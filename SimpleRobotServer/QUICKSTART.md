# Quick Start Guide

Get up and running with Simple Robot Server in 5 minutes!

## Step 1: Install uv (One-time Setup)

### Windows

```powershell
# Open PowerShell and run:
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Linux/Mac

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**That's it!** `uv` will automatically handle Python and all dependencies when you run the server.

### Alternative: Traditional pip

```bash
pip install -r requirements.txt  # If you prefer pip over uv
```

## Step 2: (Optional) Add Robot Configuration

If you have calibration files, set them up:

```bash
# Option A: Copy from robot_server
cp -r ../robot_server/src/robot_server/robots/follower_1 SimpleRobotServer/robots/

# Option B: Create manually
mkdir SimpleRobotServer/robots/my_robot
# Add calibration.json to that folder
```

**Or skip this step** and use default calibration!

## Step 3: Start the Server

Just run it (uv handles everything automatically):

```bash
uv run simple-robot-server
```

Or with Python directly:

```bash
python simple_robot_server.py
```

**What happens next:**

1. **Robot Scan**: Server looks in `robots/` folder

   ```
   📁 Found 1 robot(s):
   1. follower_1
      Calibration: robots/follower_1/calibration.json
   2. None (use default calibration)

   Select a robot (1-2) or 'q' to quit: 1
   ✅ Selected robot: follower_1
   ```

2. **Device Scan**: Server shows all USB serial devices

   ```
   📱 Found 2 serial device(s):
   1. COM3
      Description: USB Serial Device
   2. COM5
      Description: Standard Serial Port
   ```

3. **Select Port**: Associate your robot with a port

   ```
   Select a device (1-2) or 'q' to quit: 1
   ✅ Selected port: COM3
   ```

4. **Done!** Configuration saved, server starts

   ```
   💾 Configuration saved to config.json
      Robot ID: follower_1
      Port: COM3
   🚀 Starting Simple Robot Server on localhost:9000
   ```

**Next time you run it:**

```bash
uv run simple-robot-server
```

The server will check the config:

```
🔧 Found existing configuration:
  Robot ID: follower_1
  Port: COM3
  Calibration: robots/follower_1/calibration.json

✅ Port COM3 is still connected
✅ Auto-starting with saved configuration...
🚀 Starting Simple Robot Server on localhost:9000
```

**It just starts automatically!** No questions asked! 🎉

## Step 4: Test the Connection

In a new terminal, run the test client:

```bash
python test_client.py
```

You should see all tests pass! ✅

## Step 5: Send Your First Command

### Using Python

```python
import asyncio
import websockets
import json

async def control_robot():
    uri = "ws://localhost:9000"
    async with websockets.connect(uri) as ws:
        # Skip welcome message
        await ws.recv()

        # Move robot to zero position
        command = {
            "type": "joint_control",
            "joints": [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]
        }
        await ws.send(json.dumps(command))

        # Get response
        response = await ws.recv()
        print(response)

asyncio.run(control_robot())
```

### Using JavaScript (Browser or Node.js)

```javascript
const ws = new WebSocket("ws://localhost:9000");

ws.onopen = () => {
  // Send joint command
  ws.send(
    JSON.stringify({
      type: "joint_control",
      joints: [0.0, 0.0, 0.0, 0.0, 0.0, 50.0],
    })
  );
};

ws.onmessage = (event) => {
  console.log("Response:", event.data);
};
```

## Joint Positions Explained

The `joints` array contains 6 values:

```python
joints = [
    0.0,   # Joint 0: shoulder_pan (radians)
    0.0,   # Joint 1: shoulder_lift (radians)
    0.0,   # Joint 2: elbow_flex (radians)
    0.0,   # Joint 3: wrist_flex (radians)
    0.0,   # Joint 4: wrist_roll (radians)
    50.0   # Joint 5: gripper (0-100, where 0=closed, 100=open)
]
```

### Safe Range Recommendations

- **Joints 0-4**: Typically safe range is -π to +π radians (-3.14 to 3.14)
- **Joint 5 (Gripper)**: 0 to 100
- Start with small movements (±0.1 radians) until you know your robot's limits

## Common Issues

### "Failed to connect to robot"

- Check USB cable
- Verify correct port number
- Ensure robot is powered on
- On Linux: Add user to dialout group: `sudo usermod -a -G dialout $USER`

### "Failed to import LeRobot"

```bash
pip install 'lerobot[feetech]' --upgrade
```

### Want to reconfigure?

```bash
uv run simple-robot-server --reset
```

### WebSocket connection refused

- Ensure server is running
- Check firewall settings
- Verify port 9000 is not in use by another program

## Next Steps

- See `README.md` for complete API documentation
- Check out `test_client.py` for more examples
- Try simulation mode: `uv run simple-robot-server --simulation`
- Reconfigure anytime: `uv run simple-robot-server --reset`

## Need Help?

1. Enable debug logging: `--debug` flag
2. Try simulation mode first: `--simulation` flag
3. Check the full README.md for troubleshooting
