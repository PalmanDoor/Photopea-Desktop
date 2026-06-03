#define MyAppName "Photopea Desktop"
#ifndef MyAppVersion
#define MyAppVersion "1.0.1"
#endif
#define MyAppPublisher "PalmanDoor"
#define MyAppExeName "WebPhotoshopDesktop.exe"

[Setup]
AppId={{D9DF633B-72BB-4485-B6C5-97F89CB401A3}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Photopea Desktop
DefaultGroupName=Photopea Desktop
DisableProgramGroupPage=yes
OutputDir=..\installer-output
OutputBaseFilename=PhotopeaDesktop-Setup-x64
SetupIconFile=..\Assets\AppIcon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
Source: "..\bin\Release\net8.0-windows\win-x64\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Photopea Desktop"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\Photopea Desktop"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch Photopea Desktop"; Flags: nowait postinstall skipifsilent
