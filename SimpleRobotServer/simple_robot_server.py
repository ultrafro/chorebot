"""
Simple Robot Server - Direct Joint Control via WebSocket

This server receives direct joint position commands (6 numbers) and sends them
directly to the robot without any inverse kinematics calculations.

Usage:
    python simple_robot_server.py
    
The server will automatically:
- Scan for connected robots
- Ask you to select and configure the robot
- Save the configuration for future use
"""

import asyncio
import websockets
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SimpleRobotController:
    """Simple robot controller that accepts direct joint position commands."""
    
    def __init__(self, robot_port: str, calibration_file: str = None, use_simulation: bool = False):
        """
        Initialize the simple robot controller.
        
        Args:
            robot_port: Serial port for robot communication (e.g., COM3 or /dev/ttyACM0)
            calibration_file: Path to calibration.json file (optional)
            use_simulation: If True, only simulate movements without actual robot
        """
        self.robot_port = robot_port
        self.calibration_file = calibration_file
        self.use_simulation = use_simulation
        self.robot = None
        self.is_connected = False
        self.current_joint_positions = [0.0, 0.0, 0.0, 0.0, 0.0, 50.0]  # 5 joints + gripper
        
        logger.info(f"SimpleRobotController initialized (port: {robot_port}, calibration: {calibration_file or 'default'}, simulation: {use_simulation})")
    
    def connect(self):
        """Connect to the robot."""
        if self.use_simulation:
            self.is_connected = True
            logger.info("🎮 Connected to simulated robot")
            return
        
        try:
            # Pre-connection checks
            logger.info("🔍 Running pre-connection checks...")
            logger.info(f"   - Checking if port {self.robot_port} is accessible...")
            
            # Check if port exists
            try:
                import serial.tools.list_ports
                available_ports = [port.device for port in serial.tools.list_ports.comports()]
                if self.robot_port in available_ports:
                    logger.info(f"   ✓ Port {self.robot_port} is detected")
                else:
                    logger.warning(f"   ⚠️  Port {self.robot_port} not in available ports list")
                    logger.warning(f"   Available ports: {', '.join(available_ports) if available_ports else 'None'}")
            except Exception as port_check_error:
                logger.warning(f"   ⚠️  Could not check port availability: {port_check_error}")
            
            # Try to open the port briefly to check access
            try:
                import serial
                logger.info(f"   - Testing serial port access...")
                test_port = serial.Serial(self.robot_port, baudrate=1000000, timeout=0.1)
                test_port.close()
                logger.info(f"   ✓ Port is accessible")
            except serial.SerialException as serial_error:
                logger.error(f"   ❌ Cannot access port: {serial_error}")
                logger.error(f"   💡 Possible reasons:")
                logger.error(f"      - Port is already open by another program")
                logger.error(f"      - Insufficient permissions")
                logger.error(f"      - Port does not exist")
                raise
            except Exception as access_error:
                logger.warning(f"   ⚠️  Could not test port access: {access_error}")
            
            # Import LeRobot components
            logger.info("📦 Importing LeRobot components...")
            from lerobot.robots.so101_follower.so101_follower import SO101Follower
            from lerobot.robots.so101_follower.config_so101_follower import SO101FollowerConfig
            
            # Create configuration
            if self.calibration_file:
                # Use calibration file if provided
                calib_path = Path(self.calibration_file)
                robot_folder = calib_path.parent
                robot_id = robot_folder.name
                
                logger.info(f"📋 Using calibration file: {self.calibration_file}")
                logger.info(f"🤖 Robot ID: {robot_id}")
                
                config = SO101FollowerConfig(
                    port=self.robot_port,
                    use_degrees=False,
                    id=robot_id,
                    calibration_dir=robot_folder
                )
            else:
                # Use default configuration
                logger.info("📋 Using default calibration")
                config = SO101FollowerConfig(
                    port=self.robot_port,
                    use_degrees=False
                )
            
            # Log detailed configuration
            logger.info(f"🔧 Robot Configuration Details:")
            logger.info(f"   - Port: {self.robot_port}")
            logger.info(f"   - Robot ID: {robot_id if self.calibration_file else 'default'}")
            logger.info(f"   - Calibration Dir: {robot_folder if self.calibration_file else 'default'}")
            logger.info(f"   - Use Degrees: False (radians)")
            
            # Initialize and connect to robot
            logger.info(f"🔌 Connecting to robot on {self.robot_port}...")
            logger.info(f"   This will initialize all servos and enable torque...")
            
            try:
                self.robot = SO101Follower(config)
                logger.info(f"✓ SO101Follower instance created")
                logger.info(f"⚙️  Calling connect() - this may take a few seconds...")
                self.robot.connect()
                logger.info(f"✓ Connection successful")
            except Exception as connect_error:
                logger.error(f"❌ Connection failed with error: {connect_error}")
                logger.error(f"📋 Error type: {type(connect_error).__name__}")
                logger.error(f"🔍 Full traceback:")
                logger.error(traceback.format_exc())
                raise
            
            # Get initial joint positions
            obs = self.robot.get_observation()
            self.current_joint_positions = [
                obs.get("shoulder_pan.pos", 0),
                obs.get("shoulder_lift.pos", 0),
                obs.get("elbow_flex.pos", 0),
                obs.get("wrist_flex.pos", 0),
                obs.get("wrist_roll.pos", 0),
                obs.get("gripper.pos", 50)
            ]
            
            self.is_connected = True
            logger.info(f"✅ Connected to robot successfully")
            logger.info(f"📊 Initial joint positions: {[f'{x:.3f}' for x in self.current_joint_positions]}")
            
        except ImportError as e:
            logger.error(f"❌ Failed to import LeRobot: {e}")
            logger.error("Please install lerobot: pip install 'lerobot[feetech]'")
            logger.error(f"🔍 Full traceback:")
            logger.error(traceback.format_exc())
            raise
        except Exception as e:
            logger.error(f"❌ Failed to connect to robot: {e}")
            logger.error(f"📋 Error type: {type(e).__name__}")
            logger.error(f"💡 This error typically occurs when:")
            logger.error(f"   1. A servo is not responding (check power and connections)")
            logger.error(f"   2. A servo ID is incorrect (check your calibration file)")
            logger.error(f"   3. Communication issues (check USB cable and drivers)")
            logger.error(f"   4. Another program is using the port (close other software)")
            logger.error(f"🔍 Full traceback:")
            logger.error(traceback.format_exc())
            raise
    
    def disconnect(self):
        """Disconnect from the robot."""
        if not self.use_simulation and self.robot:
            try:
                self.robot.disconnect()
                logger.info("Disconnected from robot")
            except Exception as e:
                logger.error(f"Error disconnecting robot: {e}")
        
        self.is_connected = False
    
    def move_to_joint_positions(self, joint_positions: list) -> bool:
        """
        Move robot to specified joint positions.
        
        Args:
            joint_positions: List of 6 floats [j1, j2, j3, j4, j5, gripper]
                           Joint angles in radians, gripper in range 0-100
        
        Returns:
            True if movement was successful, False otherwise
        """
        if not self.is_connected:
            logger.warning("Robot not connected")
            return False
        
        if len(joint_positions) != 6:
            logger.error(f"Expected 6 joint positions, got {len(joint_positions)}")
            return False
        
        try:
            if self.use_simulation:
                # Simulation mode - just update internal state
                self.current_joint_positions = joint_positions
                logger.info(f"🎮 Simulated move to: {[f'{x:.3f}' for x in joint_positions]}")
                return True
            
            else:
                # Real robot mode
                action = {
                    "shoulder_pan.pos": joint_positions[0],
                    "shoulder_lift.pos": joint_positions[1],
                    "elbow_flex.pos": joint_positions[2],
                    "wrist_flex.pos": joint_positions[3],
                    "wrist_roll.pos": joint_positions[4],
                    "gripper.pos": max(0.0, min(100.0, joint_positions[5]))  # Clamp gripper
                }
                
                self.robot.send_action(action)
                self.current_joint_positions = joint_positions
                
                logger.debug(f"📍 Moved to joint positions: {[f'{x:.3f}' for x in joint_positions]}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to move to joint positions: {e}")
            return False
    
    def get_current_joint_positions(self) -> list:
        """Get current joint positions."""
        return self.current_joint_positions.copy()


