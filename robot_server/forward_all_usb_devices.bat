@echo off
setlocal enabledelayedexpansion

title TeleTable USB Device Forwarder - Forward All

echo.
echo ========================================
echo TeleTable USB Device Forwarder
echo Forward All Devices to WSL
echo ========================================
echo.
echo This script will forward ALL USB devices from Windows to WSL
echo for use with the TeleTable robot server.
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - Good!
) else (
    echo ERROR: This script must be run as Administrator
    echo.
    echo Please:
    echo 1. Right-click on this file
    echo 2. Select "Run as administrator"
    echo 3. Click "Yes" when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo Checking if usbipd is installed...
usbipd --version >nul 2>&1
if %errorLevel% == 0 (
    echo OK usbipd is already installed
    for /f "tokens=*" %%i in ('usbipd --version') do echo    Version: %%i
) else (
    echo ERROR usbipd is not installed
    echo.
    echo Installing usbipd...
    winget install usbipd
    if %errorLevel% == 0 (
        echo OK usbipd installed successfully
    ) else (
        echo ERROR Failed to install usbipd
        echo.
        echo Please try installing manually:
        echo 1. Go to: https://github.com/cezanne/usbip-win/releases
        echo 2. Download the latest release
        echo 3. Install it manually
        echo.
        goto :keep_open
    )
)

echo.
echo Scanning for USB devices...
echo.

:: Get list of USB devices
usbipd list > temp_usb_list.txt 2>&1
if %errorLevel% neq 0 (
    echo ERROR Failed to list USB devices
    echo.
    echo This might mean:
    echo 1. No USB devices are connected
    echo 2. usbipd is not working properly
    echo.
    goto :keep_open
)

:: Display the raw output first
echo Raw usbipd output:
echo.
type temp_usb_list.txt
echo.

:: Parse the output and forward all devices
set /a device_count=0
set /a forwarded_count=0

echo Forwarding ALL USB devices to WSL...
echo.

for /f "usebackq tokens=1,2* delims= " %%a in ("temp_usb_list.txt") do (
    set busid=%%a
    set vid_pid=%%b
    set device_name=%%c
    
    :: Skip header lines
    if not "!busid!"=="BUSID" if not "!busid!"=="Connected:" if not "!busid!"=="Persisted:" if not "!busid!"=="GUID" (
        if not "!busid!"=="" (
            set /a device_count+=1
            
            echo Device !device_count!. !busid! - !device_name! (!vid_pid!)
            
            :: Check if device is already shared
            echo !device_name! | findstr /i "shared" >nul
            if !errorLevel!==0 (
                echo    Status: Already shared - skipping
            ) else (
                echo    Binding device !busid!...
                usbipd bind --busid !busid!
                if !errorLevel!==0 (
                    echo    OK Device !busid! bound successfully
                    set /a forwarded_count+=1
                ) else (
                    echo    ERROR Failed to bind device !busid!
                )
            )
            echo.
        )
    )
)

:: Clean up temp file
if exist temp_usb_list.txt del temp_usb_list.txt

echo.
echo ========================================
echo Summary
echo ========================================
echo.

if %device_count%==0 (
    echo No USB devices found
    echo.
    echo Please:
    echo 1. Connect your robot to a USB port
    echo 2. Make sure it's powered on
    echo 3. Run this script again
    echo.
) else (
    echo Found %device_count% USB device(s)
    echo Successfully bound %forwarded_count% device(s)
    echo.
    echo Next steps:
    echo 1. Go to your WSL terminal
    echo 2. Run: uv run robot-server --scan-and-forward
    echo 3. Or run: usbipd attach --wsl --busid ^<BUSID^> for each device
    echo 4. Then run: uv run robot-server -justmove
    echo.
    echo Note: Some devices may already be shared, so the count above
    echo shows only newly bound devices.
)

echo.
echo Additional WSL commands:
echo    uv run robot-server --diagnose-usb
echo    uv run robot-server --show-commands
echo.

:keep_open
echo.
echo ========================================
echo WINDOW WILL STAY OPEN
echo ========================================
echo.
echo This window is intentionally staying open so you can review the results.
echo.
echo Options:
echo   - Press 'q' and Enter to quit
echo   - Press just Enter to continue reviewing
echo   - Press Ctrl+C to force close (not recommended)
echo.
set /p user_input="Your choice: "
if /i "%user_input%"=="q" (
    echo.
    echo Goodbye!
    goto :end
) else (
    echo.
    echo Window will stay open. Press 'q' and Enter to quit.
    goto :keep_open
)
:end
echo.
echo Script completed. Window will close in 3 seconds...
timeout /t 3 >nul
