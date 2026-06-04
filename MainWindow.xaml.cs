using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Input;
using System.Windows.Controls;
using System.Windows.Threading;
using System.Windows.Media.Animation;
using Microsoft.Web.WebView2.Core;

namespace WebPhotoshopDesktop;

public partial class MainWindow : Window
{
    private const string HostName = "webphotoshop-desktop.local";

    private const int WmGetMinMaxInfo = 0x0024;
    private const int WmNcHitTest = 0x0084;
    private const int WmNcLButtonDown = 0x00A1;

    private const int HtCaption = 0x0002;
    private const int HtLeft = 0x000A;
    private const int HtRight = 0x000B;
    private const int HtTop = 0x000C;
    private const int HtTopLeft = 0x000D;
    private const int HtTopRight = 0x000E;
    private const int HtBottom = 0x000F;
    private const int HtBottomLeft = 0x0010;
    private const int HtBottomRight = 0x0011;

    private const int ResizeGripThickness = 8;
    private const int MonitorDefaultToNearest = 0x00000002;

    // Borderless maximized windows can cover an auto-hidden taskbar hot edge.
    // Leave a tiny native-pixel gap on the taskbar edge so Windows can reveal it.
    private const int AutoHideTaskbarRevealGap = 2;
    private const uint AbmGetState = 0x00000004;
    private const uint AbmGetTaskbarPos = 0x00000005;
    private const int AbsAutoHide = 0x00000001;
    private const uint AbeLeft = 0;
    private const uint AbeTop = 1;
    private const uint AbeRight = 2;
    private const uint AbeBottom = 3;

    private bool _webViewReady;
    private bool _suppressClosePrompt;
    private DispatcherTimer? _resizeTimer;
    private DispatcherTimer? _splashTimer;
    private double _splashProgress;
    private double _splashTarget = 8.0;
    private bool _splashHidden;
    private readonly SplashWindow? _startupSplash;
    private readonly UpdateInfo? _pendingUpdate;
    private bool _updateDialogShown;

    [StructLayout(LayoutKind.Sequential)]
    private struct NativePoint
    {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeRect
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }


    [StructLayout(LayoutKind.Sequential)]
    private struct NativeMinMaxInfo
    {
        public NativePoint Reserved;
        public NativePoint MaxSize;
        public NativePoint MaxPosition;
        public NativePoint MinTrackSize;
        public NativePoint MaxTrackSize;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeMonitorInfo
    {
        public int Size;
        public NativeRect Monitor;
        public NativeRect Work;
        public int Flags;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct NativeAppBarData
    {
        public int cbSize;
        public IntPtr hWnd;
        public uint uCallbackMessage;
        public uint uEdge;
        public NativeRect rc;
        public IntPtr lParam;
    }

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out NativePoint point);

    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out NativeRect rect);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromWindow(IntPtr hWnd, int flags);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern bool GetMonitorInfo(IntPtr hMonitor, ref NativeMonitorInfo monitorInfo);

    [DllImport("shell32.dll")]
    private static extern IntPtr SHAppBarMessage(uint dwMessage, ref NativeAppBarData pData);

    public MainWindow() : this(null, null)
    {
    }

    public MainWindow(SplashWindow? startupSplash) : this(startupSplash, null)
    {
    }

    public MainWindow(SplashWindow? startupSplash, UpdateInfo? pendingUpdate)
    {
        _startupSplash = startupSplash;
        _pendingUpdate = pendingUpdate;

        InitializeComponent();

        if (_startupSplash is not null)
        {
            SplashOverlay.Visibility = Visibility.Collapsed;
            SplashOverlay.Opacity = 0.0;
            SplashOverlay.IsHitTestVisible = false;
        }

        Loaded += OnLoaded;
        SourceInitialized += OnSourceInitialized;
        StateChanged += OnStateChanged;
        SizeChanged += OnSizeChanged;
        Closing += OnClosing;
        ApplySplashOverlayLanguage();
        if (_startupSplash is null)
            StartSplashProgress();
        UpdateSplashMaximizeButton();
    }

