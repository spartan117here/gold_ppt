@echo off
title Pothys Swarna Mahal -- Gold Training Program Presentation
cd /d "%~dp0Gold_Presentation_Portable"

if exist "%~dp0Gold_Presentation_Portable\Launch_Presentation.bat" (
    call "%~dp0Gold_Presentation_Portable\Launch_Presentation.bat"
    exit /b %ERRORLEVEL%
)

if exist "%~dp0Launch_Presentation.exe" (
    start "" "%~dp0Launch_Presentation.exe"
    exit /b 0
)

start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1"
exit /b 0
