import { tool } from "ai";
import { z } from "zod";

const BRIDGE_URL = process.env.MATLAB_BRIDGE_URL || "http://localhost:5000";

/**
 * Helper to call the MATLAB bridge API
 */
async function callBridge(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>
) {
  try {
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BRIDGE_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    return { 
      success: false, 
      simulationMode: true, 
      error: error instanceof Error ? error.message : "Bridge not available" 
    };
  }
}

/**
 * Execute MATLAB code directly
 */
export const executeMatlabCode = tool({
  description: `Execute MATLAB code directly. Use this for:
- Running MATLAB commands and scripts
- Performing calculations
- Creating variables
- Generating plots
- Processing data
- Opening and manipulating Simulink models

Returns the output from MATLAB including any printed results and error messages.`,
  inputSchema: z.object({
    code: z.string().describe("The MATLAB code to execute. Can be multi-line."),
    captureOutput: z
      .boolean()
      .default(true)
      .describe("Whether to capture and return the command window output"),
  }),
  execute: async ({ code, captureOutput }) => {
    const result = await callBridge("/execute", "POST", { code, captureOutput });
    return result;
  },
});

/**
 * Open an existing Simulink model
 */
export const openSimulinkModel = tool({
  description: `Open an existing Simulink model file (.slx or .mdl). 
Use this before inspecting or modifying a model.`,
  inputSchema: z.object({
    modelPath: z.string().describe("Path to the Simulink model file or model name"),
  }),
  execute: async ({ modelPath }) => {
    const code = `
% Open Simulink model
try
    load_system('${modelPath}');
    open_system('${modelPath}');
    fprintf('Model opened successfully: ${modelPath}\\n');
    
    % Get model info
    blocks = find_system('${modelPath}', 'Type', 'Block');
    fprintf('Total blocks in model: %d\\n', length(blocks));
catch ME
    fprintf('Error: %s\\n', ME.message);
end
`;
    return await callBridge("/execute", "POST", { code, captureOutput: true });
  },
});

/**
 * Inspect a Simulink model structure
 */
export const inspectSimulinkModel = tool({
  description: `Get detailed information about a Simulink model including:
- All blocks and their types
- Block connections
- Block parameters
- Model configuration
Use this to understand existing models before modification.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the loaded Simulink model"),
  }),
  execute: async ({ modelName }) => {
    return await callBridge("/simulink/inspect", "POST", { modelName });
  },
});

/**
 * Add a block to a Simulink model
 */
export const addSimulinkBlock = tool({
  description: `Add a single block to an existing Simulink model. 
Use this when you need to add blocks one at a time with precise control.

Common block libraries:
- simulink/Commonly Used Blocks
- simulink/Continuous
- simulink/Discrete
- simulink/Math Operations
- simulink/Signal Routing
- simulink/Sinks
- simulink/Sources
`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
    blockLibraryPath: z.string().describe("Full library path (e.g., 'simulink/Continuous/PID Controller')"),
    blockName: z.string().describe("Name for the new block instance"),
    position: z
      .array(z.number())
      .length(4)
      .optional()
      .describe("Block position [left, top, right, bottom]"),
    parameters: z
      .record(z.string())
      .optional()
      .describe("Block parameters as key-value pairs"),
  }),
  execute: async ({ modelName, blockLibraryPath, blockName, position, parameters }) => {
    return await callBridge("/simulink/add_block", "POST", {
      modelName,
      blockLibraryPath,
      blockName,
      position,
      parameters,
    });
  },
});

/**
 * Connect blocks in a Simulink model
 */
export const connectSimulinkBlocks = tool({
  description: `Connect two blocks in a Simulink model.
Specify source and destination blocks with their port numbers.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
    sourceBlock: z.string().describe("Source block name"),
    sourcePort: z.number().describe("Source port number (1-indexed)"),
    destBlock: z.string().describe("Destination block name"),
    destPort: z.number().describe("Destination port number (1-indexed)"),
  }),
  execute: async ({ modelName, sourceBlock, sourcePort, destBlock, destPort }) => {
    return await callBridge("/simulink/connect", "POST", {
      modelName,
      sourceBlock,
      sourcePort,
      destBlock,
      destPort,
    });
  },
});

