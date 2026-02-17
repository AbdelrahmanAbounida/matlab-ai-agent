"""
Enhanced MATLAB Bridge Server
A comprehensive Flask server for MATLAB Engine API with full Simulink support

Features:
- Full Simulink model inspection and manipulation
- Block-level operations (add, delete, modify, connect)
- Model structure analysis
- Block library search
- Parameter management

Requirements:
- Python 3.8+
- MATLAB R2019a or later with Simulink
- matlab.engine Python package
- Flask, flask-cors

Setup:
1. Install MATLAB Engine API for Python:
   cd "matlabroot/extern/engines/python"
   python setup.py install

2. Install Python dependencies:
   pip install flask flask-cors

3. Start MATLAB and share the engine:
   In MATLAB command window: matlab.engine.shareEngine('MatlabBridge')

4. Run this server:
   python server_enhanced.py
"""

from io import StringIO
from threading import Lock
import os
import traceback

from flask import Flask, jsonify, request
from flask_cors import CORS

# Try to import MATLAB engine
try:
    import matlab.engine
    MATLAB_AVAILABLE = True
except ImportError:
    print("Warning: MATLAB Engine not available. Running in simulation mode.")
    MATLAB_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Global MATLAB engine instance
matlab_engine = None
engine_lock = Lock()


def get_matlab_engine():
    """Get or create the MATLAB engine connection."""
    global matlab_engine
    
    if not MATLAB_AVAILABLE:
        return None
    
    with engine_lock:
        if matlab_engine is None:
            try:
                # Try to connect to a shared MATLAB session first
                shared_sessions = matlab.engine.find_matlab()
                if shared_sessions:
                    print(f"Found shared MATLAB sessions: {shared_sessions}")
                    matlab_engine = matlab.engine.connect_matlab(shared_sessions[0])
                    print(f"Connected to shared session: {shared_sessions[0]}")
                else:
                    # Start a new MATLAB session
                    print("Starting new MATLAB session...")
                    matlab_engine = matlab.engine.start_matlab()
                    print("MATLAB session started")
            except Exception as e:
                print(f"Error connecting to MATLAB: {e}")
                return None
    
    return matlab_engine


@app.route("/", methods=["GET"])
def home_route():
    return {"message": "Enhanced MATLAB Bridge Server"}


@app.route("/status", methods=["GET"])
def get_status():
    """Check MATLAB connection status."""
    eng = get_matlab_engine()
    
    if eng is not None:
        try:
            version = eng.version("-release", nargout=1)
            return jsonify({
                "connected": True,
                "matlabVersion": f"MATLAB R{version}",
                "bridgeVersion": "2.0.0",
                "sharedSessions": matlab.engine.find_matlab() if MATLAB_AVAILABLE else []
            })
        except Exception as e:
            return jsonify({
                "connected": False,
                "error": str(e)
            })
    
    return jsonify({
        "connected": False,
        "simulationMode": not MATLAB_AVAILABLE,
        "message": "MATLAB Engine not available" if not MATLAB_AVAILABLE else "Could not connect to MATLAB"
    })


@app.route("/execute", methods=["POST"])
def execute_code():
    """Execute MATLAB code and return the result."""
    data = request.json
    code = data.get("code", "")
    capture_output = data.get("captureOutput", True)
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "output": f"[Simulation Mode]\nExecuted:\n{code}",
            "simulationMode": True
        })
    
    try:
        output_buffer = StringIO()
        error_buffer = StringIO()
        
        if capture_output:
            eng.eval(code, nargout=0, stdout=output_buffer, stderr=error_buffer)
        else:
            eng.eval(code, nargout=0)
        
        output = output_buffer.getvalue()
        errors = error_buffer.getvalue()
        
        return jsonify({
            "success": True,
            "output": output,
            "errors": errors if errors else None,
            "variables": get_workspace_variables(eng)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "errorType": type(e).__name__,
            "traceback": traceback.format_exc()
        }), 400


