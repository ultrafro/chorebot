# Multi-Robot Support Guide

The Simple Robot Server now supports controlling multiple robots simultaneously through a single WebSocket connection.

## Configuration

### Single Robot (Legacy Format)

The server still supports the original single-robot configuration:

```json
{
  "robot_id": "right",
  "robot_port": "COM3",
  "calibration_file": "C:\\path\\to\\calibration.json",
  "server": {
    "host": "localhost",
    "port": 9000
  }
}
```

### Multiple Robots (New Format)

To control multiple robots, use the `robots` array:

```json
{
  "robots": [
    {
      "robot_id": "left",
      "robot_port": "COM3",
      "calibration_file": "C:\\path\\to\\left\\calibration.json"
    },
    {
      "robot_id": "right",
      "robot_port": "COM4",
      "calibration_file": "C:\\path\\to\\right\\calibration.json"
    }
  ],
  "server": {
    "host": "localhost",
    "port": 9000
  }
}
```

## WebSocket Protocol

### Sending Joint Commands

When sending joint control commands, you must now include a `robot_id` field:

```javascript
{
  "type": "joint_control",
  "robot_id": "right",  // Required: specifies which robot to control
  "joints": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]  // 5 joint angles + gripper
}
```

### Response

The server response includes the robot_id:

```javascript
{
  "type": "joint_control_response",
  "robot_id": "right",
  "success": true,
  "current_joints": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0],
  "timestamp": "2025-10-12T12:00:00.000Z"
}
```

### Getting Joint Positions

**Get specific robot:**

```javascript
{
  "type": "get_joints",
  "robot_id": "right"
}
```

Response:

```javascript
{
  "type": "current_joints",
  "robot_id": "right",
  "joints": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0],
  "timestamp": "2025-10-12T12:00:00.000Z"
}
```

**Get all robots:**

```javascript
{
  "type": "get_joints"
}
```

Response:

```javascript
{
  "type": "current_joints",
  "robots": {
    "left": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0],
    "right": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]
  },
  "timestamp": "2025-10-12T12:00:00.000Z"
}
```

## Error Handling

If you send a command with an unknown `robot_id`, you'll receive an error:

```javascript
{
  "type": "error",
  "message": "Unknown robot_id 'unknown'. Available robots: ['left', 'right']"
}
```

If you forget to include the `robot_id`:

```javascript
{
  "type": "error",
  "message": "Missing 'robot_id' field in joint_control message"
}
```

## TypeScript/JavaScript Client Example

```typescript
import { useRobotWebSocket } from "./hooks/useRobotWebSocket";

// In your component
const { isConnected, sendHandData } = useRobotWebSocket("ws://localhost:9000");

// Send commands to specific robots
sendHandData("left", [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]);
sendHandData("right", [0.1, 0.2, 0.3, 0.4, 0.5, 60.0]);
```

## Migration from Single Robot

Your existing single-robot configuration will continue to work. The server automatically detects the format and handles both:

- **Legacy format**: Uses `robot_id`, `robot_port`, and `calibration_file` at the root level
- **New format**: Uses `robots` array with multiple robot configurations

## Running the Server

The server initialization automatically detects which format you're using:

```bash
# Single robot (auto-detected from config.json)
python simple_robot_server.py

# Multiple robots (auto-detected from config.json)
python simple_robot_server.py

# Simulation mode
python simple_robot_server.py --simulation
```

When starting, the server will log which robots it's managing:

```
SimpleRobotServer initialized on localhost:9000
Managing 2 robot(s): ['left', 'right']
```
