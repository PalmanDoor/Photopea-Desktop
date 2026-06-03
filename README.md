# Photopea Desktop

**Photopea Desktop** is a lightweight Windows desktop wrapper for Photopea Offline, built with C# WPF and Microsoft Edge WebView2.

It keeps the original Photopea Offline files untouched and adds desktop features around them: a custom title bar, native window controls, resizing, a startup integrity check, a separate loading splash screen, an unsaved-project close warning, and GitHub release update checks.

## Short description

A desktop version of Photopea Offline for Windows with a native-looking window, splash screen, resize support, close warning, and GitHub-based updates.

## Features

- Photopea Offline inside a native Windows desktop window
- Custom minimize, maximize / restore, and close buttons integrated into the Photopea top bar
- Theme-aware desktop controls
- Resizable borderless window with a small Edge-like frame
- Separate loading splash screen before the editor appears
- Startup file integrity check with SHA-256 manifest
- Unsaved project warning before closing
- GitHub update checker using the latest release
- Setup download support from GitHub Release Assets
- App icon and portable-friendly project structure

## Requirements

- Windows 10 or Windows 11
- .NET SDK 8.0 or newer for building
- Microsoft Edge WebView2 Runtime

## Build

Run:

```bat
build.bat
```

The published app will be created in:

```text
bin\Release\net8.0-windows\win-x64\publish\
```

For a self-contained build, run:

```bat
build-self-contained.bat
```

## Installer

You can use any installer builder. The updater does not require Inno Setup, NSIS, WiX, or a specific tool.

Your installer builder only needs to produce a Windows installer file, usually an `.exe`, for example:

```text
PhotopeaDesktop-Setup-x64.exe
```

This setup file must be uploaded to a GitHub Release as a release asset.

## Update system

The app checks this repository for the latest published GitHub Release:

```text
PalmanDoor/Photopea-Desktop
```

The update checker compares the current app version from `WebPhotoshopDesktop.csproj` with the latest release tag.

Recommended tag format:

```text
v1.0.1
v1.0.2
v1.1.0
```

The updater looks for a setup asset with one of these extensions:

```text
.exe
.msi
.msix
```

The file name should contain one of these words:

```text
setup
installer
install
update
```

Recommended file name:

```text
PhotopeaDesktop-Setup-x64.exe
```

If a setup asset is found, the update dialog opens the direct setup download link. If no setup asset is found, it opens the GitHub release page instead.

## Creating a GitHub release for updates

1. Update the app version in `WebPhotoshopDesktop.csproj`:

```xml
<Version>1.0.1</Version>
<AssemblyVersion>1.0.1.0</AssemblyVersion>
<FileVersion>1.0.1.0</FileVersion>
```

2. Build the app:

```bat
build.bat
```

3. Use your custom installer builder to create the setup file.

Recommended output name:

```text
PhotopeaDesktop-Setup-x64.exe
```

4. Open GitHub → Releases → Draft a new release.

5. Create a tag with the same version:

```text
v1.0.1
```

6. Upload the setup file to release assets.

7. Publish the release.

After that, older app versions will detect the new release and show the update dialog.

## Notes

- Do not upload only the raw application `.exe` if you want automatic updates to install correctly.
- Upload the installer setup `.exe` created by your installer builder.
- If several assets are attached to a release, the updater prefers `PhotopeaDesktop-Setup-x64.exe`.
