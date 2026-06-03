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

        VersionText.Text = "Версия: " + updateInfo.TagName;
        AssetText.Text = !string.IsNullOrWhiteSpace(updateInfo.SetupAssetName)
            ? "Файл обновления: " + updateInfo.SetupAssetName
            : "Setup-файл не найден в релизе. Будет открыта страница релиза.";

        DownloadButton.Content = !string.IsNullOrWhiteSpace(updateInfo.SetupDownloadUrl)
            ? "Скачать setup"
            : "Открыть релиз";
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
                "Не удалось открыть ссылку обновления.\n\n" + ex.Message,
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
