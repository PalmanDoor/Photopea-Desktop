using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace WebPhotoshopDesktop;

internal static class UpdateChecker
{
    private const string Owner = "PalmanDoor";
    private const string Repository = "Photopea-Desktop";
    private const string LatestReleaseApiUrl = "https://api.github.com/repos/PalmanDoor/Photopea-Desktop/releases/latest";

    public static async Task<UpdateInfo?> CheckForUpdatesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(6)
            };

            client.DefaultRequestHeaders.UserAgent.ParseAdd("WebPhotoshopDesktop-Updater/1.0");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
            client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

            using HttpResponseMessage response = await client.GetAsync(LatestReleaseApiUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
                return null;

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            JsonElement root = document.RootElement;

            string tagName = GetString(root, "tag_name");
            if (string.IsNullOrWhiteSpace(tagName))
                return null;

            string currentVersionText = GetCurrentVersionText();
            if (!IsRemoteVersionNewer(tagName, currentVersionText))
                return null;

            string releaseUrl = GetString(root, "html_url");
            string releaseNotes = GetString(root, "body");

            string? setupAssetName = null;
            string? setupDownloadUrl = null;

            if (root.TryGetProperty("assets", out JsonElement assets) && assets.ValueKind == JsonValueKind.Array)
            {
                var candidates = assets.EnumerateArray()
                    .Select(asset => new
                    {
                        Name = GetString(asset, "name"),
                        Url = GetString(asset, "browser_download_url")
                    })
                    .Where(asset => !string.IsNullOrWhiteSpace(asset.Name) && !string.IsNullOrWhiteSpace(asset.Url))
                    .ToList();

                var setup = candidates
                    .OrderByDescending(asset => IsExactSetupAsset(asset.Name))
                    .ThenByDescending(asset => IsPreferredSetupAsset(asset.Name))
                    .FirstOrDefault(asset => IsSetupInstallerAsset(asset.Name));

                if (setup is not null)
                {
                    setupAssetName = setup.Name;
                    setupDownloadUrl = setup.Url;
                }
            }

            return new UpdateInfo(
                tagName,
                NormalizeVersionText(tagName),
                releaseUrl,
                setupAssetName,
                setupDownloadUrl,
                releaseNotes);
        }
        catch (OperationCanceledException)
        {
            return null;
        }
        catch
        {
            // Update checking must never prevent the editor from starting.
            return null;
        }
    }

    public static void OpenDownloadOrReleasePage(UpdateInfo updateInfo)
    {
        string url = !string.IsNullOrWhiteSpace(updateInfo.SetupDownloadUrl)
            ? updateInfo.SetupDownloadUrl!
            : updateInfo.ReleaseUrl;

        if (string.IsNullOrWhiteSpace(url))
            return;

        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    private static string GetCurrentVersionText()
    {
        Assembly assembly = Assembly.GetExecutingAssembly();

        string? informationalVersion = assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion;

        if (!string.IsNullOrWhiteSpace(informationalVersion))
            return informationalVersion.Split('+')[0];

        return assembly.GetName().Version?.ToString() ?? "0.0.0";
    }

    private static bool IsRemoteVersionNewer(string remoteTag, string currentVersion)
    {
        string remoteNormalized = NormalizeVersionText(remoteTag);
        string currentNormalized = NormalizeVersionText(currentVersion);

        Version? remote = TryParseVersion(remoteNormalized);
        Version? current = TryParseVersion(currentNormalized);

        if (remote is not null && current is not null)
            return remote.CompareTo(current) > 0;

        return !string.Equals(remoteNormalized, currentNormalized, StringComparison.OrdinalIgnoreCase);
    }

    private static Version? TryParseVersion(string value)
    {
        string normalized = NormalizeVersionText(value);
        Match match = Regex.Match(normalized, @"^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?");
        if (!match.Success)
            return null;

        int major = ParsePart(match.Groups[1].Value);
        int minor = ParsePart(match.Groups[2].Value);
        int build = ParsePart(match.Groups[3].Value);
        int revision = ParsePart(match.Groups[4].Value);
        return new Version(major, minor, build, revision);
    }

    private static int ParsePart(string value)
    {
        return int.TryParse(value, out int result) ? Math.Max(result, 0) : 0;
    }

    private static string NormalizeVersionText(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "0.0.0";

        string normalized = value.Trim();
        if (normalized.StartsWith("v", StringComparison.OrdinalIgnoreCase))
            normalized = normalized[1..];

        int metadataIndex = normalized.IndexOf('+');
        if (metadataIndex >= 0)
            normalized = normalized[..metadataIndex];

        return normalized.Trim();
    }

    private static string GetString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? string.Empty
            : string.Empty;
    }

    private static bool IsExactSetupAsset(string name)
    {
        string lower = name.ToLowerInvariant();
        return lower == "photopeadesktop-setup-x64.exe"
            || lower == "photopea-desktop-setup-x64.exe"
            || lower == "photopea-desktop-setup.exe";
    }

    private static bool IsPreferredSetupAsset(string name)
    {
        string lower = name.ToLowerInvariant();
        return lower.Contains("setup")
            || lower.Contains("installer")
            || lower.Contains("install")
            || lower.Contains("update");
    }

    private static bool IsSetupInstallerAsset(string name)
    {
        string lower = name.ToLowerInvariant();
        bool supportedInstaller = lower.EndsWith(".exe") || lower.EndsWith(".msi") || lower.EndsWith(".msix");
        return supportedInstaller && (IsExactSetupAsset(name) || IsPreferredSetupAsset(name));
    }
}
