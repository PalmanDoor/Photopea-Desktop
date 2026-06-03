@echo off
setlocal
cd /d "%~dp0"
title Build Web Photoshop Desktop

echo =====================================================
echo  Web Photoshop Desktop - build
echo =====================================================
echo.

echo Checking .NET SDK...
where dotnet >nul 2>nul
if errorlevel 1 (
    echo .NET SDK was not found.
    echo Install .NET 8 SDK, then run this file again.
    echo Download: https://dotnet.microsoft.com/download/dotnet/8.0
    pause
    exit /b 1
)

echo Cleaning old build output...
if exist "bin" rmdir /s /q "bin"
if exist "obj" rmdir /s /q "obj"

echo Restoring packages...
dotnet restore "WebPhotoshopDesktop.csproj"
if errorlevel 1 goto fail

echo Publishing win-x64...
dotnet publish "WebPhotoshopDesktop.csproj" -c Release -r win-x64 --self-contained false /p:PublishSingleFile=false
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
echo Send me the full error text.
echo.
pause
exit /b 1
