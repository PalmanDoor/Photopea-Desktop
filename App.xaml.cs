using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace WebPhotoshopDesktop;

public partial class App : Application
{
    private SplashWindow? _startupSplash;
    private bool _startupAborted;

    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        _startupSplash = new SplashWindow();
        _startupSplash.CloseRequested += OnStartupSplashCloseRequested;
        _startupSplash.SetProgress(0, DesktopLanguage.Text("StartingApplication"));
        _startupSplash.Show();

        try
        {
            var visibleTimer = Stopwatch.StartNew();

            await Task.Yield();
            await StartupIntegrityChecker.VerifyAsync((progress, status) =>
            {
                _startupSplash?.SetProgress(progress, status);
            });

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

    private void OnStartupSplashCloseRequested(object? sender, EventArgs e)
    {
        _startupAborted = true;
        _startupSplash?.AllowClose();
        Shutdown();
    }
}
