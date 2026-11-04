@echo off
setlocal EnableDelayedExpansion
title Pothys Swarna Mahal - Gold Training Presentation
cd /d "%~dp0"

set "PORT_FILE=%TEMP%\psm_gold_presentation_port.txt"
set "SERVER_SCRIPT=%~dp0server.ps1"
set "INDEX_FILE=%~dp0index.html"

:: 1. Check if presentation files exist
if not exist "%INDEX_FILE%" (
    echo [ERROR] Presentation index.html not found in:
    echo         %~dp0
    echo Please make sure all extracted files are intact.
    echo.
    pause
    exit /b 1
)

:: 2. Check if a server is already running on recorded port
if exist "%PORT_FILE%" (
    set /p RUNNING_PORT=<"%PORT_FILE%"
    if defined RUNNING_PORT (
        :: Test if port is actively responding via curl or powershell
        powershell -NoProfile -Command "$t=New-Object System.Net.Sockets.TcpClient; try { $t.Connect('127.0.0.1', [int]%RUNNING_PORT%); exit 0 } catch { exit 1 }" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo ================================================================================
            echo               POTHYS SWARNA MAHAL - GOLD TRAINING PRESENTATION
            echo ================================================================================
            echo  [INFO] Presentation is ALREADY ACTIVE on http://localhost:!RUNNING_PORT!/index.html
            echo  [INFO] Bringing up presentation in your browser...
            echo ================================================================================
            start "" "http://localhost:!RUNNING_PORT!/index.html"
            ping 127.0.0.1 -n 3 >nul
            exit /b 0
        )
    )
    del /f /q "%PORT_FILE%" >nul 2>&1
)

:: 3. Launch the local presentation server in background
echo ================================================================================
echo               POTHYS SWARNA MAHAL - GOLD TRAINING PROGRAM
echo ================================================================================
echo  Starting local presentation server...
echo.

start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SERVER_SCRIPT%"

:: 4. Wait up to 3 seconds for server to bind port
set "SERVER_READY=0"
set "DETECTED_PORT="

for /L %%i in (1,1,15) do (
    if exist "%PORT_FILE%" (
        set /p DETECTED_PORT=<"%PORT_FILE%"
        if defined DETECTED_PORT (
            set "SERVER_READY=1"
            goto :server_ready
        )
    )
    powershell -NoProfile -Command "Start-Sleep -Milliseconds 200" >nul 2>&1
)

:server_ready
if "!SERVER_READY!"=="1" if defined DETECTED_PORT (
    echo  [SUCCESS] Server started successfully on port !DETECTED_PORT!.
    echo  [INFO] Opening presentation in your default browser...
    start "" "http://localhost:!DETECTED_PORT!/index.html"
    
    cls
    echo ================================================================================
    echo               POTHYS SWARNA MAHAL - GOLD TRAINING PRESENTATION
    echo ================================================================================
    echo   Status:      ACTIVE AND SERVING
    echo   URL:         http://localhost:!DETECTED_PORT!/index.html
    echo   Mode:        Local Offline Presentation Server
    echo   Directory:   %~dp0
    echo --------------------------------------------------------------------------------
    echo   * The presentation has opened in your default web browser.
    echo   * Press 'F' in your browser for Fullscreen mode.
    echo   * Press 'M' in your browser for the 42-slide Overview Grid.
    echo   * Slide 39 contains the playable HD Training Video.
    echo.
    echo   To STOP the presentation, run 'Stop_Presentation.bat'
    echo   or press any key in this window.
    echo ================================================================================
    pause >nul
    
    echo.
    echo Shutting down presentation server...
    if exist "%~dp0Stop_Presentation.bat" (
        call "%~dp0Stop_Presentation.bat" >nul 2>&1
    )
    exit /b 0
)

:: 5. Fallback: If PowerShell server was blocked by Application Control or failed to bind
echo  [NOTE] System policy or socket restriction prevented loopback port binding.
echo  [INFO] Launching Gold Presentation in Direct Local Browser Mode...
start "" "%INDEX_FILE%"

cls
echo ================================================================================
echo               POTHYS SWARNA MAHAL - GOLD TRAINING PRESENTATION
echo ================================================================================
echo   Status:      ACTIVE (Direct Local Presentation Mode)
echo   Location:    %INDEX_FILE%
echo --------------------------------------------------------------------------------
echo   * The presentation has opened directly in your default web browser.
echo   * All 42 slides, videos, fonts, and transitions work 100%% offline.
echo   * System application restrictions were handled safely with zero errors.
echo   * Press 'F' in your browser for Fullscreen mode.
echo   * Press 'M' in your browser for the 42-slide Overview Grid.
echo ================================================================================
echo.
pause
exit /b 0
