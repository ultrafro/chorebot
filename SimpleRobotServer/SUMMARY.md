# SimpleRobotServer - Summary

## What is this?

A **super simple** WebSocket server that takes direct joint commands (6 numbers) and sends them straight to your robot. No inverse kinematics, no WSL required, works natively on Windows!

## Key Features

✅ **Auto-Detection**: Just run `python simple_robot_server.py` and it handles everything  
✅ **Config Management**: Saves your setup, remembers it next time  
✅ **Windows Native**: No WSL needed (unlike the full robot_server)  
✅ **Direct Control**: Send 6 joint angles directly - no IK calculations  
✅ **Calibration Support**: Optional - use calibration files or defaults  
✅ **WebSocket API**: Real-time communication on port 9000

## Quick Start

```bash
# Install uv (one-time)
# Windows: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
# Linux/Mac: curl -LsSf https://astral.sh/uv/install.sh | sh

# Run the server (uv handles everything automatically!)
uv run simple-robot-server

# Test it
uv run python test_client.py
```

## Usage Flow

### First Time

1. Run: `uv run simple-robot-server`
2. Server scans `robots/` folder for configurations
3. You select your robot (or use default)
4. Server scans USB devices
5. You select your robot's port
6. Config saved to `config.json` (robot ID → port mapping)
7. Server starts on `ws://localhost:9000`

### Every Time After

1. Run: `uv run simple-robot-server`
2. Server checks if robot is on saved port
3. If yes: **Auto-starts immediately!** 🚀
4. If no: Prompts to reassociate, updates config

## WebSocket API

### Send Joint Command

```json
{
  "type": "joint_control",
  "joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0]
}
```

Response:

```json
{
  "type": "joint_control_response",
  "success": true,
  "current_joints": [0.0, 0.5, -0.3, 0.2, 0.0, 50.0],
  "timestamp": "2025-10-12T10:30:00.000Z"
}
```

### Get Current Joints

```json
{
  "type": "get_joints"
}
```

### Ping

```json
{
  "type": "ping"
}
```

## Project Structure

```
SimpleRobotServer/
├── simple_robot_server.py    # Main server (all-in-one)
├── test_client.py             # Test client
├── requirements.txt           # Dependencies
├── README.md                  # Full documentation
├── QUICKSTART.md              # Step-by-step guide
├── SUMMARY.md                 # This file
├── .gitignore                 # Git ignore (includes config.json)
├── config.json                # Auto-generated config (robot ID → port)
└── robots/                    # Robot configurations
    ├── README.md              # Setup instructions
    ├── follower_1/
    │   └── calibration.json
    └── follower_2/
        └── calibration.json
```

## Comparison with Full Robot Server

| Feature        | SimpleRobotServer      | robot_server                |
| -------------- | ---------------------- | --------------------------- |
| Input          | 6 joint angles         | x,y,z + quaternion          |
| IK Required    | ❌ No                  | ✅ Yes                      |
| WSL Required   | ❌ No                  | ✅ Yes (for IK)             |
| Windows Native | ✅ Yes                 | ❌ No                       |
| Auto-Setup     | ✅ Yes                 | ✅ Yes                      |
| Use Case       | Direct joint control   | Hand tracking, pose control |
| Complexity     | 🟢 Simple (~600 lines) | 🔴 Complex (~2000+ lines)   |

## When to Use This?

✅ **Use SimpleRobotServer when:**

- You have joint angles already calculated
- You're testing joint movements
- You want to bypass IK for faster control
- You want Windows-native operation
- You want simplicity

❌ **Use full robot_server when:**

- You need inverse kinematics
- You're doing hand tracking → robot control
- You need precise end-effector poses
- You can run in WSL

## Command Reference

```bash
# Basic usage (auto-setup)
uv run simple-robot-server

# Reset config and reconfigure
uv run simple-robot-server --reset

# Simulation mode (no robot)
uv run simple-robot-server --simulation

# Listen on all interfaces
uv run simple-robot-server --host 0.0.0.0

# Custom WebSocket port
uv run simple-robot-server --ws-port 8765

# Enable debug logging
uv run simple-robot-server --debug
```

## Troubleshooting

### No devices found

- Check USB connection
- Ensure robot is powered on
- On Linux: `sudo usermod -a -G dialout $USER` (then reboot)

### Can't import LeRobot

```bash
# uv handles this automatically, but if needed:
uv pip install 'lerobot[feetech]' --upgrade
```

### Want to reconfigure?

```bash
uv run simple-robot-server --reset
```

### Test without robot

```bash
uv run simple-robot-server --simulation
uv run python test_client.py
```

## Architecture

```
┌─────────────┐                 ┌──────────────────┐                ┌────────┐
│   Client    │  WebSocket      │ SimpleRobotServer│   USB Serial   │ Robot  │
│ (Your App)  │────────────────▶│                  │───────────────▶│ Arm    │
│             │  JSON Commands  │  - Auto-detect   │   Joint Cmds   │        │
│             │◀────────────────│  - Config mgmt   │◀───────────────│        │
└─────────────┘  JSON Responses │  - Direct ctrl   │   Joint States │        │
                                 └──────────────────┘                └────────┘
```

## Example Client Code

### Python

```python
import asyncio
import websockets
import json

async def control_robot():
    async with websockets.connect("ws://localhost:9000") as ws:
        await ws.recv()  # Skip welcome
        await ws.send(json.dumps({
            "type": "joint_control",
            "joints": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]
        }))
        print(await ws.recv())

asyncio.run(control_robot())
```

### JavaScript

```javascript
const ws = new WebSocket("ws://localhost:9000");
ws.onopen = () => {
  ws.send(
    JSON.stringify({
      type: "joint_control",
      joints: [0.0, 0.0, 0.0, 0.0, 0.0, 50.0],
    })
  );
};
ws.onmessage = (e) => console.log(e.data);
```

## Next Steps

1. Read `QUICKSTART.md` for detailed setup
2. Check `README.md` for full API docs
3. Run `test_client.py` to see examples
4. Start building your application!

---

**Made with ❤️ for the TeleTable project**
