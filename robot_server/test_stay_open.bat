@echo off
title Test - Window Should Stay Open

echo.
echo ========================================
echo 🧪 TEST: Window Should Stay Open
echo ========================================
echo.
echo This is a test to see if the window stays open.
echo.
echo If you can see this message, the window is working.
echo.

:keep_open
echo.
echo Press 'q' and Enter to quit, or just Enter to continue...
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
echo Test completed. Window will close in 3 seconds...
timeout /t 3 >nul
