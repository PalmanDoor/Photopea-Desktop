using System;
using System.Windows;
using System.Windows.Input;

namespace WebPhotoshopDesktop;

public partial class UpdateWindow : Window
{
    private readonly UpdateInfo _updateInfo;

    public UpdateWindow(UpdateInfo updateInfo)
    {
        _updateInfo = updateInfo;
        InitializeComponent();

        Title = DesktopLanguage.Text("UpdateAvailableTitle");
        TitleText.Text = DesktopLanguage.Text("UpdateAvailableTitle");
        CloseButton.ToolTip = DesktopLanguage.Text("Close");
        MessageText.Text = DesktopLanguage.Text("UpdateMessage");
        SaveWarningText.Text = DesktopLanguage.Text("UpdateSaveWarning");
        LaterButton.Content = DesktopLanguage.Text("Later");

        VersionText.Text = DesktopLanguage.Format("Version", updateInfo.TagName);
        AssetText.Text = !string.IsNullOrWhiteSpace(updateInfo.SetupAssetName)
            ? DesktopLanguage.Format("UpdateFile", updateInfo.SetupAssetName)
            : DesktopLanguage.Text("SetupMissing");

        DownloadButton.Content = !string.IsNullOrWhiteSpace(updateInfo.SetupDownloadUrl)
            ? DesktopLanguage.Text("DownloadSetup")
            : DesktopLanguage.Text("OpenRelease");
    }

    private void OnTitleBarMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState != MouseButtonState.Pressed)
            return;

        try
        {
            DragMove();
        }
        catch
        {
            // Windows can cancel DragMove on fast clicks.
        }
    }

    private void OnDownloadClick(object sender, RoutedEventArgs e)
    {
        try
        {
            UpdateChecker.OpenDownloadOrReleasePage(_updateInfo);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                DesktopLanguage.Text("UpdateOpenError") + "\n\n" + ex.Message,
                "Web Photoshop Desktop",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
        }

        Close();
    }

    private void OnCloseClick(object sender, RoutedEventArgs e)
    {
        Close();
    }
}
