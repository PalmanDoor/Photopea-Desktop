@echo off
setlocal
cd /d "%~dp0"
dotnet run --project "WebPhotoshopDesktop.csproj"
pause
