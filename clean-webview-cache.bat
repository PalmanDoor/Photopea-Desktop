@echo off
setlocal
cd /d "%~dp0"
echo Closing old Web Photoshop Desktop processes if any...
taskkill /f /im WebPhotoshopDesktop.exe >nul 2>nul

echo Removing WebView2 profile cache...
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileSystemLanguage" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileSystemLanguage"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileIntegritySplash" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileIntegritySplash"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileSeparateSplash" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileSeparateSplash"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileLoadingSplash" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileLoadingSplash"

if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileDialogNoSelectDragBottomFix" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileDialogNoSelectDragBottomFix"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileThemeCloseDragIconFix" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileThemeCloseDragIconFix"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileIntegratedCloseDialog" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileIntegratedCloseDialog"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileCustomCloseDialog" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileCustomCloseDialog"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileMaximizeCloseWarning" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileMaximizeCloseWarning"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileFrameResizeIcon" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileFrameResizeIcon"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileFinalTinyFix" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileFinalTinyFix"
if exist "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileNoGapFixed" rmdir /s /q "%LOCALAPPDATA%\WebPhotoshopDesktop\ProfileNoGapFixed"

echo Done.
pause
