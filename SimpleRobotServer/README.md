# Simple Robot Server

A lightweight WebSocket server for direct robot joint control. No inverse kinematics, no WSL required!

## Features

- 🚀 **Simple**: Just send 6 joint angles directly to the robot
- 🌐 **WebSocket**: Real-time bidirectional communication on port 9000
- 🪟 **Windows Compatible**: Runs natively on Windows (no WSL needed)
- 🐧 **Linux Compatible**: Also works on Linux
- 🎮 **Simulation Mode**: Test without a physical robot

## Installation

### Using uv (Recommended - Modern & Fast!)

```bash
# Install uv if you don't have it
# Windows (PowerShell):
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Linux/Mac:
curl -LsSf https://astral.sh/uv/install.sh | sh

# That's it! uv will handle everything else automatically
```

### Alternative: Using pip

```bash
# Install Python 3.10+ from python.org
# Then install dependencies
pip install -r requirements.txt
```

## Robot Configuration Setup

### Option 1: Use Existing Robot Folders (Recommended)

If you have robot configurations from the full robot_server, copy them:

```bash
# Copy from robot_server
cp -r ../robot_server/src/robot_server/robots/follower_1 robots/

# Or create manually:
mkdir -p robots/my_robot
# Add calibration.json to robots/my_robot/
```

Expected structure:

```
SimpleRobotServer/
├── robots/
│   ├── follower_1/
│   │   └── calibration.json
│   └── follower_2/
│       └── calibration.json
├── config.json  (auto-generated)
└── simple_robot_server.py
```

### Option 2: Use Default Calibration

No setup needed! Just run the server and select "Use default calibration" when prompted.

## Usage

### Basic Usage (Auto-Detection)

Just run the script - it will automatically detect your robot and walk you through setup:

```bash
# Using uv (recommended)
uv run simple-robot-server

# Or directly with Python
python simple_robot_server.py
```

**On first run:**

1. Server scans for robot configurations in `robots/` folder
2. Shows you available robots (or offers default calibration)
3. You select your robot
4. Server scans for USB serial devices
5. You select which port your robot is on
6. Configuration is saved to `config.json` (maps robot ID → port)

**On subsequent runs:**

- Server loads saved configuration
- Checks if the robot is still on the same port
- If yes, **auto-starts immediately!** 🚀
- If no, prompts you to reassociate and updates `config.json`

### Reset Configuration

To reconfigure from scratch:

```bash
uv run simple-robot-server --reset
```

### Simulation Mode

Test without a physical robot:

```bash
uv run simple-robot-server --simulation
```

### Listen on All Network Interfaces

Allow connections from other computers:

```bash
uv run simple-robot-server --host 0.0.0.0
```

### Custom WebSocket Port

```bash
uv run simple-robot-server --ws-port 8765
```

## WebSocket Protocol

The server listens on `ws://localhost:9000` (by default).

### Message Types

#### 1. Joint Control

Send direct joint position commands:

```json
{
  "type": "joint_control",
  "joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0]
}
```

- `joints`: Array of 6 floats
  - Indices 0-4: Joint angles in radians (shoulder_pan, shoulder_lift, elbow_flex, wrist_flex, wrist_roll)
  - Index 5: Gripper position (0-100)

Response:

```json
{
  "type": "joint_control_response",
  "success": true,
  "current_joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0],
  "timestamp": "2025-10-12T10:30:00.000Z"
}
```

#### 2. Get Current Joint Positions

Query the current robot state:

```json
{
  "type": "get_joints"
}
```

Response:

```json
{
  "type": "current_joints",
  "joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0],
  "timestamp": "2025-10-12T10:30:00.000Z"
}
```

#### 3. Ping

Check server connectivity:

```json
{
  "type": "ping"
}
```

Response:

```json
{
  "type": "pong",
  "timestamp": "2025-10-12T10:30:00.000Z"
}
```

## Example Client (JavaScript)

```javascript
const ws = new WebSocket("ws://localhost:9000");

ws.onopen = () => {
  console.log("Connected to robot server");

  // Send joint command
  ws.send(
    JSON.stringify({
      type: "joint_control",
      joints: [0.0, 0.5, -0.3, 0.2, 0.0, 50.0],
    })
  );
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};
```

## Example Client (Python)

```python
import asyncio
import websockets
import json

async def control_robot():
    uri = "ws://localhost:9000"
    async with websockets.connect(uri) as websocket:
        # Send joint command
        command = {
            "type": "joint_control",
            "joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0]
        }
        await websocket.send(json.dumps(command))

        # Receive response
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(control_robot())
```

## Comparison with Full Robot Server

| Feature        | SimpleRobotServer             | robot_server                        |
| -------------- | ----------------------------- | ----------------------------------- |
| Input Format   | Direct joint angles           | IK (x,y,z + quaternion)             |
| Dependencies   | websockets, pyserial, lerobot | + urdf parsers, kinematics libs     |
| WSL Required   | ❌ No                         | ✅ Yes (for IK)                     |
| Windows Native | ✅ Yes                        | ❌ No                               |
| Complexity     | 🟢 Simple                     | 🔴 Complex                          |
| Use Case       | Direct control, testing       | Hand tracking, precise pose control |

## Troubleshooting

### Port Not Found

**Windows:**

- Check Device Manager for COM port number
- Install USB-to-Serial drivers if needed

**Linux:**

- Check available ports: `ls /dev/tty*`
- Add user to dialout group: `sudo usermod -a -G dialout $USER`
- Reboot after adding to group

### Connection Failed

1. Ensure robot is powered on
2. Check USB cable connection
3. Verify correct port in command line
4. Try closing other programs using the serial port

### Import Errors

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## Development

### Enable Debug Logging

```bash
python simple_robot_server.py --port COM3 --debug
```

### Project Structure

```
SimpleRobotServer/
├── simple_robot_server.py    # Main server code
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## License

This project is part of the TeleTable robot control system.