@app.route("/eval", methods=["POST"])
def eval_expression():
    """Evaluate a MATLAB expression and return the result."""
    data = request.json
    expression = data.get("expression", "")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "result": f"[Simulation] {expression}",
            "simulationMode": True
        })
    
    try:
        result = eng.eval(expression, nargout=1)
        
        # Convert result to JSON-serializable format
        if hasattr(result, 'tolist'):
            result = result.tolist()
        elif hasattr(result, '__iter__') and not isinstance(result, str):
            result = list(result)
        
        return jsonify({
            "success": True,
            "result": result
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/workspace", methods=["GET"])
def get_workspace():
    """Get list of variables in the MATLAB workspace."""
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "variables": [],
            "simulationMode": True
        })
    
    try:
        variables = get_workspace_variables(eng)
        return jsonify({
            "success": True,
            "variables": variables
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


def get_workspace_variables(eng):
    """Get information about workspace variables."""
    try:
        var_names = eng.eval("who", nargout=1)
        if not var_names:
            return []
        
        variables = []
        for name in var_names:
            try:
                var_class = eng.eval(f"class({name})", nargout=1)
                var_size = eng.eval(f"size({name})", nargout=1)
                size_str = "x".join(str(int(s)) for s in var_size)
                
                variables.append({
                    "name": name,
                    "type": var_class,
                    "size": size_str
                })
            except:
                variables.append({
                    "name": name,
                    "type": "unknown",
                    "size": "unknown"
                })
        
        return variables
    
    except Exception as e:
        print(f"Error getting workspace variables: {e}")
        return []


@app.route("/simulink/inspect", methods=["POST"])
def inspect_model():
    """Get detailed information about a Simulink model."""
    data = request.json
    model_name = data.get("modelName", "")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True,
            "message": "Model inspection (simulation mode)"
        })
    
    try:
        # Get all blocks
        blocks = eng.eval(f"find_system('{model_name}', 'Type', 'Block')", nargout=1)
        
        block_info = []
        for block in blocks:
            try:
                block_type = eng.eval(f"get_param('{block}', 'BlockType')", nargout=1)
                position = eng.eval(f"get_param('{block}', 'Position')", nargout=1)
                
                block_info.append({
                    "path": block,
                    "name": block.split('/')[-1],
                    "type": block_type,
                    "position": list(position) if hasattr(position, '__iter__') else position
                })
            except Exception as e:
                print(f"Error getting block info for {block}: {e}")
        
        # Get all lines (connections)
        lines = eng.eval(f"find_system('{model_name}', 'Type', 'Line')", nargout=1)
        
        return jsonify({
            "success": True,
            "modelName": model_name,
            "blockCount": len(blocks),
            "blocks": block_info,
            "connectionCount": len(lines) if lines else 0
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/simulink/add_block", methods=["POST"])
def add_block():
    """Add a block to a Simulink model."""
    data = request.json
    model_name = data.get("modelName", "")
    block_library_path = data.get("blockLibraryPath", "")
    block_name = data.get("blockName", "")
    position = data.get("position")
    parameters = data.get("parameters", {})
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True,
            "message": f"Would add block {block_name}"
        })
    
    try:
        # Construct the full block path
        full_block_path = f"{model_name}/{block_name}"
        
        # Build add_block command
        if position:
            pos_str = f"[{', '.join(str(p) for p in position)}]"
            cmd = f"add_block('{block_library_path}', '{full_block_path}', 'Position', {pos_str})"
        else:
            cmd = f"add_block('{block_library_path}', '{full_block_path}')"
        
        eng.eval(cmd, nargout=0)
        
        # Set parameters if provided
        for param_name, param_value in parameters.items():
            eng.eval(
                f"set_param('{full_block_path}', '{param_name}', '{param_value}')",
                nargout=0
            )
        
        return jsonify({
            "success": True,
            "blockPath": full_block_path,
            "message": f"Block '{block_name}' added successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/simulink/connect", methods=["POST"])
def connect_blocks():
    """Connect two blocks in a Simulink model."""
    data = request.json
    model_name = data.get("modelName", "")
    source_block = data.get("sourceBlock", "")
    source_port = data.get("sourcePort", 1)
    dest_block = data.get("destBlock", "")
    dest_port = data.get("destPort", 1)
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True,
            "message": "Would connect blocks"
        })
    
    try:
        # Construct port strings
        source = f"{source_block}/{source_port}"
        dest = f"{dest_block}/{dest_port}"
        
        # Add line
        eng.eval(
            f"add_line('{model_name}', '{source}', '{dest}', 'autorouting', 'on')",
            nargout=0
        )
        
        return jsonify({
            "success": True,
            "message": f"Connected {source_block} to {dest_block}"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/simulink/delete_block", methods=["POST"])
def delete_block():
    """Delete a block from a Simulink model."""
    data = request.json
    model_name = data.get("modelName", "")
    block_path = data.get("blockPath", "")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True
        })
    
    try:
        eng.eval(f"delete_block('{block_path}')", nargout=0)
        return jsonify({
            "success": True,
            "message": f"Block '{block_path}' deleted"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/simulink/set_params", methods=["POST"])
def set_block_params():
    """Set parameters for a Simulink block."""
    data = request.json
    model_name = data.get("modelName", "")
    block_path = data.get("blockPath", "")
    parameters = data.get("parameters", {})
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True
        })
    
    try:
        for param_name, param_value in parameters.items():
            eng.eval(
                f"set_param('{block_path}', '{param_name}', '{param_value}')",
                nargout=0
            )
        
        return jsonify({
            "success": True,
            "message": f"Parameters set for '{block_path}'"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/simulink/get_params", methods=["POST"])
def get_block_params():
    """Get parameters of a Simulink block."""
    data = request.json
    model_name = data.get("modelName", "")
    block_path = data.get("blockPath", "")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "parameters": {},
            "simulationMode": True
        })
    
    try:
        # Get all parameters
        params = eng.eval(f"get_param('{block_path}', 'ObjectParameters')", nargout=1)
        
        # Convert to dict
        param_dict = {}
        if params:
            # Get values for each parameter
            for param_name in params:
                try:
                    value = eng.eval(f"get_param('{block_path}', '{param_name}')", nargout=1)
                    param_dict[param_name] = str(value)
                except:
                    pass
        
        return jsonify({
            "success": True,
            "blockPath": block_path,
            "parameters": param_dict
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/simulink/search_blocks", methods=["POST"])
def search_blocks():
    """Search for Simulink blocks in libraries."""
    data = request.json
    search_term = data.get("searchTerm", "")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "results": [],
            "simulationMode": True
        })
    
    try:
        # Search in Simulink library
        cmd = f"find_system('simulink', 'LookUnderMasks', 'all', 'BlockType', '{search_term}')"
        results = eng.eval(cmd, nargout=1)
        
        # Also search by name
        cmd_name = f"find_system('simulink', 'LookUnderMasks', 'all', 'Name', '{search_term}')"
        results_name = eng.eval(cmd_name, nargout=1)
        
        all_results = list(set(list(results) + list(results_name)))
        
        return jsonify({
            "success": True,
            "searchTerm": search_term,
            "results": all_results,
            "count": len(all_results)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/simulink/libraries", methods=["POST"])
def get_libraries():
    """Get available Simulink libraries and their blocks."""
    data = request.json
    library = data.get("library", "simulink")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "libraries": [],
            "simulationMode": True
        })
    
    try:
        # Load library
        eng.eval(f"load_system('{library}')", nargout=0)
        
        # Get all blocks in library
        blocks = eng.eval(f"find_system('{library}', 'LookUnderMasks', 'all', 'Type', 'Block')", nargout=1)
        
        # Organize by subsystem
        library_structure = {}
        for block in blocks:
            parts = block.split('/')
            if len(parts) > 1:
                category = parts[1] if len(parts) > 1 else "root"
                if category not in library_structure:
                    library_structure[category] = []
                library_structure[category].append(block)
        
        return jsonify({
            "success": True,
            "library": library,
            "structure": library_structure
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/simulink/run", methods=["POST"])
def run_simulation():
    """Run a Simulink simulation."""
    data = request.json
    model_name = data.get("modelName", "")
    stop_time = data.get("stopTime", 10)
    solver = data.get("solver", "ode45")
    
    eng = get_matlab_engine()
    
    if eng is None:
        return jsonify({
            "success": True,
            "simulationMode": True,
            "message": f"Simulation would run for {stop_time}s"
        })
    
    try:
        # Configure simulation
        eng.eval(f"set_param('{model_name}', 'StopTime', '{stop_time}')", nargout=0)
        eng.eval(f"set_param('{model_name}', 'Solver', '{solver}')", nargout=0)
        
        # Run simulation
        output_buffer = StringIO()
        eng.eval(f"simOut = sim('{model_name}')", nargout=0, stdout=output_buffer)
        
        output = output_buffer.getvalue()
        
        return jsonify({
            "success": True,
            "modelName": model_name,
            "stopTime": stop_time,
            "solver": solver,
            "output": output,
            "message": "Simulation completed successfully"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/file/read", methods=["POST"])
def read_file():
    """Read a MATLAB file."""
    data = request.json
    file_path = data.get("filePath", "")
    
    if not file_path:
        return jsonify({"success": False, "error": "No file path provided"}), 400
    
    try:
        if file_path.endswith('.m'):
            with open(file_path, 'r') as f:
                content = f.read()
            return jsonify({
                "success": True,
                "content": content,
                "fileType": "m",
                "filePath": file_path
            })
        
        elif file_path.endswith('.mat'):
            eng = get_matlab_engine()
            if eng:
                info = eng.eval(f"whos('-file', '{file_path}')", nargout=1)
                return jsonify({
                    "success": True,
                    "fileType": "mat",
                    "filePath": file_path,
                    "variables": str(info)
                })
        
        elif file_path.endswith(('.slx', '.mdl')):
            eng = get_matlab_engine()
            if eng:
                eng.eval(f"load_system('{file_path}')", nargout=0)
                model_name = os.path.splitext(os.path.basename(file_path))[0]
                blocks = eng.eval(f"find_system('{model_name}', 'Type', 'Block')", nargout=1)
                return jsonify({
                    "success": True,
                    "fileType": "slx/mdl",
                    "filePath": file_path,
                    "modelName": model_name,
                    "blockCount": len(blocks)
                })
        
        return jsonify({
            "success": False,
            "error": "Unsupported file type"
        }), 400
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 400


@app.route("/file/write", methods=["POST"])
def write_file():
    """Write a MATLAB file."""
    data = request.json
    file_path = data.get("filePath", "")
    content = data.get("content", "")
    
    if not file_path:
        return jsonify({"success": False, "error": "No file path provided"}), 400
    
    try:
        os.makedirs(os.path.dirname(file_path) or '.', exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        return jsonify({
            "success": True,
            "filePath": file_path,
            "bytesWritten": len(content)
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("DEBUG", "false").lower() == "true"
    
    print(f"\n{'='*60}")
    print("Enhanced MATLAB Bridge Server v2.0")
    print(f"{'='*60}")
    print(f"Port: {port}")
    print(f"MATLAB Engine Available: {MATLAB_AVAILABLE}")
    
    if MATLAB_AVAILABLE:
        print("\n📋 Setup Instructions:")
        print("1. Open MATLAB")
        print("2. Run: matlab.engine.shareEngine('MatlabBridge')")
        print("3. Keep MATLAB running while using this bridge")
    
    print(f"\n🚀 Server starting at http://localhost:{port}")
    print(f"{'='*60}\n")
    
    app.run(host="0.0.0.0", port=port, debug=debug)