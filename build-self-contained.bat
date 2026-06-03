@echo off
setlocal
cd /d "%~dp0"
title Build Web Photoshop Desktop Self-Contained

echo =====================================================
echo  Web Photoshop Desktop - self-contained build
echo =====================================================
echo.

where dotnet >nul 2>nul
if errorlevel 1 (
    echo .NET SDK was not found.
    echo Install .NET 8 SDK, then run this file again.
    pause
    exit /b 1
)

if exist "bin" rmdir /s /q "bin"
if exist "obj" rmdir /s /q "obj"

dotnet restore "WebPhotoshopDesktop.csproj"
if errorlevel 1 goto fail

dotnet publish "WebPhotoshopDesktop.csproj" -c Release -r win-x64 --self-contained true /p:PublishSingleFile=false
if errorlevel 1 goto fail

echo.
echo Done.
echo EXE will be here:
echo %~dp0bin\Release\net8.0-windows\win-x64\publish\WebPhotoshopDesktop.exe
echo.
pause
exit /b 0

:fail
echo.
echo Build failed.
echo.
pause
exit /b 1