/**
 * Set parameters for a Simulink block
 */
export const setBlockParameters = tool({
  description: `Set or modify parameters of a Simulink block.
Use this to configure block behavior after adding it to the model.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
    blockPath: z.string().describe("Full path to the block (e.g., 'modelName/BlockName')"),
    parameters: z.record(z.string()).describe("Parameters to set as key-value pairs"),
  }),
  execute: async ({ modelName, blockPath, parameters }) => {
    return await callBridge("/simulink/set_params", "POST", {
      modelName,
      blockPath,
      parameters,
    });
  },
});

/**
 * Get block parameters
 */
export const getBlockParameters = tool({
  description: `Get current parameters of a Simulink block.
Use this to inspect block configuration.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
    blockPath: z.string().describe("Full path to the block"),
  }),
  execute: async ({ modelName, blockPath }) => {
    return await callBridge("/simulink/get_params", "POST", {
      modelName,
      blockPath,
    });
  },
});

/**
 * Delete a block from a Simulink model
 */
export const deleteSimulinkBlock = tool({
  description: `Remove a block from a Simulink model.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
    blockPath: z.string().describe("Full path to the block to delete"),
  }),
  execute: async ({ modelName, blockPath }) => {
    return await callBridge("/simulink/delete_block", "POST", {
      modelName,
      blockPath,
    });
  },
});

/**
 * Create a new Simulink model
 */
export const createSimulinkModel = tool({
  description: `Create a new blank Simulink model.
After creation, use other tools to add blocks and connections.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name for the new Simulink model (no spaces)"),
  }),
  execute: async ({ modelName }) => {
    const code = `
% Create new Simulink model
new_system('${modelName}');
open_system('${modelName}');
fprintf('Created and opened model: ${modelName}\\n');
`;
    return await callBridge("/execute", "POST", { code, captureOutput: true });
  },
});

/**
 * Save a Simulink model
 */
export const saveSimulinkModel = tool({
  description: `Save a Simulink model to disk.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model to save"),
    savePath: z.string().optional().describe("Optional: specific path to save the model"),
  }),
  execute: async ({ modelName, savePath }) => {
    const code = savePath
      ? `save_system('${modelName}', '${savePath}');`
      : `save_system('${modelName}');`;
    return await callBridge("/execute", "POST", { code, captureOutput: true });
  },
});

/**
 * Run a Simulink simulation
 */
export const runSimulation = tool({
  description: `Run a Simulink model simulation.
The model must be loaded and properly configured before simulation.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model to simulate"),
    stopTime: z.number().default(10).describe("Simulation stop time in seconds"),
    solver: z
      .string()
      .default("ode45")
      .describe("ODE solver to use (e.g., ode45, ode23, ode15s)"),
  }),
  execute: async ({ modelName, stopTime, solver }) => {
    return await callBridge("/simulink/run", "POST", {
      modelName,
      stopTime,
      solver,
    });
  },
});

/**
 * Get workspace variables
 */
export const getWorkspaceVariables = tool({
  description: "Get a list of all variables currently in the MATLAB workspace with their types and sizes.",
  inputSchema: z.object({}),
  execute: async () => {
    return await callBridge("/workspace", "GET");
  },
});

/**
 * Read a MATLAB file
 */
export const readMatlabFile = tool({
  description: `Read the contents of a MATLAB file:
- .m files: Returns the script/function code
- .mat files: Returns variable information
- .slx/.mdl files: Returns model information`,
  inputSchema: z.object({
    filePath: z.string().describe("Path to the file to read"),
  }),
  execute: async ({ filePath }) => {
    return await callBridge("/file/read", "POST", { filePath });
  },
});

/**
 * Write a MATLAB script file
 */
export const writeMatlabFile = tool({
  description: "Write or create a MATLAB script file (.m).",
  inputSchema: z.object({
    filePath: z.string().describe("Path where to save the file"),
    content: z.string().describe("The MATLAB code to write to the file"),
    overwrite: z.boolean().default(false).describe("Whether to overwrite if file exists"),
  }),
  execute: async ({ filePath, content, overwrite }) => {
    return await callBridge("/file/write", "POST", {
      filePath,
      content,
      overwrite,
    });
  },
});

