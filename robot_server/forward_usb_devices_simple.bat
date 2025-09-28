@echo off
setlocal enabledelayedexpansion

title TeleTable USB Device Forwarder

echo.
echo ========================================
echo TeleTable USB Device Forwarder
echo ========================================
echo.
echo This script will help you forward USB devices from Windows to WSL
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
    echo usbipd is already installed
    for /f "tokens=*" %%i in ('usbipd --version') do echo    Version: %%i
) else (
    echo usbipd is not installed
    echo.
    echo Installing usbipd...
    winget install usbipd
    if %errorLevel% == 0 (
        echo usbipd installed successfully
    ) else (
        echo Failed to install usbipd
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
    echo Failed to list USB devices
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

:: Parse the output to find robot devices
set /a device_count=0
set /a robot_device_count=0

echo Available USB devices:
echo.

for /f "usebackq tokens=1,2,3* delims= " %%a in ("temp_usb_list.txt") do (
    set busid=%%a
    set vid_pid=%%b
    set device_name=%%c %%d %%e %%f %%g %%h %%i %%j %%k %%l %%m %%n %%o %%p %%q %%r %%s %%t %%u %%v %%w %%x %%y %%z
    
    :: Skip header lines
    if not "!busid!"=="BUSID" if not "!busid!"=="Connected:" if not "!busid!"=="Persisted:" if not "!busid!"=="GUID" (
        if not "!busid!"=="" (
            set /a device_count+=1
            
            :: Check if this looks like a robot device
            set is_robot=0
            echo !device_name! | findstr /i "serial" >nul && set is_robot=1
            echo !device_name! | findstr /i "uart" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch340" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch341" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch343" >nul && set is_robot=1
            echo !device_name! | findstr /i "cp210" >nul && set is_robot=1
            echo !device_name! | findstr /i "ft232" >nul && set is_robot=1
            echo !device_name! | findstr /i "ftdi" >nul && set is_robot=1
            echo !device_name! | findstr /i "arduino" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb-serial" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb enhanced" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb to serial" >nul && set is_robot=1
            
            :: Check VID:PID patterns
            echo !vid_pid! | findstr /i "1a86:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "0403:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "10c4:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "067b:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "2341:" >nul && set is_robot=1
            
            if !is_robot!==1 (
                set /a robot_device_count+=1
                echo Robot !device_count!. !busid! - !device_name! (!vid_pid!)
                echo    This looks like a robot device
            ) else (
                echo Device !device_count!. !busid! - !device_name! (!vid_pid!)
            )
            echo.
        )
    )
)

:: Clean up temp file
if exist temp_usb_list.txt del temp_usb_list.txt

if %device_count%==0 (
    echo No USB devices found
    echo.
    echo Please:
    echo 1. Connect your robot to a USB port
    echo 2. Make sure it's powered on
    echo 3. Run this script again
    echo.
    goto :keep_open
)

if %robot_device_count%==0 (
    echo No robot devices detected
    echo.
    echo The devices above don't appear to be robot devices.
    echo If you think one of them is your robot, you can still try to forward it.
    echo.
    set /p forward_anyway="Do you want to forward any of these devices anyway? (y/N): "
    if /i not "!forward_anyway!"=="y" (
        echo No devices will be forwarded.
        goto :keep_open
    )
)

echo.
echo USB Device Forwarding
echo ========================
echo.

:: Ask user which devices to forward
set /a forwarded_count=0

for /f "usebackq tokens=1,2,3* delims= " %%a in ("temp_usb_list.txt") do (
    set busid=%%a
    set vid_pid=%%b
    set device_name=%%c %%d %%e %%f %%g %%h %%i %%j %%k %%l %%m %%n %%o %%p %%q %%r %%s %%t %%u %%v %%w %%x %%y %%z
    
    :: Skip header lines
    if not "!busid!"=="BUSID" if not "!busid!"=="Connected:" if not "!busid!"=="Persisted:" if not "!busid!"=="GUID" (
        if not "!busid!"=="" (
            :: Check if this looks like a robot device
            set is_robot=0
            echo !device_name! | findstr /i "serial" >nul && set is_robot=1
            echo !device_name! | findstr /i "uart" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch340" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch341" >nul && set is_robot=1
            echo !device_name! | findstr /i "ch343" >nul && set is_robot=1
            echo !device_name! | findstr /i "cp210" >nul && set is_robot=1
            echo !device_name! | findstr /i "ft232" >nul && set is_robot=1
            echo !device_name! | findstr /i "ftdi" >nul && set is_robot=1
            echo !device_name! | findstr /i "arduino" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb-serial" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb enhanced" >nul && set is_robot=1
            echo !device_name! | findstr /i "usb to serial" >nul && set is_robot=1
            
            :: Check VID:PID patterns
            echo !vid_pid! | findstr /i "1a86:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "0403:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "10c4:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "067b:" >nul && set is_robot=1
            echo !vid_pid! | findstr /i "2341:" >nul && set is_robot=1
            
            if !is_robot!==1 (
                echo Robot Device: !busid! - !device_name!
                set /p forward_device="   Forward this device to WSL? (Y/n): "
                if /i "!forward_device!"=="" set forward_device=y
                if /i "!forward_device!"=="y" (
                    echo    Binding device !busid!...
                    usbipd bind --busid !busid!
                    if !errorLevel!==0 (
                        echo    Device !busid! bound successfully
                        set /a forwarded_count+=1
                    ) else (
                        echo    Failed to bind device !busid!
                    )
                ) else (
                    echo    Skipping device !busid!
                )
                echo.
            )
        )
    )
)

echo.
echo ========================================
echo Summary
echo ========================================
echo.

if %forwarded_count%==0 (
    echo No devices were forwarded
    echo.
    echo You can still try to forward devices manually:
    echo 1. Run: usbipd list
    echo 2. Run: usbipd bind --busid ^<BUSID^>
    echo 3. Then in WSL: usbipd attach --wsl --busid ^<BUSID^>
) else (
    echo %forwarded_count% device(s) bound successfully
    echo.
    echo Next steps:
    echo 1. Go to your WSL terminal
    echo 2. Run: uv run robot-server --scan-and-forward
    echo 3. Or run: usbipd attach --wsl --busid ^<BUSID^> for each device
    echo 4. Then run: uv run robot-server -justmove
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
