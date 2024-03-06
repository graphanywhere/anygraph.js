/**
 * 可监听事件对象
 */
class EventTarget {

    constructor() {
        this.__eventListeners = {};
    }

    /**
     * 增加事件监听
     * @param {String|Object} eventName 事件名称 或 事件名称+事件函数对象，例如{"mouseUp":handle1, "mouseDown":handle2}
     * @param {Function} handler 事件函数
     * @return {Self} thisArg
     * @chainable
     */
    on(eventName, handler) {
        if (!this.__eventListeners) {
            this.__eventListeners = {};
        }
        // one object with key/value pairs was passed
        if (arguments.length === 1) {
            for (var prop in eventName) {
                this.on(prop, eventName[prop]);
            }
        } else {
            if (!this.__eventListeners[eventName]) {
                this.__eventListeners[eventName] = [];
            }
            this.__eventListeners[eventName].push(handler);
        }
        return this;
    }

    /**
     * 增加一次性事件监听
     */
    once(eventName, handler) {
        // one object with key/value pairs was passed
        if (arguments.length === 1) {
            for (var prop in eventName) {
                this._once(prop, eventName[prop]);
            }
        } else {
            this._once(eventName, handler);
        }
        return this;
    }

    _once(eventName, handler) {
        let that = this;
        var _handler = function () {
            handler(arguments);
            that.off(eventName, _handler);
        };
        this.on(eventName, _handler);
    }

    /**
     * 停止监听某个事件
     * 如果handle为空，则停止监听该事件的所有回调
     * @param {String|Object} eventName 事件名称
     * @param {Function} handler 事件函数
     * @return {Self} thisArg
     * @chainable
     */
    off(eventName, handler) {
        if (!this.__eventListeners) {
            return this;
        }

        // remove all key/value pairs (event name -> event handler)
        if (arguments.length === 0) {
            for (eventName in this.__eventListeners) {
                this._removeEventListener(eventName);
            }
        } else if (arguments.length === 1 && typeof arguments[0] === 'object') {
            // one object with key/value pairs was passed
            for (var prop in eventName) {
                this._removeEventListener(prop, eventName[prop]);
            }
        } else {
            this._removeEventListener(eventName, handler);
        }
        return this;
    }

    /**
     * 移除事件
     * @private
     * @param {String} eventName 事件名
     * @param {Function} handler 事件函数
     */
    _removeEventListener(eventName, handler) {
        if (!this.__eventListeners[eventName]) {
            return;
        }
        var eventListener = this.__eventListeners[eventName];
        if (handler) {
            eventListener[eventListener.indexOf(handler)] = false;
        } else {
            eventListener = [];
        }
    }

    /**
     * 触发事件
     * @param {String} eventName 事件名
     * @param {Object} [options] 事件参数
     * @return {Boolean} false 阻止冒泡
     * @chainable
     */
    triggerEvent(eventName, options) {
        if (!this.__eventListeners) {
            return true;
        }

        var listenersForEvent = this.__eventListeners[eventName];
        if (!listenersForEvent) {
            return true;
        }

        let rtn = true;
        for (var i = 0, len = listenersForEvent.length; i < len; i++) {
            if (typeof (listenersForEvent[i]) == "function") {
                let r = listenersForEvent[i](options || {});
                if (r === false) rtn = false;
            }
        }
        return rtn;
    }
}

export default EventTarget;
