using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace WebPhotoshopDesktop;

internal static class DesktopLanguage
{
    private static readonly HashSet<string> SupportedPhotopeaLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "en", "cs", "es", "de", "fr", "el", "ar", "pt", "ru", "uk", "he", "hr", "it", "ro", "nl", "sv", "da", "fi",
        "sl", "tr", "pl", "id", "zh-CN", "zh-CHT", "th", "ja", "ko", "pt-BR", "hu", "sk", "vi", "bg", "sr", "sq",
        "ta", "bo", "ca", "no", "tl", "et", "lt", "ckb", "fa", "eo", "nqo", "ka", "kk", "rue"
    };

    private static readonly Dictionary<string, Dictionary<string, string>> Texts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = new(StringComparer.OrdinalIgnoreCase)
        {
            ["StartingApplication"] = "Starting application...",
            ["FindingManifest"] = "Finding file list...",
            ["CheckingIntegrity"] = "Checking file integrity...",
            ["CheckingFiles"] = "Checking files {0}/{1}...",
            ["FilesVerified"] = "Application files verified",
            ["PreparingLaunch"] = "Preparing startup...",
            ["CheckingUpdates"] = "Checking for updates...",
            ["LoadingEditorBackground"] = "Loading editor in background...",
            ["PreparingEditor"] = "Preparing editor...",
            ["CheckingMainFiles"] = "Checking main files...",
            ["CreatingProfile"] = "Creating WebView2 profile...",
            ["StartingWebView"] = "Starting WebView2...",
            ["ConnectingLocalResources"] = "Connecting local resources...",
            ["PreparingBridge"] = "Preparing desktop bridge...",
            ["LoadingPhotopea"] = "Loading Photopea Offline in background...",
            ["WaitingInterface"] = "Waiting for interface...",
            ["Ready"] = "Ready",
            ["Minimize"] = "Minimize",
            ["Close"] = "Close",
            ["Maximize"] = "Maximize",
            ["Restore"] = "Restore",
            ["UpdateAvailableTitle"] = "Update available",
            ["UpdateMessage"] = "A new version of Web Photoshop Desktop is ready to install.",
            ["UpdateSaveWarning"] = "Save your current project before installing the update.",
            ["Version"] = "Version: {0}",
            ["UpdateFile"] = "Update file: {0}",
            ["SetupMissing"] = "Setup file was not found in the release. The release page will be opened.",
            ["DownloadSetup"] = "Download setup",
            ["OpenRelease"] = "Open release",
            ["Later"] = "Later",
            ["UpdateOpenError"] = "Could not open the update link.",
            ["StartupFilesError"] = "Failed to start the application.",
            ["RuntimeError"] = "Failed to start the application. Check that Microsoft Edge WebView2 Runtime is installed.",
            ["MissingIndex"] = "File app\\index.html was not found",
            ["MissingBridge"] = "File desktop\\desktop-bridge.js was not found",
            ["MissingManifest"] = "File integrity.manifest was not found. Extract the application again.",
            ["BrokenManifest"] = "File integrity.manifest is corrupted or incomplete.",
            ["BadManifestLine"] = "Invalid line in integrity.manifest: {0}",
            ["BadManifestSize"] = "Invalid file size in integrity.manifest: {0}",
            ["BadManifestPath"] = "Invalid path in integrity.manifest: {0}",
            ["MissingFile"] = "Missing file: {0}",
            ["ChangedFileSize"] = "File size changed: {0}",
            ["ChangedFileHash"] = "File is corrupted or changed: {0}",
            ["PageLoadFailed"] = "Application page failed to load: {0}",
            ["EditorPreparedWarning"] = "The editor opened, but the interface was not prepared in time.",
            ["EditorReadyTimeout"] = "Photopea Offline is taking too long to prepare the start interface."
        },
        ["ru"] = new(StringComparer.OrdinalIgnoreCase)
        {
            ["StartingApplication"] = "Запуск приложения...",
            ["FindingManifest"] = "Поиск списка файлов...",
            ["CheckingIntegrity"] = "Проверка целостности файлов...",
            ["CheckingFiles"] = "Проверка файлов {0}/{1}...",
            ["FilesVerified"] = "Файлы приложения проверены",
            ["PreparingLaunch"] = "Подготовка запуска...",
            ["CheckingUpdates"] = "Проверка обновлений...",
            ["LoadingEditorBackground"] = "Загрузка редактора в фоне...",
            ["PreparingEditor"] = "Подготовка редактора...",
            ["CheckingMainFiles"] = "Проверка основных файлов...",
            ["CreatingProfile"] = "Создание профиля WebView2...",
            ["StartingWebView"] = "Запуск WebView2...",
            ["ConnectingLocalResources"] = "Подключение локальных ресурсов...",
            ["PreparingBridge"] = "Подготовка bridge-скрипта...",
            ["LoadingPhotopea"] = "Загрузка Photopea Offline в фоне...",
            ["WaitingInterface"] = "Ожидание готового интерфейса...",
            ["Ready"] = "Готово",
            ["Minimize"] = "Свернуть",
            ["Close"] = "Закрыть",
            ["Maximize"] = "Развернуть",
            ["Restore"] = "Восстановить",
            ["UpdateAvailableTitle"] = "Доступно обновление",
            ["UpdateMessage"] = "Новая версия Web Photoshop Desktop готова к установке.",
            ["UpdateSaveWarning"] = "Сохрани текущий проект перед установкой обновления.",
            ["Version"] = "Версия: {0}",
            ["UpdateFile"] = "Файл обновления: {0}",
            ["SetupMissing"] = "Setup-файл не найден в релизе. Будет открыта страница релиза.",
            ["DownloadSetup"] = "Скачать setup",
            ["OpenRelease"] = "Открыть релиз",
            ["Later"] = "Позже",
            ["UpdateOpenError"] = "Не удалось открыть ссылку обновления.",
            ["StartupFilesError"] = "Не удалось запустить приложение.",
            ["RuntimeError"] = "Не удалось запустить приложение. Проверь, что установлен Microsoft Edge WebView2 Runtime.",
            ["MissingIndex"] = "Не найден файл app\\index.html",
            ["MissingBridge"] = "Не найден файл desktop\\desktop-bridge.js",
            ["MissingManifest"] = "Не найден файл integrity.manifest. Распакуй приложение заново.",
            ["BrokenManifest"] = "Файл integrity.manifest повреждён или неполный.",
            ["BadManifestLine"] = "Некорректная строка в integrity.manifest: {0}",
            ["BadManifestSize"] = "Некорректный размер файла в integrity.manifest: {0}",
            ["BadManifestPath"] = "Некорректный путь в integrity.manifest: {0}",
            ["MissingFile"] = "Не найден файл: {0}",
            ["ChangedFileSize"] = "Размер файла изменён: {0}",
            ["ChangedFileHash"] = "Файл повреждён или изменён: {0}",
            ["PageLoadFailed"] = "Страница приложения не загрузилась: {0}",
            ["EditorPreparedWarning"] = "Редактор открылся, но интерфейс не успел подготовиться.",
            ["EditorReadyTimeout"] = "Photopea Offline слишком долго готовит стартовый интерфейс."
        },
        ["uk"] = new(StringComparer.OrdinalIgnoreCase)
        {
            ["StartingApplication"] = "Запуск застосунку...",
            ["FindingManifest"] = "Пошук списку файлів...",
            ["CheckingIntegrity"] = "Перевірка цілісності файлів...",
            ["CheckingFiles"] = "Перевірка файлів {0}/{1}...",
            ["FilesVerified"] = "Файли застосунку перевірено",
            ["PreparingLaunch"] = "Підготовка запуску...",
            ["CheckingUpdates"] = "Перевірка оновлень...",
            ["LoadingEditorBackground"] = "Завантаження редактора у фоні...",
            ["PreparingEditor"] = "Підготовка редактора...",
            ["CheckingMainFiles"] = "Перевірка основних файлів...",
            ["CreatingProfile"] = "Створення профілю WebView2...",
            ["StartingWebView"] = "Запуск WebView2...",
            ["ConnectingLocalResources"] = "Підключення локальних ресурсів...",
            ["PreparingBridge"] = "Підготовка desktop bridge...",
            ["LoadingPhotopea"] = "Завантаження Photopea Offline у фоні...",
            ["WaitingInterface"] = "Очікування готового інтерфейсу...",
            ["Ready"] = "Готово",
            ["Minimize"] = "Згорнути",
            ["Close"] = "Закрити",
            ["Maximize"] = "Розгорнути",
            ["Restore"] = "Відновити",
            ["UpdateAvailableTitle"] = "Доступне оновлення",
            ["UpdateMessage"] = "Нова версія Web Photoshop Desktop готова до встановлення.",
            ["UpdateSaveWarning"] = "Збережи поточний проєкт перед встановленням оновлення.",
            ["Version"] = "Версія: {0}",
            ["UpdateFile"] = "Файл оновлення: {0}",
            ["SetupMissing"] = "Setup-файл не знайдено в релізі. Буде відкрито сторінку релізу.",
            ["DownloadSetup"] = "Завантажити setup",
            ["OpenRelease"] = "Відкрити реліз",
            ["Later"] = "Пізніше",
            ["UpdateOpenError"] = "Не вдалося відкрити посилання оновлення.",
            ["StartupFilesError"] = "Не вдалося запустити застосунок.",
            ["RuntimeError"] = "Не вдалося запустити застосунок. Перевір, що встановлено Microsoft Edge WebView2 Runtime.",
            ["MissingIndex"] = "Не знайдено файл app\\index.html",
            ["MissingBridge"] = "Не знайдено файл desktop\\desktop-bridge.js",
            ["MissingManifest"] = "Не знайдено файл integrity.manifest. Розпакуй застосунок заново.",
            ["BrokenManifest"] = "Файл integrity.manifest пошкоджений або неповний.",
            ["BadManifestLine"] = "Некоректний рядок в integrity.manifest: {0}",
            ["BadManifestSize"] = "Некоректний розмір файлу в integrity.manifest: {0}",
            ["BadManifestPath"] = "Некоректний шлях в integrity.manifest: {0}",
            ["MissingFile"] = "Не знайдено файл: {0}",
            ["ChangedFileSize"] = "Розмір файлу змінено: {0}",
            ["ChangedFileHash"] = "Файл пошкоджений або змінений: {0}",
            ["PageLoadFailed"] = "Сторінка застосунку не завантажилася: {0}",
            ["EditorPreparedWarning"] = "Редактор відкрився, але інтерфейс не встиг підготуватися.",
            ["EditorReadyTimeout"] = "Photopea Offline занадто довго готує стартовий інтерфейс."
        },
        ["de"] = MakeEuropean("Anwendung wird gestartet...", "Dateiliste wird gesucht...", "Dateiintegrität wird geprüft...", "Dateien werden geprüft {0}/{1}...", "Anwendungsdateien geprüft", "Start wird vorbereitet...", "Updates werden gesucht...", "Editor wird im Hintergrund geladen...", "Editor wird vorbereitet...", "Hauptdateien werden geprüft...", "WebView2-Profil wird erstellt...", "WebView2 wird gestartet...", "Lokale Ressourcen werden verbunden...", "Desktop-Bridge wird vorbereitet...", "Photopea Offline wird im Hintergrund geladen...", "Warten auf die Oberfläche...", "Fertig", "Minimieren", "Schließen"),
        ["fr"] = MakeEuropean("Démarrage de l’application...", "Recherche de la liste des fichiers...", "Vérification de l’intégrité des fichiers...", "Vérification des fichiers {0}/{1}...", "Fichiers de l’application vérifiés", "Préparation du lancement...", "Recherche des mises à jour...", "Chargement de l’éditeur en arrière-plan...", "Préparation de l’éditeur...", "Vérification des fichiers principaux...", "Création du profil WebView2...", "Démarrage de WebView2...", "Connexion des ressources locales...", "Préparation du bridge desktop...", "Chargement de Photopea Offline en arrière-plan...", "Attente de l’interface...", "Prêt", "Réduire", "Fermer"),
        ["es"] = MakeEuropean("Iniciando aplicación...", "Buscando lista de archivos...", "Comprobando integridad de archivos...", "Comprobando archivos {0}/{1}...", "Archivos de la aplicación verificados", "Preparando inicio...", "Buscando actualizaciones...", "Cargando editor en segundo plano...", "Preparando editor...", "Comprobando archivos principales...", "Creando perfil de WebView2...", "Iniciando WebView2...", "Conectando recursos locales...", "Preparando bridge de escritorio...", "Cargando Photopea Offline en segundo plano...", "Esperando la interfaz...", "Listo", "Minimizar", "Cerrar"),
        ["pt"] = MakeEuropean("A iniciar a aplicação...", "A procurar a lista de ficheiros...", "A verificar a integridade dos ficheiros...", "A verificar ficheiros {0}/{1}...", "Ficheiros da aplicação verificados", "A preparar o arranque...", "A procurar atualizações...", "A carregar o editor em segundo plano...", "A preparar o editor...", "A verificar ficheiros principais...", "A criar perfil WebView2...", "A iniciar WebView2...", "A ligar recursos locais...", "A preparar a bridge desktop...", "A carregar Photopea Offline em segundo plano...", "A aguardar a interface...", "Pronto", "Minimizar", "Fechar"),
        ["pt-BR"] = MakeEuropean("Iniciando o aplicativo...", "Procurando lista de arquivos...", "Verificando integridade dos arquivos...", "Verificando arquivos {0}/{1}...", "Arquivos do aplicativo verificados", "Preparando inicialização...", "Verificando atualizações...", "Carregando editor em segundo plano...", "Preparando editor...", "Verificando arquivos principais...", "Criando perfil WebView2...", "Iniciando WebView2...", "Conectando recursos locais...", "Preparando desktop bridge...", "Carregando Photopea Offline em segundo plano...", "Aguardando interface...", "Pronto", "Minimizar", "Fechar"),
        ["pl"] = MakeEuropean("Uruchamianie aplikacji...", "Szukanie listy plików...", "Sprawdzanie integralności plików...", "Sprawdzanie plików {0}/{1}...", "Pliki aplikacji sprawdzone", "Przygotowywanie startu...", "Sprawdzanie aktualizacji...", "Ładowanie edytora w tle...", "Przygotowywanie edytora...", "Sprawdzanie głównych plików...", "Tworzenie profilu WebView2...", "Uruchamianie WebView2...", "Podłączanie zasobów lokalnych...", "Przygotowywanie desktop bridge...", "Ładowanie Photopea Offline w tle...", "Oczekiwanie na interfejs...", "Gotowe", "Minimalizuj", "Zamknij"),
        ["tr"] = MakeEuropean("Uygulama başlatılıyor...", "Dosya listesi aranıyor...", "Dosya bütünlüğü kontrol ediliyor...", "Dosyalar kontrol ediliyor {0}/{1}...", "Uygulama dosyaları doğrulandı", "Başlatma hazırlanıyor...", "Güncellemeler kontrol ediliyor...", "Düzenleyici arka planda yükleniyor...", "Düzenleyici hazırlanıyor...", "Ana dosyalar kontrol ediliyor...", "WebView2 profili oluşturuluyor...", "WebView2 başlatılıyor...", "Yerel kaynaklar bağlanıyor...", "Desktop bridge hazırlanıyor...", "Photopea Offline arka planda yükleniyor...", "Arayüz bekleniyor...", "Hazır", "Simge durumuna küçült", "Kapat"),
        ["zh-CN"] = MakeEuropean("正在启动应用...", "正在查找文件列表...", "正在检查文件完整性...", "正在检查文件 {0}/{1}...", "应用文件已验证", "正在准备启动...", "正在检查更新...", "正在后台加载编辑器...", "正在准备编辑器...", "正在检查主文件...", "正在创建 WebView2 配置...", "正在启动 WebView2...", "正在连接本地资源...", "正在准备桌面桥接...", "正在后台加载 Photopea Offline...", "正在等待界面...", "完成", "最小化", "关闭"),
        ["zh-CHT"] = MakeEuropean("正在啟動應用程式...", "正在尋找檔案清單...", "正在檢查檔案完整性...", "正在檢查檔案 {0}/{1}...", "應用程式檔案已驗證", "正在準備啟動...", "正在檢查更新...", "正在背景載入編輯器...", "正在準備編輯器...", "正在檢查主要檔案...", "正在建立 WebView2 設定檔...", "正在啟動 WebView2...", "正在連接本機資源...", "正在準備桌面橋接...", "正在背景載入 Photopea Offline...", "正在等待介面...", "完成", "最小化", "關閉"),
        ["ja"] = MakeEuropean("アプリを起動しています...", "ファイル一覧を確認しています...", "ファイルの整合性を確認しています...", "ファイルを確認しています {0}/{1}...", "アプリファイルを確認しました", "起動を準備しています...", "更新を確認しています...", "エディターをバックグラウンドで読み込んでいます...", "エディターを準備しています...", "主要ファイルを確認しています...", "WebView2 プロファイルを作成しています...", "WebView2 を起動しています...", "ローカルリソースを接続しています...", "デスクトップブリッジを準備しています...", "Photopea Offline をバックグラウンドで読み込んでいます...", "インターフェイスを待機しています...", "完了", "最小化", "閉じる"),
        ["ko"] = MakeEuropean("앱을 시작하는 중...", "파일 목록을 찾는 중...", "파일 무결성을 확인하는 중...", "파일 확인 중 {0}/{1}...", "앱 파일 확인 완료", "시작 준비 중...", "업데이트 확인 중...", "편집기를 백그라운드에서 로드 중...", "편집기 준비 중...", "기본 파일 확인 중...", "WebView2 프로필 생성 중...", "WebView2 시작 중...", "로컬 리소스 연결 중...", "데스크톱 브리지 준비 중...", "Photopea Offline을 백그라운드에서 로드 중...", "인터페이스 대기 중...", "완료", "최소화", "닫기")
    };

    private static string _photopeaCode = LoadPreferredPhotopeaLanguage();
    private static string _webViewLanguage = DetectWebViewLanguage(CultureInfo.CurrentUICulture, _photopeaCode);

    public static string PhotopeaCode => _photopeaCode;

    public static string WebViewLanguage => _webViewLanguage;

    public static void SetApplicationLanguage(string? code)
    {
        string? normalized = NormalizePhotopeaLanguage(code);
        if (string.IsNullOrWhiteSpace(normalized))
            return;

        _photopeaCode = normalized;
        _webViewLanguage = DetectWebViewLanguage(CultureInfo.CurrentUICulture, normalized);
        SavePreferredPhotopeaLanguage(normalized);
    }

    public static string Text(string key)
    {
        if (Texts.TryGetValue(PhotopeaCode, out Dictionary<string, string>? table) && table.TryGetValue(key, out string? value))
            return value;

        return Texts["en"].TryGetValue(key, out string? fallback) ? fallback : key;
    }

    public static string Format(string key, params object[] args)
    {
        return string.Format(CultureInfo.CurrentUICulture, Text(key), args);
    }

    public static string DetectPhotopeaLanguage(CultureInfo culture)
    {
        string? normalizedName = NormalizePhotopeaLanguage(culture.Name);
        if (!string.IsNullOrWhiteSpace(normalizedName))
            return normalizedName;

        string? normalizedTwoLetter = NormalizePhotopeaLanguage(culture.TwoLetterISOLanguageName);
        return !string.IsNullOrWhiteSpace(normalizedTwoLetter) ? normalizedTwoLetter : "en";
    }

    private static string LoadPreferredPhotopeaLanguage()
    {
        try
        {
            string path = PreferredLanguagePath;
            if (File.Exists(path))
            {
                string? normalized = NormalizePhotopeaLanguage(File.ReadAllText(path).Trim());
                if (!string.IsNullOrWhiteSpace(normalized))
                    return normalized;
            }
        }
        catch
        {
            // Ignore broken settings and fall back to the system language.
        }

        return DetectPhotopeaLanguage(CultureInfo.CurrentUICulture);
    }

    private static void SavePreferredPhotopeaLanguage(string code)
    {
        try
        {
            Directory.CreateDirectory(DesktopSettingsDirectory);
            File.WriteAllText(PreferredLanguagePath, code);
        }
        catch
        {
            // Language persistence is optional.
        }
    }

    private static string DesktopSettingsDirectory => System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "WebPhotoshopDesktop");

    private static string PreferredLanguagePath => System.IO.Path.Combine(
        DesktopSettingsDirectory,
        "language.txt");

    private static string? NormalizePhotopeaLanguage(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        string name = code.Trim().Replace('_', '-');
        string lower = name.ToLowerInvariant();

        string? mapped = lower switch
        {
            "zh-hk" or "zh-tw" or "zh-mo" or "zh-hant" => "zh-CHT",
            "zh-cn" or "zh-sg" or "zh-hans" => "zh-CN",
            "pt-br" => "pt-BR",
            "nb" or "nn" or "nb-no" or "nn-no" => "no",
            "fa-ir" => "fa",
            "ku" or "ku-iq" or "ckb-iq" => "ckb",
            _ => null
        };

        if (mapped is not null && SupportedPhotopeaLanguages.Contains(mapped))
            return mapped;

        if (SupportedPhotopeaLanguages.Contains(name))
            return Canonical(name);

        string baseCode = lower.Split('-')[0];
        return SupportedPhotopeaLanguages.Contains(baseCode) ? Canonical(baseCode) : null;
    }

    private static string DetectWebViewLanguage(CultureInfo culture, string photopeaCode)
    {
        return photopeaCode switch
        {
            "zh-CHT" => "zh-TW",
            "zh-CN" => "zh-CN",
            "pt-BR" => "pt-BR",
            "en" => "en-US",
            _ when !string.IsNullOrWhiteSpace(culture.Name) && DetectPhotopeaLanguage(culture).Equals(photopeaCode, StringComparison.OrdinalIgnoreCase) => culture.Name,
            _ => photopeaCode
        };
    }

    private static string Canonical(string code)
    {
        foreach (string supported in SupportedPhotopeaLanguages)
        {
            if (StringComparer.OrdinalIgnoreCase.Equals(supported, code))
                return supported;
        }

        return code;
    }

    private static Dictionary<string, string> MakeEuropean(
        string startingApplication,
        string findingManifest,
        string checkingIntegrity,
        string checkingFiles,
        string filesVerified,
        string preparingLaunch,
        string checkingUpdates,
        string loadingEditorBackground,
        string preparingEditor,
        string checkingMainFiles,
        string creatingProfile,
        string startingWebView,
        string connectingLocalResources,
        string preparingBridge,
        string loadingPhotopea,
        string waitingInterface,
        string ready,
        string minimize,
        string close)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["StartingApplication"] = startingApplication,
            ["FindingManifest"] = findingManifest,
            ["CheckingIntegrity"] = checkingIntegrity,
            ["CheckingFiles"] = checkingFiles,
            ["FilesVerified"] = filesVerified,
            ["PreparingLaunch"] = preparingLaunch,
            ["CheckingUpdates"] = checkingUpdates,
            ["LoadingEditorBackground"] = loadingEditorBackground,
            ["PreparingEditor"] = preparingEditor,
            ["CheckingMainFiles"] = checkingMainFiles,
            ["CreatingProfile"] = creatingProfile,
            ["StartingWebView"] = startingWebView,
            ["ConnectingLocalResources"] = connectingLocalResources,
            ["PreparingBridge"] = preparingBridge,
            ["LoadingPhotopea"] = loadingPhotopea,
            ["WaitingInterface"] = waitingInterface,
            ["Ready"] = ready,
            ["Minimize"] = minimize,
            ["Close"] = close
        };
    }
}
