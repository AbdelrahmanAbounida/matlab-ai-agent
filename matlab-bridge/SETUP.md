# MATLAB Bridge Setup Guide

This guide will help you set up the Python MATLAB bridge to enable full MATLAB integration with the AI assistant.

## Prerequisites

- MATLAB R2019a or later (with Simulink for model creation)
- Python 3.8 or later
- pip (Python package manager)

## Step 1: Install MATLAB Engine API for Python

The MATLAB Engine API allows Python to call MATLAB functions directly.

### Find your MATLAB installation

- **Windows**: `C:\Program Files\MATLAB\R2024a`
- **macOS**: `/Applications/MATLAB_R2024a.app`
- **Linux**: `/usr/local/MATLAB/R2024a`

### Install the engine

cd 

Example for Windows:
```bash
cd "C:\Program Files\MATLAB\R2024b\extern\engines\python"
# py -3.11 -m pip install .
python -m pip install .
```

## Step 2: Install Python Dependencies

```bash
cd matlab-bridge
py -3.11 -m venv venv311
pip install -r requirements.txt
```

## Step 3: Share Your MATLAB Session (Recommended)

For the best experience, share your existing MATLAB session so the bridge can connect to it:

1. Open MATLAB
2. In the MATLAB Command Window, run:
   ```matlab
   matlab.engine.shareEngine('MatlabBridge')
   ```

This allows the bridge to connect to your running MATLAB instance, giving you access to your workspace, open models, and more.

## Step 4: Start the Bridge Server

```bash
cd matlab-bridge
python server.py
```

You should see:
```
==================================================
MATLAB Bridge Server
==================================================
Port: 5000
MATLAB Engine Available: True

To share your MATLAB session, run in MATLAB:
  matlab.engine.shareEngine('MatlabBridge')

Server starting at http://localhost:5000
==================================================
``` 

## Step 5: Configure the Next.js App

Add the bridge URL to your environment:

1. Create a `.env.local` file in the project root:
   ```
   MATLAB_BRIDGE_URL=http://localhost:5000
   ```

2. Restart the Next.js development server

## Verifying the Connection

1. In your browser, go to `http://localhost:5000/status`
2. You should see a JSON response with `"connected": true`

Or use curl:
```bash
curl http://localhost:5000/status
```

## Troubleshooting

### "MATLAB Engine not available"

- Ensure MATLAB is installed
- Verify the Python engine was installed correctly:
  ```python
  python -c "import matlab.engine; print('Success!')"
  ```

### "No shared MATLAB sessions found"

- Open MATLAB and run: `matlab.engine.shareEngine('MatlabBridge')`
- The bridge will automatically connect to the shared session

### Connection refused

- Ensure the bridge server is running on port 5000
- Check if another application is using port 5000
- Try a different port: `PORT=5001 python server.py`

### MATLAB functions fail

- Ensure Simulink is installed for Simulink-related features
- Check that the MATLAB path includes required toolboxes

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Check connection status |
| `/execute` | POST | Execute MATLAB code |
| `/eval` | POST | Evaluate MATLAB expression |
| `/workspace` | GET | Get workspace variables |
| `/file/read` | POST | Read a MATLAB file |
| `/file/write` | POST | Write a MATLAB file |
| `/simulink/create` | POST | Create a Simulink model |
| `/simulink/run` | POST | Run a simulation |
| `/simulink/blocks` | GET | List available blocks |

## Security Note

The bridge server is intended for local development only. Do not expose it to the public internet without proper authentication and security measures.