class SimpleRobotServer:
    """WebSocket server for receiving direct joint position commands."""
    
    def __init__(self, host: str = "localhost", port: int = 9000, 
                 robot_controllers: Dict[str, SimpleRobotController] = None):
        """
        Initialize the Simple Robot Server.
        
        Args:
            host: The host address to bind the server to
            port: The port number to listen on
            robot_controllers: Dictionary of robot_id -> robot controller instances
        """
        self.host = host
        self.port = port
        self.robot_controllers = robot_controllers or {}
        self.connected_clients = set()
        
        logger.info(f"SimpleRobotServer initialized on {host}:{port}")
        logger.info(f"Managing {len(self.robot_controllers)} robot(s): {list(self.robot_controllers.keys())}")
    
    async def handle_client(self, websocket):
        """Handle a new WebSocket client connection."""
        client_addr = websocket.remote_address
        logger.info(f"🔗 New client connected: {client_addr}")
        self.connected_clients.add(websocket)
        
        try:
            # Send welcome message
            welcome_msg = {
                "type": "welcome",
                "message": "Connected to Simple Robot Server",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(welcome_msg))
            
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_message(websocket, data)
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON received from {client_addr}: {e}")
                    error_msg = {
                        "type": "error",
                        "message": "Invalid JSON format"
                    }
                    await websocket.send(json.dumps(error_msg))
                except Exception as e:
                    logger.error(f"Error processing message from {client_addr}: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"📱 Client disconnected: {client_addr}")
        except Exception as e:
            logger.error(f"Error handling client {client_addr}: {e}")
        finally:
            self.connected_clients.discard(websocket)
    
    async def process_message(self, websocket, data: Dict[str, Any]):
        """Process incoming WebSocket message."""
        message_type = data.get("type")
        
        if message_type == "joint_control":
            # Process direct joint control command
            robot_id = data.get("robot_id")
            joints = data.get("joints", [])
            
            # Validate robot_id
            if not robot_id:
                error_msg = {
                    "type": "error",
                    "message": "Missing 'robot_id' field in joint_control message"
                }
                await websocket.send(json.dumps(error_msg))
                return
            
            # Check if robot exists
            if robot_id not in self.robot_controllers:
                error_msg = {
                    "type": "error",
                    "message": f"Unknown robot_id '{robot_id}'. Available robots: {list(self.robot_controllers.keys())}"
                }
                await websocket.send(json.dumps(error_msg))
                return
            
            # Validate joint count
            if len(joints) != 6:
                error_msg = {
                    "type": "error",
                    "message": f"Expected 6 joint values, got {len(joints)}"
                }
                await websocket.send(json.dumps(error_msg))
                return
            
            logger.info(f"📥 Joint control command for robot '{robot_id}': {[f'{x:.3f}' for x in joints]}")
            
            # Execute joint control on the specified robot
            robot_controller = self.robot_controllers[robot_id]
            success = robot_controller.move_to_joint_positions(joints)
            
            # Send response
            response_msg = {
                "type": "joint_control_response",
                "robot_id": robot_id,
                "success": success,
                "current_joints": robot_controller.get_current_joint_positions() if success else None,
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(response_msg))
            
        elif message_type == "get_joints":
            # Get current joint positions
            robot_id = data.get("robot_id")
            
            # If no robot_id specified, return all robots
            if not robot_id:
                all_joints = {}
                for rid, controller in self.robot_controllers.items():
                    all_joints[rid] = controller.get_current_joint_positions()
                
                response_msg = {
                    "type": "current_joints",
                    "robots": all_joints,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Return specific robot
                if robot_id not in self.robot_controllers:
                    error_msg = {
                        "type": "error",
                        "message": f"Unknown robot_id '{robot_id}'. Available robots: {list(self.robot_controllers.keys())}"
                    }
                    await websocket.send(json.dumps(error_msg))
                    return
                
                current_joints = self.robot_controllers[robot_id].get_current_joint_positions()
                response_msg = {
                    "type": "current_joints",
                    "robot_id": robot_id,
                    "joints": current_joints,
                    "timestamp": datetime.now().isoformat()
                }
            
            await websocket.send(json.dumps(response_msg))
            
        elif message_type == "ping":
            # Respond to ping with pong
            pong_msg = {
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(pong_msg))
            
        else:
            logger.warning(f"Unknown message type: {message_type}")
            error_msg = {
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }
            await websocket.send(json.dumps(error_msg))
    
    async def start_server(self):
        """Start the WebSocket server."""
        logger.info(f"🚀 Starting Simple Robot Server on {self.host}:{self.port}")
        logger.info(f"📡 Waiting for connections...")
        
        try:
            async with websockets.serve(self.handle_client, self.host, self.port):
                # Keep the server running
                await asyncio.Future()  # Run forever
        finally:
            # Cleanup on server shutdown
            for robot_id, controller in self.robot_controllers.items():
                logger.info(f"Disconnecting robot '{robot_id}'...")
                controller.disconnect()
            logger.info("Server stopped")


def list_serial_devices() -> List[Tuple[str, str, str]]:
    """
    List all available serial devices.
    
    Returns:
        List of tuples (device_path, description, hardware_id)
    """
    try:
        import serial.tools.list_ports
        ports = serial.tools.list_ports.comports()
        devices = []
        
        for port in ports:
            devices.append((
                port.device,
                port.description or "Unknown Device",
                port.hwid or "Unknown"
            ))
        
        return devices
    except Exception as e:
        logger.error(f"Failed to list serial devices: {e}")
        return []


def display_devices(devices: List[Tuple[str, str, str]]):
    """Display available devices in a nice format."""
    if not devices:
        logger.info("No serial devices found")
        return
    
    print("\n" + "="*60)
    print(f"📱 Found {len(devices)} serial device(s):")
    print("="*60)
    for i, (device, description, hwid) in enumerate(devices, 1):
        print(f"  {i}. {device}")
        print(f"     Description: {description}")
        print(f"     Hardware ID: {hwid}")
        print()


def find_robot_folders() -> List[Path]:
    """
    Find all robot folders in SimpleRobotServer/robots/.
    Each robot folder should contain a calibration.json file.
    
    Returns:
        List of Path objects to robot folders
    """
    robots_dir = Path(__file__).parent / "robots"
    robot_folders = []
    
    if not robots_dir.exists():
        logger.warning(f"Robots directory not found: {robots_dir}")
        return []
    
    # Look for folders containing calibration.json
    for item in robots_dir.iterdir():
        if item.is_dir():
            calib_file = item / "calibration.json"
            if calib_file.exists():
                robot_folders.append(item)
            else:
                logger.debug(f"Skipping {item.name}: no calibration.json found")
    
    return robot_folders


def load_existing_config() -> Optional[Dict]:
    """Load existing config.json if it exists."""
    config_path = Path(__file__).parent / "config.json"
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            logger.info(f"📋 Found existing configuration: {config_path}")
            return config
        except Exception as e:
            logger.error(f"❌ Failed to load config.json: {e}")
            return None
    return None


def check_and_use_existing_config(config: Dict, available_ports: List[str]) -> bool:
    """
    Check if existing configuration is valid and can be used automatically.
    
    Returns:
        True if config can be used automatically, False if needs reconfiguration
    """
    saved_port = config.get('robot_port')
    robot_id = config.get('robot_id')
    
    print("\n" + "="*60)
    print("🔧 Found existing configuration:")
    print("="*60)
    print(f"  Robot ID: {robot_id}")
    print(f"  Port: {saved_port}")
    print(f"  Calibration: {config.get('calibration_file', 'None')}")
    print()
    
    # Check if the saved port is still available
    if saved_port in available_ports:
        print(f"✅ Port {saved_port} is still connected")
        print(f"✅ Auto-starting with saved configuration...")
        return True
    else:
        print(f"⚠️  Port {saved_port} is NOT currently connected")
        print(f"   Available ports: {', '.join(available_ports) if available_ports else 'None'}")
        print()
        print("❌ Robot not found on saved port. Need to reconfigure.")
        return False


def interactive_setup() -> Optional[Dict]:
    """Interactive setup to configure robot."""
    print("\n" + "="*60)
    print("🤖 Simple Robot Server - Interactive Setup")
    print("="*60)
    
    # Step 1: Find robot folders
    print("\n🔍 Scanning for robot configurations...")
    robot_folders = find_robot_folders()
    
    if not robot_folders:
        print("❌ No robot folders found in SimpleRobotServer/robots/")
        print("   Expected structure: SimpleRobotServer/robots/<robot_id>/calibration.json")
        print("\n💡 You can either:")
        print("   1. Create a robot folder with calibration.json")
        print("   2. Use default calibration (no folder needed)")
        print()
        
        # Ask if user wants to continue with default calibration
        while True:
            try:
                response = input("Continue with default calibration? [y/N]: ").strip().lower()
                if response in ['y', 'yes']:
                    robot_id = None
                    calibration_file = None
                    break
                elif response in ['n', 'no', '']:
                    print("Setup cancelled.")
                    return None
                else:
                    print("Please enter 'y' for yes or 'n' for no.")
            except KeyboardInterrupt:
                print("\nSetup cancelled.")
                return None
    else:
        print(f"\n📁 Found {len(robot_folders)} robot(s):")
        print("="*60)
        for i, robot_folder in enumerate(robot_folders, 1):
            robot_id = robot_folder.name
            calib_file = robot_folder / "calibration.json"
            print(f"  {i}. {robot_id}")
            print(f"     Calibration: {calib_file}")
            print()
        print(f"  {len(robot_folders) + 1}. None (use default calibration)")
        print()
        
        # Step 2: Select robot
        while True:
            try:
                choice = input(f"Select a robot (1-{len(robot_folders) + 1}) or 'q' to quit: ").strip().lower()
                
                if choice == 'q' or choice == 'quit':
                    print("Setup cancelled.")
                    return None
                
                robot_num = int(choice)
                if 1 <= robot_num <= len(robot_folders):
                    selected_robot = robot_folders[robot_num - 1]
                    robot_id = selected_robot.name
                    calibration_file = str(selected_robot / "calibration.json")
                    print(f"✅ Selected robot: {robot_id}")
                    break
                elif robot_num == len(robot_folders) + 1:
                    robot_id = None
                    calibration_file = None
                    print("✅ Using default calibration")
                    break
                else:
                    print(f"❌ Invalid selection. Please enter a number between 1 and {len(robot_folders) + 1}.")
            except ValueError:
                print("❌ Invalid input. Please enter a number or 'q' to quit.")
            except KeyboardInterrupt:
                print("\nSetup cancelled.")
                return None
    
    # Step 3: Scan for serial devices
    print("\n📡 Scanning for serial devices...")
    devices = list_serial_devices()
    
    if not devices:
        print("❌ No serial devices found. Please connect your robot and try again.")
        return None
    
    display_devices(devices)
    
    # Step 4: Select device
    while True:
        try:
            choice = input(f"Select a device (1-{len(devices)}) or 'q' to quit: ").strip().lower()
            
            if choice == 'q' or choice == 'quit':
                print("Setup cancelled.")
                return None
            
            device_num = int(choice)
            if 1 <= device_num <= len(devices):
                selected_port = devices[device_num - 1][0]
                print(f"✅ Selected port: {selected_port}")
                break
            else:
                print(f"❌ Invalid selection. Please enter a number between 1 and {len(devices)}.")
        except ValueError:
            print("❌ Invalid input. Please enter a number or 'q' to quit.")
        except KeyboardInterrupt:
            print("\nSetup cancelled.")
            return None
    
    # Step 5: Create configuration
    config = {
        'robot_id': robot_id,
        'robot_port': selected_port,
        'calibration_file': calibration_file,
        'server': {
            'host': 'localhost',
            'port': 9000
        }
    }
    
    # Step 6: Save configuration
    config_path = Path(__file__).parent / "config.json"
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print("\n💾 Configuration saved to config.json")
        print(f"   Robot ID: {robot_id or 'Default'}")
        print(f"   Port: {selected_port}")
    except Exception as e:
        logger.warning(f"⚠️  Could not save config: {e}")
    
    return config


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Simple Robot Server - Direct Joint Control via WebSocket",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python simple_robot_server.py                           # Auto-detect and configure
  python simple_robot_server.py --simulation              # Simulation mode
  python simple_robot_server.py --host 0.0.0.0            # Listen on all interfaces
  python simple_robot_server.py --reset                   # Reset saved configuration
        """
    )
    
    parser.add_argument(
        '--host',
        default='localhost',
        help='WebSocket server host (default: localhost)'
    )
    parser.add_argument(
        '--ws-port',
        type=int,
        default=9000,
        help='WebSocket server port (default: 9000)'
    )
    parser.add_argument(
        '--simulation',
        action='store_true',
        help='Run in simulation mode (no actual robot required)'
    )
    parser.add_argument(
        '--reset',
        action='store_true',
        help='Reset saved configuration and run setup again'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging'
    )
    
    args = parser.parse_args()
    
    # Enable debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.info("🐛 Debug logging enabled")
    
    try:
        config = None
        
        # Check if user wants to reset configuration
        if args.reset:
            config_path = Path(__file__).parent / "config.json"
            if config_path.exists():
                config_path.unlink()
                logger.info("🗑️  Deleted existing configuration")
        
        # Try to load existing configuration
        if not args.simulation:
            existing_config = load_existing_config()
            
            if existing_config:
                # Get available ports
                devices = list_serial_devices()
                available_ports = [device[0] for device in devices]
                
                # Check if config is valid and can be used automatically
                if check_and_use_existing_config(existing_config, available_ports):
                    config = existing_config
                    logger.info("✅ Using existing configuration")
                else:
                    logger.info("🔄 Reconfiguring...")
                    config = None
            
            # If no config yet, run interactive setup
            if not config:
                config = interactive_setup()
                
                if not config:
                    logger.error("❌ Setup cancelled or failed")
                    return
        else:
            # Simulation mode - create minimal config
            logger.info("🎮 Running in simulation mode")
            config = {
                'robot_id': 'sim_robot',
                'robot_port': 'SIM',
                'calibration_file': None,
                'server': {
                    'host': args.host,
                    'port': args.ws_port
                }
            }
        
        # Extract server configuration
        server_config = config.get('server', {})
        host = args.host or server_config.get('host', 'localhost')
        ws_port = args.ws_port or server_config.get('port', 9000)
        
        # Initialize robot controllers
        # Support both single robot (old format) and multiple robots (new format)
        robot_controllers = {}
        
        if 'robots' in config:
            # New format: multiple robots
            logger.info(f"🤖 Initializing multiple robot controllers...")
            for robot_config in config['robots']:
                robot_id = robot_config.get('robot_id')
                robot_port = robot_config.get('robot_port')
                calibration_file = robot_config.get('calibration_file')
                
                logger.info(f"   Robot ID: {robot_id}")
                logger.info(f"   Port: {robot_port}")
                logger.info(f"   Calibration: {calibration_file or 'Default'}")
                
                robot_controller = SimpleRobotController(
                    robot_port=robot_port,
                    calibration_file=calibration_file,
                    use_simulation=args.simulation
                )
                
                # Connect to robot
                robot_controller.connect()
                robot_controllers[robot_id] = robot_controller
        else:
            # Old format: single robot
            robot_id = config.get('robot_id', 'default')
            robot_port = config.get('robot_port')
            calibration_file = config.get('calibration_file')
            
            logger.info(f"🤖 Initializing robot controller...")
            logger.info(f"   Robot ID: {robot_id}")
            logger.info(f"   Port: {robot_port}")
            logger.info(f"   Calibration: {calibration_file or 'Default'}")
            
            robot_controller = SimpleRobotController(
                robot_port=robot_port,
                calibration_file=calibration_file,
                use_simulation=args.simulation
            )
            
            # Connect to robot
            robot_controller.connect()
            robot_controllers[robot_id] = robot_controller
        
        # Initialize and start server
        server = SimpleRobotServer(
            host=host,
            port=ws_port,
            robot_controllers=robot_controllers
        )
        
        asyncio.run(server.start_server())
        
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        raise


if __name__ == "__main__":
    main()

