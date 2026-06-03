using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Input;

namespace WebPhotoshopDesktop;

public partial class SplashWindow : Window
{
    private bool _allowClose;
    private double _progress;

    public event EventHandler? CloseRequested;

    public SplashWindow()
    {
        InitializeComponent();
        ApplyLanguage();
    }

    private void ApplyLanguage()
    {
        TitleText.Text = "Web Photoshop Desktop";
        MinimizeButton.ToolTip = DesktopLanguage.Text("Minimize");
        CloseButton.ToolTip = DesktopLanguage.Text("Close");
        StatusText.Text = DesktopLanguage.Text("StartingApplication");
    }

    public void SetStatus(string text)
    {
        if (!Dispatcher.CheckAccess())
        {
            Dispatcher.Invoke(() => SetStatus(text));
            return;
        }

        StatusText.Text = text;
    }

    public void SetProgress(double progress, string? status = null)
    {
        if (!Dispatcher.CheckAccess())
        {
            Dispatcher.Invoke(() => SetProgress(progress, status));
            return;
        }

        _progress = Math.Clamp(progress, 0.0, 100.0);
        if (!string.IsNullOrWhiteSpace(status))
            StatusText.Text = status;

        ApplyProgress();
    }

    public void AllowClose()
    {
        _allowClose = true;
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        if (!_allowClose)
        {
            e.Cancel = true;
            CloseRequested?.Invoke(this, EventArgs.Empty);
            return;
        }

        base.OnClosing(e);
    }

    private void OnTitleBarMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.OriginalSource is DependencyObject source)
        {
            DependencyObject? current = source;
            while (current is not null)
            {
                if (current is System.Windows.Controls.Button)
                    return;

                current = System.Windows.Media.VisualTreeHelper.GetParent(current);
            }
        }

        if (e.ButtonState != MouseButtonState.Pressed)
            return;

        try
        {
            DragMove();
        }
        catch
        {
            // Не критично: иногда Windows отменяет DragMove при быстрых кликах.
        }
    }

    private void OnMinimizeClick(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState.Minimized;
    }

    private void OnCloseClick(object sender, RoutedEventArgs e)
    {
        CloseRequested?.Invoke(this, EventArgs.Empty);
    }

    private void OnProgressTrackSizeChanged(object sender, SizeChangedEventArgs e)
    {
        ApplyProgress();
    }

    private void ApplyProgress()
    {
        double trackWidth = Math.Max(0.0, ProgressTrack.ActualWidth);
        ProgressFill.Width = trackWidth * _progress / 100.0;
    }
}
