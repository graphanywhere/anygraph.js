// const isBlank = /^(\s+)?$/

/**
 * Dom操作工具类
 * @class
 */
const DomUtil = {};

(function () {

    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") {
        return {};
    }

    /**
     * 获取Html对象
     * @param {String} id 
     * @returns Element
     */
    DomUtil.get = function (id) {
        return typeof id === 'string' ? document.getElementById(id) : id;
    }

    /**
     * 获取样式值
     * @param {Element} el 
     * @param {String} style 
     * @returns String 
     */
    DomUtil.getStyle = function (el, style) {
        let value = el.style[style];
        if ((!value || value === 'auto') && document.defaultView) {
            let css = document.defaultView.getComputedStyle(el, null);
            value = css ? css[style] : null;
        }
        return value === 'auto' ? null : value;
    }

    /**
     * 设置css样式
     * @param {Element} el 对象名称
     * @param {String} style 样式名称
     * @param {String} val 样式值
     */
    DomUtil.setStyle = function (el, style, val) {
        el.style[style] = val;
    }

    /**
     * 创建HTML对象
     * @param {String} tagName 
     * @param {String} className 
     * @param {Element} container 
     * @returns Element
     */
    DomUtil.create = function (tagName, className, container) {
        let el = document.createElement(tagName);
        if(className) el.className = className || '';

        if (container) {
            container.appendChild(el);
        }
        return el;
    }

    /**
     * 移除HTML对象
     * @param {Element} el 
     */
    DomUtil.remove = function (el) {
        let parent = el.parentNode;
        if (parent) {
            parent.removeChild(el);
        }
    }

    /**
     * 移除所有子对象
     * @param {Element} el 
     */
    DomUtil.empty = function (el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    /**
     * 移到最上面
     * @param {Element} el 
     */
    DomUtil.toFront = function (el) {
        let parent = el.parentNode;
        if (parent && parent.lastChild !== el) {
            parent.appendChild(el);
        }
    }

    /**
     * 移到最下面，也就是最先渲染，其他对象将会显示在该对象上面
     * @param {Element} el 
     */
    DomUtil.toBack = function (el) {
        let parent = el.parentNode;
        if (parent && parent.firstChild !== el) {
            parent.insertBefore(el, parent.firstChild);
        }
    }

    /**
     * 判断对象是否包含了某个class
     * @param {Element} el 
     * @param {String} name 
     * @returns boolean
     */
    DomUtil.hasClass = function (el, name) {
        if (el.classList !== undefined) {
            return el.classList.contains(name);
        }
        let className = DomUtil.getClass(el);
        return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    }

    /**
     * 给Html对象增加样式
     */
    DomUtil.addClass = function (el, name) {
        if (el.classList !== undefined) {
            let classes = __splitWords(name);
            for (let i = 0, len = classes.length; i < len; i++) {
                el.classList.add(classes[i]);
            }
        } else if (!DomUtil.hasClass(el, name)) {
            let className = DomUtil.getClass(el);
            DomUtil.setClass(el, (className ? className + ' ' : '') + name);
        }
    }

    /**
     * 移除Html对象样式
     * @param {Element} el 
     * @param {String} name
     */
    DomUtil.removeClass = function (el, name) {
        if (el.classList !== undefined) {
            el.classList.remove(name);
        } else {
            DomUtil.setClass(el, __trim((' ' + DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
        }
    }

    /**
     * 给Html对象设置样式
     * @param {Element} el 
     * @param {String} name
     */
    DomUtil.setClass = function (el, name) {
        if (el.className.baseVal === undefined) {
            el.className = name;
        } else {
            el.className.baseVal = name;
        }
    }

    /**
     * 获取Html对象样式
     * @param {Element} el 
     * @returns String
     */
    DomUtil.getClass = function (el) {
        if (el.correspondingElement) {
            el = el.correspondingElement;
        }
        return el.className.baseVal === undefined ? el.className : el.className.baseVal;
    }

    /*
     * 事件绑定
     * @examples: DomUtil.on(element, "mouseup", function(e){})
     */
    DomUtil.on = function (obj, types, fn, context) {
        if (types && typeof types === 'object') {
            for (let type in types) {
                __addOne(obj, type, types[type], fn, context);
            }
        } else {
            types = __splitWords(types);
            for (let i = 0, len = types.length; i < len; i++) {
                __addOne(obj, types[i], fn, context);
            }
        }
        return this;
    }

    let eventsKey = '_leaflet_events';

    /**
     * 取消事件绑定
     * @param {Element} obj 
     * @param {String} types 
     * @param {Function} fn 
     * @param {*} context 
     */
    DomUtil.off = function (obj, types, fn, context) {
        if (arguments.length === 1) {
            __batchRemove(obj);
            delete obj[eventsKey];
        } else if (types && typeof types === 'object') {
            for (let type in types) {
                __removeOne(obj, type, types[type], fn);
            }
        } else {
            types = __splitWords(types);
            if (arguments.length === 2) {
                __batchRemove(obj, function (type) {
                    return types.indexOf(type) !== -1;
                });
            } else {
                for (let i = 0, len = types.length; i < len; i++) {
                    __removeOne(obj, types[i], fn, context);
                }
            }
        }
        return this;
    }

    /**
     * 批量移除事件
     * @param {*} obj 
     * @param {*} filterFn 
     */
    function __batchRemove(obj, filterFn) {
        for (let id in obj[eventsKey]) {
            let type = id.split(/\d/)[0];
            if (!filterFn || filterFn(type)) {
                __removeOne(obj, type, null, null, id);
            }
        }
    }

    let mouseSubst = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout',
        wheel: !('onwheel' in window) && 'mousewheel'
    };

    function __addOne(obj, type, fn, context) {
        let id = type + __stamp(fn) + (context ? '_' + __stamp(context) : '');
        if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

        let handler = function (e) {
            return fn.call(context || obj, e || window.event);
        };
        let originalHandler = handler;

        if ('addEventListener' in obj) {
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
                obj.addEventListener(mouseSubst[type] || type, handler);
            } else if (type === 'mouseenter' || type === 'mouseleave') {
                handler = function (e) {
                    e = e || window.event;
                    if (isExternalTarget(obj, e)) {
                        originalHandler(e);
                    }
                };
                obj.addEventListener(mouseSubst[type], handler, false);
            } else {
                obj.addEventListener(type, originalHandler, false);
            }
        } else {
            obj.attachEvent('on' + type, handler);
        }
        obj[eventsKey] = obj[eventsKey] || {};
        obj[eventsKey][id] = handler;
    }

    function __removeOne(obj, type, fn, context, id) {
        id = id || type + __stamp(fn) + (context ? '_' + __stamp(context) : '');
        let handler = obj[eventsKey] && obj[eventsKey][id];
        if (!handler) { return this; }

        if ('removeEventListener' in obj) {
            obj.removeEventListener(mouseSubst[type] || type, handler, false);
        } else {
            obj.detachEvent('on' + type, handler);
        }
        obj[eventsKey][id] = null;
    }

    /**
     * 停止给定事件传播到父元素
     * @param {Event} e 
     */
    DomUtil.stopPropagation = function (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        } else if (e.originalEvent) {  // In case of Leaflet event.
            e.originalEvent._stopped = true;
        } else {
            e.cancelBubble = true;
        }
    }

    /**
     * 阻止DOM事件“ev”的默认操作发生
     * @param {Event} e 
     */
    DomUtil.preventDefault = function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }
    }

    /**
     * Does `stopPropagation` and `preventDefault` at the same time.
     * @param {Event} e 
     */
    DomUtil.stop = function (e) {
        this.preventDefault(e);
        this.stopPropagation(e);
    }

    function __splitWords(str) {
        return __trim(str).split(/\s+/);
    }
    function __trim(str) {
        return str.__trim ? str.__trim() : str.replace(/^\s+|\s+$/g, '');
    }
    let lastId = 0;
    function __stamp(obj) {
        if (!('_leaflet_id' in obj)) {
            obj['_leaflet_id'] = ++lastId;
        }
        return obj._leaflet_id;
    }
}());

export default DomUtil;
