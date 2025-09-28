# USB Device Forwarding Guide for WSL

This guide helps you forward USB devices from Windows to WSL for use with the TeleTable robot server.

## Quick Start

### Option 1: Automated Script (Recommended)

1. **Double-click** `forward_usb_devices.bat` in the `robot_server` folder
2. **Right-click** and select "Run as administrator" when prompted
3. Follow the on-screen instructions to forward your robot devices
4. Go to WSL and run: `uv run robot-server --scan-and-forward`

### Option 2: Manual Steps

#### On Windows (PowerShell as Administrator):

1. **Install usbipd:**

   ```powershell
   winget install usbipd
   ```

2. **List USB devices:**

   ```powershell
   usbipd list
   ```

3. **Bind robot device:**
   ```powershell
   usbipd bind --busid <BUSID>
   ```
   (Replace `<BUSID>` with the actual bus ID from step 2)

#### In WSL:

4. **Attach device to WSL:**

   ```bash
   usbipd attach --wsl --busid <BUSID>
   ```

5. **Check devices:**

   ```bash
   ls -l /dev/tty*
   ```

6. **Run robot server:**
   ```bash
   uv run robot-server -justmove
   ```

## Troubleshooting

### No devices found

- Make sure your robot is connected and powered on
- Check USB cable connection
- Try unplugging and reconnecting the USB cable

### Permission denied

- Make sure you're running PowerShell as Administrator
- Check that usbipd is installed correctly

### Device not recognized

- The script automatically detects robot devices based on common patterns
- If your device isn't detected, you can still forward it manually
- Look for devices with "serial", "uart", "ch340", "ch341", "ch343", "cp210", "ft232", "ftdi", or "arduino" in the name

### WSL can't see the device

- Make sure the device is bound on Windows first
- Try running: `uv run robot-server --scan-and-forward`
- Check device permissions: `sudo chmod 666 /dev/ttyUSB* /dev/ttyACM*`

## Additional Commands

- `uv run robot-server --diagnose-usb` - Run USB diagnostics
- `uv run robot-server --show-commands` - Show exact commands needed
- `uv run robot-server --scan-and-forward` - Automatically scan and forward devices

## Common Robot Device Patterns

The script automatically detects these types of devices:

- **Serial/UART devices**: CH340, CH341, CH343, CP210x, FT232, FTDI
- **Arduino devices**: Any device with "Arduino" in the name
- **USB-Serial converters**: Common USB-to-serial adapters
- **VID:PID patterns**: 1a86: (QinHeng), 0403: (FTDI), 10c4: (Silicon Labs), etc.

If your device doesn't match these patterns, you can still forward it manually using the bus ID from `usbipd list`.
