# Release Guide

This project uses GitHub Releases for update delivery. The app downloads the setup installer from release assets.

## Version rules

The app version is stored in `WebPhotoshopDesktop.csproj`:

```xml
<Version>1.0.0</Version>
<AssemblyVersion>1.0.0.0</AssemblyVersion>
<FileVersion>1.0.0.0</FileVersion>
```

Before every release, increase all three values.

Example:

```xml
<Version>1.0.1</Version>
<AssemblyVersion>1.0.1.0</AssemblyVersion>
<FileVersion>1.0.1.0</FileVersion>
```

## Release tag

Create a GitHub release tag with the same version and a `v` prefix:

```text
v1.0.1
```

The desktop app compares this tag with its own version.

## Setup asset

Use your custom installer builder and create one installer file.

Recommended file name:

```text
PhotopeaDesktop-Setup-x64.exe
```

Supported extensions:

```text
.exe
.msi
.msix
```

The updater searches release assets for installer names containing:

```text
setup
installer
install
update
```

It prioritizes these exact names:

```text
PhotopeaDesktop-Setup-x64.exe
Photopea-Desktop-Setup-x64.exe
Photopea-Desktop-Setup.exe
```

## Recommended release text

```markdown
## Photopea Desktop v1.0.1

### Changes
- Improved desktop wrapper behavior.
- Fixed minor UI issues.
- Updated startup and update checks.

### Installation
Download `PhotopeaDesktop-Setup-x64.exe` from the assets below and run it.
```

## Release steps

1. Update the version in `WebPhotoshopDesktop.csproj`.
2. Run `build.bat` or `build-self-contained.bat`.
3. Build the setup `.exe` with your custom installer builder.
4. Rename the output to `PhotopeaDesktop-Setup-x64.exe`.
5. Go to GitHub → Releases → Draft a new release.
6. Use tag `vX.Y.Z`, for example `v1.0.1`.
7. Upload `PhotopeaDesktop-Setup-x64.exe` as a release asset.
8. Publish the release.

## Important

The updater does not install updates silently. It opens the setup download link from GitHub. The user runs the installer and updates the app normally.