    private void ApplySplashOverlayLanguage()
    {
        SplashMinimizeButton.ToolTip = DesktopLanguage.Text("Minimize");
        SplashCloseButton.ToolTip = DesktopLanguage.Text("Close");
        if (SplashStatusText is not null)
            SplashStatusText.Text = DesktopLanguage.Text("StartingApplication");
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            SetSplashStatus(DesktopLanguage.Text("PreparingEditor"));
            await InitializeEditorAsync();
            ResizeWebViewToWindow();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                DesktopLanguage.Text("RuntimeError") + "\n\n" + ex.Message,
                "Web Photoshop Desktop",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            _suppressClosePrompt = true;
            Close();
        }
    }

    private async Task InitializeEditorAsync()
    {
        SetSplashProgress(50, DesktopLanguage.Text("CheckingMainFiles"));

        string appRoot = System.IO.Path.Combine(AppContext.BaseDirectory, "app");
        string indexPath = System.IO.Path.Combine(appRoot, "index.html");
        string bridgePath = System.IO.Path.Combine(AppContext.BaseDirectory, "desktop", "desktop-bridge.js");

        if (!File.Exists(indexPath))
            throw new FileNotFoundException(DesktopLanguage.Text("MissingIndex"), indexPath);

        if (!File.Exists(bridgePath))
            throw new FileNotFoundException(DesktopLanguage.Text("MissingBridge"), bridgePath);

        string userDataFolder = System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WebPhotoshopDesktop",
            "ProfileSystemLanguage");

        Directory.CreateDirectory(userDataFolder);

        SetSplashProgress(58, DesktopLanguage.Text("CreatingProfile"));

        var options = new CoreWebView2EnvironmentOptions($"--lang={DesktopLanguage.WebViewLanguage}");
        var environment = await CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: userDataFolder,
            options: options);

        SetSplashProgress(66, DesktopLanguage.Text("StartingWebView"));

        await EditorWebView.EnsureCoreWebView2Async(environment);
        EditorWebView.ZoomFactor = 1.0;

        CoreWebView2 core = EditorWebView.CoreWebView2;
        SetSplashProgress(74, DesktopLanguage.Text("ConnectingLocalResources"));

        core.SetVirtualHostNameToFolderMapping(
            HostName,
            appRoot,
            CoreWebView2HostResourceAccessKind.Allow);

        core.Settings.AreDefaultContextMenusEnabled = true;
        core.Settings.AreDevToolsEnabled = true;
        core.Settings.IsZoomControlEnabled = true;
        core.Settings.IsStatusBarEnabled = false;

        core.WebMessageReceived += OnWebMessageReceived;
        core.NavigationCompleted += async (_, args) =>
        {
            try
            {
                if (!args.IsSuccess)
                {
                    MessageBox.Show(
                        DesktopLanguage.Format("PageLoadFailed", args.WebErrorStatus),
                        "Web Photoshop Desktop",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
                    return;
                }

                await SendWindowStateAsync();
                SetSplashProgress(92, DesktopLanguage.Text("WaitingInterface"));
                await WaitForEditorInterfaceAsync();
                await DispatchEditorResizeAsync();
                SetSplashProgress(100, DesktopLanguage.Text("Ready"));
                await HideSplashAsync();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    DesktopLanguage.Text("EditorPreparedWarning") + "\n\n" + ex.Message,
                    "Web Photoshop Desktop",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);

                SetSplashProgress(100, DesktopLanguage.Text("Ready"));
                await HideSplashAsync();
            }
        };

        SetSplashProgress(82, DesktopLanguage.Text("PreparingBridge"));

        string bridgeScript = await File.ReadAllTextAsync(bridgePath);
        await core.AddScriptToExecuteOnDocumentCreatedAsync(bridgeScript);

        SetSplashProgress(88, DesktopLanguage.Text("LoadingPhotopea"));

        _webViewReady = true;
        core.Navigate($"https://{HostName}/index.html?desktop=8887&desktopLang={Uri.EscapeDataString(DesktopLanguage.PhotopeaCode)}");
    }

    private async Task WaitForEditorInterfaceAsync()
    {
        if (!_webViewReady || EditorWebView.CoreWebView2 is null)
            return;

        DateTime deadline = DateTime.UtcNow.AddSeconds(20);
        bool wasReady = false;

        const string readinessScript = @"
(function () {
    try {
        var text = document.body ? (document.body.innerText || '') : '';
        var hasTopbar = !!document.getElementById('ap-topbar');
        var hasSearch = !!document.getElementById('ap-topbar-search');
        var hasDesktopButtons = !!document.getElementById('desktop-window-controls');
        var hasHome = /Новый проект|Открыть с компьютера|Шаблоны|New Project|Open From Computer|Templates|Drop any files here/i.test(text);
        var hasBrokenEmptyPage = hasTopbar && text.length < 80;
        return !!(hasTopbar && hasSearch && hasDesktopButtons && hasHome && !hasBrokenEmptyPage);
    } catch (e) {
        return false;
    }
})();";

        while (DateTime.UtcNow < deadline)
        {
            string result = await EditorWebView.ExecuteScriptAsync(readinessScript);
            bool readyNow = string.Equals(result.Trim(), "true", StringComparison.OrdinalIgnoreCase);

            if (readyNow && wasReady)
            {
                // Две успешные проверки подряд: интерфейс уже не просто появился,
                // а успел стабилизироваться после внутренних перестроений Photopea.
                await Task.Delay(180);
                return;
            }

            wasReady = readyNow;
            await Task.Delay(140);
        }

        throw new TimeoutException(DesktopLanguage.Text("EditorReadyTimeout"));
    }


    private void StartSplashProgress()
    {
        _splashTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(35)
        };

        _splashTimer.Tick += (_, _) =>
        {
            if (_splashHidden)
                return;

            if (_splashProgress < _splashTarget)
            {
                double step = Math.Max(0.15, (_splashTarget - _splashProgress) * 0.045);
                _splashProgress = Math.Min(_splashTarget, _splashProgress + step);
                ApplySplashProgress();
            }
        };

        _splashTimer.Start();
        SetSplashProgress(8, DesktopLanguage.Text("StartingApplication"));
    }


    private void OnSplashTitleBarMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.OriginalSource is DependencyObject source)
        {
            DependencyObject? current = source;
            while (current is not null)
            {
                if (current is Button)
                    return;
                current = System.Windows.Media.VisualTreeHelper.GetParent(current);
            }
        }

        if (e.ClickCount >= 2)
        {
            ToggleMaximize();
            return;
        }

        BeginDragFromWeb();
    }

    private void OnSplashMinimizeClick(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState.Minimized;
    }

    private void OnSplashMaximizeClick(object sender, RoutedEventArgs e)
    {
        ToggleMaximize();
    }

    private void OnSplashCloseClick(object sender, RoutedEventArgs e)
    {
        _suppressClosePrompt = true;
        Close();
    }

    private void UpdateSplashMaximizeButton()
    {
        if (SplashMaximizeButton is null)
            return;

        bool maximized = WindowState == WindowState.Maximized;
        SplashMaximizeButton.Content = maximized ? "❐" : "□";
        SplashMaximizeButton.ToolTip = maximized ? DesktopLanguage.Text("Restore") : DesktopLanguage.Text("Maximize");
    }

    private void SetSplashStatus(string text)
    {
        _startupSplash?.SetStatus(text);

        if (_splashHidden || SplashStatusText is null)
            return;

        SplashStatusText.Text = text;
    }

    private void SetSplashProgress(double target, string status)
    {
        double clampedTarget = Math.Clamp(target, 0.0, 100.0);
        _startupSplash?.SetProgress(clampedTarget, status);

        if (_splashHidden)
            return;

        _splashTarget = Math.Max(_splashTarget, clampedTarget);
        SetSplashStatus(status);
        ApplySplashProgress();
    }

    private void ApplySplashProgress()
    {
        if (SplashProgressTrack is null || SplashProgressFill is null)
            return;

        double trackWidth = Math.Max(0.0, SplashProgressTrack.ActualWidth);
        SplashProgressFill.Width = trackWidth * Math.Clamp(_splashProgress, 0.0, 100.0) / 100.0;
    }

    private void OnSplashProgressTrackSizeChanged(object sender, SizeChangedEventArgs e)
    {
        ApplySplashProgress();
    }

    private async Task HideSplashAsync()
    {
        if (_splashHidden)
            return;

        _splashTarget = 100;
        _splashProgress = 100;
        _startupSplash?.SetProgress(100, DesktopLanguage.Text("Ready"));
        ApplySplashProgress();

        await Task.Delay(220);

        if (_splashHidden)
            return;

        _splashHidden = true;
        _splashTimer?.Stop();

        if (_startupSplash is not null)
        {
            SplashOverlay.Visibility = Visibility.Collapsed;
            SplashOverlay.Opacity = 0.0;
            SplashOverlay.IsHitTestVisible = false;

            ShowInTaskbar = true;
            Opacity = 1.0;
            Activate();
            Focus();

            _startupSplash.AllowClose();
            _startupSplash.Close();
            ShowPendingUpdateDialog();
            return;
        }

        var fade = new DoubleAnimation
        {
            From = SplashOverlay.Opacity,
            To = 0.0,
            Duration = TimeSpan.FromMilliseconds(240),
            FillBehavior = FillBehavior.Stop
        };

        fade.Completed += (_, _) =>
        {
            SplashOverlay.Visibility = Visibility.Collapsed;
            SplashOverlay.Opacity = 0.0;
            SplashOverlay.IsHitTestVisible = false;
            ShowPendingUpdateDialog();
        };

        SplashOverlay.BeginAnimation(OpacityProperty, fade);
    }

    private void ShowPendingUpdateDialog()
    {
        if (_pendingUpdate is null || _updateDialogShown)
            return;

        _updateDialogShown = true;

        Dispatcher.BeginInvoke(new Action(() =>
        {
            try
            {
                var updateWindow = new UpdateWindow(_pendingUpdate)
                {
                    Owner = this
                };
                updateWindow.ShowDialog();
            }
            catch
            {
                // Update notification is optional and must not break the editor.
            }
        }), DispatcherPriority.ContextIdle);
    }

    private async void OnStateChanged(object? sender, EventArgs e)
    {
        ResizeWebViewToWindow();
        UpdateSplashMaximizeButton();
        await SendWindowStateAsync();
        ScheduleEditorResize();
    }

    private void OnSizeChanged(object sender, SizeChangedEventArgs e)
    {
        ResizeWebViewToWindow();
        ScheduleEditorResize();
    }

    private void ResizeWebViewToWindow()
    {
        // WebView2 normally stretches by layout. Explicitly invalidating layout is safer
        // than forcing a too-large size when the 1 px native-style border is visible.
        EditorWebView.InvalidateVisual();
        EditorWebView.InvalidateMeasure();
        EditorWebView.InvalidateArrange();
    }

    private void ScheduleEditorResize()
    {
        if (!_webViewReady)
            return;

        _resizeTimer ??= new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(120)
        };

        _resizeTimer.Tick -= ResizeTimerTick;
        _resizeTimer.Tick += ResizeTimerTick;
        _resizeTimer.Stop();
        _resizeTimer.Start();
    }

    private async void ResizeTimerTick(object? sender, EventArgs e)
    {
        _resizeTimer?.Stop();
        await DispatchEditorResizeAsync();
    }

    private async Task DispatchEditorResizeAsync()
    {
        if (!_webViewReady || EditorWebView.CoreWebView2 is null)
            return;

        try
        {
            await EditorWebView.ExecuteScriptAsync(
                "try { window.dispatchEvent(new Event('resize')); document.dispatchEvent(new Event('resize')); } catch(e) {};");
        }
        catch
        {
            // Страница может быть между перезагрузками.
        }
    }

    private async Task SendWindowStateAsync()
    {
        if (!_webViewReady || EditorWebView.CoreWebView2 is null)
            return;

        string maximized = WindowState == WindowState.Maximized ? "true" : "false";
        try
        {
            await EditorWebView.ExecuteScriptAsync(
                $"window.desktopWindowStateChanged && window.desktopWindowStateChanged({maximized});");
        }
        catch
        {
            // Страница ещё может загружаться.
        }
    }


    private void OnClosing(object? sender, CancelEventArgs e)
    {
        if (_suppressClosePrompt || !_splashHidden)
            return;

        if (!_webViewReady || EditorWebView.CoreWebView2 is null)
            return;

        e.Cancel = true;
        _ = ShowUnsavedProjectDialogInEditorAsync();
    }

    private async Task ShowUnsavedProjectDialogInEditorAsync()
    {
        if (!_webViewReady || EditorWebView.CoreWebView2 is null)
            return;

        try
        {
            await EditorWebView.ExecuteScriptAsync(
                "try { if (window.desktopShowUnsavedProjectDialog) window.desktopShowUnsavedProjectDialog(); } catch(e) {};");
        }
        catch
        {
            // Если страница уже перезагружается, не показываем системный MessageBox.
        }
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string message = e.TryGetWebMessageAsString();

        const string languagePrefix = "window:language:";
        if (message.StartsWith(languagePrefix, StringComparison.Ordinal))
        {
            DesktopLanguage.SetApplicationLanguage(message[languagePrefix.Length..]);
            ApplySplashOverlayLanguage();
            UpdateSplashMaximizeButton();
            return;
        }

        switch (message)
        {
            case "window:minimize":
                WindowState = WindowState.Minimized;
                break;

            case "window:toggleMaximize":
                ToggleMaximize();
                break;

            case "window:close":
                Close();
                break;

            case "window:closeConfirmed":
                _suppressClosePrompt = true;
                Close();
                break;

            case "window:closeCanceled":
                break;

            case "window:drag":
                BeginDragFromWeb();
                break;

            case "window:resize:left":
                BeginResizeFromWeb(HtLeft);
                break;

            case "window:resize:right":
                BeginResizeFromWeb(HtRight);
                break;

            case "window:resize:top":
                BeginResizeFromWeb(HtTop);
                break;

            case "window:resize:bottom":
                BeginResizeFromWeb(HtBottom);
                break;

            case "window:resize:topLeft":
                BeginResizeFromWeb(HtTopLeft);
                break;

            case "window:resize:topRight":
                BeginResizeFromWeb(HtTopRight);
                break;

            case "window:resize:bottomLeft":
                BeginResizeFromWeb(HtBottomLeft);
                break;

            case "window:resize:bottomRight":
                BeginResizeFromWeb(HtBottomRight);
                break;
        }
    }

    private void ToggleMaximize()
    {
        WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;
    }

    private void BeginDragFromWeb()
    {
        try
        {
            if (WindowState == WindowState.Maximized)
            {
                Point cursor = GetCursorPositionInDeviceIndependentPixels();
                double restoreWidth = Math.Max(RestoreBounds.Width, MinWidth);

                WindowState = WindowState.Normal;
                Left = cursor.X - restoreWidth / 2.0;
                Top = Math.Max(cursor.Y - 15.0, 0.0);
            }

            IntPtr handle = new WindowInteropHelper(this).Handle;
            ReleaseCapture();
            SendMessage(handle, WmNcLButtonDown, new IntPtr(HtCaption), IntPtr.Zero);
        }
        catch
        {
            // Не критично.
        }
    }


    private void OnSourceInitialized(object? sender, EventArgs e)
    {
        var source = HwndSource.FromHwnd(new WindowInteropHelper(this).Handle);
        source?.AddHook(WndProc);
    }

    private IntPtr WndProc(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WmGetMinMaxInfo)
        {
            AdjustMaximizedSize(hWnd, lParam);
            handled = true;
            return IntPtr.Zero;
        }

        if (msg == WmNcHitTest && CanResizeWindow() && WindowState != WindowState.Maximized)
        {
            int hitTest = GetResizeHitTest(hWnd);
            if (hitTest != 0)
            {
                handled = true;
                return new IntPtr(hitTest);
            }
        }

        return IntPtr.Zero;
    }


    private static void AdjustMaximizedSize(IntPtr hWnd, IntPtr lParam)
    {
        IntPtr monitor = MonitorFromWindow(hWnd, MonitorDefaultToNearest);
        if (monitor == IntPtr.Zero)
            return;

        var monitorInfo = new NativeMonitorInfo
        {
            Size = Marshal.SizeOf<NativeMonitorInfo>()
        };

        if (!GetMonitorInfo(monitor, ref monitorInfo))
            return;

        NativeRect work = monitorInfo.Work;
        NativeRect full = monitorInfo.Monitor;
        var minMaxInfo = Marshal.PtrToStructure<NativeMinMaxInfo>(lParam);

        int maxX = work.Left - full.Left;
        int maxY = work.Top - full.Top;
        int maxWidth = work.Right - work.Left;
        int maxHeight = work.Bottom - work.Top;

        ApplyAutoHideTaskbarRevealGap(full, ref maxX, ref maxY, ref maxWidth, ref maxHeight);

        minMaxInfo.MaxPosition.X = maxX;
        minMaxInfo.MaxPosition.Y = maxY;
        minMaxInfo.MaxSize.X = maxWidth;
        minMaxInfo.MaxSize.Y = maxHeight;

        Marshal.StructureToPtr(minMaxInfo, lParam, false);
    }

    private static void ApplyAutoHideTaskbarRevealGap(
        NativeRect monitorRect,
        ref int maxX,
        ref int maxY,
        ref int maxWidth,
        ref int maxHeight)
    {
        if (!TryGetAutoHideTaskbar(out uint edge, out NativeRect taskbarRect))
            return;

        if (!RectsIntersect(monitorRect, taskbarRect))
            return;

        int gap = AutoHideTaskbarRevealGap;

        switch (edge)
        {
            case AbeTop:
                if (Math.Abs(taskbarRect.Top - monitorRect.Top) <= gap + 2)
                {
                    maxY += gap;
                    maxHeight = Math.Max(0, maxHeight - gap);
                }
                break;

            case AbeBottom:
                if (Math.Abs(taskbarRect.Bottom - monitorRect.Bottom) <= gap + 2)
                    maxHeight = Math.Max(0, maxHeight - gap);
                break;

            case AbeLeft:
                if (Math.Abs(taskbarRect.Left - monitorRect.Left) <= gap + 2)
                {
                    maxX += gap;
                    maxWidth = Math.Max(0, maxWidth - gap);
                }
                break;

            case AbeRight:
                if (Math.Abs(taskbarRect.Right - monitorRect.Right) <= gap + 2)
                    maxWidth = Math.Max(0, maxWidth - gap);
                break;
        }
    }

    private static bool TryGetAutoHideTaskbar(out uint edge, out NativeRect taskbarRect)
    {
        edge = AbeBottom;
        taskbarRect = default;

        var stateData = new NativeAppBarData
        {
            cbSize = Marshal.SizeOf<NativeAppBarData>()
        };

        IntPtr stateResult = SHAppBarMessage(AbmGetState, ref stateData);
        bool autoHideEnabled = (((long)stateResult & AbsAutoHide) != 0);
        if (!autoHideEnabled)
            return false;

        var positionData = new NativeAppBarData
        {
            cbSize = Marshal.SizeOf<NativeAppBarData>()
        };

        IntPtr positionResult = SHAppBarMessage(AbmGetTaskbarPos, ref positionData);
        if (positionResult == IntPtr.Zero)
            return false;

        edge = positionData.uEdge;
        taskbarRect = positionData.rc;
        return true;
    }

    private static bool RectsIntersect(NativeRect a, NativeRect b)
    {
        return a.Left < b.Right &&
               a.Right > b.Left &&
               a.Top < b.Bottom &&
               a.Bottom > b.Top;
    }

    private bool CanResizeWindow()
    {
        return ResizeMode == ResizeMode.CanResize || ResizeMode == ResizeMode.CanResizeWithGrip;
    }

    private int GetResizeHitTest(IntPtr hWnd)
    {
        if (!GetCursorPos(out NativePoint point) || !GetWindowRect(hWnd, out NativeRect rect))
            return 0;

        int border = GetResizeBorderThicknessInDevicePixels();

        bool onLeft = point.X >= rect.Left && point.X < rect.Left + border;
        bool onRight = point.X <= rect.Right && point.X > rect.Right - border;
        bool onTop = point.Y >= rect.Top && point.Y < rect.Top + border;
        bool onBottom = point.Y <= rect.Bottom && point.Y > rect.Bottom - border;

        if (onTop && onLeft) return HtTopLeft;
        if (onTop && onRight) return HtTopRight;
        if (onBottom && onLeft) return HtBottomLeft;
        if (onBottom && onRight) return HtBottomRight;
        if (onLeft) return HtLeft;
        if (onRight) return HtRight;
        if (onTop) return HtTop;
        if (onBottom) return HtBottom;

        return 0;
    }

    private int GetResizeBorderThicknessInDevicePixels()
    {
        double scale = 1.0;
        var source = PresentationSource.FromVisual(this);
        if (source?.CompositionTarget is not null)
            scale = source.CompositionTarget.TransformToDevice.M11;

        return Math.Max(6, (int)Math.Round(ResizeGripThickness * scale));
    }

    private void BeginResizeFromWeb(int hitTest)
    {
        if (!CanResizeWindow() || WindowState == WindowState.Maximized)
            return;

        try
        {
            IntPtr handle = new WindowInteropHelper(this).Handle;
            ReleaseCapture();
            SendMessage(handle, WmNcLButtonDown, new IntPtr(hitTest), IntPtr.Zero);
        }
        catch
        {
            // Не критично. Нативная рамка всё равно попробует обработать resize.
        }
    }

    private Point GetCursorPositionInDeviceIndependentPixels()
    {
        if (!GetCursorPos(out NativePoint point))
            return PointToScreen(new Point(ActualWidth / 2.0, 15.0));

        var screenPoint = new Point(point.X, point.Y);
        var source = PresentationSource.FromVisual(this);
        if (source?.CompositionTarget is null)
            return screenPoint;

        return source.CompositionTarget.TransformFromDevice.Transform(screenPoint);
    }
}
