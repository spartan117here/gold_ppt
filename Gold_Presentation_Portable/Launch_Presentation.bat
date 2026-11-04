@echo off
title Pothys Swarna Mahal -- Gold Training Program Presentation
cd /d "%~dp0"

:: If native compiled launcher exists, launch it directly
if exist "%~dp0Launch_Presentation.exe" (
    start "" "%~dp0Launch_Presentation.exe"
    exit /b 0
)

:: Fallback to portable background server with zero external dependencies
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1"
exit /b 0

