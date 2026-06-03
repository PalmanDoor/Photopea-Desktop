@echo off
chcp 65001 >nul
echo =====================================================
echo  Photopea Desktop - custom installer note
echo =====================================================
echo.
echo This project does not require a specific installer builder.
echo Use your own custom installer builder and select this folder as input:
echo.
echo   bin\Release\net8.0-windows\win-x64\publish\
echo.
echo Recommended setup output name:
echo.
echo   PhotopeaDesktop-Setup-x64.exe
echo.
echo Upload that EXE file to GitHub Release assets.
echo.
pause
