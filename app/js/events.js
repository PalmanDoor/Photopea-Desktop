(function (global) {
    var isPointerEventSupported = window.PointerEvent,
        eventPrefix = isPointerEventSupported ? "pointer" : "mouse",
        startEvent = eventPrefix + "down",
        moveEvent = eventPrefix + "move",
        endEvent = eventPrefix + "up",
        useCapture = false; // 是否使用事件捕获

    // 为元素添加按下事件监听
    function events() {
        this.listeners = {};
        this.contexts = {};
    }
    
    events.addDownListen = function (element, handler) {
        element.addEventListener(startEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.addEventListener("touchstart", handler, useCapture);
    }

    // 为元素添加移动事件监听
    events.addMoveListen = function (element, handler) {
        element.addEventListener(moveEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.addEventListener("touchmove", handler, useCapture);
    }

    // 为元素添加松开事件监听
    events.addUpListen = function (element, handler) {
        element.addEventListener(endEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.addEventListener("touchend", handler, useCapture);
    }

    // 移除元素的按下事件监听
    events.removeDownListen = function (element, handler) {
        element.removeEventListener(startEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.removeEventListener("touchstart", handler, useCapture);
    }

    // 移除元素的移动事件监听
    events.removeMoveListen = function (element, handler) {
        element.removeEventListener(moveEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.removeEventListener("touchmove", handler, useCapture);
    }

    // 移除元素的松开事件监听
    events.removeUpListen = function (element, handler) {
        element.removeEventListener(endEvent, handler, useCapture);
        if (!isPointerEventSupported)
            element.removeEventListener("touchend", handler, useCapture);
    }

    events.prototype.hasListeners = function (eventType) {
        var listeners = this.listeners[eventType];
        if (listeners == null) {
            return false;
        }
        return listeners.length > 0;
    };
    
    events.prototype.addEventListener = function (eventType, listener, context) {
        if (this.listeners[eventType] == null) {
            this.listeners[eventType] = [];
            this.contexts[eventType] = [];
        }
        this.listeners[eventType].push(listener);
        this.contexts[eventType].push(context);
    };
    
    events.prototype.removeEventListener = function (eventType, listener) {
        var listeners = this.listeners[eventType];
        if (listeners == null) {
            return;
        }
        var index = listeners.indexOf(listener);
        if (index < 0) {
            return;
        }
        var contexts = this.contexts[eventType];
        listeners.splice(index, 1);
        contexts.splice(index, 1);
    };
    
    events.prototype.dispatchEvent = function (event) {
        event.currentTarget = this;
        if (event.target == null) {
            event.target = this;
        }
        var listeners = this.listeners[event.type];
        if (listeners == null) {
            return;
        }
        var contexts = this.contexts[event.type];
        for (var i = 0; i < listeners.length; i++) {
            if (contexts[i] == null) {
                listeners[i](event);
            } else {
                listeners[i].call(contexts[i], event);
            }
        }
    };
    
    global.__events = new events;
}(this));