@echo off
setlocal

:: Set environment variables
set NODE_ENV=production

:: Change to the script's directory
cd /d "%~dp0"
cd ..

:: Start the MCP server
echo Starting Home Assistant MCP Server...
bun run start --port 8080

if errorlevel 1 (
    echo Error starting MCP server
    pause
    exit /b 1
)

pause 