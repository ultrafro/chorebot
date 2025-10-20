"""
Test client for Simple Robot Server

This script connects to the Simple Robot Server and sends test commands.

Usage:
    uv run python test_client.py
    # or
    python test_client.py
"""

import asyncio
import websockets
import json
import math
import time


async def test_connection():
    """Test basic connection and ping."""
    print("🔗 Testing connection...")
    uri = "ws://localhost:9000"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Wait for welcome message
            welcome = await websocket.recv()
            print(f"✅ Received welcome: {welcome}")
            
            # Send ping
            await websocket.send(json.dumps({"type": "ping"}))
            pong = await websocket.recv()
            print(f"✅ Ping successful: {pong}")
            
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


async def test_get_joints():
    """Test getting current joint positions."""
    print("\n📊 Testing get joints...")
    uri = "ws://localhost:9000"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Skip welcome message
            await websocket.recv()
            
            # Get joints
            await websocket.send(json.dumps({"type": "get_joints"}))
            response = await websocket.recv()
            data = json.loads(response)
            print(f"✅ Current joints: {data.get('joints')}")
            return True
    except Exception as e:
        print(f"❌ Get joints failed: {e}")
        return False


async def test_joint_control():
    """Test sending joint control commands."""
    print("\n🎮 Testing joint control...")
    uri = "ws://localhost:9000"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Skip welcome message
            await websocket.recv()
            
            # Send a simple joint command
            test_joints = [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]
            command = {
                "type": "joint_control",
                "joints": test_joints
            }
            
            print(f"📤 Sending: {test_joints}")
            await websocket.send(json.dumps(command))
            
            response = await websocket.recv()
            data = json.loads(response)
            
            if data.get("success"):
                print(f"✅ Joint control successful")
                print(f"📍 Current position: {data.get('current_joints')}")
                return True
            else:
                print(f"❌ Joint control failed")
                return False
                
    except Exception as e:
        print(f"❌ Joint control test failed: {e}")
        return False


async def test_continuous_motion():
    """Test continuous motion by sending multiple commands."""
    print("\n🔄 Testing continuous motion (5 seconds)...")
    uri = "ws://localhost:9000"
    
    try:
        async with websockets.connect(uri) as websocket:
            # Skip welcome message
            await websocket.recv()
            
            start_time = time.time()
            count = 0
            
            while time.time() - start_time < 5.0:
                # Create a simple sinusoidal motion for joint 0
                t = time.time() - start_time
                angle = math.sin(t * 2) * 0.5  # Oscillate between -0.5 and 0.5 radians
                
                test_joints = [angle, 0.0, 0.0, 0.0, 0.0, 50.0]
                command = {
                    "type": "joint_control",
                    "joints": test_joints
                }
                
                await websocket.send(json.dumps(command))
                response = await websocket.recv()
                
                count += 1
                await asyncio.sleep(0.05)  # 20 Hz update rate
            
            print(f"✅ Sent {count} commands in 5 seconds ({count/5:.1f} Hz)")
            return True
            
    except Exception as e:
        print(f"❌ Continuous motion test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests sequentially."""
    print("="*60)
    print("Simple Robot Server - Test Client")
    print("="*60)
    
    tests = [
        ("Connection Test", test_connection),
        ("Get Joints Test", test_get_joints),
        ("Joint Control Test", test_joint_control),
        ("Continuous Motion Test", test_continuous_motion),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results[test_name] = False
        
        # Small delay between tests
        await asyncio.sleep(0.5)
    
    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    passed = sum(results.values())
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*60)


if __name__ == "__main__":
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")

