(function () {
    'use strict';

    // Injected by WebView2. The original web app files are not changed.
    // Keep this bridge small: Photopea is sensitive to DOM/CSS changes.

    function noop() { }

    if (!window.chrome) window.chrome = {};
    if (!window.chrome.runtime) window.chrome.runtime = {};
    if (!window.chrome.action) window.chrome.action = {};
    if (!window.chrome.tabs) window.chrome.tabs = {};
    if (!window.chrome.storage) window.chrome.storage = {};
    if (!window.chrome.i18n) window.chrome.i18n = {};

    window.chrome.runtime.id = window.chrome.runtime.id || 'webphotoshopdesktop';

    function makeEvent() {
        var listeners = [];
        return {
            addListener: function (callback) {
                if (typeof callback === 'function' && listeners.indexOf(callback) < 0) listeners.push(callback);
            },
            removeListener: function (callback) {
                var index = listeners.indexOf(callback);
                if (index >= 0) listeners.splice(index, 1);
            },
            hasListener: function (callback) {
                return listeners.indexOf(callback) >= 0;
            },
            _dispatch: function () {
                var args = arguments;
                listeners.slice().forEach(function (callback) {
                    try { callback.apply(null, args); } catch (_ignored) { }
                });
            }
        };
    }

    window.chrome.runtime.onMessage = window.chrome.runtime.onMessage || makeEvent();
    window.chrome.runtime.onInstalled = window.chrome.runtime.onInstalled || makeEvent();
    window.chrome.runtime.onUpdateAvailable = window.chrome.runtime.onUpdateAvailable || makeEvent();
    window.chrome.action.onClicked = window.chrome.action.onClicked || makeEvent();

    window.chrome.runtime.sendMessage = window.chrome.runtime.sendMessage || function (message, callback) {
        setTimeout(function () {
            try { window.chrome.runtime.onMessage._dispatch(message, {}, callback || noop); } catch (_ignored) { }
            if (callback) callback({});
        }, 0);
    };

    window.chrome.runtime.openOptionsPage = window.chrome.runtime.openOptionsPage || noop;
    window.chrome.runtime.setUninstallURL = window.chrome.runtime.setUninstallURL || function (_url, callback) {
        if (callback) callback();
    };

    window.chrome.runtime.getURL = window.chrome.runtime.getURL || function (path) {
        if (!path) return location.origin + '/';
        if (/^https?:\/\//i.test(path) || /^data:/i.test(path) || /^blob:/i.test(path)) return path;
        return location.origin + '/' + String(path).replace(/^\//, '');
    };

    window.chrome.i18n.getMessage = window.chrome.i18n.getMessage || function (key) { return key || ''; };

    window.chrome.tabs.query = window.chrome.tabs.query || function (_query, callback) {
        if (callback) callback([{ id: 1, active: true, currentWindow: true }]);
    };
    window.chrome.tabs.sendMessage = window.chrome.tabs.sendMessage || function (_tabId, message, callback) {
        try { window.chrome.runtime.onMessage._dispatch(message, { tab: { id: 1 } }, callback || noop); } catch (_ignored) { }
        if (callback) callback({});
    };
    window.chrome.tabs.create = window.chrome.tabs.create || function (options, callback) {
        if (options && options.url) window.open(options.url, '_blank');
        if (callback) callback({});
    };

    window.chrome.storage.local = window.chrome.storage.local || {
        get: function (keys, callback) {
            var result = {};
            try {
                if (keys == null) {
                    for (var i = 0; i < localStorage.length; i++) {
                        var key = localStorage.key(i);
                        if (key != null) result[key] = localStorage.getItem(key);
                    }
                } else if (typeof keys === 'string') {
                    result[keys] = localStorage.getItem(keys);
                } else if (Array.isArray(keys)) {
                    keys.forEach(function (key) { result[key] = localStorage.getItem(key); });
                } else if (typeof keys === 'object') {
                    Object.keys(keys).forEach(function (key) {
                        var value = localStorage.getItem(key);
                        result[key] = value == null ? keys[key] : value;
                    });
                }
            } catch (_ignored) { }
            if (callback) setTimeout(function () { callback(result); }, 0);
        },
        set: function (items, callback) {
            try {
                Object.keys(items || {}).forEach(function (key) {
                    localStorage.setItem(key, items[key]);
                });
            } catch (_ignored) { }
            if (callback) setTimeout(callback, 0);
        },
        remove: function (keys, callback) {
            try {
                (Array.isArray(keys) ? keys : [keys]).forEach(function (key) { localStorage.removeItem(key); });
            } catch (_ignored) { }
            if (callback) setTimeout(callback, 0);
        }
    };

    var DESKTOP_TRANSLATIONS = {
        "en": {
                "title": "Unsaved project",
                "message": "Close application?",
                "sub": "If the project is not saved, changes will be lost.",
                "close": "Close",
                "cancel": "Cancel",
                "minimize": "Minimize",
                "maximize": "Maximize",
                "restore": "Restore",
                "search": "Search"
        },
        "cs": {
                "title": "Neuložený projekt",
                "message": "Zavřít aplikaci?",
                "sub": "Pokud projekt není uložen, změny budou ztraceny.",
                "close": "Zavřít",
                "cancel": "Zrušit",
                "minimize": "Minimalizovat",
                "maximize": "Maximalizovat",
                "restore": "Obnovit",
                "search": "Hledat"
        },
        "es": {
                "title": "Proyecto no guardado",
                "message": "¿Cerrar la aplicación?",
                "sub": "Si el proyecto no está guardado, los cambios se perderán.",
                "close": "Cerrar",
                "cancel": "Cancelar",
                "minimize": "Minimizar",
                "maximize": "Maximizar",
                "restore": "Restaurar",
                "search": "Buscar"
        },
        "de": {
                "title": "Nicht gespeichertes Projekt",
                "message": "Anwendung schließen?",
                "sub": "Wenn das Projekt nicht gespeichert ist, gehen die Änderungen verloren.",
                "close": "Schließen",
                "cancel": "Abbrechen",
                "minimize": "Minimieren",
                "maximize": "Maximieren",
                "restore": "Wiederherstellen",
                "search": "Suchen"
        },
        "fr": {
                "title": "Projet non enregistré",
                "message": "Fermer l’application ?",
                "sub": "Si le projet n’est pas enregistré, les modifications seront perdues.",
                "close": "Fermer",
                "cancel": "Annuler",
                "minimize": "Réduire",
                "maximize": "Agrandir",
                "restore": "Restaurer",
                "search": "Rechercher"
        },
        "el": {
                "title": "Μη αποθηκευμένο έργο",
                "message": "Κλείσιμο εφαρμογής;",
                "sub": "Αν το έργο δεν έχει αποθηκευτεί, οι αλλαγές θα χαθούν.",
                "close": "Κλείσιμο",
                "cancel": "Ακύρωση",
                "minimize": "Ελαχιστοποίηση",
                "maximize": "Μεγιστοποίηση",
                "restore": "Επαναφορά",
                "search": "Αναζήτηση"
        },
        "ar": {
                "title": "مشروع غير محفوظ",
                "message": "هل تريد إغلاق التطبيق؟",
                "sub": "إذا لم يتم حفظ المشروع، ستفقد التغييرات.",
                "close": "إغلاق",
                "cancel": "إلغاء",
                "minimize": "تصغير",
                "maximize": "تكبير",
                "restore": "استعادة",
                "search": "بحث"
        },
        "pt": {
                "title": "Projeto não guardado",
                "message": "Fechar a aplicação?",
                "sub": "Se o projeto não estiver guardado, as alterações serão perdidas.",
                "close": "Fechar",
                "cancel": "Cancelar",
                "minimize": "Minimizar",
                "maximize": "Maximizar",
                "restore": "Restaurar",
                "search": "Pesquisar"
        },
        "ru": {
                "title": "Несохранённый проект",
                "message": "Закрыть приложение?",
                "sub": "Если проект не сохранён, изменения будут потеряны.",
                "close": "Закрыть",
                "cancel": "Отмена",
                "minimize": "Свернуть",
                "maximize": "Развернуть",
                "restore": "Восстановить",
                "search": "Поиск"
        },
        "uk": {
                "title": "Незбережений проєкт",
                "message": "Закрити застосунок?",
                "sub": "Якщо проєкт не збережено, зміни буде втрачено.",
                "close": "Закрити",
                "cancel": "Скасувати",
                "minimize": "Згорнути",
                "maximize": "Розгорнути",
                "restore": "Відновити",
                "search": "Пошук"
        },
        "he": {
                "title": "פרויקט שלא נשמר",
                "message": "לסגור את היישום?",
                "sub": "אם הפרויקט לא נשמר, השינויים יאבדו.",
                "close": "סגור",
                "cancel": "ביטול",
                "minimize": "מזער",
                "maximize": "הגדל",
                "restore": "שחזר",
                "search": "חיפוש"
        },
        "hr": {
                "title": "Nespremljeni projekt",
                "message": "Zatvoriti aplikaciju?",
                "sub": "Ako projekt nije spremljen, promjene će biti izgubljene.",
                "close": "Zatvori",
                "cancel": "Odustani",
                "minimize": "Smanji",
                "maximize": "Povećaj",
                "restore": "Vrati",
                "search": "Traži"
        },
        "it": {
                "title": "Progetto non salvato",
                "message": "Chiudere l’applicazione?",
                "sub": "Se il progetto non è stato salvato, le modifiche andranno perse.",
                "close": "Chiudi",
                "cancel": "Annulla",
                "minimize": "Riduci a icona",
                "maximize": "Ingrandisci",
                "restore": "Ripristina",
                "search": "Cerca"
        },
        "ro": {
                "title": "Proiect nesalvat",
                "message": "Închideți aplicația?",
                "sub": "Dacă proiectul nu este salvat, modificările vor fi pierdute.",
                "close": "Închide",
                "cancel": "Anulează",
                "minimize": "Minimizează",
                "maximize": "Maximizează",
                "restore": "Restabilește",
                "search": "Caută"
        },
        "nl": {
                "title": "Niet-opgeslagen project",
                "message": "Applicatie sluiten?",
                "sub": "Als het project niet is opgeslagen, gaan de wijzigingen verloren.",
                "close": "Sluiten",
                "cancel": "Annuleren",
                "minimize": "Minimaliseren",
                "maximize": "Maximaliseren",
                "restore": "Herstellen",
                "search": "Zoeken"
        },
        "sv": {
                "title": "Osparat projekt",
                "message": "Stäng programmet?",
                "sub": "Om projektet inte är sparat går ändringarna förlorade.",
                "close": "Stäng",
                "cancel": "Avbryt",
                "minimize": "Minimera",
                "maximize": "Maximera",
                "restore": "Återställ",
                "search": "Sök"
        },
        "da": {
                "title": "Ikke gemt projekt",
                "message": "Luk programmet?",
                "sub": "Hvis projektet ikke er gemt, går ændringerne tabt.",
                "close": "Luk",
                "cancel": "Annuller",
                "minimize": "Minimer",
                "maximize": "Maksimer",
                "restore": "Gendan",
                "search": "Søg"
        },
        "fi": {
                "title": "Tallentamaton projekti",
                "message": "Suljetaanko sovellus?",
                "sub": "Jos projektia ei ole tallennettu, muutokset menetetään.",
                "close": "Sulje",
                "cancel": "Peruuta",
                "minimize": "Pienennä",
                "maximize": "Suurenna",
                "restore": "Palauta",
                "search": "Haku"
        },
        "sl": {
                "title": "Neshranjen projekt",
                "message": "Zapreti aplikacijo?",
                "sub": "Če projekt ni shranjen, bodo spremembe izgubljene.",
                "close": "Zapri",
                "cancel": "Prekliči",
                "minimize": "Pomanjšaj",
                "maximize": "Povečaj",
                "restore": "Obnovi",
                "search": "Iskanje"
        },
        "tr": {
                "title": "Kaydedilmemiş proje",
                "message": "Uygulama kapatılsın mı?",
                "sub": "Proje kaydedilmediyse değişiklikler kaybolur.",
                "close": "Kapat",
                "cancel": "İptal",
                "minimize": "Küçült",
                "maximize": "Büyüt",
                "restore": "Geri yükle",
                "search": "Ara"
        },
        "pl": {
                "title": "Niezapisany projekt",
                "message": "Zamknąć aplikację?",
                "sub": "Jeśli projekt nie został zapisany, zmiany zostaną utracone.",
                "close": "Zamknij",
                "cancel": "Anuluj",
                "minimize": "Minimalizuj",
                "maximize": "Maksymalizuj",
                "restore": "Przywróć",
                "search": "Szukaj"
        },
        "id": {
                "title": "Proyek belum disimpan",
                "message": "Tutup aplikasi?",
                "sub": "Jika proyek belum disimpan, perubahan akan hilang.",
                "close": "Tutup",
                "cancel": "Batal",
                "minimize": "Minimalkan",
                "maximize": "Maksimalkan",
                "restore": "Pulihkan",
                "search": "Cari"
        },
        "zh-CN": {
                "title": "未保存的项目",
                "message": "关闭应用程序？",
                "sub": "如果项目未保存，更改将会丢失。",
                "close": "关闭",
                "cancel": "取消",
                "minimize": "最小化",
                "maximize": "最大化",
                "restore": "还原",
                "search": "搜索"
        },
        "zh-CHT": {
                "title": "未儲存的專案",
                "message": "要關閉應用程式嗎？",
                "sub": "如果專案尚未儲存，變更將會遺失。",
                "close": "關閉",
                "cancel": "取消",
                "minimize": "最小化",
                "maximize": "最大化",
                "restore": "還原",
                "search": "搜尋"
        },
        "th": {
                "title": "โปรเจกต์ยังไม่ได้บันทึก",
                "message": "ปิดแอปพลิเคชันหรือไม่?",
                "sub": "หากยังไม่ได้บันทึกโปรเจกต์ การเปลี่ยนแปลงจะสูญหาย",
                "close": "ปิด",
                "cancel": "ยกเลิก",
                "minimize": "ย่อ",
                "maximize": "ขยาย",
                "restore": "คืนค่า",
                "search": "ค้นหา"
        },
        "ja": {
                "title": "未保存のプロジェクト",
                "message": "アプリケーションを閉じますか？",
                "sub": "プロジェクトが保存されていない場合、変更は失われます。",
                "close": "閉じる",
                "cancel": "キャンセル",
                "minimize": "最小化",
                "maximize": "最大化",
                "restore": "元に戻す",
                "search": "検索"
        },
        "ko": {
                "title": "저장되지 않은 프로젝트",
                "message": "응용 프로그램을 닫으시겠습니까?",
                "sub": "프로젝트가 저장되지 않은 경우 변경 사항이 손실됩니다.",
                "close": "닫기",
                "cancel": "취소",
                "minimize": "최소화",
                "maximize": "최대화",
                "restore": "복원",
                "search": "검색"
        },
        "pt-BR": {
                "title": "Projeto não salvo",
                "message": "Fechar o aplicativo?",
                "sub": "Se o projeto não foi salvo, as alterações serão perdidas.",
                "close": "Fechar",
                "cancel": "Cancelar",
                "minimize": "Minimizar",
                "maximize": "Maximizar",
                "restore": "Restaurar",
                "search": "Pesquisar"
        },
        "hu": {
                "title": "Nem mentett projekt",
                "message": "Bezárja az alkalmazást?",
                "sub": "Ha a projekt nincs mentve, a módosítások elvesznek.",
                "close": "Bezárás",
                "cancel": "Mégse",
                "minimize": "Kis méret",
                "maximize": "Teljes méret",
                "restore": "Visszaállítás",
                "search": "Keresés"
        },
        "sk": {
                "title": "Neuložený projekt",
                "message": "Zavrieť aplikáciu?",
                "sub": "Ak projekt nie je uložený, zmeny sa stratia.",
                "close": "Zavrieť",
                "cancel": "Zrušiť",
                "minimize": "Minimalizovať",
                "maximize": "Maximalizovať",
                "restore": "Obnoviť",
                "search": "Hľadať"
        },
        "vi": {
                "title": "Dự án chưa lưu",
                "message": "Đóng ứng dụng?",
                "sub": "Nếu dự án chưa được lưu, các thay đổi sẽ bị mất.",
                "close": "Đóng",
                "cancel": "Hủy",
                "minimize": "Thu nhỏ",
                "maximize": "Phóng to",
                "restore": "Khôi phục",
                "search": "Tìm kiếm"
        },
        "bg": {
                "title": "Незапазен проект",
                "message": "Да се затвори ли приложението?",
                "sub": "Ако проектът не е запазен, промените ще бъдат изгубени.",
                "close": "Затвори",
                "cancel": "Отказ",
                "minimize": "Минимизиране",
                "maximize": "Максимизиране",
                "restore": "Възстановяване",
                "search": "Търсене"
        },
        "sr": {
                "title": "Несачуван пројекат",
                "message": "Затворити апликацију?",
                "sub": "Ако пројекат није сачуван, измене ће бити изгубљене.",
                "close": "Затвори",
                "cancel": "Откажи",
                "minimize": "Умањи",
                "maximize": "Увећај",
                "restore": "Врати",
                "search": "Претрага"
        },
        "sq": {
                "title": "Projekt i paruajtur",
                "message": "Të mbyllet aplikacioni?",
                "sub": "Nëse projekti nuk është ruajtur, ndryshimet do të humbasin.",
                "close": "Mbyll",
                "cancel": "Anulo",
                "minimize": "Minimizo",
                "maximize": "Maksimizo",
                "restore": "Rikthe",
                "search": "Kërko"
        },
        "ta": {
                "title": "சேமிக்கப்படாத திட்டம்",
                "message": "பயன்பாட்டை மூடவா?",
                "sub": "திட்டம் சேமிக்கப்படவில்லை என்றால், மாற்றங்கள் இழக்கப்படும்.",
                "close": "மூடு",
                "cancel": "ரத்து",
                "minimize": "சிறிதாக்கு",
                "maximize": "பெரிதாக்கு",
                "restore": "மீட்டமை",
                "search": "தேடு"
        },
        "bo": {
                "title": "ཉར་མེད་པའི་ལས་འཆར།",
                "message": "ཉེར་སྤྱོད་སྒོ་རྒྱག་གམ།",
                "sub": "ལས་འཆར་ཉར་མེད་ན་བཟོ་བཅོས་རྣམས་བརླག་འགྲོ།",
                "close": "སྒོ་རྒྱག",
                "cancel": "དོར",
                "minimize": "ཆུང་བ",
                "maximize": "ཆེ་བ",
                "restore": "སོར་ཆུད",
                "search": "འཚོལ"
        },
        "ca": {
                "title": "Projecte no desat",
                "message": "Tancar l’aplicació?",
                "sub": "Si el projecte no està desat, els canvis es perdran.",
                "close": "Tanca",
                "cancel": "Cancel·la",
                "minimize": "Minimitza",
                "maximize": "Maximitza",
                "restore": "Restaura",
                "search": "Cerca"
        },
        "no": {
                "title": "Ulagret prosjekt",
                "message": "Lukke programmet?",
                "sub": "Hvis prosjektet ikke er lagret, går endringene tapt.",
                "close": "Lukk",
                "cancel": "Avbryt",
                "minimize": "Minimer",
                "maximize": "Maksimer",
                "restore": "Gjenopprett",
                "search": "Søk"
        },
        "tl": {
                "title": "Hindi na-save na proyekto",
                "message": "Isara ang app?",
                "sub": "Kung hindi na-save ang proyekto, mawawala ang mga pagbabago.",
                "close": "Isara",
                "cancel": "Kanselahin",
                "minimize": "I-minimize",
                "maximize": "I-maximize",
                "restore": "Ibalik",
                "search": "Hanapin"
        },
        "et": {
                "title": "Salvestamata projekt",
                "message": "Kas sulgeda rakendus?",
                "sub": "Kui projekt pole salvestatud, lähevad muudatused kaotsi.",
                "close": "Sulge",
                "cancel": "Tühista",
                "minimize": "Minimeeri",
                "maximize": "Maksimeeri",
                "restore": "Taasta",
                "search": "Otsi"
        },
        "lt": {
                "title": "Neišsaugotas projektas",
                "message": "Uždaryti programą?",
                "sub": "Jei projektas neišsaugotas, pakeitimai bus prarasti.",
                "close": "Uždaryti",
                "cancel": "Atšaukti",
                "minimize": "Sumažinti",
                "maximize": "Padidinti",
                "restore": "Atkurti",
                "search": "Ieškoti"
        },
        "ckb": {
                "title": "پڕۆژەی پاشەکەوت‌نەکراو",
                "message": "بەرنامە دابخرێت؟",
                "sub": "ئەگەر پڕۆژەکە پاشەکەوت نەکرابێت، گۆڕانکارییەکان لەدەست دەچن.",
                "close": "داخستن",
                "cancel": "هەڵوەشاندنەوە",
                "minimize": "بچووککردنەوە",
                "maximize": "گەورەکردن",
                "restore": "گەڕاندنەوە",
                "search": "گەڕان"
        },
        "fa": {
                "title": "پروژه ذخیره‌نشده",
                "message": "برنامه بسته شود؟",
                "sub": "اگر پروژه ذخیره نشده باشد، تغییرات از دست خواهند رفت.",
                "close": "بستن",
                "cancel": "لغو",
                "minimize": "کوچک کردن",
                "maximize": "بزرگ کردن",
                "restore": "بازگردانی",
                "search": "جستجو"
        },
        "eo": {
                "title": "Nekonservita projekto",
                "message": "Ĉu fermi la aplikaĵon?",
                "sub": "Se la projekto ne estas konservita, ŝanĝoj perdiĝos.",
                "close": "Fermi",
                "cancel": "Nuligi",
                "minimize": "Minimumigi",
                "maximize": "Maksimumigi",
                "restore": "Restarigi",
                "search": "Serĉi"
        },
        "nqo": {
                "title": "ߞߊ߬ ߓߘߐ߬ߓߌ߬ߟߊ߬ ߕߊ߬ ߓߊ߯ߙߊ",
                "message": "ߓߊ߯ߙߊߟߊ߲ ߘߊߕߎ߲߯؟",
                "sub": "ߣߴߊ߬ ߡߊ߫ ߟߊߞߎ߲߬ߘߎ߬ ߘߐ߫، ߝߊ߬ߟߋ߲߬ߠߌ ߟߎ߬ ߦߋ߫ ߕߎߣߎ߲߫.",
                "close": "ߘߊߕߎ߲߯",
                "cancel": "ߓߐ߬ߛߌ߬",
                "minimize": "ߘߐ߰ߦߊ߬",
                "maximize": "ߓߏ߲߬ߧߊ߬",
                "restore": "ߟߊߛߊ߬ߦߌ߬",
                "search": "ߢߌߣߌ߲"
        },
        "ka": {
                "title": "შეუნახავი პროექტი",
                "message": "დაიხუროს აპლიკაცია?",
                "sub": "თუ პროექტი შენახული არ არის, ცვლილებები დაიკარგება.",
                "close": "დახურვა",
                "cancel": "გაუქმება",
                "minimize": "ჩაკეცვა",
                "maximize": "გადიდება",
                "restore": "აღდგენა",
                "search": "ძებნა"
        },
        "kk": {
                "title": "Сақталмаған жоба",
                "message": "Қолданбаны жабу керек пе?",
                "sub": "Егер жоба сақталмаса, өзгерістер жоғалады.",
                "close": "Жабу",
                "cancel": "Бас тарту",
                "minimize": "Қайыру",
                "maximize": "Үлкейту",
                "restore": "Қалпына келтіру",
                "search": "Іздеу"
        },
        "rue": {
                "title": "Неуложеный проєкт",
                "message": "Закрыти аплікацію?",
                "sub": "Кедь проєкт не є уложеный, зміны ся стратять.",
                "close": "Закрыти",
                "cancel": "Одкликати",
                "minimize": "Зменшыти",
                "maximize": "Звекшыти",
                "restore": "Вернути",
                "search": "Пошук"
        }
};
    var DESKTOP_MENU_SIGNATURES = {
        "en": [
                "File",
                "Edit",
                "Image"
        ],
        "cs": [
                "Soubor",
                "Úpravy",
                "Obraz"
        ],
        "es": [
                "Archivo",
                "Editar",
                "Imagen"
        ],
        "de": [
                "Datei",
                "Bearbeiten",
                "Bild"
        ],
        "fr": [
                "Fichier",
                "Édition",
                "Image"
        ],
        "el": [
                "Αρχείο",
                "Επεξεργασία",
                "Εικόνα"
        ],
        "ar": [
                "ملف",
                "تعديل",
                "صورة"
        ],
        "pt": [
                "Arquivo",
                "Editar",
                "Imagem"
        ],
        "ru": [
                "Файл",
                "Редактирование",
                "Изображение"
        ],
        "uk": [
                "Файл",
                "Редагувати",
                "Зображення"
        ],
        "he": [
                "קובץ",
                "עריכה",
                "תמונה"
        ],
        "hr": [
                "Datoteka",
                "Uređivanje",
                "Slika"
        ],
        "it": [
                "File",
                "Modifica",
                "Immagine"
        ],
        "ro": [
                "Fișier",
                "Editare",
                "Imagine"
        ],
        "nl": [
                "Bestand",
                "Bewerken",
                "Afbeelding"
        ],
        "sv": [
                "Fil",
                "Redigera",
                "Bild"
        ],
        "da": [
                "Fil",
                "Rediger",
                "Billede"
        ],
        "fi": [
                "Tiedosto",
                "Muokkaa",
                "Kuva"
        ],
        "sl": [
                "Datoteka",
                "Uredi",
                "Slika"
        ],
        "tr": [
                "Dosya",
                "Düzenle",
                "Resim"
        ],
        "pl": [
                "Plik",
                "Edycja",
                "Obraz"
        ],
        "id": [
                "Berkas",
                "Ubah",
                "Gambar"
        ],
        "zh-CN": [
                "文件",
                " 编辑",
                " 图像"
        ],
        "zh-CHT": [
                "檔案",
                "編輯",
                "影像"
        ],
        "th": [
                "ไฟล์",
                "แก้ไข",
                "รูปภาพ"
        ],
        "ja": [
                "ファイル",
                "編集",
                "画像"
        ],
        "ko": [
                "파일",
                "편집",
                "이미지"
        ],
        "pt-BR": [
                "Arquivo",
                "Editar",
                "Imagem"
        ],
        "hu": [
                "Fájl",
                "Szerkesztés",
                "Kép"
        ],
        "sk": [
                "Súbor",
                "Upraviť",
                "Obraz"
        ],
        "vi": [
                "Tệp",
                "Chỉnh sửa",
                "Hình ảnh"
        ],
        "bg": [
                "Файл",
                "Редакция",
                "Изображение"
        ],
        "sr": [
                "Датотека",
                "Измени",
                "Слика"
        ],
        "sq": [
                "Dokumenti",
                "Redakto",
                "Foto"
        ],
        "ta": [
                "கோப்பு",
                "தொகு",
                "படம்"
        ],
        "bo": [
                "ཡིག་ཆ།",
                "བཟོ་སྒྲིག",
                "པར།"
        ],
        "ca": [
                "Fitxer",
                "Edita",
                "Imatge"
        ],
        "no": [
                "Fil",
                "Rediger",
                "Bilde"
        ],
        "tl": [
                "File",
                "I-edit",
                "Larawan"
        ],
        "et": [
                "Fail",
                "Muuda",
                "Pilt"
        ],
        "lt": [
                "Failas",
                "Redaguoti",
                "Vaizdas"
        ],
        "ckb": [
                "پەڕاو",
                "دەستکاری",
                "وێنە"
        ],
        "fa": [
                "فایل",
                "ویرایش",
                "تصویر"
        ],
        "eo": [
                "Dosiero",
                "Redakti",
                "Bildo"
        ],
        "nqo": [
                "ߞߐߕߐ߮",
                "ߟߢߊ߬ߟߌ",
                "ߖߌ߬ߦߊ߬ߓߍ"
        ],
        "ka": [
                "ფაილი",
                "რედაქტირება",
                "სურათი"
        ],
        "kk": [
                "Файл",
                "Өңдеу",
                "Сурет"
        ],
        "rue": [
                "Файл",
                "Редаґовати",
                "Образчик"
        ]
};
    var DESKTOP_RTL_CODES = { ar: true, he: true, fa: true, ckb: true, nqo: true };

    function desktopNormalizeInitialLanguage(code) {
        code = String(code == null ? '' : code).replace(/_/g, '-').trim();
        if (!code) return null;
        var lower = code.toLowerCase();
        var aliases = {
            'zh-hk': 'zh-CHT',
            'zh-tw': 'zh-CHT',
            'zh-mo': 'zh-CHT',
            'zh-hant': 'zh-CHT',
            'zh-cn': 'zh-CN',
            'zh-sg': 'zh-CN',
            'zh-hans': 'zh-CN',
            'pt-br': 'pt-BR',
            'nb': 'no',
            'nn': 'no',
            'nb-no': 'no',
            'nn-no': 'no',
            'fa-ir': 'fa',
            'ku': 'ckb',
            'ku-iq': 'ckb',
            'ckb-iq': 'ckb'
        };
        if (aliases[lower] && DESKTOP_TRANSLATIONS[aliases[lower]]) return aliases[lower];
        if (DESKTOP_TRANSLATIONS[code]) return code;
        if (DESKTOP_TRANSLATIONS[lower]) return lower;
        var base = lower.split('-')[0];
        return DESKTOP_TRANSLATIONS[base] ? base : null;
    }

    function desktopReadQueryLanguage() {
        try {
            var params = new URLSearchParams(location.search || '');
            return desktopNormalizeInitialLanguage(params.get('desktopLang'));
        } catch (_ignored) {
            return null;
        }
    }

    var DESKTOP_SYSTEM_LANG = desktopReadQueryLanguage() || desktopNormalizeInitialLanguage((navigator.languages && navigator.languages[0]) || navigator.language) || 'en';
    var DESKTOP_LAST_REPORTED_LANG = null;

    try {
        if (!localStorage.getItem('lang') && !localStorage.getItem('_ppp')) {
            localStorage.setItem('lang', DESKTOP_SYSTEM_LANG);
        }
    } catch (_ignored) { }

    try {
        window.chrome.i18n.getUILanguage = function () { return DESKTOP_SYSTEM_LANG; };
    } catch (_ignored2) { }

    function desktopNormalizeText(value) {
        return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    }

    function desktopReadStoredLanguage() {
        function isKnown(code) { return !!(code && DESKTOP_TRANSLATIONS[code]); }
        function normalizeCode(code) {
            code = desktopNormalizeText(code);
            if (isKnown(code)) return code;
            var lower = code.toLowerCase();
            var aliases = { 'zh-hk': 'zh-CHT', 'zh-tw': 'zh-CHT', 'zh-mo': 'zh-CHT', 'zh-cn': 'zh-CN', 'pt-br': 'pt-BR' };
            if (aliases[lower]) return aliases[lower];
            if (isKnown(lower)) return lower;
            var base = lower.split('-')[0];
            return isKnown(base) ? base : null;
        }
        function scan(value, depth) {
            if (depth > 4 || value == null) return null;
            if (typeof value === 'string') {
                var direct = normalizeCode(value);
                if (direct) return direct;
                if ((value.charAt(0) === '{' || value.charAt(0) === '[') && value.length < 20000) {
                    try { return scan(JSON.parse(value), depth + 1); } catch (_ignored) { }
                }
                return null;
            }
            if (typeof value !== 'object') return null;
            if (typeof value.lang === 'string') {
                var lang = normalizeCode(value.lang);
                if (lang) return lang;
            }
            if (value.globals && typeof value.globals.lang === 'string') {
                var globalLang = normalizeCode(value.globals.lang);
                if (globalLang) return globalLang;
            }
            var keys = Object.keys(value);
            for (var i = 0; i < keys.length; i++) {
                var found = scan(value[keys[i]], depth + 1);
                if (found) return found;
            }
            return null;
        }
        try {
            if (window.locStor) {
                var state = window.locStor.getItem('0_stateLocal');
                var fromLocState = scan(state, 0);
                if (fromLocState) return fromLocState;
            }
        } catch (_ignored) { }
        try {
            var packed = window.localStorage && window.localStorage.getItem('_ppp');
            var fromPacked = scan(packed, 0);
            if (fromPacked) return fromPacked;
        } catch (_ignored2) { }
        try {
            var fromLocal = normalizeCode(window.localStorage && window.localStorage.getItem('lang'));
            if (fromLocal) return fromLocal;
        } catch (_ignored3) { }
        return null;
    }

    function desktopGetTopbarLabels() {
        var topbar = document.getElementById('ap-topbar');
        if (!topbar) return [];
        var labels = [];
        var children = Array.prototype.slice.call(topbar.children || []);
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (!child || child.id === 'ap-topbar-right' || child.id === 'desktop-window-controls') continue;
            if (child.classList && child.classList.contains('desktop-window-controls')) continue;
            var text = desktopNormalizeText(child.innerText || child.textContent || '');
            if (!text || text.length > 32) continue;
            labels.push(text);
            if (labels.length >= 3) break;
        }
        return labels;
    }

    function desktopGetTopbarFullText() {
        var topbar = document.getElementById('ap-topbar');
        if (!topbar) return '';
        return desktopNormalizeText(topbar.innerText || topbar.textContent || '');
    }

    function desktopSignatureMatchesFullText(signature, text) {
        if (!signature || signature.length < 3 || !text) return false;
        var position = 0;
        for (var i = 0; i < 3; i++) {
            var token = desktopNormalizeText(signature[i]);
            if (!token) return false;
            var found = text.indexOf(token, position);
            if (found < 0) return false;

            // The menu labels are always at the beginning of Photopea topbar.
            // This prevents random matches inside other UI text.
            if (i === 0 && found > 12) return false;
            position = found + token.length;
        }
        return true;
    }

    function desktopDetectLanguageFromTopbar() {
        var labels = desktopGetTopbarLabels();
        if (labels.length >= 3) {
            for (var code in DESKTOP_MENU_SIGNATURES) {
                var sig = DESKTOP_MENU_SIGNATURES[code];
                if (!sig || sig.length < 3) continue;
                if (desktopNormalizeText(sig[0]) === labels[0] && desktopNormalizeText(sig[1]) === labels[1] && desktopNormalizeText(sig[2]) === labels[2]) {
                    return code;
                }
            }
        }

        var fullText = desktopGetTopbarFullText();
        if (fullText) {
            for (var code2 in DESKTOP_MENU_SIGNATURES) {
                if (desktopSignatureMatchesFullText(DESKTOP_MENU_SIGNATURES[code2], fullText)) {
                    return code2;
                }
            }
        }

        return null;
    }

    function desktopDetectLanguageCode() {
        return desktopDetectLanguageFromTopbar() || desktopReadStoredLanguage() || DESKTOP_SYSTEM_LANG || 'en';
    }

    function desktopTexts() {
        var code = desktopDetectLanguageCode();
        return DESKTOP_TRANSLATIONS[code] || DESKTOP_TRANSLATIONS.en;
    }

    function desktopCurrentDirection() {
        var code = desktopDetectLanguageCode();
        return DESKTOP_RTL_CODES[code] ? 'rtl' : 'ltr';
    }

    function postWindowMessage(message) {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage(message);
        }
    }

    function notifyDesktopLanguageChanged() {
        var code = desktopDetectLanguageCode();
        if (!code || code === DESKTOP_LAST_REPORTED_LANG) return code;
        DESKTOP_LAST_REPORTED_LANG = code;
        postWindowMessage('window:language:' + code);
        return code;
    }

    function isInteractiveTarget(target) {
        return !!(target && target.closest && target.closest(
            'button,a,input,textarea,select,[contenteditable="true"],.desktop-window-controls,.desktop-window-button,.fitem,.bbtn,.dropdown,.contextmenu,.menuitem,#ap-topbar-left,#ap-topbar-left1,#ap-topbar-left2,#ap-topbar-search,#ap-topbar-account,#ap-topbar-fullscreen'
        ));
    }

    function isPointInsideElement(event, element) {
        if (!event || !element || !element.getBoundingClientRect) return false;
        var rect = element.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return false;
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    }

    function isBlockedTopbarDragArea(event) {
        var selectors = [
            '#ap-topbar-left',
            '#ap-topbar-left1',
            '#ap-topbar-left2',
            '#ap-topbar-search',
            '#ap-topbar-account',
            '#ap-topbar-fullscreen',
            '#desktop-window-controls'
        ];

        for (var i = 0; i < selectors.length; i++) {
            var element = document.querySelector(selectors[i]);
            if (isPointInsideElement(event, element)) return true;
        }

        return false;
    }

    function shouldStartWindowDrag(event, topbar) {
        if (!event || event.button !== 0 || !topbar) return false;
        if (isInteractiveTarget(event.target)) return false;
        if (isBlockedTopbarDragArea(event)) return false;
        return isPointInsideElement(event, topbar);
    }

    function disableNativeTopbarDrag() {
        var nodes = document.querySelectorAll('#ap-topbar,#ap-topbar *');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (!node || !node.style) continue;
            node.style.webkitAppRegion = 'no-drag';
            node.style.appRegion = 'no-drag';
        }
    }

    function createSvg(viewBox, paths) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        paths.forEach(function (d) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '1.6');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
        });

        return svg;
    }

    function makeButton(className, title, svg, onClick) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'desktop-window-button ' + className;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.appendChild(svg);
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            onClick();
        }, true);
        button.addEventListener('dblclick', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }, true);
        return button;
    }

    function updateMaximizeIcon(svg, maximized) {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var paths = maximized
            ? ['M7 4.5H13.5V11H11.5V6.5H7Z', 'M4.5 7H11V13.5H4.5Z']
            : ['M5 4.5H13.5V13H5Z'];

        paths.forEach(function (d) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '1.55');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
        });
    }

    function installStyle() {
        if (document.getElementById('desktop-window-controls-style')) return;

        var style = document.createElement('style');
        style.id = 'desktop-window-controls-style';
        style.textContent = '\n' +
            'html,body{width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important;}\n' +
            'html::-webkit-scrollbar,body::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;}\n' +
            'body>.app{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;overflow:hidden!important;}\n' +
            'body>.app>div:first-child{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;overflow:hidden!important;}\n' +
            '#ap-topbar{width:100vw!important;max-width:100vw!important;app-region:no-drag!important;-webkit-app-region:no-drag!important;}\n' +
            '#ap-topbar,#ap-topbar *{app-region:no-drag!important;-webkit-app-region:no-drag!important;}\n' +
            '#ap-topbar-left,#ap-topbar-left1,#ap-topbar-left2,#ap-topbar-left button,#ap-topbar-left .fitem,#ap-topbar-search,#ap-topbar-account,#ap-topbar-fullscreen,#desktop-window-controls,#desktop-window-controls *{app-region:no-drag!important;-webkit-app-region:no-drag!important;}\n' +
            '#ap-topbar-fullscreen{display:none!important;width:0!important;min-width:0!important;margin:0!important;padding:0!important;overflow:hidden!important;visibility:hidden!important;}\n' +
            '.desktop-window-controls{display:inline-flex!important;align-items:stretch;height:31px;margin-left:6px;color:var(--text-color,#ddd);background-color:var(--base,#474747);-webkit-app-region:no-drag;position:relative;z-index:2147483647;}\n' +
            '.desktop-window-button{width:39px;height:31px;margin:0;padding:0;display:inline-flex!important;align-items:center;justify-content:center;border:0;border-radius:0;outline:none;color:var(--text-color,#ddd);background:transparent;opacity:.92;cursor:default;box-shadow:none;text-shadow:none;-webkit-app-region:no-drag;}\n' +
            '.desktop-window-button:hover{background-color:var(--bg-bbtnOver,rgba(255,255,255,.12));opacity:1;}\n' +
            '.desktop-window-button:active{background-color:var(--bg-bbtn,rgba(255,255,255,.18));}\n' +
            '.desktop-window-close:hover{background-color:#c42b1c!important;color:#fff!important;}\n' +
            '.desktop-window-close:active{background-color:#8f1d13!important;color:#fff!important;}\n' +
            '.desktop-window-button svg{display:block;pointer-events:none;}\n' +
            '.desktop-resize-handles{position:fixed;inset:0;z-index:2147483646;pointer-events:none;}\n' +
            '.desktop-resize-handle{position:fixed;display:block;pointer-events:auto;background:transparent;}\n' +
            '.desktop-resize-left{left:0;top:12px;bottom:12px;width:6px;cursor:w-resize;}\n' +
            '.desktop-resize-right{right:0;top:12px;bottom:12px;width:6px;cursor:e-resize;}\n' +
            '.desktop-resize-top{left:12px;right:12px;top:0;height:5px;cursor:n-resize;}\n' +
            '.desktop-resize-bottom{left:12px;right:12px;bottom:0;height:6px;cursor:s-resize;}\n' +
            '.desktop-resize-top-left{left:0;top:0;width:14px;height:14px;cursor:nw-resize;}\n' +
            '.desktop-resize-top-right{right:0;top:0;width:14px;height:14px;cursor:ne-resize;}\n' +
            '.desktop-resize-bottom-left{left:0;bottom:0;width:14px;height:14px;cursor:sw-resize;}\n' +
            '.desktop-resize-bottom-right{right:0;bottom:0;width:16px;height:16px;cursor:se-resize;}\n' +
            'html.desktop-window-maximized .desktop-resize-handle{display:none!important;}\n' +
            '.desktop-close-dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.36);z-index:2147483647;pointer-events:auto;}\n' +
            '.desktop-close-dialog.window{position:fixed!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;width:430px;min-width:430px;max-width:430px;min-height:0;z-index:2147483647;color:var(--text-color);background-color:var(--base);border:1px solid rgba(0,0,0,.35);box-shadow:0 8px 38px rgba(0,0,0,.38);text-shadow:none;}\n' +
            '.desktop-close-dialog-overlay,.desktop-close-dialog,.desktop-close-dialog *{user-select:none!important;-webkit-user-select:none!important;-webkit-user-drag:none!important;}\n' +
            '.desktop-close-dialog.is-dragging{user-select:none!important;-webkit-user-select:none!important;}\n' +
            '.desktop-close-dialog .whead{cursor:default;}\n' +
            '.desktop-close-dialog .body{padding:1.05em 1.2em .95em 1.2em;line-height:1.55em;}\n' +
            '.desktop-close-dialog .cross{background-image:none!important;color:var(--text-color,#ddd);opacity:.9;}\n' +
            '.desktop-close-dialog .cross:hover{background-color:var(--bg-bbtnOver,rgba(255,255,255,.12));opacity:1;}\n' +
            '.desktop-close-dialog .cross:before,.desktop-close-dialog .cross:after{content:"";position:absolute;left:9px;top:14px;width:12px;height:1.6px;background:currentColor;border-radius:1px;}\n' +
            '.desktop-close-dialog .cross:before{transform:rotate(45deg);}\n' +
            '.desktop-close-dialog .cross:after{transform:rotate(-45deg);}\n' +
            '.desktop-close-dialog-message{font-size:1em;margin-bottom:.25em;}\n' +
            '.desktop-close-dialog-sub{opacity:.82;margin-top:.35em;}\n' +
            '.desktop-close-dialog-actions{padding:.8em 1em 1em 1em;text-align:right;border-top-width:1px;border-top-color:rgba(0,0,0,var(--alphaDark));}\n' +
            '.desktop-close-dialog-actions button{min-width:86px;margin-left:.55em;padding:.35em .9em;}\n' +
            '.desktop-home-bottom-hidden{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;}\n';
        document.head.appendChild(style);
    }

    function removeFullscreenButton() {
        var fullscreenButton = document.getElementById('ap-topbar-fullscreen');
        if (fullscreenButton) {
            fullscreenButton.style.display = 'none';
            fullscreenButton.style.visibility = 'hidden';
            fullscreenButton.style.width = '0';
            fullscreenButton.style.minWidth = '0';
            fullscreenButton.style.margin = '0';
            fullscreenButton.style.padding = '0';
        }
    }

    function installResizeHandles() {
        if (document.getElementById('desktop-resize-handles')) return true;

        var root = document.createElement('div');
        root.id = 'desktop-resize-handles';
        root.className = 'desktop-resize-handles';

        var handles = [
            ['left', 'left'],
            ['right', 'right'],
            ['top', 'top'],
            ['bottom', 'bottom'],
            ['top-left', 'topLeft'],
            ['top-right', 'topRight'],
            ['bottom-left', 'bottomLeft'],
            ['bottom-right', 'bottomRight']
        ];

        handles.forEach(function (info) {
            var handle = document.createElement('div');
            handle.className = 'desktop-resize-handle desktop-resize-' + info[0];
            handle.addEventListener('mousedown', function (event) {
                if (event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                postWindowMessage('window:resize:' + info[1]);
            }, true);
            root.appendChild(handle);
        });

        document.documentElement.appendChild(root);
        return true;
    }


    function updateWindowControlsLanguage() {
        var controls = document.getElementById('desktop-window-controls');
        if (!controls) return;
        var t = desktopTexts();
        var minButton = controls.querySelector('.desktop-window-minimize');
        var maxButton = controls.querySelector('.desktop-window-maximize');
        var closeButton = controls.querySelector('.desktop-window-close');
        if (minButton) {
            minButton.title = t.minimize;
            minButton.setAttribute('aria-label', t.minimize);
        }
        if (maxButton) {
            var maximized = document.documentElement.classList.contains('desktop-window-maximized');
            maxButton.title = maximized ? t.restore : t.maximize;
            maxButton.setAttribute('aria-label', maxButton.title);
        }
        if (closeButton) {
            closeButton.title = t.close;
            closeButton.setAttribute('aria-label', t.close);
        }
    }

    function installWindowControls() {
        installStyle();
        removeFullscreenButton();

        var topbar = document.getElementById('ap-topbar');
        var right = document.getElementById('ap-topbar-right');
        if (!topbar || !right) return false;

        var controls = document.getElementById('desktop-window-controls');
        if (!controls) {
            controls = document.createElement('div');
            controls.id = 'desktop-window-controls';
            controls.className = 'desktop-window-controls';

            var minimizeIcon = createSvg('0 0 18 18', ['M4 10.5H14']);
            var maximizeIcon = createSvg('0 0 18 18', ['M5 4.5H13.5V13H5Z']);
            var closeIcon = createSvg('0 0 18 18', ['M5 5L13 13', 'M13 5L5 13']);

            var desktopText = desktopTexts();
            var minButton = makeButton('desktop-window-minimize', desktopText.minimize, minimizeIcon, function () {
                postWindowMessage('window:minimize');
            });
            var maxButton = makeButton('desktop-window-maximize', desktopText.maximize, maximizeIcon, function () {
                postWindowMessage('window:toggleMaximize');
            });
            var closeButton = makeButton('desktop-window-close', desktopText.close, closeIcon, function () {
                postWindowMessage('window:close');
            });

            controls.appendChild(minButton);
            controls.appendChild(maxButton);
            controls.appendChild(closeButton);

            window.desktopWindowStateChanged = function (maximized) {
                controls.classList.toggle('is-maximized', !!maximized);
                document.documentElement.classList.toggle('desktop-window-maximized', !!maximized);
                var t = desktopTexts();
                maxButton.title = maximized ? t.restore : t.maximize;
                maxButton.setAttribute('aria-label', maxButton.title);
                updateMaximizeIcon(maximizeIcon, !!maximized);
            };
        }

        if (controls.parentNode !== right) right.appendChild(controls);
        updateWindowControlsLanguage();
        disableNativeTopbarDrag();

        right.style.padding = '0';
        right.style.height = '31px';
        right.style.display = 'flex';
        right.style.alignItems = 'stretch';
        right.style.justifyContent = 'flex-end';
        right.style.webkitAppRegion = 'no-drag';

        if (!topbar.classList.contains('desktop-titlebar-ready')) {
            topbar.classList.add('desktop-titlebar-ready');

            topbar.addEventListener('mousedown', function (event) {
                if (!shouldStartWindowDrag(event, topbar)) return;
                event.preventDefault();
                event.stopPropagation();
                postWindowMessage('window:drag');
            }, true);

            topbar.addEventListener('dblclick', function (event) {
                if (!shouldStartWindowDrag(event, topbar)) return;
                event.preventDefault();
                event.stopPropagation();
                postWindowMessage('window:toggleMaximize');
            }, true);
        }

        return true;
    }

    function openPhotopeaSearch() {
        try {
            var app = window.ps && window.ps._j3;
            if (app && app.$y && typeof app.$y.awL === 'function') {
                app.$y.awL(typeof app.I_ === 'function' ? app.I_() : null, app.e);
                return true;
            }
        } catch (_ignored) { }
        return false;
    }

    function fixTopbarSearchButton() {
        var searchButton = document.getElementById('ap-topbar-search');
        if (!searchButton) return false;

        var t = desktopTexts();
        searchButton.title = t.search;
        searchButton.setAttribute('aria-label', t.search);
        var img = searchButton.querySelector('img');
        if (img) img.alt = t.search;

        if (!searchButton.__desktopSearchFixed) {
            searchButton.__desktopSearchFixed = true;
            searchButton.addEventListener('click', function (event) {
                if (openPhotopeaSearch()) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                }
            }, true);
        }
        return true;
    }

    function removeUnsavedProjectDialog(sendCancelMessage) {
        var old = document.getElementById('desktop-close-dialog-overlay');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        if (sendCancelMessage) postWindowMessage('window:closeCanceled');
    }

    function updateUnsavedProjectDialogLanguage() {
        var overlay = document.getElementById('desktop-close-dialog-overlay');
        if (!overlay) return;
        var dialog = overlay.querySelector('.desktop-close-dialog');
        if (!dialog) return;

        var t = desktopTexts();
        dialog.setAttribute('aria-label', t.title);
        dialog.setAttribute('dir', desktopCurrentDirection());

        var title = dialog.querySelector('.wname');
        var cross = dialog.querySelector('.cross');
        var message = dialog.querySelector('.desktop-close-dialog-message');
        var sub = dialog.querySelector('.desktop-close-dialog-sub');
        var buttons = dialog.querySelectorAll('.desktop-close-dialog-actions .bbtn');

        if (title) title.textContent = t.title;
        if (cross) {
            cross.title = t.close;
            cross.setAttribute('aria-label', t.close);
        }
        if (message) message.textContent = t.message;
        if (sub) sub.textContent = t.sub;
        if (buttons[0]) buttons[0].textContent = t.close;
        if (buttons[1]) buttons[1].textContent = t.cancel;
    }

    function showUnsavedProjectDialog() {
        installStyle();

        if (document.getElementById('desktop-close-dialog-overlay')) { updateUnsavedProjectDialogLanguage(); return; }

        var overlay = document.createElement('div');
        overlay.id = 'desktop-close-dialog-overlay';
        overlay.className = 'desktop-close-dialog-overlay';

        var t = desktopTexts();
        var dialog = document.createElement('div');
        dialog.className = 'window desktop-close-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', t.title);
        dialog.setAttribute('dir', desktopCurrentDirection());
        overlay.appendChild(dialog);

        var head = document.createElement('div');
        head.className = 'whead';
        dialog.appendChild(head);

        var name = document.createElement('div');
        name.className = 'wname';
        name.textContent = t.title;
        head.appendChild(name);

        var cross = document.createElement('div');
        cross.className = 'cross';
        cross.title = t.close;
        cross.setAttribute('aria-label', t.close);
        head.appendChild(cross);

        var body = document.createElement('div');
        body.className = 'body';
        dialog.appendChild(body);

        var message = document.createElement('div');
        message.className = 'desktop-close-dialog-message';
        message.textContent = t.message;
        body.appendChild(message);

        var sub = document.createElement('div');
        sub.className = 'desktop-close-dialog-sub';
        sub.textContent = t.sub;
        body.appendChild(sub);

        var actions = document.createElement('div');
        actions.className = 'desktop-close-dialog-actions';
        dialog.appendChild(actions);

        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'bbtn';
        closeButton.textContent = t.close;
        actions.appendChild(closeButton);

        var cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'bbtn';
        cancelButton.textContent = t.cancel;
        actions.appendChild(cancelButton);

        function cancel(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            }
            removeUnsavedProjectDialog(true);
        }

        function confirmClose(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            }
            removeUnsavedProjectDialog(false);
            postWindowMessage('window:closeConfirmed');
        }

        cross.addEventListener('click', cancel, true);
        cancelButton.addEventListener('click', cancel, true);
        closeButton.addEventListener('click', confirmClose, true);

        overlay.addEventListener('mousedown', function (event) {
            if (event.target === overlay) {
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            }
        }, true);

        overlay.addEventListener('selectstart', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }, true);

        overlay.addEventListener('dragstart', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();
        }, true);

        dialog.addEventListener('mousedown', function (event) {
            if (event.target && event.target.closest && event.target.closest('.whead')) return;
            event.stopPropagation();
        }, false);

        head.addEventListener('mousedown', function (event) {
            if (event.button !== 0) return;
            if (event.target && event.target.closest && event.target.closest('.cross')) return;

            event.preventDefault();
            event.stopPropagation();
            if (event.stopImmediatePropagation) event.stopImmediatePropagation();

            var rect = dialog.getBoundingClientRect();
            var offsetX = event.clientX - rect.left;
            var offsetY = event.clientY - rect.top;
            var dialogWidth = rect.width;
            var dialogHeight = rect.height;

            dialog.classList.add('is-dragging');
            dialog.style.setProperty('transform', 'none', 'important');
            dialog.style.setProperty('left', rect.left + 'px', 'important');
            dialog.style.setProperty('top', rect.top + 'px', 'important');

            function move(moveEvent) {
                moveEvent.preventDefault();
                moveEvent.stopPropagation();
                if (moveEvent.stopImmediatePropagation) moveEvent.stopImmediatePropagation();

                var maxLeft = Math.max(0, window.innerWidth - dialogWidth);
                var maxTop = Math.max(0, window.innerHeight - dialogHeight);
                var left = Math.min(Math.max(0, moveEvent.clientX - offsetX), maxLeft);
                var top = Math.min(Math.max(0, moveEvent.clientY - offsetY), maxTop);

                dialog.style.setProperty('left', left + 'px', 'important');
                dialog.style.setProperty('top', top + 'px', 'important');
            }

            function stop(stopEvent) {
                if (stopEvent) {
                    stopEvent.preventDefault();
                    stopEvent.stopPropagation();
                    if (stopEvent.stopImmediatePropagation) stopEvent.stopImmediatePropagation();
                }

                dialog.classList.remove('is-dragging');
                document.removeEventListener('mousemove', move, true);
                document.removeEventListener('mouseup', stop, true);
            }

            document.addEventListener('mousemove', move, true);
            document.addEventListener('mouseup', stop, true);
        }, true);

        function onKeyDown(event) {
            if (!document.getElementById('desktop-close-dialog-overlay')) {
                document.removeEventListener('keydown', onKeyDown, true);
                return;
            }
            if (event.key === 'Escape') {
                cancel(event);
                document.removeEventListener('keydown', onKeyDown, true);
            }
            if (event.key === 'Enter') {
                confirmClose(event);
                document.removeEventListener('keydown', onKeyDown, true);
            }
        }

        document.addEventListener('keydown', onKeyDown, true);
        document.documentElement.appendChild(overlay);

        setTimeout(function () {
            try { cancelButton.focus(); } catch (_ignored) { }
        }, 0);
    }

    window.desktopShowUnsavedProjectDialog = showUnsavedProjectDialog;


    function desktopIsInstallPhotopeaText(text) {
        text = desktopNormalizeText(text).toLowerCase();
        return text === 'install photopea' ||
            text === 'установить photopea' ||
            text === 'встановити photopea' ||
            text === 'install photopea offline' ||
            text === 'установить photopea offline' ||
            text === 'встановити photopea offline';
    }

    function removeInstallPhotopeaButton() {
        try {
            var nodes = document.querySelectorAll('.fitem,.menuitem,.bbtn,button,a,div');
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (!node || node.id === 'ap-topbar' || node.id === 'ap-topbar-right' || node.id === 'desktop-window-controls') continue;
                if (node.querySelector && node.querySelector('.fitem,.menuitem,.bbtn,button,a')) continue;

                var text = desktopNormalizeText(node.innerText || node.textContent || '');
                if (!desktopIsInstallPhotopeaText(text)) continue;

                node.style.setProperty('display', 'none', 'important');
                node.style.setProperty('visibility', 'hidden', 'important');
                node.setAttribute('aria-hidden', 'true');
            }
        } catch (_ignored) { }
    }

    function installInstallPhotopeaClickBlocker() {
        if (document.__desktopInstallPhotopeaClickBlocker) return;
        document.__desktopInstallPhotopeaClickBlocker = true;
        document.addEventListener('click', function (event) {
            try {
                var target = event.target;
                var node = target && target.closest && target.closest('.fitem,.menuitem,.bbtn,button,a,div');
                if (!node) return;
                var text = desktopNormalizeText(node.innerText || node.textContent || '');
                if (!desktopIsInstallPhotopeaText(text)) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                node.style.setProperty('display', 'none', 'important');
            } catch (_ignored) { }
        }, true);
    }


    function desktopIsRemovedOnlineResourceText(text) {
        text = desktopNormalizeText(text).toLowerCase();
        if (!text) return false;

        return text === 'gallery' ||
            text === 'галерея' ||
            text === 'pinterest' ||
            text === 'peasmaker' ||
            text === 'templates' ||
            text === 'шаблоны' ||
            text === 'шаблони' ||
            text === 'plugins' ||
            text === 'плагины' ||
            text === 'плагіни' ||
            text === 'photoshop plugins' ||
            text === 'photopea plugins' ||
            text === 'resources' ||
            text === 'ресурсы' ||
            text === 'ресурси' ||
            text === 'install plugins' ||
            text === 'установить плагины' ||
            text === 'встановити плагіни';
    }

    function hideDesktopMenuNode(node) {
        if (!node || node.__desktopRemovedResourceItem) return;
        node.__desktopRemovedResourceItem = true;
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.setAttribute('aria-hidden', 'true');

        try {
            var previous = node.previousElementSibling;
            if (previous && desktopIsSeparatorLike(previous)) {
                previous.style.setProperty('display', 'none', 'important');
                previous.style.setProperty('visibility', 'hidden', 'important');
            }
        } catch (_ignored) { }
    }

    function desktopIsSeparatorLike(node) {
        if (!node) return false;
        var text = desktopNormalizeText(node.innerText || node.textContent || '');
        if (text.length !== 0) return false;

        var style = '';
        try { style = node.getAttribute('style') || ''; } catch (_ignored) { }
        var className = '';
        try { className = String(node.className || ''); } catch (_ignored2) { }

        return /border|height\s*:\s*1px|background/i.test(style) ||
            /sep|separator|split|line|dc/i.test(className) ||
            node.offsetHeight <= 3;
    }

    function removeOnlineResourceItems() {
        try {
            var nodes = document.querySelectorAll('.fitem,.menuitem,.bbtn,button,a,div,span');
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (!node || node.id === 'ap-topbar' || node.id === 'ap-topbar-right' || node.id === 'desktop-window-controls') continue;
                if (node.querySelector && node.querySelector('.fitem,.menuitem,.bbtn,button,a')) continue;

                var text = desktopNormalizeText(node.innerText || node.textContent || '');
                if (!desktopIsRemovedOnlineResourceText(text)) continue;

                hideDesktopMenuNode(node);
            }
        } catch (_ignored) { }
    }

    function installOnlineResourceClickBlocker() {
        if (document.__desktopOnlineResourceClickBlocker) return;
        document.__desktopOnlineResourceClickBlocker = true;
        document.addEventListener('click', function (event) {
            try {
                var target = event.target;
                var node = target && target.closest && target.closest('.fitem,.menuitem,.bbtn,button,a,div,span');
                if (!node) return;
                var text = desktopNormalizeText(node.innerText || node.textContent || '');
                if (!desktopIsRemovedOnlineResourceText(text)) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                hideDesktopMenuNode(node);
            } catch (_ignored) { }
        }, true);
    }

    function hideHomeBottomImage() {
        try {
            var images = document.querySelectorAll('img[src^="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjIi"]');
            images.forEach(function (img) {
                var parent = img.parentElement;
                if (!parent) return;

                var parentStyle = parent.getAttribute('style') || '';
                var imgWidth = parseFloat(img.style.width || img.getAttribute('width') || '0');
                var isBottomHomeGraphic = /bottom\s*:\s*0/i.test(parentStyle) && (imgWidth >= 250 || img.clientWidth >= 250);

                if (isBottomHomeGraphic) {
                    parent.classList.add('desktop-home-bottom-hidden');
                    parent.style.setProperty('display', 'none', 'important');
                    parent.style.setProperty('visibility', 'hidden', 'important');
                    img.removeAttribute('src');
                }
            });
        } catch (_ignored) { }
    }

    var ensureTimer = null;
    function ensureDesktopChrome() {
        installStyle();
        removeFullscreenButton();
        installWindowControls();
        installResizeHandles();
        fixTopbarSearchButton();
        updateUnsavedProjectDialogLanguage();
        removeInstallPhotopeaButton();
        installInstallPhotopeaClickBlocker();
        removeOnlineResourceItems();
        installOnlineResourceClickBlocker();
        hideHomeBottomImage();
        notifyDesktopLanguageChanged();
    }

    function scheduleEnsure() {
        if (ensureTimer) return;
        ensureTimer = setTimeout(function () {
            ensureTimer = null;
            ensureDesktopChrome();
        }, 50);
    }

    function bootDesktopControls() {
        ensureDesktopChrome();

        var fastAttempts = 0;
        var fastTimer = setInterval(function () {
            fastAttempts++;
            ensureDesktopChrome();
            if (fastAttempts > 240) clearInterval(fastTimer);
        }, 50);

        // Photopea can rebuild parts of the top bar on language/theme/menu changes.
        // Keep only our small titlebar injection alive instead of modifying the app layout.
        try {
            var observer = new MutationObserver(scheduleEnsure);
            observer.observe(document.documentElement, { childList: true, subtree: true });
        } catch (_ignored) { }

        setInterval(ensureDesktopChrome, 1000);

        document.addEventListener('DOMContentLoaded', ensureDesktopChrome);
        window.addEventListener('load', function () {
            ensureDesktopChrome();
            setTimeout(function () {
                try { window.dispatchEvent(new Event('resize')); } catch (_ignored) { }
            }, 100);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootDesktopControls);
    } else {
        bootDesktopControls();
    }
})();