/**
 * Search for Simulink blocks in libraries
 */
export const searchSimulinkBlocks = tool({
  description: `Search for Simulink blocks by name or category.
Returns full library paths for blocks that can be added to models.`,
  inputSchema: z.object({
    searchTerm: z.string().describe("Search term (e.g., 'PID', 'Integrator', 'Sum')"),
  }),
  execute: async ({ searchTerm }) => {
    return await callBridge("/simulink/search_blocks", "POST", { searchTerm });
  },
});

/**
 * Get available Simulink block libraries
 */
export const getSimulinkLibraries = tool({
  description: `Get a list of available Simulink block libraries and their contents.
Use this to discover what blocks are available.`,
  inputSchema: z.object({
    library: z
      .string()
      .optional()
      .describe("Specific library to query (e.g., 'simulink', 'dsp')"),
  }),
  execute: async ({ library }) => {
    return await callBridge("/simulink/libraries", "POST", { library });
  },
});

/**
 * Evaluate a MATLAB expression and get the result
 */
export const evaluateMatlabExpression = tool({
  description: `Evaluate a MATLAB expression and return its value. Use this for:
- Simple calculations: "2 + 2", "sin(pi/4)"
- Getting variable values: "x", "myArray(1:5)"
- Function calls that return values: "length(data)", "mean(values)"`,
  inputSchema: z.object({
    expression: z.string().describe("The MATLAB expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    return await callBridge("/eval", "POST", { expression });
  },
});

/**
 * Auto-arrange blocks in a Simulink model
 */
export const arrangeSimulinkModel = tool({
  description: `Automatically arrange and organize blocks in a Simulink model for better visualization.`,
  inputSchema: z.object({
    modelName: z.string().describe("Name of the Simulink model"),
  }),
  execute: async ({ modelName }) => {
    const code = `
% Auto-arrange model layout
Simulink.BlockDiagram.arrangeSystem('${modelName}');
fprintf('Model layout arranged\\n');
`;
    return await callBridge("/execute", "POST", { code, captureOutput: true });
  },
});


/**
 * File System Tools
 */
export const listDirectory = tool({
  description: `List files and directories in a given path. Use this to:
- Explore the project structure
- Find MATLAB files (.m, .slx, .mdl)
- Understand the codebase organization`,
  inputSchema: z.object({
    path: z.string().describe("Directory path to list"),
    filter: z.string().optional().describe("File extension filter (e.g., '.m', '.slx')"),
  }),
  execute: async ({ path, filter }) => {
    return await callBridge("/file/list", "POST", { path, filter });
  },
});

export const readMultipleFiles = tool({
  description: `Read multiple MATLAB files at once to understand context.
Use this when you need to understand how different files interact.`,
  inputSchema: z.object({
    filePaths: z.array(z.string()).describe("Array of file paths to read"),
  }),
  execute: async ({ filePaths }) => {
    return await callBridge("/file/read_multiple", "POST", { filePaths });
  },
});

export const findReferences = tool({
  description: `Find where a function, variable, or model is referenced across files.
Useful for understanding dependencies before making changes.`,
  inputSchema: z.object({
    searchTerm: z.string().describe("Function name, variable, or model to search for"),
    directory: z.string().describe("Directory to search in"),
  }),
  execute: async ({ searchTerm, directory }) => {
    return await callBridge("/file/find_references", "POST", { searchTerm, directory });
  },
});

/**
 * All enhanced MATLAB tools
 */
export const matlabTools = {
  // Core execution
  executeMatlabCode,
  evaluateMatlabExpression,
  getWorkspaceVariables,
  
  // File operations
  readMatlabFile,
  writeMatlabFile,
  
  // Model management
  createSimulinkModel,
  openSimulinkModel,
  saveSimulinkModel,
  inspectSimulinkModel,
  
  // Block operations
  addSimulinkBlock,
  connectSimulinkBlocks,
  deleteSimulinkBlock,
  setBlockParameters,
  getBlockParameters,
  
  // Discovery
  searchSimulinkBlocks,
  getSimulinkLibraries,
  
  // Simulation
  runSimulation,
  
  // Utilities
  arrangeSimulinkModel,

  // File systems structures
  listDirectory,
  readMultipleFiles,
  findReferences
};