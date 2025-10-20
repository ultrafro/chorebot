# SimpleRobotServer - Configuration System Changes

## What Changed?

The SimpleRobotServer now uses a **local `robots/` folder** structure and implements **automatic port detection** with smart config management.

## New Folder Structure

```
SimpleRobotServer/
├── simple_robot_server.py       # Main server
├── config.json                  # Auto-generated (robot_id → port mapping)
├── robots/                      # Robot configurations
│   ├── README.md                # Setup guide
│   ├── follower_1/
│   │   └── calibration.json
│   ├── right/                   # ← You already have this one!
│   │   └── calibration.json
│   └── ...
└── ...
```

## How It Works Now

### First Time Running

```bash
uv run simple-robot-server
```

**Step 1:** Server scans `robots/` folder for calibration files

```
📁 Found 1 robot(s):
1. right
   Calibration: robots/right/calibration.json
2. None (use default calibration)

Select a robot (1-2) or 'q' to quit:
```

**Step 2:** You select your robot (e.g., "right")

**Step 3:** Server scans USB ports

```
📱 Found 2 serial device(s):
1. COM3
   Description: USB Serial Device
2. COM5
   Description: Standard Serial Port
```

**Step 4:** You associate the robot with its port

**Step 5:** Config saved to `config.json`:

```json
{
  "robot_id": "right",
  "robot_port": "COM3",
  "calibration_file": "robots/right/calibration.json",
  "server": {
    "host": "localhost",
    "port": 9000
  }
}
```

### Every Time After

```bash
uv run simple-robot-server
```

**Automatic behavior:**

1. ✅ Loads `config.json`
2. ✅ Checks if robot is still on port COM3
3. ✅ If yes: **Auto-starts immediately!**
4. ⚠️ If no: Prompts you to reassociate and updates config

**No more questions if everything is the same!** 🎉

## Key Features

### ✅ Smart Port Detection

- Checks if saved port is still available
- Auto-starts if port matches
- Prompts to reconfigure if port changed

### ✅ Robot ID System

- Each robot has a unique ID (folder name)
- Maps robot ID → USB port
- Multiple robots supported (for future use)

### ✅ Local Configuration

- `robots/` folder in SimpleRobotServer directory
- No more searching entire project tree
- Clean, organized structure

### ✅ Easy Migration

Copy existing calibration files:

```bash
# From full robot_server
cp -r ../robot_server/src/robot_server/robots/follower_1 robots/
```

## Commands

```bash
# Normal usage (auto-detect and save/load config)
uv run simple-robot-server

# Reset configuration and reconfigure
uv run simple-robot-server --reset

# Simulation mode (no robot needed)
uv run simple-robot-server --simulation

# Debug mode
uv run simple-robot-server --debug
```

## Example config.json

```json
{
  "robot_id": "right",
  "robot_port": "COM3",
  "calibration_file": "robots/right/calibration.json",
  "server": {
    "host": "localhost",
    "port": 9000
  }
}
```

## Benefits

| Before                                | After                               |
| ------------------------------------- | ----------------------------------- |
| Search entire project for calibration | Local `robots/` folder only         |
| Manual port selection every time      | Auto-starts if port unchanged       |
| Ask to reuse config                   | Automatic if port matches           |
| No robot ID tracking                  | Each robot has unique ID            |
| Config anywhere                       | `config.json` in SimpleRobotServer/ |

## Migration Guide

If you already have the full robot_server with calibration files:

```bash
# 1. Copy your robot folder
cp -r ../robot_server/src/robot_server/robots/follower_1 SimpleRobotServer/robots/

# 2. Run the server
cd SimpleRobotServer
uv run simple-robot-server

# 3. Select your robot and associate with port
# Done! Next time it auto-starts!
```

## Troubleshooting

### "No robot folders found"

- Check that `robots/` folder exists
- Ensure each robot folder has `calibration.json`
- Or just select "Use default calibration"

### Port changed

- Server will detect this automatically
- You'll be prompted to reassociate
- Config will be updated

### Reset everything

```bash
uv run simple-robot-server --reset
```

This will delete `config.json` and start fresh.

## What Stayed the Same

- ✅ WebSocket API (no changes)
- ✅ Joint control commands (same format)
- ✅ Test client works the same
- ✅ All features unchanged
- ✅ Windows/Linux compatibility

## Summary

The SimpleRobotServer is now even simpler! It:

1. Uses a local `robots/` folder structure
2. Associates each robot ID with its USB port
3. Saves the mapping to `config.json`
4. **Auto-starts if the robot is on the same port**
5. Prompts to reconfigure if port changed

No more manual selection every time! 🚀
