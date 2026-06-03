namespace WebPhotoshopDesktop;

public sealed record UpdateInfo(
    string TagName,
    string VersionText,
    string ReleaseUrl,
    string? SetupAssetName,
    string? SetupDownloadUrl,
    string? ReleaseNotes);
