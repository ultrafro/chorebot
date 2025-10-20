# Robot Configurations

This folder contains robot configurations for SimpleRobotServer.

## Structure

Each robot should have its own folder with a `calibration.json` file:

```
robots/
├── follower_1/
│   └── calibration.json
├── follower_2/
│   └── calibration.json
└── my_robot/
    └── calibration.json
```

## Creating a Robot Configuration

1. Create a new folder with your robot's ID (e.g., `follower_1`)
2. Add a `calibration.json` file in that folder
3. The `calibration.json` should contain calibration data from LeRobot

### Example calibration.json

```json
{
  "shoulder_pan": {
    "homing_offset": 0,
    "drive_mode": 0
  },
  "shoulder_lift": {
    "homing_offset": 0,
    "drive_mode": 0
  },
  "elbow_flex": {
    "homing_offset": 0,
    "drive_mode": 0
  },
  "wrist_flex": {
    "homing_offset": 0,
    "drive_mode": 0
  },
  "wrist_roll": {
    "homing_offset": 0,
    "drive_mode": 0
  },
  "gripper": {
    "homing_offset": 0,
    "drive_mode": 0
  }
}
```

## Usage

When you run `uv run simple-robot-server` (or `python simple_robot_server.py`), the server will:

1. Scan this `robots/` folder
2. Show you all available robot configurations
3. Let you select which robot to use
4. Ask you to associate it with a USB port
5. Save the mapping to `config.json`

On subsequent runs, if the robot is still on the same port, it will auto-start!

## Copying Calibration from Full Robot Server

If you have calibration files in the full robot_server, you can copy them:

```bash
# Copy from robot_server to SimpleRobotServer
cp -r ../robot_server/src/robot_server/robots/follower_1 robots/

# Or on Windows:
# xcopy ..\robot_server\src\robot_server\robots\follower_1 robots\follower_1\ /E
```

## Default Configuration

If you don't have any robot folders, the server will offer to use default calibration (no calibration file needed).
