Web Photoshop Desktop

Эта версия не меняет оригинальные файлы Web Photoshop / Photopea.
Кнопки окна и скрытие Fullscreen добавляются через WebView2-инъекцию из desktop\desktop-bridge.js.

Сборка:
1. Запусти clean-webview-cache.bat один раз, если раньше запускались сломанные версии.
2. Запусти build.bat.
3. EXE будет в bin\Release\net8.0-windows\win-x64\publish\WebPhotoshopDesktop.exe

Если нужно собрать без установленного .NET Runtime у пользователя — запускай build-self-contained.bat.


Изменения no_gap_fixed:
- запуск index.html с ?desktop=8887, чтобы Photopea не резервировала правую рекламную колонку;
- оригинальные файлы app не изменяются;
- кнопки окна восстанавливаются MutationObserver-ом, если верхняя панель пересобирается;
- поиск открывается напрямую через внутренний search-панель Photopea.


Изменения FinalTinyFix: убрана узкая правая полоса документа через overflow hidden только для корня страницы; подсказка поиска заменена на русский текст "Поиск".



Версия custom_close_dialog:
- Системный MessageBox заменён на тёмное встроенное предупреждение при закрытии.
- Кнопки: Закрыть / Отмена.
