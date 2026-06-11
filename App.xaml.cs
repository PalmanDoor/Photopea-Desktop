using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using System.Windows;

namespace WebPhotoshopDesktop;

public partial class App : Application
{
    private const string LatestReleasePageUrl = "https://github.com/PalmanDoor/Photopea-Desktop/releases/latest";
    private const string SingleInstanceMutexName = @"Local\WebPhotoshopDesktop_SingleInstance";
    private const int SwShow = 5;
    private const int SwRestore = 9;

    private Mutex? _singleInstanceMutex;
    private SplashWindow? _startupSplash;
    private bool _startupAborted;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr FindWindow(string? lpClassName, string? lpWindowName);

    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    protected override async void OnStartup(StartupEventArgs e)
    {
        bool isFirstInstance;
        _singleInstanceMutex = new Mutex(true, SingleInstanceMutexName, out isFirstInstance);

        if (!isFirstInstance)
        {
            ActivateExistingInstance();
            Shutdown();
            return;
        }

        base.OnStartup(e);

        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        _startupSplash = new SplashWindow();
        _startupSplash.CloseRequested += OnStartupSplashCloseRequested;
        _startupSplash.SetProgress(0, DesktopLanguage.Text("StartingApplication"));
        _startupSplash.Show();

        try
        {
            var visibleTimer = Stopwatch.StartNew();
            bool integrityCheckFailed = false;

            await Task.Yield();

            try
            {
                await StartupIntegrityChecker.VerifyAsync((progress, status) =>
                {
                    _startupSplash?.SetProgress(progress, status);
                });
            }
            catch (IntegrityCheckException)
            {
                // Не пугаем пользователя сообщением про повреждённые файлы.
                // Просто запускаем текущую сборку и показываем обычное окно обновления.
                integrityCheckFailed = true;
                _startupSplash?.SetProgress(45, DesktopLanguage.Text("FilesVerified"));
            }

            if (_startupAborted)
                return;

            // Проверка файлов проходит очень быстро на SSD. Небольшая минимальная
            // задержка нужна, чтобы splash не моргал меньше чем на полсекунды.
            TimeSpan minimumSplashTime = TimeSpan.FromMilliseconds(1400);
            if (visibleTimer.Elapsed < minimumSplashTime)
            {
                _startupSplash?.SetProgress(46, DesktopLanguage.Text("PreparingLaunch"));
                await Task.Delay(minimumSplashTime - visibleTimer.Elapsed);
            }

            if (_startupAborted)
                return;

            UpdateInfo? updateInfo = null;
            try
            {
                _startupSplash?.SetProgress(46, DesktopLanguage.Text("CheckingUpdates"));
                using var updateTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(6));
                updateInfo = await UpdateChecker.CheckForUpdatesAsync(updateTimeout.Token);
            }
            catch
            {
                updateInfo = null;
            }

            if (integrityCheckFailed && updateInfo is null)
            {
                updateInfo = new UpdateInfo(
                    "latest",
                    "latest",
                    LatestReleasePageUrl,
                    null,
                    null,
                    null);
            }

            if (_startupAborted)
                return;

            _startupSplash?.SetProgress(48, DesktopLanguage.Text("LoadingEditorBackground"));

            var mainWindow = new MainWindow(_startupSplash, updateInfo)
            {
                ShowActivated = false,
                ShowInTaskbar = false,
                Opacity = 0.0
            };

            MainWindow = mainWindow;
            ShutdownMode = ShutdownMode.OnMainWindowClose;
            mainWindow.Show();
        }
        catch (Exception ex)
        {
            _startupSplash?.AllowClose();
            _startupSplash?.Close();

            MessageBox.Show(
                DesktopLanguage.Text("StartupFilesError") + "\n\n" + ex.Message,
                "Web Photoshop Desktop",
                MessageBoxButton.OK,
                MessageBoxImage.Error);

            Shutdown(-1);
        }
    }

    private static void ActivateExistingInstance()
    {
        IntPtr hWnd = IntPtr.Zero;

        try
        {
            using var currentProcess = Process.GetCurrentProcess();
            Process[] processes = Process.GetProcessesByName(currentProcess.ProcessName);

            foreach (Process process in processes)
            {
                try
                {
                    if (process.Id != currentProcess.Id && process.MainWindowHandle != IntPtr.Zero)
                    {
                        hWnd = process.MainWindowHandle;
                        break;
                    }
                }
                finally
                {
                    if (process.Id != currentProcess.Id) process.Dispose();
                }
            }
        }
        catch
        {
            hWnd = IntPtr.Zero;
        }

        if (hWnd == IntPtr.Zero)
            hWnd = FindWindow(null, "Web Photoshop Desktop");

        if (hWnd == IntPtr.Zero)
            return;

        if (IsIconic(hWnd))
            ShowWindow(hWnd, SwRestore);
        else
            ShowWindow(hWnd, SwShow);

        SetForegroundWindow(hWnd);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        try
        {
            _singleInstanceMutex?.ReleaseMutex();
            _singleInstanceMutex?.Dispose();
        }
        catch
        {
        }

        base.OnExit(e);
    }

    private void OnStartupSplashCloseRequested(object? sender, EventArgs e)
    {
        _startupAborted = true;
        _startupSplash?.AllowClose();
        Shutdown();
    }
}
