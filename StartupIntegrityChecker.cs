using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace WebPhotoshopDesktop;

internal sealed class IntegrityCheckException : Exception
{
    public IntegrityCheckException(string message) : base(message)
    {
    }
}

internal static class StartupIntegrityChecker
{
    private sealed record ManifestEntry(string RelativePath, long Length, string Sha256);

    public static async Task VerifyAsync(Action<double, string>? reportProgress = null, CancellationToken cancellationToken = default)
    {
        string baseDirectory = AppContext.BaseDirectory;
        string manifestPath = Path.Combine(baseDirectory, "integrity.manifest");

        reportProgress?.Invoke(2, DesktopLanguage.Text("FindingManifest"));

        if (!File.Exists(manifestPath))
            throw new IntegrityCheckException(DesktopLanguage.Text("MissingManifest"));

        List<ManifestEntry> entries = ReadManifest(manifestPath);
        if (entries.Count < 20)
            throw new IntegrityCheckException(DesktopLanguage.Text("BrokenManifest"));

        reportProgress?.Invoke(6, DesktopLanguage.Text("CheckingIntegrity"));

        for (int i = 0; i < entries.Count; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            ManifestEntry entry = entries[i];
            string fullPath = Path.Combine(baseDirectory, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));

            double progress = 6.0 + (39.0 * i / Math.Max(1, entries.Count));
            if (i == 0 || i == entries.Count - 1 || i % 5 == 0)
                reportProgress?.Invoke(progress, DesktopLanguage.Format("CheckingFiles", i + 1, entries.Count));

            if (!File.Exists(fullPath))
                throw new IntegrityCheckException(DesktopLanguage.Format("MissingFile", entry.RelativePath));

            var info = new FileInfo(fullPath);
            if (info.Length != entry.Length)
                throw new IntegrityCheckException(DesktopLanguage.Format("ChangedFileSize", entry.RelativePath));

            string actualHash = await ComputeSha256Async(fullPath, cancellationToken);
            if (!StringComparer.OrdinalIgnoreCase.Equals(actualHash, entry.Sha256))
                throw new IntegrityCheckException(DesktopLanguage.Format("ChangedFileHash", entry.RelativePath));
        }

        reportProgress?.Invoke(45, DesktopLanguage.Text("FilesVerified"));
    }

    private static List<ManifestEntry> ReadManifest(string manifestPath)
    {
        var entries = new List<ManifestEntry>();

        foreach (string rawLine in File.ReadAllLines(manifestPath))
        {
            string line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
                continue;

            string[] parts = line.Split('|');
            if (parts.Length != 3)
                throw new IntegrityCheckException(DesktopLanguage.Format("BadManifestLine", line));

            if (!long.TryParse(parts[1], NumberStyles.None, CultureInfo.InvariantCulture, out long length))
                throw new IntegrityCheckException(DesktopLanguage.Format("BadManifestSize", parts[0]));

            string relativePath = parts[0].Replace('\\', '/');
            if (relativePath.Contains("..", StringComparison.Ordinal) || Path.IsPathRooted(relativePath))
                throw new IntegrityCheckException(DesktopLanguage.Format("BadManifestPath", relativePath));

            entries.Add(new ManifestEntry(relativePath, length, parts[2]));
        }

        return entries;
    }

    private static async Task<string> ComputeSha256Async(string path, CancellationToken cancellationToken)
    {
        await using FileStream stream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 1024 * 64,
            useAsync: true);

        byte[] hash = await SHA256.HashDataAsync(stream, cancellationToken);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
