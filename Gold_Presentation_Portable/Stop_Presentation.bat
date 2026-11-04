@echo off
title Pothys Swarna Mahal - Stop Presentation
cd /d "%~dp0"

echo ================================================================================
echo             POTHYS SWARNA MAHAL - PRESENTATION SERVER STOPPER
echo ================================================================================
echo  Stopping local presentation server...

set "PORT_FILE=%TEMP%\psm_gold_presentation_port.txt"

if exist "%PORT_FILE%" (
    set /p RUNNING_PORT=<"%PORT_FILE%"
    if defined RUNNING_PORT (
        :: Signal server shutdown via curl
        curl -s -m 1 -X POST "http://127.0.0.1:!RUNNING_PORT!/api/shutdown" >nul 2>&1
    )
    del /f /q "%PORT_FILE%" >nul 2>&1
)

:: Terminate any active server.ps1 background process
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*server.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo  [SUCCESS] Presentation server has been stopped cleanly.
echo ================================================================================
ping 127.0.0.1 -n 2 >nul
exit /b 0
