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

    try {
        if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'ru');
    } catch (_ignored) { }

    function postWindowMessage(message) {
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage(message);
        }
    }

    function isInteractiveTarget(target) {
        return !!(target && target.closest && target.closest(
            'button,a,input,textarea,select,[contenteditable="true"],.desktop-window-controls,.fitem,.bbtn,.dropdown,.contextmenu,.menuitem'
        ));
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
            '#ap-topbar{width:100vw!important;max-width:100vw!important;}\n' +
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

            var minButton = makeButton('desktop-window-minimize', 'Свернуть', minimizeIcon, function () {
                postWindowMessage('window:minimize');
            });
            var maxButton = makeButton('desktop-window-maximize', 'Развернуть', maximizeIcon, function () {
                postWindowMessage('window:toggleMaximize');
            });
            var closeButton = makeButton('desktop-window-close', 'Закрыть', closeIcon, function () {
                postWindowMessage('window:close');
            });

            controls.appendChild(minButton);
            controls.appendChild(maxButton);
            controls.appendChild(closeButton);

            window.desktopWindowStateChanged = function (maximized) {
                controls.classList.toggle('is-maximized', !!maximized);
                document.documentElement.classList.toggle('desktop-window-maximized', !!maximized);
                maxButton.title = maximized ? 'Восстановить' : 'Развернуть';
                maxButton.setAttribute('aria-label', maxButton.title);
                updateMaximizeIcon(maximizeIcon, !!maximized);
            };
        }

        if (controls.parentNode !== right) right.appendChild(controls);

        right.style.padding = '0';
        right.style.height = '31px';
        right.style.display = 'flex';
        right.style.alignItems = 'stretch';
        right.style.justifyContent = 'flex-end';
        right.style.webkitAppRegion = 'no-drag';

        if (!topbar.classList.contains('desktop-titlebar-ready')) {
            topbar.classList.add('desktop-titlebar-ready');

            topbar.addEventListener('mousedown', function (event) {
                if (event.button !== 0 || isInteractiveTarget(event.target)) return;
                postWindowMessage('window:drag');
            }, true);

            topbar.addEventListener('dblclick', function (event) {
                if (isInteractiveTarget(event.target)) return;
                event.preventDefault();
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

        searchButton.title = 'Поиск';
        searchButton.setAttribute('aria-label', 'Поиск');
        var img = searchButton.querySelector('img');
        if (img) img.alt = 'Поиск';

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

    function showUnsavedProjectDialog() {
        installStyle();

        if (document.getElementById('desktop-close-dialog-overlay')) return;

        var overlay = document.createElement('div');
        overlay.id = 'desktop-close-dialog-overlay';
        overlay.className = 'desktop-close-dialog-overlay';

        var dialog = document.createElement('div');
        dialog.className = 'window desktop-close-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Несохранённый проект');
        overlay.appendChild(dialog);

        var head = document.createElement('div');
        head.className = 'whead';
        dialog.appendChild(head);

        var name = document.createElement('div');
        name.className = 'wname';
        name.textContent = 'Несохранённый проект';
        head.appendChild(name);

        var cross = document.createElement('div');
        cross.className = 'cross';
        cross.title = 'Закрыть';
        cross.setAttribute('aria-label', 'Закрыть');
        head.appendChild(cross);

        var body = document.createElement('div');
        body.className = 'body';
        dialog.appendChild(body);

        var message = document.createElement('div');
        message.className = 'desktop-close-dialog-message';
        message.textContent = 'Закрыть приложение?';
        body.appendChild(message);

        var sub = document.createElement('div');
        sub.className = 'desktop-close-dialog-sub';
        sub.textContent = 'Если проект не сохранён, изменения будут потеряны.';
        body.appendChild(sub);

        var actions = document.createElement('div');
        actions.className = 'desktop-close-dialog-actions';
        dialog.appendChild(actions);

        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'bbtn';
        closeButton.textContent = 'Закрыть';
        actions.appendChild(closeButton);

        var cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'bbtn';
        cancelButton.textContent = 'Отмена';
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
        hideHomeBottomImage();
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
