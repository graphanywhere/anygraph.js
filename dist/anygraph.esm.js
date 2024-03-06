/**
  * 图形渲染基础类
 */
class RendererBase {
    constructor() {
        /**
         * 工作画板上下文
         */
        this._context = null;

        /**
         * 工作画板对象
         */
        this._canvas = null;

        // 点击拾取画布
        this._hitCanvas = null;
        this._hitContext = null;
        this._useHitCanvas = true;
    }

    /**
     * 初始化画板对象
     * @param {Size} size
     */
    initCanvas(size) {
        // 建立缓冲画板
        if (this._canvas === null) {
            this._canvas = document.createElement("canvas");
        }
        this._canvas.width = size.width;
        this._canvas.height = size.height;
        this._context = this._canvas.getContext("2d");
        this._context.clearRect(0, 0, size.width, size.height);

        // 建立点击拾取画板
        if (this._useHitCanvas === true) {
            if (this._hitCanvas === null) {
                this._hitCanvas = document.createElement("canvas");
            }
            this._hitCanvas.width = size.width;
            this._hitCanvas.height = size.height;
            this._hitContext = this._hitCanvas.getContext("2d", { "willReadFrequently": true });
            this._hitContext.clearRect(0, 0, size.width, size.height);
        } else {
            this._hitContext = null;
        }
    }

    /**
     * 获取当前图层的图形
     */
    getImage() {
        let ctx = this._context;
        return ctx ? ctx.canvas : null;
    }

    /**
     * 设置当前图形内容
     */
    setImage(img) {
        let ctx = this._context;
        ctx.drawImage(img, 0, 0);
    }

    /**
     * 点击拾取图形
     * @returns Canvas
     */
    getHitImage() {
        return this._hitCanvas;
    }

    /**
     * 获取视图尺寸
     * @returns size
     */
    getSize() {
        return {
            "width": this._canvas.width,
            "height": this._canvas.height
        };
    }

    /**
     * 清屏
     */
    clearScreen(ctx) {
        if (ctx == null) ctx = this._context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

/**
 * class工具类
 * @class
 */
const ClassUtil = {};

(function () {
    /**
     * 强制要求子类必须实现的抽象方法
     */
    ClassUtil.abstract = function () {
        throw new Error("未实现的抽象方法");
    };

    /**
     * 断言
     * @param {Boolean} assertion
     * @param {String} errorMessage
     * @param {int} errorCode
     */
    ClassUtil.assert = function (assertion, errorMessage, errorCode = 0) {
        if (!assertion) {
            throw new Error(errorMessage);
        }
    };

    /**
     * 对象克隆（深度克隆）
     * @param {Object} obj
     * @returns {Object} 克隆的对象
     */
    ClassUtil.clone = function (obj) {
        if (!obj || typeof (obj) !== 'object') return obj;
        var temp = new obj.constructor();
        for (var key in obj) {
            if (!obj[key] || typeof (obj[key]) !== 'object') {
                temp[key] = obj[key];
            } else {
                // clone sub-object
                temp[key] = this.clone(obj[key]);
            }
        }
        return temp;
    };

    /**
     * 复制对象, 使用JSON转字符串实现对象复制
     * @param {Object} obj
     * @returns {Object} 克隆的对象
     */
    ClassUtil.copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    /**
     * 判断数据类型
     * @param {*} data 
     * @returns String
     * @example
     * console.log(ClassUtil.typeof(1), typeof(1));                             // Number
     * console.log(ClassUtil.typeof("1"), typeof("1"));                         // String
     * console.log(ClassUtil.typeof(true), typeof(true));                       // Boolean
     * console.log(ClassUtil.typeof(null), typeof(null));                       // Null
     * console.log(ClassUtil.typeof(undefined), typeof(undefined));             // Undefined
     * console.log(ClassUtil.typeof(Symbol(1)), typeof(Symbol(1)));             // Symbol
     * console.log(ClassUtil.typeof({}), typeof({}));                           // Object
     * console.log(ClassUtil.typeof([]), typeof([]));                           // Array
     * console.log(ClassUtil.typeof(function () {}), typeof(function(){}));     // Function
     * console.log(ClassUtil.typeof(new Date()), typeof(new Date()));           // Date
     * console.log(ClassUtil.typeof(new RegExp()), typeof(new RegExp));         // RegExp
     */
    ClassUtil.typeof = function (data) {
        return Object.prototype.toString.call(data).slice(8, -1);
    };
}());

/**
 * 图层渲染类
 */
class LayerRenderer extends RendererBase {
    constructor() {
        super();
        this.layer = null;       
    }

    /**
     * 取图层
     */
    getLayer() {
        return this.layer;
    }

    /**
     * 设置图层
     * 初始化Layer对象时，将会调用此方法
     */
    setLayer(layer) {
        this.layer = layer;
    }

    /**
     * 渲染图形，各子类需重写此方法
     */
    composeBuffer(frameState) {
        ClassUtil.abstract();
    }
}

/**
 * 图层渲染状态
 */
const LayerRendererState = {
    IDLE: 0,
    RENDERING: 1,
    RENDERED: 2,
    ERROR: 3,
    EMPTY: 4,
    ABORT: 5
};

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

/**
 * 数学计算工具类
 * @class
 */
const MathUtil = {};

(function () {
    /**
     * 取某数的余数
     * @param {number} num 
     * @param {number} max 
     * @returns {number} wrap
     */
    MathUtil.wrap = function (num, max) {
        if (num < 0) {
            return max - -num % max
        }
        return num % max
    };

    /**
     * 根据b的符号返回a/b的模
     * @param {number} a Dividend.
     * @param {number} b Divisor.
     * @return {number} Modulo.
     */
    MathUtil.modulo = function (a, b) {
        const r = a % b;
        return r * b < 0 ? r + b : r;
    };

    /**
     * 计算a和b之间的x的线性插值
     * @param {number} a 开始值
     * @param {number} b 结束值
     * @param {number} x 插值系数.
     * @return {number} 插值.
     */
    MathUtil.lerp = function (a, b, x) {
        return a + x * (b - a);
    };

    /**
     * 获取指定范围内的数字
     * @param {number} value 数值.
     * @param {number} min 范围最小值.
     * @param {number} max 范围最大值.
     * @return {number} 指定范围内的数字，或与范围最接近的数字
     */
    MathUtil.clamp = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    };

    /**
     * 返回一个小数位数有限的数字(四舍五入到指定的小数位数) <br>
     * 例如：toFixed(10.465,2)的返回值为10.47, toFixed(10.995, 2)的返回值为11
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The input number with a limited number of decimal digits.
     */
    MathUtil.toFixed = function (n, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(n * factor) / factor;
    };

    /**
     * 先按小数位四舍五入,然后按四舍五入到整数, 例如 round(10.495, 2)的返回值为11
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The nearest integer.
     */
    MathUtil.round = function (n, decimals = 0) {
        return Math.round(this.toFixed(n, decimals));
    };

    /**
     * 先按小数位四舍五入,然后取整, 例如 round(10.995, 2)的返回值为11
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The next smaller integer.
     */
    MathUtil.floor = function (n, decimals = 0) {
        return Math.floor(this.toFixed(n, decimals));
    };

    /**
     * 只考虑给定的小数位数,将一个数字四舍五入到下一个较大的整数(最后一位四舍五舍五入)。
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The next bigger integer.
     */
    MathUtil.ceil = function (n, decimals = 0) {
        return Math.ceil(this.toFixed(n, decimals));
    };

    /**
     * 返回指定小数位数的数字
     * @param {number} number
     * @param {int} precision
     * @returns {number} number
     */
    MathUtil.toFloat = function (number, precision) {
        if (precision == null) {
            precision = 2;
        }
        if (typeof number !== "number") {
            number = parseFloat(number);
        }
        return precision === 0 ? number : parseFloat(number.toPrecision(precision));
    };

    /**
     * 将弧度转换为度
     * @param {number} angleInRadians 以弧度为单位的角度
     * @return {number} 角度（以度为单位）
     */
    MathUtil.toDegrees = function (angleInRadians) {
        return (angleInRadians * 180) / Math.PI;
    };

    /**
     * 将度数转换为弧度
     * @param {number} angleInDegrees 以度为单位的角度
     * @return {number} 角度（弧度）
     */
    MathUtil.toRadians = function (angleInDegrees) {
        return (angleInDegrees * Math.PI) / 180;
    };

    /**
     * 获取min和Max之间的随机整数
     * @param {number} min 
     * @param {number} max 
     * @returns {int} 随机数
     */
    MathUtil.getRandomNum = function (min, max) {
        let range = max - min;
        let rand = Math.random();
        return Math.floor(min + Math.round(rand * range));
    };

    /**
     * 获取长度为len的随机字符串
     * @param {int} len长度
     * @returns {string} 随机字符串
     */
    MathUtil.getRandomString = function (len) {
        len = len || 32;
        let chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz'; // 默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1
        let maxPos = chars.length;
        let pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    };
}());

// console.info(MathUtil.ceil(4.494123, 2));
// console.info(Math.ceil(4.445123));
// console.info(MathUtil.round(4.445123, 2));

/**
 * 矩阵变换类
 * transform(a, b, c, d, e, f)
 * a (m11) 水平方向的缩放
 * b (m12) 竖直方向的倾斜偏移
 * c (m21) 水平方向的倾斜偏移
 * d (m22) 竖直方向的缩放
 * e (dx)  水平方向的移动
 * f (dy)  竖直方向的移动
 */
class Transform {
    /**
     * 构造函数
     */
    constructor() {
    }

    /**
     * 创建Transform.
     * @return {Transform} 初始矩阵.
     */
    static create() {
        return [1, 0, 0, 1, 0, 0];
    }

    /**
     * 重置矩阵
     * @param {Transform} transform Transform.
     * @return {Transform} transform.
     */
    static reset(transform) {
        return this.set(transform, 1, 0, 0, 1, 0, 0);
    }

    /**
     * 给矩阵赋值
     * @return {Transform} 重新赋值的矩阵，同时也将改变目标矩阵的值.
     */
    static set(transform, a, b, c, d, e, f) {
        transform[0] = a;
        transform[1] = b;
        transform[2] = c;
        transform[3] = d;
        transform[4] = e;
        transform[5] = f;
        return transform;
    }

    /**
     * 将两个变换的基础矩阵相乘，并返回第一个变换的结果。
     * @param {Transform} transform1 矩阵1.
     * @param {Transform} transform2 矩阵2.
     * @return {Transform} 变换的结果，同时也将改变目标矩阵的值.
     */
    static multiply(transform1, transform2) {
        let [a1, b1, c1, d1, e1, f1] = transform1;
        let [a2, b2, c2, d2, e2, f2] = transform2;

        transform1[0] = a1 * a2 + c1 * b2;
        transform1[1] = b1 * a2 + d1 * b2;
        transform1[2] = a1 * c2 + c1 * d2;
        transform1[3] = b1 * c2 + d1 * d2;
        transform1[4] = a1 * e2 + c1 * f2 + e1;
        transform1[5] = b1 * e2 + d1 * f2 + f1;

        return transform1;
    }

    /**
     * 将一个矩阵的值赋予另一个矩阵
     * @param {Transform} transform1 目标矩阵.
     * @param {Transform} transform2 原矩阵.
     * @return {Transform} 返回新的矩阵，同时也将改变目标矩阵的值.
     */
    static setFromArray(transform1, transform2) {
        transform1[0] = transform2[0];
        transform1[1] = transform2[1];
        transform1[2] = transform2[2];
        transform1[3] = transform2[3];
        transform1[4] = transform2[4];
        transform1[5] = transform2[5];
        return transform1;
    }

    /**
     * 使用矩阵变换坐标的值。
     * @param {Transform} transform 变换矩阵.
     * @param {Array} coordinate 原坐标，格式为[[x,y],[x,y],[x,y],[x,y],[x,y],……].
     * @param {Boolean} precision 返回值是否保留小数.
     * @return {Array} 返回变换之后的坐标
     */
    static applys(transform, coordinates, precision = true) {
        let dest = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coordinates)) {
            if (coordinates.length === 2 && !Array.isArray(coordinates[0])) {
                return this.apply(transform, coordinates, precision);
            } else {
                for (let i = 0, ii = coordinates.length; i < ii; i++) {
                    dest.push(this.applys(transform, coordinates[i], precision));
                }
                return dest;
            }
        } else {
            console.error("coordinates is error", coordinates);
        }
    }

    /**
     * 使用矩阵变换坐标的值。
     * @param {Transform} transform 变换矩阵.
     * @param {Array} coordinate 原坐标，格式为[x,y].
     * @param {Boolean} precision 返回值是否保留小数.
     * @return {Array} 返回变换之后的坐标
     */
    static apply(transform, coordinates, precision = true) {
        let dest = [];
        let x = coordinates[0], y = coordinates[1];
        dest[0] = transform[0] * x + transform[2] * y + transform[4];
        dest[1] = transform[1] * x + transform[3] * y + transform[5];
        if (precision === true || precision == null) {
            dest[0] = MathUtil.toFixed(dest[0], 6);
            dest[1] = MathUtil.toFixed(dest[1], 6);
        } else {
            dest[0] = MathUtil.toFixed(dest[0], 2);
            dest[1] = MathUtil.toFixed(dest[1], 2);
        }
        return dest;
    }

    /**
     * 在矩阵中增加旋转量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} angle 旋转角度（弧度）.
     * @return {Transform} 旋转后的矩阵.
     */
    static rotate(transform, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, cos, sin, -sin, cos, 0, 0));
    }

    static rotateAtOrigin(transform, angle, origin = [0, 0]) {
        this.translate(transform, origin[0], origin[1]);
        this.rotate(transform, angle);
        this.translate(transform, -origin[0], -origin[1]);
    }

    /**
     * 在矩阵中增加缩放量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} x 水平方向缩放倍数.
     * @param {number} y 垂直方向缩放倍数.
     * @return {Transform} 缩放后的矩阵.
     */
    static scale(transform, sx, sy = sx) {
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, sx, 0, 0, sy, 0, 0));
    }

    /**
     * 在矩阵中增加错切量
     * @param {*} transform 
     * @param {*} sx 水平方向错切量.
     * @param {*} sy 垂直方向错切量.
     * @returns {Transform} 错切后的矩阵.
     */
    static skew(transform, sx, sy) {
        var m11 = transform[0] + transform[2] * sy;
        var m12 = transform[1] + transform[3] * sy;
        var m21 = transform[2] + transform[0] * sx;
        var m22 = transform[3] + transform[1] * sx;
        transform[0] = m11;
        transform[1] = m12;
        transform[2] = m21;
        transform[3] = m22;
        return transform;
    }

    /**
     * 在矩阵中增加平移量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} dx 水平方向平移量.
     * @param {number} dy 垂直方向平移量.
     * @return {Transform} 平移后的矩阵.
     */
    static translate(transform, dx, dy) {
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, 1, 0, 0, 1, dx, dy));
    }

    /**
     * 反转给定的变换
     * @param {Transform} transform Transform.
     * @return {Transform} Inverse of the transform.
     */
    static invert(transform) {
        let det = this.determinant(transform);
        ClassUtil.assert(det !== 0, 32); // Transformation matrix cannot be inverted

        let [a, b, c, d, e, f] = transform;
        transform[0] = d / det;
        transform[1] = -b / det;
        transform[2] = -c / det;
        transform[3] = a / det;
        transform[4] = (c * f - d * e) / det;
        transform[5] = -(a * f - b * e) / det;
        return transform;
    }

    /**
     * 在给定目标坐标系点（初始平移）、缩放、旋转和源坐标系点（最终平移）的情况下创建合成变换。
     * @param {Transform} transform 引用的矩阵.
     * @param {number} dx1 目标坐标系点X坐标.
     * @param {number} dy1 目标坐标系点Y坐标.
     * @param {number} sx Scale factor x.
     * @param {number} sy Scale factor y.
     * @param {number} angle 旋转角度
     * @param {number} dx2 源坐标系点X坐标.
     * @param {number} dy2 源坐标系点Y坐标.
     * @return {Transform} 坐标系转换矩阵.
     */
    static compose(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        transform[0] = sx * cos;
        transform[1] = sy * sin;
        transform[2] = -sx * sin;
        transform[3] = sy * cos;
        transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
        transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
        return transform;
    }

    /**
     * 返回给定矩阵的行列式.
     * 行列式可以表达矩阵缩放倍率的平方
     * @param {Transform} transform 矩阵.
     * @return {number} 行列式.
     */
    static determinant(transform) {
        return transform[0] * transform[3] - transform[1] * transform[2];
    }

    /**
     * 取旋转角度
     * @param {Transform} transform 
     * @returns {number} angle.
     */
    static getRotationAngle(transform) {
        return MathUtil.toDegrees(Math.atan2(transform[1], transform[3]));
    }

    /**
     * 取缩放倍率，
     * 行列式可以表达 矩阵缩放倍率的平方，当x轴和y轴的缩放倍率相同时，可以通过行列式计算缩放倍率
     * 但是，x或y出现翻转时，行列式的值为负值，例如d=-1表示垂直翻转
     */
    static getScale(transform) {
        return Math.sqrt(Math.abs(transform[0] * transform[3] - transform[1] * transform[2]));
    }

    /**
     * 转换为字符串
     * @param {Transform} transform
     * @return string
     */
    static toString(transform) {
        const transformString = 'matrix(' + transform.join(', ') + ')';
        return transformString;
    }

    /**
     * 生成坐标变换对象
     * @param {Array} transData 
     * [{"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *  {"action":"scale", "value":[2, 2]}, 
     *  {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}]
     * @returns transform
     */
    static createByData(transData) {
        let trans = Transform.create();
        //let angle = 0;
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let prop = transData[i];
                if (prop.action == "translate") {
                    Transform.translate(trans, prop.value[0], prop.value[1]);
                } else if (prop.action === "rotate") {
                    Transform.rotateAtOrigin(trans, MathUtil.toRadians(prop.value), prop.origin);
                    //angle += prop.value;
                } else if (prop.action === "scale") {
                    Transform.scale(trans, prop.value[0], prop.value[1]);
                } else if (prop.action == "matrix") {
                    Transform.multiply(trans, prop.value);
                }
            }
        }
        return trans;
    }
}

/**
 * 边界坐标范围处理类
 * 注意：屏幕坐标系(左上角、右下角)的设定：x正方向为自左向右，y正方向为自上向下，常规笛卡尔坐标系(左下角、右上角)与屏幕坐标系y方向相反
 */
class Extent {
    /**
     * 创建包络矩形
     * @param {number} xmin - x方向最小值
     * @param {number} ymin - y方向最小值
     * @param {number} xmax - x方向最大值
     * @param {number} ymax - y方向最大值
     */
    constructor(xmin, ymin, xmax, ymax) {
        this.extent = [xmin, ymin, xmax, ymax];
    }

    /**
     * 获取边界范围值
     * @returns Extent 边界范围值
     */
    getExtent() {
        return this.extent;
    }

    /**
     * 建立一个边界范围对象
     * @param {number} xmin - x方向最小值
     * @param {number} ymin - y方向最小值
     * @param {number} xmax - x方向最大值
     * @param {number} ymax - y方向最大值
     * @returns Extent 边界范围值
     */
    static create(xmin, ymin, xmax, ymax) {
        return [xmin, ymin, xmax, ymax];
    }

    /**
     * 建立一个空的边界范围对象
     * @returns Extent 边界范围值
     */
    static createEmpty() {
        return [Infinity, Infinity, -Infinity, -Infinity];
    }

    /**
     * 是否为边界范围对象
     * @param {Extent} extent
     * @returns Boolean
     */
    static isExtent(extent) {
        if (typeof (extent) === "object" && extent.length === 4) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 两个范围是否相等
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Boolean
     */
    static equal(extent1, extent2) {
        return (extent1 != null && extent2 != null && extent1.length == extent2.length && extent1[0] == extent2[0] && extent1[1] == extent2[1] && extent1[2] == extent2[2] && extent1[3] == extent2[3]);
    }

    /**
     * 是否为空
     * @param {Extent} extent
     * @returns Boolean
     */
    static isEmpty(extent) {
        return (extent == null) || (extent[2] < extent[0] && extent[3] < extent[1]);
    }

    /**
     * 返回两个extent的bbox
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Extent 边界范围值
     */
    static merge(extent1, extent2) {
        return [
            extent1[0] < extent2[0] ? extent1[0] : extent2[0],
            extent1[1] < extent2[1] ? extent1[1] : extent2[1],
            extent1[2] > extent2[2] ? extent1[2] : extent2[2],
            extent1[3] > extent2[3] ? extent1[3] : extent2[3]
        ]
    }

    /**
     * 计算中心点
     * @param {Extent} extent
     * @returns 中心点坐标
     */
    static getCenter(extent) {
        let center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        return center;
    }

    /**
     * 计算宽度
     * @param {Extent} extent
     * @returns width
     */
    static getWidth(extent) {
        return extent[2] - extent[0];
    }

    /**
     * 计算高度
     * @param {Extent} extent
     * @returns height
     */
    static getHeight(extent) {
        return extent[3] - extent[1];
    }

    /**
     * 计算宽高
     * @param {Extent} extent
     * @returns [width, height]
     */
    static getSize(extent) {
        return { "width": Math.abs(extent[2] - extent[0]), "height": Math.abs(extent[3] - extent[1]) };
    }

    /**
     * 计算面积
     * @param {Extent} extent
     * @returns 面积
     */
    static getArea(extent) {
        let area = 0;
        if (!this.isEmpty(extent)) {
            area = this.getWidth(extent) * this.getHeight(extent);
        }
        return area;
    }

    /**
     * 计算缓冲区范围
     * @param {Extent} extent
     * @param {number} value 
     * @returns Extent 边界范围值
     */
    static buffer(extent, value) {
        return [extent[0] - value, extent[1] - value, extent[2] + value, extent[3] + value];
    }

    /**
     * 判断点是否在空间范围内
     * @param {Extent} extent
     * @param {Coord} point 
     * @returns Boolean
     */
    static containsXY(extent, point) {
        return extent[0] <= point[0] && point[0] <= extent[2] && extent[1] <= point[1] && point[1] <= extent[3];
    }

    /**
     * 判断extent2是否在extent1内
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Boolean
     */
    static containsExtent(extent1, extent2) {
        return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] && extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
    }

    /**
     * 判断两个空间范围是否相交
     * @param {*} extent1 
     * @param {*} extent2 
     * @returns Boolean
     */
    static intersects(extent1, extent2) {
        return extent1[0] <= extent2[2] && extent1[2] >= extent2[0] && extent1[1] <= extent2[3] && extent1[3] >= extent2[1];
    }

    /**
     * 计算以中心点缩放后的空间范围
     * @param {Extent} extent
     * @param {number} scale 倍率
     * @returns Extent 边界范围值
     */
    static scaleFromCenter(extent, scale) {
        let size = this.getSize(extent);
        const deltaX = size.width * (scale - 1);
        const deltaY = size.height * (scale - 1);
        let x1 = extent[0] - deltaX * 0.5;
        let x2 = extent[2] + deltaX * 0.5;
        let y1 = extent[1] - deltaY * 0.5;
        let y2 = extent[3] + deltaY * 0.5;
        return [MathUtil.toFixed(x1, 2), MathUtil.toFixed(y1, 2), MathUtil.toFixed(x2, 2), MathUtil.toFixed(y2, 2)];
    }

    /**
     * 计算以指定点缩放的空间范围 （point必须在extent范围内）
     * @param {Extent} extent
     * @param {number} scale 
     * @param {Coord} point 
     * @returns Extent 边界范围值
     */
    static scaleFromPoint(extent, scale, point) {
        let size = this.getSize(extent);
        const deltaX = size.width * (scale - 1);
        const deltaY = size.height * (scale - 1);
        let x1 = extent[0] - deltaX * (point[0] - extent[0]) / size.width;
        let x2 = extent[2] + deltaX * (extent[2] - point[0]) / size.width;
        let y1 = extent[1] - deltaY * (point[1] - extent[1]) / size.height;
        let y2 = extent[3] + deltaY * (extent[3] - point[1]) / size.height;
        return [MathUtil.toFixed(x1, 2), MathUtil.toFixed(y1, 2), MathUtil.toFixed(x2, 2), MathUtil.toFixed(y2, 2)];
    }

    /**
     * 取左上角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getTopLeft(extent) {
        return [extent[0], extent[3]];
    }

    /**
     * 取右上角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getTopRight(extent) {
        return [extent[2], extent[3]];
    }

    /**
     * 取左下角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getBottomLeft(extent) {
        return [extent[0], extent[1]];
    }

    /**
     * 取右下角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getBottomRight(extent) {
        return [extent[2], extent[1]];
    }

    /**
     * 转换为多边形坐标
     * @param {Extent} extent
     * @returns [coord1, coord2, coord3, coord4, coord5]
     */
    static getPolygonCoords(extent) {
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];
        const coords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];
        return coords;
    }
}

/**
 * 坐标等比例变换处理类
 */
class Ratio {
    constructor() {
        /**
         * 画板大小
         */
        this.canvasExtent_;

        /**
         * 坐标范围
         */
        this.worldExtent_;

        /**
         * 两个坐标系原点是否相同, (地理坐标系false，0点在左下, 屏幕坐标系true，0点在左上)
         */
        this.sameOrigin_ = false;
    }

    getScale() {
        return Extent.getWidth(this.canvasExtent_) / Extent.getWidth(this.worldExtent_);
    }

    /**
     * 设置画板尺寸
     * @param {Size} size 
     */
    setCanvasSize(size) {
        this.canvasExtent_ = [0, 0, size.width, size.height];
    }

    /**
     * 设置画板范围
     * @param {Extent} extent
     */
    setCanvasExtent(extent) {
        this.canvasExtent_ = extent;
    }

    /**
     * 设置世界坐标范围
     * @param {Extent} extent
     */
    setWorldExtent(extent) {
        this.worldExtent_ = extent;
    }

    /**
     * 设置坐标原点是否与屏幕原点一致
     * @example 地理坐标系false，0点在左下, 屏幕坐标系true，0点在左上
     * @param {Boolean} val 
     */
    setWorldExtentOrigin(val) {
        this.sameOrigin_ = (val === true);
    }

    /**
     * 坐标变换
     * @param {Coord} originalCoord  原坐标值，其格式为[x,y]或[[x,y],[x,y]]
     * @param {Extent} originalExtent 原坐标范围
     * @param {Extent} destExtent     目标坐标范围
     * @param {Boolean} precision 返回值是否保留小数
     * @returns {Coord} flatCoords 目标坐标值，其格式为[x,y]
     */
    convert(originalCoord, originalExtent, destExtent, options = {}, precision = false) {
        if (originalExtent == null) throw new Error("originalExtent is null");
        if (destExtent == null) throw new Error("destExtent is null");
        if(options.correct == null) options.correct = true;
        if(options.sameOrigin == null) options.sameOrigin = false;

        if (options.correct) {
            destExtent = correctExtent(destExtent, originalExtent);
        }

        let originalWidth = Math.abs(originalExtent[2] - originalExtent[0]);
        let originalHeight = Math.abs(originalExtent[3] - originalExtent[1]);
        let destWidth = Math.abs(destExtent[2] - destExtent[0]);
        let destHeight = Math.abs(destExtent[3] - destExtent[1]);

        // 分辨率
        let resX = destWidth / originalWidth;
        let resY = destHeight / originalHeight;

        if (Array.isArray(originalCoord[0])) {
            let flatCoords = [];
            for (let i = 0; i < originalCoord.length; i++) {
                flatCoords.push(this.convert(originalCoord[i], originalExtent, destExtent, options, precision));
            }
            return flatCoords;
        } else {
            if(originalCoord[0] == null || originalCoord[1] == null) {
                return [null, null];
            }
            let destX = resX * (originalCoord[0] - originalExtent[0]) + destExtent[0];
            let destY;
            if (options.sameOrigin === true) {
                destY = resY * (originalCoord[1] - originalExtent[1]) + destExtent[1];
            } 
            // Y轴翻转
            else {
                destY = destExtent[3] - resY * (originalCoord[1] - originalExtent[1]);
            }
            if (precision == true) {
                return [destX, destY];
            } else {
                //return [destX == null ? null : Math.floor(destX), destY == null ? null : Math.floor(destY)];
                return [destX == null ? null : Math.round(destX), destY == null ? null : Math.round(destY)];
            }
        }
    }

    // // openlayer 2.13 
    // getLocalXY (point) {
    //     var resolution = this.getResolution();
    //     var extent = this.extent;
    //     var x = ((point.x - this.featureDx) / resolution + (-extent.left / resolution));
    //     var y = ((extent.top / resolution) - point.y / resolution);
    //     return [x, y];
    // }

    /**
     * 屏幕坐标转世界坐标
     * @param {Coord} pixArray 
     * @returns Coord flatCoords
     */
    toWorld(pixArray, precision = true) {
        return this.convert(pixArray, this.canvasExtent_, this.worldExtent_, { correct: true, sameOrigin: this.sameOrigin_ }, precision);
    }

    /**
     * 世界坐标转屏幕坐标
     * @param {Coord} coordArray 
     * @returns Coord flatCoords
     */
    toPix(coordArray, precision = false) {
        return this.convert(coordArray, this.worldExtent_, this.canvasExtent_, { correct: true, sameOrigin: this.sameOrigin_ }, precision);
    }
}

/**
 * 按originalExtent宽高比矫正extent
 * @param {Extent} extent
 * @param {Extent} originalExtent
 * @returns Extent 边界范围值
 */
function correctExtent(extent, originalExtent) {
    let osize = Extent.getSize(originalExtent);
    if (osize.width == 0 || osize.height == 0) {
        return [extent[0], extent[1], extent[2], extent[3]];
    }
    let nsize = Extent.getSize(extent);

    // 按屏幕的宽高比，矫正extent的宽高比
    if (MathUtil.toFixed(osize.width / osize.height, 2) == MathUtil.toFixed(nsize.width / nsize.height, 2)) ; else if (osize.width / osize.height < nsize.width / nsize.height) {
        let newWidth = osize.width / osize.height * nsize.height;
        extent[0] = extent[0] - (newWidth - nsize.width) / 2;
        extent[2] = extent[2] + (newWidth - nsize.width) / 2;
    } else {
        let newHeight = nsize.width / osize.width * osize.height;
        if (extent[1] < extent[3]) {
            extent[1] = extent[1] - (newHeight - nsize.height) / 2;
            extent[3] = extent[3] + (newHeight - nsize.height) / 2;
        } else {
            extent[1] = extent[1] + (newHeight - nsize.height) / 2;
            extent[3] = extent[3] - (newHeight - nsize.height) / 2;
        }
    }
    return [extent[0], extent[1], extent[2], extent[3]];
}

/**
 * 测量算法类
 */
class Measure {
    constructor() {
    }

    /**
     * 返回点p1(x1,y1)和p2(x2,y2)之间距离
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} distance.
     */
    static dist(p1, p2) {
        if (arguments.length === 1) {
            if (Array.isArray(p1)) {
                let dist_ = 0;
                for (let i = 1, ii = p1.length; i < ii; i++) {
                    dist_ += Math.sqrt(this.dist2(p1[i - 1], p1[i]));
                }
                return dist_;
            } else {
                return NaN;
            }
        } else {
            return Math.sqrt(this.dist2(p1, p2));
        }
    }

    /**
     * 返回点p1(x1,y1)和p2(x2,y2)之间距离的平方。
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} Squared distance.
     */
    static dist2(p1, p2) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    }

    /**
     * 计算两点与X轴夹角的角度
     * @param {*} p1
     * @param {*} p2
     * @returns {number} 角度
     */
    static calcAngle(p1, p2) {
        // return MathUtil.toFixed(MathUtil.toDegrees(Math.atan2(p2.y - p1.y, p2.x - p1.x)), 2);
        return MathUtil.toFixed(MathUtil.toDegrees(Math.atan2(p2[1] - p1[1], p2[0] - p1[0])), 2);
    }

    /**
     * 返回点p[x,y]和线段(p1[x1,y1], p2[x2,y2])之间最接近距离。
     * @param {Array} p[x, y]
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} distance.
     * 参考：
     * https://www.bilibili.com/read/cv17169956/
     * https://blog.csdn.net/lee371042/article/details/101214204
     */
    static distToSegment(p, p1, p2) {
        // 计算线段两端点的差值
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
    
        // 如果dx和dy都不等于0, p1p2是一个线段，否则p1p2为同一个点
        if (dx !== 0 || dy !== 0) {
            // 计算p到线段p1p2的投影点 在线段上的相对位置t
            const t = ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                // 如果t大于1，说明投影在线段p1p2外，此时将p1设置为p2
                p1[0] = p2[0];
                p1[1] = p2[1];
            } else if (t > 0) {
                // 如果t大于0且小于等于1，说明投影点在线段p1p2上，此时将p1设置为投影点的坐标
                p1[0] += dx * t;
                p1[1] += dy * t;
            }
        }
    
        // 计算并返回两点之间的距离
        return this.dist(p, p1);
    }

    /**
     * 判断两条线段是否相交
     * @param {*} p0 
     * @param {*} p1 
     * @param {*} p2 
     * @param {*} p3 
     * @returns Boolean
     */
    static line_intersects(p0, p1, p2, p3) {
        let s1_x, s1_y, s2_x, s2_y;
        s1_x = p1[0] - p0[0];
        s1_y = p1[1] - p0[1];
        s2_x = p3[0] - p2[0];
        s2_y = p3[1] - p2[1];

        let s, t;
        s = (-s1_y * (p0[0] - p2[0]) + s1_x * (p0[1] - p2[1])) / (-s2_x * s1_y + s1_x * s2_y);
        t = (s2_x * (p0[1] - p2[1]) - s2_y * (p0[0] - p2[0])) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            // Collision detected
            return true;
        } else {
            return false; // No collision
        }
    }

    /**
     * 计算线段上最接近坐标的点。
     * 当垂足在线段上时，坐标到线段的垂足的距离，或者当垂足在线段外部时，离线段最近的线段坐标。
     * @param {Coordinate} coords The coords.
     * @param {Array<Coordinate>} segment The two coords of the segment.
     * @return {Coordinate} The foot of the perpendicular of the coords to the segment.
     * 如果给定点在线段上，那么垂足就是该点本身，因为它直接位于线段上。这个点是垂直于给定坐标线与线段相交的点。
     * 然而，如果给定点在线段外部，垂足可能不在线段上。在这种情况下，线段上离给定坐标最近的点被视为“垂足”。这个点是线段上离给定坐标最近的点，可以通过将从线段一个端点到给定坐标的向量投影到线段上来找到。
     * 在这两种情况下，结果都是在线段上或最接近线段的点，该点通过垂直线与给定坐标相连。这个概念在几何、计算机图形学和工程等领域都非常有用。
     */
    static closestOnSegment(coords, segment) {
        let [x0, y0] = [coords[0], coords[1]];
        let [x1, y1] = [segment[0][0], segment[0][1]];
        let [x2, y2] = [segment[1][0], segment[1][1]];
        let dx = x2 - x1;
        let dy = y2 - y1;
        let along = (dx === 0 && dy === 0) ? 0 : (dx * (x0 - x1) + dy * (y0 - y1)) / (dx * dx + dy * dy || 0);
        let x, y;
        if (along <= 0) {
            x = x1;
            y = y1;
        } else if (along >= 1) {
            x = x2;
            y = y2;
        } else {
            x = x1 + along * dx;
            y = y1 + along * dy;
        }
        return [x, y];
    }

    /**
     * 计算圆上最接近坐标的点。
     * @param {Coordinate} coords The coords.
     * @param {Circle} circle The circle.
     * @return {Coordinate} Closest point on the circumference.
     */
    static closestOnCircle(coords, circle) {
        let r = circle.getRadius();
        let center = circle.getCenter();
        let [x0, y0] = [center[0], center[1]];
        let [x1, y1] = [coords[0], coords[1]];
        let dx = x1 - x0;
        let dy = y1 - y0;
        if (dx === 0 && dy === 0) {
            dx = 1;
        }
        let d = Math.sqrt(dx * dx + dy * dy);
        let x = x0 + (r * dx) / d;
        let y = y0 + (r * dy) / d;
        return [x, y];
    }

    /**
     * 多边形计算面积
     * @param {Array} coords 多边形顶点坐标数组
     * https://blog.csdn.net/xza13155/article/details/112118676
     * https://zhuanlan.zhihu.com/p/612991648
     */
    static getArea(coords) {
        // 多边形面积换算公式
        // S = Math.abs(0.5 * (x1 * y2 - y1 * x2 + x2 * y3 - y2 * x3 +….+ xn * y1 - yn * x1)));
        let area = 0;
        for (let i = 2; i < coords.length; i++) {
            let ax = coords[i - 1][0] - coords[0][0];
            let bx = coords[i - 1][1] - coords[0][1];
            let cx = coords[i][0] - coords[0][0];
            let dx = coords[i][1] - coords[0][1];
            // 三角形面积公式
            // S = 0.5 * (ax * dx - cx * bx);
            area += 0.5 * (ax * dx - cx * bx);
        }        //顺时针为正，逆时针为负
        return Math.abs(area);
    }

    /**
     * 计算折线长度
     * @param {Array} coords 折线点坐标数组
     */
    static getLength(coords) {
        let length = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            length += this.dist(coords[i], coords[i + 1]);
        }
        return length;
    }

    /**
     * 计算折线中最长的一段线段
     * @param {Array} coords 折线点坐标数组
     */
    static getMaxLenSegment(coords) {
        let maxlength = 0;
        let maxlength_segment = -1;
        for (let i = 0; i < coords.length - 1; i++) {
            let length = this.dist(coords[i], coords[i + 1]);
            if (length > maxlength) {
                maxlength = length;
                maxlength_segment = i;
            }
        }        return maxlength_segment;
    }

    // static GK_ANGLE_2D(x1, y1, x2, y2) {
    //     return Math.atan2((y1) - (y2), (x1) - (x2));
    // }

    // static GK_ANGLE_2DV(vtx1, vtx2) {
    //     return this.GK_ANGLE_2D((vtx1)[0], (vtx1)[1], (vtx2)[0], (vtx2)[1]);
    // }

    /**
     * 求折线上位于总长ratio处的一点out，并可同时求出out处的角度angle
     */
    static solveRatioPointOnPolyline(ratio, vtxp) {
        let d, t, x, y, dist;
        let i;
        let retval = {};

        if (ratio < 0.0 || ratio > 1.0 || vtxp.length < 2) return null;

        if (Math.abs(ratio) < 0.0001) {
            retval.out = vtxp[0];
            retval.angle = this.calcAngle(vtxp[1], vtxp[0]);
            retval.index = 0;
            return retval;
        }
        if (Math.abs(ratio - 1.0) < 0.0001) {
            let num = vtxp.length;
            retval.out = vtxp[num - 1];
            retval.angle = this.calcAngle(vtxp[num - 1], vtxp[num - 2]);
            retval.index = num - 2;
            return retval;
        }
        dist = this.getLength(vtxp) * ratio;
        d = 0.0;
        for (i = 1; i < vtxp.length; i++) {
            x = vtxp[i][0] - vtxp[i - 1][0];
            y = vtxp[i][1] - vtxp[i - 1][1];
            t = this.dist(vtxp[i], vtxp[i - 1]);
            if (d < dist && dist <= d + t) break;

            d += t;
        }
        ratio = (dist - d) / t;
        retval.out = [vtxp[i - 1][0] + ratio * x, vtxp[i - 1][1] + ratio * y];
        retval.angle = this.calcAngle(vtxp[i], vtxp[i - 1]);
        retval.index = i - 1;
        return retval;
    }

}

/**
 * 碰撞检测
 * Repo: https://github.com/bmoren/p5.2D/
 * Some functions and code modified version from http://www.jeffreythompson.org/collision-detection
 */
class Collide {
    constructor() {
        this._Debug = false;
    }

    static debug(debugMode) {
        _Debug = debugMode;
    }

    /**
     * 判断点与点是否碰撞
     * @param {Point} point1 {x, y}
     * @param {Point} point2 {x, y}
     * @param {float} buffer 容差
     * @returns boolean
     */
    static pointPoint(point1, point2, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }
        if (Measure.dist([point1.x, point1.y], [point2.x, point2.y]) <= buffer) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与圆是否碰撞
     * @param {Point} point {x, y}
     * @param {Circle} circle {x, y, radius}
     * @returns boolean
     */
    static pointCircle(point, circle) {
        if (Measure.dist([point.x, point.y], [circle.x, circle.y]) <= circle.radius) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与椭圆是否碰撞
     * @param {Point} point {x, y}
     * @param {Ellipse} ellipse {x, y, radiusX, radiusY}
     * @returns boolean
     */
    static pointEllipse(point, ellipse) {
        // 粗略判断，排除Bounding Box之外的点
        if (point.x > ellipse.x + ellipse.radiusX || point.x < ellipse.x - ellipse.radiusX ||
            point.y > ellipse.y + ellipse.radiusY || point.y < ellipse.y - ellipse.radiusY) {
            return false;
        }
        // 将该点与其椭圆上的等效点进行比较
        let xx = point.x - ellipse.x,
            yy = point.y - ellipse.y;
        let eyy = Math.sqrt(Math.abs(ellipse.radiusX * ellipse.radiusX - xx * xx)) * ellipse.radiusY / ellipse.radiusX;
        return yy <= eyy && yy >= -eyy;
    }

    /**
     * 判断点与矩形是否碰撞
     * @param {*} point {x, y}
     * @param {*} rect {x, y, width, height}
     * @returns boolean
     */
    static pointRect(point, rect) {
        if (point.x >= rect.x && point.x <= rect.x + rect.width &&    // X坐标大于等于矩形的起点X坐标，小于等于矩形的起点X坐标加上矩形宽度
            point.y >= rect.y && point.y <= rect.y + rect.height) {   // Y坐标大于等于矩形的起点Y坐标，小于等于矩形的起点Y坐标加上矩形高度
            return true;
        }
        return false;
    }

    /**
     * 判断点与线段是否碰撞
     * @param {*} point {x, y}
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} buffer 容差
     * @returns boolean
     */
    static pointLine(point, line, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }

        // 计算点与线段的两个端点之间的距离
        let d1 = Measure.dist([point.x, point.y], [line.x1, line.y1]);
        let d2 = Measure.dist([point.x, point.y], [line.x2, line.y2]);

        // 计算线段长度
        let lineLen = Measure.dist([line.x1, line.y1], [line.x2, line.y2]);

        // 如果点与线段的两个端点之间的距离之和等于线的长度，则可判断点与线相交
        if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与三角形是否碰撞
     * @param {*} point {x, y}
     * @param {*} triangle {x1, y1, x2, y2, x3, y3}
     * @param {*} buffer 
     * @returns boolean
     */
    static pointTriangle(point, triangle) {

        // get the area of the triangle
        let areaOrig = Math.abs((triangle.x2 - triangle.x1) * (triangle.y3 - triangle.y1) - (triangle.x3 - triangle.x1) * (triangle.y2 - triangle.y1));

        // get the area of 3 triangles made between the point and the corners of the triangle
        let area1 = Math.abs((triangle.x1 - point.x) * (triangle.y2 - point.y) - (triangle.x2 - point.x) * (triangle.y1 - point.y));
        let area2 = Math.abs((triangle.x2 - point.x) * (triangle.y3 - point.y) - (triangle.x3 - point.x) * (triangle.y2 - point.y));
        let area3 = Math.abs((triangle.x3 - point.x) * (triangle.y1 - point.y) - (triangle.x1 - point.x) * (triangle.y3 - point.y));

        // if the sum of the three areas equals the original, we're inside the triangle!
        if (area1 + area2 + area3 === areaOrig) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与圆弧是否碰撞(bug)
     * @param {*} point {x, y}
     * @param {*} arc {x, y, radius, heading, angle }
     * @param {*} buffer 
     * @returns boolean
     */
    static pointArc(point, arc, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }
        // point
        let pointA = this.createVector(point.x, point.y);
        // arc center point
        let arcPos = this.createVector(arc.x, arc.y);
        // arc radius vector
        let radius = this.createVector(arc.radius, 0).rotate(arc.heading);

        let pointToArc = pointA.copoint.y().sub(arcPos);
        if (pointA.dist(arcPos) <= (arc.radius + buffer)) {
            let dot = radius.dot(pointToArc);
            let angle = radius.angleBetween(pointToArc);
            if (dot > 0 && angle <= arc.angle / 2 && angle >= -arc.angle / 2) {
                return true;
            }
        }
        return false;
    }

    /**
     * 判断点与多边形是否碰撞
     * https://blog.csdn.net/tom_221x/article/details/51861129
     * @param {*} point {x, y}
     * @param {*} polygon [[x,y],[x,y],[x,y]]
     * @returns Boolean
     */
    static pointPoly(point, polygon) {
        let collision = false;

        // 遍历多边形的每一条边
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // 当前顶点
            let vc = polygon[current];
            // 下一个顶点
            next = (current === polygon.length - 1 ? 0 : current + 1);
            let vn = polygon[next];

            // 判断一个点和一条边(vc,vn)的位置关系, 如果两个检查都为 true，则切换到其相反的值
            if ((vc[1] >= point.y && vn[1] < point.y) || (vc[1] < point.y && vn[1] >= point.y)) {
                // 求出两个向量(x - x1, y - y1) 和 (x2 - x1, y2 - y1), 
                // 并对两个向量做叉积的 (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
                if ((point.x - vc[0]) < (point.y - vc[1]) * (vn[0] - vc[0]) / (vn[1] - vc[1])) {
                    // 如果结果为零: 表示点在线上
                    // 如果结果为正: 表示点在线的右边
                    // 如果结果为负: 表示点在线的左边
                    collision = !collision;
                }
            }
        }
        return collision;
    }

    /**
     * 判断圆与圆是否碰撞
     * @param {*} circle1 {x, y, radius}
     * @param {*} circle2 {x, y, radius}
     * @returns Boolean
     */
    static circleCircle(circle1, circle2) {
        if (Measure.dist([circle1.x, circle1.y], [circle2.x, circle2.y]) <= (circle1.radius) + (circle2.radius)) {
            return true;
        }
        return false;
    };

    /**
     * 判断圆与多边形是否碰撞
     * @param {*} circle 
     * @param {*} polygon 
     * @param {*} interior 
     * @returns Boolean
     */
    static circlePoly(circle, polygon, interior = false) {

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = polygon[current];    // c for "current"
            let vn = polygon[next];       // n for "next"

            // check for collision between the circle and a line formed between the two polygon
            let collision = this.lineCircle(vc[0], vc[1], vn[0], vn[1], circle.x, circle.y, circle.radius);
            if (collision) return true;
        }

        // test if the center of the circle is inside the polygon
        if (interior === true) {
            let centerInside = this.pointPoly({ "x": circle.x, "y": circle.y }, polygon);
            if (centerInside) return true;
        }

        // otherwise, after all that, return false
        return false;
    }


    /**
     * 判断线与线是否碰撞
     * @param {*} line1 {x1, y1, x2, y2}
     * @param {*} line2 {x1, y1, x2, y2}
     * @param {*} calcIntersection 
     * @returns Boolean
     */
    static lineLine(line1, line2, calcIntersection) {
        let intersection;

        // calculate the distance to intersection point
        let uA = ((line2.x2 - line2.x1) * (line1.y1 - line2.y1) - (line2.y2 - line2.y1) * (line1.x1 - line2.x1)) / ((line2.y2 - line2.y1) * (line1.x2 - line1.x1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1));
        let uB = ((line1.x2 - line1.x1) * (line1.y1 - line2.y1) - (line1.y2 - line1.y1) * (line1.x1 - line2.x1)) / ((line2.y2 - line2.y1) * (line1.x2 - line1.x1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1));

        // if uA and uB are between 0-1, lines are colliding
        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {

            if (this._Debug || calcIntersection) {
                // calc the point where the lines meet
                line1.x1 + (uA * (line1.x2 - line1.x1));
                line1.y1 + (uA * (line1.y2 - line1.y1));
            }

            // if (this._Debug) {
            //     this.ellipse(intersectionX, intersectionY, 10, 10);
            // }

            if (calcIntersection) {
                intersection = {
                    "x": intersectionX,
                    "y": intersectionY
                };
                return intersection;
            } else {
                return true;
            }
        }
        if (calcIntersection) {
            intersection = {
                "x": false,
                "y": false
            };
            return intersection;
        }
        return false;
    }

    /**
     * 判断线与矩形是否碰撞
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} rect {x, y, width, height}
     * @param {*} calcIntersection 
     * @returns Boolean
     */
    static lineRect(line, rect, calcIntersection) {
        // check if the line has hit any of the rectangle's sides. uses the lineLine function above
        let left, right, top, bottom, intersection;

        if (calcIntersection) {
            left = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x, "y2": rect.y + rect.height }, true);
            right = this.lineLine(line, { "x1": rect.x + rect.width, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y + rect.height }, true);
            top = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y }, true);
            bottom = this.lineLine(line, { "x1": rect.x, "y1": rect.y + rect.height, "x2": rect.x + rect.width, "y2": rect.y + rect.height }, true);
            intersection = {
                "left": left,
                "right": right,
                "top": top,
                "bottom": bottom
            };
        } else {
            //return booleans
            left = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x, "y2": rect.y + rect.height });
            right = this.lineLine(line, { "x1": rect.x + rect.width, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y + rect.height });
            top = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y });
            bottom = this.lineLine(line, { "x1": rect.x, "y1": rect.y + rect.height, "x2": rect.x + rect.width, "y2": rect.y + rect.height });
        }

        // if ANY of the above are true, the line has hit the rectangle
        if (left || right || top || bottom) {
            if (calcIntersection) {
                return intersection;
            }
            return true;
        }
        return false;
    }

    /**
     * 判断线与圆是否碰撞
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} circle {x, y, radius}
     * @returns Boolean
     */
    static lineCircle(line, circle) {
        // is either end INSIDE the circle?
        // if so, return true immediately
        let inside1 = this.pointCircle({ "x": line.x1, "y": line.y1 }, circle);
        let inside2 = this.pointCircle({ "x": line.x2, "y": line.y2 }, circle);
        if (inside1 || inside2) return true;

        // get length of the line
        let distX = line.x1 - line.x2;
        let distY = line.y1 - line.y2;
        let len = this.sqrt((distX * distX) + (distY * distY));

        // get dot product of the line and circle
        let dot = (((circle.x - line.x1) * (line.x2 - line.x1)) + ((circle.y - line.y1) * (line.y2 - line.y1))) / this.pow(len, 2);

        // find the closest point on the line
        let closestX = line.x1 + (dot * (line.x2 - line.x1));
        let closestY = line.y1 + (dot * (line.y2 - line.y1));

        // is this point actually on the line segment?
        // if so keep going, but if not, return false
        let onSegment = this.collidePointLine(closestX, closestY, line.x1, line.y1, line.x2, line.y2);
        if (!onSegment) return false;

        // draw a debug circle at the closest point on the line
        if (this._collideDebug) {
            this.ellipse(closestX, closestY, 10, 10);
        }

        // get distance to closest point
        distX = closestX - circle.x;
        distY = closestY - circle.y;
        let distance = this.sqrt((distX * distX) + (distY * distY));

        if (distance <= circle.radius) {
            return true;
        }
        return false;
    }

    /**
     * 判断线与多边形是否碰撞
     * @param {*} line 
     * @param {*} polygon 
     * @returns Boolean
     */
    static linePoly(line, polygon) {
        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position extract X/Y coordinates from each
            let x1 = polygon[current][0];
            let y1 = polygon[current][1];
            let x2 = polygon[next][0];
            let y2 = polygon[next][1];

            // do a Line/Line comparison if true, return 'true' immediately and stop testing (faster)
            let hit = this.lineLine(line, { x1, y1, x2, y2 });
            if (hit) {
                return true;
            }
        }
        // never got a hit
        return false;
    }

    /**
     * 判断矩形与矩形是否碰撞
     * @param {*} rect1 
     * @param {*} rect2 
     * @returns Boolean
     */
    static rect1Rect(rect1, rect2) {
        //add in a thing to detect rect1Mode CENTER
        if (rect1.x + rect1.width >= rect2.x &&    // r1 right edge past r2 left
            rect1.x <= rect2.x + rect2.width &&    // r1 left edge past r2 right
            rect1.y + rect1.height >= rect2.y &&    // r1 top edge past r2 bottom
            rect1.y <= rect2.y + rect2.height) {    // r1 bottom edge past r2 top
            return true;
        }
        return false;
    };

    /**
     * 判断矩形与圆是否碰撞
     * @param {*} rect {x, y, width, height}
     * @param {*} circle {x, y, radius}
     * @returns Boolean
     */
    static rectCircle(rect, circle) {
        // temporarect.y variables to set edges for testing
        let testX = circle.x;
        let testY = circle.y;

        // which edge is closest?
        if (circle.x < rect.x) {
            testX = rect.x;       // left edge
        } else if (circle.x > rect.x + rect.width) {
            testX = rect.x + rect.width;   // right edge
        }

        if (circle.y < rect.y) {
            testY = rect.y;       // top edge
        } else if (circle.y > rect.y + rect.height) {
            testY = rect.y + rect.height;   // // bottom edge
        }

        // // get distance from closest edges
        let distance = Measure.dist([circle.x, circle.y], [testX, testY]);

        // if the distance is less than the circle.radius, collision!
        if (distance <= circle.radius) {
            return true;
        }
        return false;
    };

    /**
     * 判断矩形与多边形是否碰撞
     * @param {*} rect {x, y, width, height}
     * @param {*} polygon 
     * @param {*} interior 
     * @returns Boolean
     */
    static rectPoly(rect, polygon, interior) {
        if (interior == undefined) {
            interior = false;
        }

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = polygon[current];    // c for "current"
            let vn = polygon[next];       // n for "next"

            // check against all four sides of the rectangle
            let collision = this.lineRect({ x1: vc[0], y1: vc[1], x2: vn[0], y2: vn[1] }, rect);
            if (collision) return true;

            // optional: test if the rectangle is INSIDE the polygon note that this iterates all sides of the polygon again, so only use this if you need to
            if (interior === true) {
                let inside = this.pointPoly({ "x": rect.x, "y": rect.y }, polygon);
                if (inside) return true;
            }
        }

        return false;
    }

    /**
     * 判断多边形与多边形是否碰撞
     * @param {*} p1 
     * @param {*} p2 
     * @param {*} interior 
     * @returns Boolean
     */
    static polyPoly(p1, p2, interior) {
        if (interior === undefined) {
            interior = false;
        }

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < p1.length; current++) {

            // get next vertex in list, if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === p1.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = p1[current];    // c for "current"
            let vn = p1[next];       // n for "next"

            //use these two points (a line) to compare to the other polygon's polygon using polyLine()
            let collision = this.linePoly({ "x1": vc[0], "y1": vc[1], "x2": vn[0], "y2": vn[1] }, p2);
            if (collision) return true;

            //check if the either polygon is INSIDE the other
            if (interior === true) {
                collision = this.pointPoly({ "x": p2[0][0], "y": p2[0][1] }, p1);
                if (collision) return true;
                collision = this.pointPoly({ "x": p1[0][0], "y": p1[0][1] }, p2);
                if (collision) return true;
            }
        }

        return false;
    }
}

/**
 * 坐标数据处理类
 */
class Coordinate {
    constructor() {
    }

    /**
     * 基于原点坐标旋转
     * @param {Array<Coord>} coords 坐标
     * @param {number} angle 角度
     * @return {Array<Coord>} 转换后的坐标
     */
    static rotate(coords, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] * cos - coords[j][1] * sin;
            let y = coords[j][1] * cos + coords[j][0] * sin;
            dest.push([x, y]);
        }
        return dest;
    }

    /**
     * 基于锚点进行坐标旋转
     * @param {Array<Coord>} coords 坐标
     * @param {number} angle 角度
     * @param {Coord} anchor 锚点坐标
     * @return {Array<Coord>} 转换后的坐标
     */
    static rotateByAnchor(coords, angle, anchor) {
        // ClassUtil.assert(this.isValidate(coords) && ClassUtil.typeof(angle) === "Number" && anchor.length == 2, "参数错误");
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let anchorX = anchor[0];
        let anchorY = anchor[1];
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let deltaX = coords[j][0] - anchorX;
            let deltaY = coords[j][1] - anchorY;
            dest.push([anchorX + deltaX * cos - deltaY * sin, anchorY + deltaX * sin + deltaY * cos]);
        }
        return dest;
    }

    /**
     * 基于原点进行坐标缩放
     * @param {Array<Coord>} coords 坐标.
     * @param {number} sx x方向上的缩放比例
     * @param {number} sy y方向上的缩放比例
     * @return {Array<Coord>} 转换后的坐标.
     */
    static scale(coords, sx, sy = sx) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            dest.push([coords[j][0] * sx, coords[j][1] * sy]);
        }
        return dest;
    }

    /**
     * 基于锚点进行坐标缩放
     * @param {Array<Coord>} coords 坐标.
     * @param {number} sx x方向上的缩放比例
     * @param {number} sy y方向上的缩放比例
     * @param {Array<Coord>} anchor Scale anchor point.
     * @return {Array<Coord>} 转换后的坐标.
     */
    static scaleByAnchor(coords, sx, sy, anchor) {
        let dest = [];
        let anchorX = anchor[0];
        let anchorY = anchor[1];
        for (let j = 0; j < coords.length; j += 1) {
            let deltaX = coords[j][0] - anchorX;
            let deltaY = coords[j][1] - anchorY;
            dest[j] = [];
            dest[j][0] = anchorX + sx * deltaX;
            dest[j][1] = anchorY + sy * deltaY;
        }
        return dest;
    }

    /**
     * 坐标平移
     * @param {Array<Coord>} coords 坐标.
     * @param {number} deltaX x方向上的平移距离
     * @param {number} deltaY y方向上的平移距离
     * @return {Array<Coord>} 转换后的坐标.
     */
    static translate(coords, deltaX, deltaY) {
        // ClassUtil.assert(deltaX != null && deltaY != null && this.isValidate(coords), "参数错误");
        let dest = [];
        for (let j = 0; j < coords.length; j += 1) {
            dest[j] = [];
            dest[j][0] = coords[j][0] + deltaX;
            dest[j][1] = coords[j][1] + deltaY;
        }
        return dest;
    }

    static add(coords, delta) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] + delta[0];
            let y = coords[j][1] + delta[1];
            dest.push([x, y]);
        }
        return dest;
    }

    static sub(coords, delta) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] - delta[0];
            let y = coords[j][1] - delta[1];
            dest.push([x, y]);
        }
        return dest;
    }

    /**
     * 坐标小数位处理
     * @param {Array} coords
     * @param {int} decimals
     * @returns Array
     */
    static toFixed(coords, decimals = 0) {
        let dest = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0])) {
                return [MathUtil.toFixed(coords[0], decimals), MathUtil.toFixed(coords[1], decimals)];
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    dest.push(this.toFixed(coords[i], decimals));
                }
                return dest;
            }
        }
        return dest;
    }

    /**
     * 判断是否为坐标
     * @param {Array} coords 
     * @returns Boolean
     */
    static isValidate(coords) {
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0]) && !Array.isArray(coords[1])) {
                let [x, y] = coords;
                return (typeof (x) === "number" && typeof (y) === "number" && !isNaN(x) && !isNaN(y));
                // } else if (coords.length === 3 && !Array.isArray(coords[0])) {
                //     let [x, y, z] = coords;
                //     return (typeof (x) === "number" && typeof (y) === "number" && typeof (z) === "number" && !isNaN(x) && !isNaN(y) && !isNaN(z));
                // } else if (coords.length === 4 && !Array.isArray(coords[0])) {
                //     let [x, y, rx, ry] = coords;
                //     return (typeof (x) === "number" && typeof (y) === "number" && typeof (rx) === "number" && !isNaN(x) && !isNaN(y) && !isNaN(rx));
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    if (this.isValidate(coords[i]) === false) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 两个坐标是否相等
     * @param {Coord} coord1 
     * @param {Coord} coord2 
     * @returns Boolean
     */
    static equal(coord1, coord2) {
        if (Array.isArray(coord1) && Array.isArray(coord2) && coord1.length === coord2.length) {
            if (coord1.length === 2) {
                return coord1[0] == coord2[0] && coord1[1] == coord2[1];
            } else if (coord1.length > 2) {
                for (let i = 0, ii = coord1.length; i < ii; i++) {
                    if (coord1[i][0] != coord2[i][0] || coord1[i][1] != coord2[i][1]) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 坐标反转
     * @param {Array<Coord>} coords 
     * @returns {Array<Coord>} coords
     */
    static reverse(coords) {
        let dest = [];
        for (let j = coords.length - 1; j >= 0; j -= 1) {
            dest.push(coords[j]);
        }
        return dest;
    }

    /**
     * 坐标转换
     * @param {Transform|Ratio} tool 变化矩阵
     * @param {Array<Coord>} coords 原坐标值
     * @param {Boolean} precision 是否保留小数
     * @returns {Array<Coord>} 转换后的坐标.
     */
    static transform2D(tool, coords, precision) {
        let pixels = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0]) && !Array.isArray(coords[1])) {
                //let point = DynamicTransform.projToWorld(coords)
                let point = coords;
                if (Array.isArray(tool)) {
                    return Transform.apply(tool, point, precision);
                } else {
                    return tool.toPix(point, precision);
                }
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    pixels.push(this.transform2D(tool, coords[i], precision));
                }
                return pixels;
            }
        } else {
            console.error("coords is error", coords);
        }
    }

    /**
     * 坐标转换为字符串格式，x1,y1,x2,y2,x3,y3,……
     * @param {Array<Coord>} coords
     * @returns String
     */
    static toString(coords) {
        if (this.isValidate(coord2)) {
            if (typeof (coords[0]) === "number") {
                return coords[0] + "," + coords[1];
            } else {
                let strCoordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [x, y] = coords[i];
                    strCoordList.push(x + "," + y);
                }
                return strCoordList.join(",");
            }
        } else {
            throw Error("参数错误");
        }
    }
}

const reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/i;
let ___uniqueList = [];

/**
 * 颜色工具类
 */
class Color {
    /**
     * 创建颜色
     * @param {number} r - red
     * @param {number} g - green
     * @param {number} b - blue
     * @param {number} a - alpha
     */
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * 修改透明度
     * @param {Number} a (0~1)
     * @returns this
     */
    setAlpha(a) {
        this.a = a;
        return this;
    }

    /**
     * 取透明度
     * @returns alaph
     */
    getAlpha() {
        return this.a;
    }

    /**
     * 获取命名色集合
     * @returns 命名色集合
     */
    static getSystemColor() {
        return ___colorNamesMap;
    }

    /**
     * 输出为rgb()字符串颜色值
     * @return {string} rgba
     */
    toString() {
        return this.toRgba();
    }

    /**
     * 转换为rgb()字符串颜色值
     * @returns {String} rgb String
     */
    toRgb() {
        // return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        return this.toRgba();
    }

    /**
     * 转换为rgba()字符串颜色值
     * @returns {String} rgba String
     */
    toRgba() {
        return (this.a == 1 || this.a == null) ? "rgb(" + this.r + "," + this.g + "," + this.b + ")" : "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }

    /**
     * 转换为10进制数值颜色
     * @returns int // RGB = R + G * 256 + B * 256 * 256
     */
    toInt() {
        return this.r + this.g * 256 + this.b * 256 * 256;
    }

    /**
     * 转换为16进制字符串颜色值
     * @returns String
     */
    toHex() {
        let [red, green, blue, alpha] = [this.r, this.g, this.b, this.a];
        red = Number(red);
        green = Number(green);
        blue = Number(blue);
        alpha = Math.round(alpha * 255);

        if (red != (red & 255) || green != (green & 255) || blue != (blue & 255)) {
            throw Error('"(' + red + "," + green + "," + blue + '") is not a valid RGB color');
        }
        let prependZero = function (hex) {
            return hex.length == 1 ? "0" + hex : hex;
        };

        let hexR = prependZero(red.toString(16));
        let hexG = prependZero(green.toString(16));
        let hexB = prependZero(blue.toString(16));
        let hexA = prependZero(alpha.toString(16));
        let hexStr = "#" + hexR + hexG + hexB + (alpha < 255 ? hexA : "");
        return hexStr.toUpperCase();
    };

    /**
     * 转换为HSB颜色对象
     * @returns {Object} hsb Object { h: hue, s: saturation, b: brightness }
     */
    toHSB() {
        let [red, green, blue] = [this.r, this.g, this.b];
        let hue;
        let saturation;
        let brightness;

        let cmax = (red > green) ? red : green;
        if (blue > cmax) {
            cmax = blue;
        }
        let cmin = (red < green) ? red : green;
        if (blue < cmin) {
            cmin = blue;
        }
        brightness = cmax / 255.0;
        if (cmax != 0) {
            saturation = (cmax - cmin) / cmax;
        } else {
            saturation = 0;
        }
        if (saturation == 0) {
            hue = 0;
        } else {
            let redc = (cmax - red) / (cmax - cmin);
            let greenc = (cmax - green) / (cmax - cmin);
            let bluec = (cmax - blue) / (cmax - cmin);

            if (red == cmax) {
                hue = bluec - greenc;
            } else if (green == cmax) {
                hue = 2.0 + redc - bluec;
            } else {
                hue = 4.0 + greenc - redc;
            }
            hue = hue / 6.0;
            if (hue < 0) {
                hue = hue + 1.0;
            }
        }

        return { H: hue, S: saturation, B: brightness };
    }

    /**
     * 转换为HSV颜色对象
     * @returns {Object} hsv Object { h: hue, s: saturation, v: value };
     */
    toHSV() {
        let [red, green, blue] = [this.r, this.g, this.b];
        let max = Math.max(Math.max(red, green), blue);
        let min = Math.min(Math.min(red, green), blue);
        let hue;
        let saturation;
        let value = max;
        if (min == max) {
            hue = 0;
            saturation = 0;
        } else {
            let delta = max - min;
            saturation = delta / max;
            if (red == max) {
                hue = (green - blue) / delta;
            } else {
                if (green == max) {
                    hue = 2 + (blue - red) / delta;
                } else {
                    hue = 4 + (red - green) / delta;
                }
            }
            hue *= 60;
            if (hue < 0) {
                hue += 360;
            }
            if (hue > 360) {
                hue -= 360;
            }
        }
        return { H: hue, S: saturation, V: value };
    };

    /**
     * 转换为hsl颜色对象
     * @returns {Object} HSL Object { H: hue, S: saturation, L: lightness};
     */
    toHSL() {
        let [red, green, blue] = [this.r, this.g, this.b];
        red /= 255; green /= 255; blue /= 255;

        let h, s, l,
            max = Math.max(red, green, blue),
            min = Math.min(red, green, blue);

        l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case red:
                    h = (green - blue) / d + (green < blue ? 6 : 0);
                    break;
                case green:
                    h = (blue - red) / d + 2;
                    break;
                case blue:
                    h = (red - green) / d + 4;
                    break;
            }
            h /= 6;
        }

        return {
            H: Math.round(h * 360),
            S: Math.round(s * 100),
            L: Math.round(l * 100),
        };
    }

    /**
     * 转换为灰度
     * @return Color
     */
    toGrayscale() {
        let average = parseInt((this.r * 0.3 + this.g * 0.59 + this.b * 0.11).toFixed(0), 10);
        this.r = this.g = this.b = average;
        return this;
    }

    /**
     * 转换为黑白色
     * @param {Number} threshold
     * @return Color
     */
    toBlackWhite(threshold = 127) {
        let average = (this.r * 0.3 + this.g * 0.59 + this.b * 0.11).toFixed(0);
        average = (Number(average) < Number(threshold)) ? 0 : 255;
        this.r = this.g = this.b = average;
        return this;
    }

    /**
     * 10进制表示法颜色 转十进制 R G B
     * @param {Number} intVal 
     * @returns {Color} color
     */
    static fromInt(intVal) {
        let alpha = intVal >> 24 & 0xff;
        let red = intVal >> 16 & 0xff;
        let green = intVal >> 8 & 0xff;
        let blue = intVal & 0xff;
        return new Color(red, green, blue, alpha);
    }

    /**
     * 将字符串颜色转换为Color对象
     * @param {string} str 目前支持两种字符串格式：1、十六进制 #FFFFFF或#FFF   2、rgb(0,0,0)或(0,0,0)或0,0,0格式
     * @return {Color}
     */
    static fromString(str) {
        if (this.isValidColor(str) == false) return null;
        if (str.startsWith('hsl(')) {
            return this.fromHSL(str);
        } else {
            // 1 判断是否为16进制格式的字符串格式
            let color = this.fromHex(str);
            if (color == null) {
                // 2 判断是否为rgba()格式
                let reg = /\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(,\s*[0|1].?\d*)?\)/;
                if (reg.test(str)) {
                    let rgbStr = str.substring(str.indexOf("(") + 1, str.indexOf(")")).split(",");
                    return new Color(rgbStr[0], rgbStr[1], rgbStr[2], rgbStr[3]);
                } else {
                    // 3 判断是否为rgb()格式
                    reg = /(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(,\s*[0|1].?\d*)?/;
                    if (reg.test(str)) {
                        let rgbStr = str.substring(str.indexOf("(") + 1, str.indexOf(")")).split(",");
                        return new Color(rgbStr[0], rgbStr[1], rgbStr[2], rgbStr[3]);
                    } else {
                        // 4 判断是否为系统内置颜色
                        const namedColor = ___colorNamesMap[str];
                        return (namedColor == null ? null : this.fromString(namedColor));
                    }
                }
            }
            return color;
        }
    }

    /**
     * 将16进制颜色字符串 转换为Color对象
     * @param {string} hex - 十六进制 #FFFFFF
     * @return {Color} color
     */
    static fromHex(hex) {
        if (hex == null) return null;
        let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/;
        hex = hex.toLowerCase();
        if (reg.test(hex)) {
            //处理三位的颜色值 #FFF
            if (hex.length === 4) {
                let sColorNew = "#";
                for (let i = 1; i < 4; i += 1) {
                    sColorNew += hex.slice(i, i + 1).concat(hex.slice(i, i + 1));
                }
                hex = sColorNew;
            }
            //处理六位的颜色值 #FFFFFF
            if (hex.length === 7) {
                hex += "ff";
            }
            let sColorChange = [];
            for (let i = 1; i < 9; i += 2) {
                sColorChange.push(parseInt("0x" + hex.slice(i, i + 2)));
            }
            return new Color(sColorChange[0], sColorChange[1], sColorChange[2], sColorChange[3] / 255);
        } else {
            return null;
        }
    }

    /**
     * 将HSB的颜色转换为Color对象
     * @param {*} hue 
     * @param {*} saturation 
     * @param {*} brightness 
     * @returns Color
     */
    static fromHSB(hue, saturation, brightness) {
        let red = 0;
        let green = 0;
        let blue = 0;

        if (saturation == 0) {
            red = parseInt(brightness * 255.0 + 0.5);
            green = red;
            blue = red;
        }
        else {
            let h = (hue - Math.floor(hue)) * 6.0;
            let f = h - Math.floor(h);
            let p = brightness * (1.0 - saturation);
            let q = brightness * (1.0 - saturation * f);
            let t = brightness * (1.0 - (saturation * (1.0 - f)));

            switch (parseInt(h)) {
                case 0:
                    red = (brightness * 255.0 + 0.5);
                    green = (t * 255.0 + 0.5);
                    blue = (p * 255.0 + 0.5);
                    break;
                case 1:
                    red = (q * 255.0 + 0.5);
                    green = (brightness * 255.0 + 0.5);
                    blue = (p * 255.0 + 0.5);
                    break;
                case 2:
                    red = (p * 255.0 + 0.5);
                    green = (brightness * 255.0 + 0.5);
                    blue = (t * 255.0 + 0.5);
                    break;
                case 3:
                    red = (p * 255.0 + 0.5);
                    green = (q * 255.0 + 0.5);
                    blue = (brightness * 255.0 + 0.5);
                    break;
                case 4:
                    red = (t * 255.0 + 0.5);
                    green = (p * 255.0 + 0.5);
                    blue = (brightness * 255.0 + 0.5);
                    break;
                case 5:
                    red = (brightness * 255.0 + 0.5);
                    green = (p * 255.0 + 0.5);
                    blue = (q * 255.0 + 0.5);
                    break;
            }
        }
        return new Color(parseInt(red), parseInt(green), parseInt(blue));
    }

    /**
     * 将HSL的字符串颜色转换为Color对象
     * @param {*} color 
     * @returns Color Object
     */
    static fromHSL(hslColor) {
        let match = hslColor.match(reHSLa);
        if (!match) {
            return;
        }

        let h = (((parseFloat(match[1]) % 360) + 360) % 360) / 360,
            s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1),
            l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1),
            r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            let q = l <= 0.5 ? l * (s + 1) : l + s - l * s,
                p = l * 2 - q;

            r = this._hue2rgb(p, q, h + 1 / 3);
            g = this._hue2rgb(p, q, h);
            b = this._hue2rgb(p, q, h - 1 / 3);
        }

        //return new Color(r * 255, g * 255, b * 255, match[4] ? parseFloat(match[4]) : 1);
        return new Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), match[4] ? parseFloat(match[4]) : 1);
    };

    /**
     * @private
     * @param {Number} p
     * @param {Number} q
     * @param {Number} t
     * @return {Number}
     */
    static _hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    /**
     * 生成色带
     * @param {Color} start - 色带起始色
     * @param {number} count - 随机颜色数，默认值10个
     * @return {Color} 生成随机色带
     */
    static band(color, count) {
        if (typeof (color) === "string") {
            color = this.fromString(color);
        }
        if (!color instanceof Color) {
            return null;
        }
        let interval = (count == null ? 10 : 100 / count);
        let colorSet = [];
        let hsl = color.toHSL();
        for (let l = 100; l > 0; l -= interval) {
            let hslColor = "hsl(" + hsl.H + ", " + hsl.S + "%, " + Math.round(l) + "%)";
            let ncolor = this.fromHSL(hslColor);
            let hex = ncolor.toHex();
            colorSet.push(hex);
        }
        return colorSet;
    }

    /**
     * 获取常用的16色
     */
    static getColor16() {
        return ["black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia", "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua"];
    }

    static resetUniqueColor() {
    }

    static getUniqueColor() {
        let randomNum = MathUtil.getRandomNum(0, 255 * 255 * 255 * 255);
        while (true) {
            if (___uniqueList.indexOf(randomNum) >= 0) {
                randomNum = MathUtil.getRandomNum(0, 255 * 255 * 255 * 255);
            } else {
                break;
            }
        }
        return this.fromInt(randomNum);
    }

    /**
     * 生成随机色
     * @return {Color} 生成随机色
     */
    static random() {
        return new Color(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
    }

    /**
     * 判断一个颜色值是否合法
     * @param {String} color 
     * @returns boolean
     */
    static isValidColor(color) {

        let _isValidateRGBNum = function (val) {
            if (isNaN(val) || val < 0 || val > 255) {
                return false;
            } else {
                return true;
            }
        };

        // 如果颜色值以 # 开头，则格式为 #000 或 #0000 或 #000000 或 #00000000
        if (color.startsWith('#')) {
            // 颜色值必须为3/4/6/8个字符，首字符为#
            let pattern = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;
            return pattern.test(color);
        } else if ((color.startsWith('rgb(') || color.startsWith('rgba(')) && color.split(",").length > 2) {
            // 如果颜色值以 rgb 开头，则格式为 rgb(0,0,0) 或 rgba(0,0,0,0)
            if (color.startsWith('rgb(')) {
                color = color.substring(4, (color.lastIndexOf(")")));
                let seq = color.split(",");
                if (seq.length == 3) {
                    for (let i = 0; i < seq.length; i++) {
                        if (_isValidateRGBNum(seq[i]) === false) {
                            return false;
                        }
                    }
                    return true;
                }
            } else if (color.startsWith('rgba(')) {
                color = color.substring(5, (color.lastIndexOf(")")));
                let seq = color.split(",");
                if (seq.length == 4) {
                    for (let i = 0; i < seq.length; i++) {
                        let val = parseFloat(seq[i]);
                        if (i < 3) {
                            if (_isValidateRGBNum(seq[i]) === false) {
                                return false;
                            }
                        } else {
                            if (isNaN(val) || val < 0 || val > 1) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
            } else {
                let seq = color.split(",");
                for (let i = 0; i < seq.length; i++) {
                    if (i < 3) {
                        if (_isValidateRGBNum(seq[i]) === false) {
                            return false;
                        }
                    } else {
                        if (isNaN(val) || val < 0 || val > 1) {
                            return false;
                        }
                    }
                }
                return true;
            }

            return false;
        } else if (color.startsWith('hsl(')) {
            let match = color.match(reHSLa);
            if (!match) {
                return false;
            } else {
                return true;
            }
        } else {
            // 检查颜色代码是否在颜色表中定义  
            const namedColor = ___colorNamesMap[color];
            return (namedColor == null ? false : true);
        }
    }
}

const ___colorNamesMap = {
    transparent: '#FFFFFF00',
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgrey: '#A9A9A9',
    darkgreen: '#006400',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgrey: '#D3D3D3',
    lightgreen: '#90EE90',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32'
};

// console.info(Color.fromString("rgb(255,255,255)").toString());
// console.info(Color.fromString("#FFF").toString());
// console.info(Color.fromString("#FFFFFFDF").toString());
// console.info(Color.fromString("rgba(255,255,255,0.1)").toString());
// console.info(Color.fromString("(255,255,255)").toString());

// console.info(1, Color.isValidColor("#000"));
// console.info(1, Color.isValidColor("#0001"));
// console.info(2, Color.isValidColor("#000FFF"));
// console.info(3, Color.isValidColor("#000FFF00"));
// console.info(4, Color.isValidColor("rgb(0,0,0)"));
// console.info(5, Color.isValidColor("rgba(0,0,0)"));
// console.info(6, Color.isValidColor("rgba(0,0,0,0)"));
// console.info(7, Color.isValidColor("white"));
// console.info(8, Color.isValidColor("whitea"));

// let color = Color.fromString("rgb(0,128,0)");
// console.info(color);
// color = Color.fromString("rgba(0,128,0, 0.8)");
// console.info(color);

// let red = Color.fromString("red")
// console.info(red.toHSL(), red.toHSB(), red.toHSV(), red.toHex(), red.toRgb());

/**
 * 渐变效果类
 */
class Gradient {

    /**
     * @param {Object} options 选项{type, coords, gradientUnits, and colorStops}
     * @param {Object} [options.type] 渐变类型：linear or radial
     * @param {Object} [options.gradientUnits] 坐标单位：像素/百分比
     * @param {Object[]} options.colorStops colorstops参数
     * @param {Object} options.coords gradient坐标
     * @param {Number} [options.coords.x1] X coordiante of the first point for linear or of the focal point for radial
     * @param {Number} [options.coords.y1] Y coordiante of the first point for linear or of the focal point for radial
     * @param {Number} [options.coords.x2] X coordiante of the second point for linear or of the center point for radial
     * @param {Number} [options.coords.y2] Y coordiante of the second point for linear or of the center point for radial
     * @param {Number} [options.coords.r1] only for radial gradient, radius of the inner circle
     * @param {Number} [options.coords.r2] only for radial gradient, radius of the external circle
     */
    constructor(options) {
        /**
         * 渐变的变换矩阵
         * 在应用此变换之前，原点位于对象的左上角，加上offsetY和offsetX
         * @type Number[]
         * @default null
         */
        this.gradientTransform = null;

        /**
         * 对象的变换矩阵
         */
        this.objTransform_ = null;

        /**
         * 坐标单位. 可选值：像素、百分数
         * If `pixels`, the number of coords are in the same unit of width / height.
         * If set as `percentage` the coords are still a number, but 1 means 100% of width
         * for the X and 100% of the height for the y. It can be bigger than 1 and negative.
         * allowed values pixels or percentage.
         * @type String
         * @default 'pixels'
         */
        this.gradientUnits = 'pixels';

        /**
         * Gradient type linear or radial
         * @type String
         * @default 'pixels'
         */
        this.type = 'linear';

        if (options == null) (options = {});
        if (options.coords == null) (options.coords = {});

        // sets everything, then coords and colorstops get sets again
        let that = this;
        Object.keys(options).forEach(function (option) {
            that[option] = options[option];
        });

        /**
         * 坐标信息
         */
        let coords = {
            x1: options.coords.x1 || 0,
            y1: options.coords.y1 || 0,
            x2: options.coords.x2 || 0,
            y2: options.coords.y2 || 0
        };
        if (this.type === 'radial') {
            coords.r1 = options.coords.r1 || 0;
            coords.r2 = options.coords.r2 || 0;
        }
        this.coords = coords;

        /**
         * 像素信息，与坐标信息对应，缩放操作时需将坐标变换为像素
         */
        this.pixel = options.pixel;

        /**
         * 由偏移值和颜色值指定的断点到渐变数组
         */
        this.colorStops = options.colorStops.slice();
    }

    /**
     * Adds another colorStop
     * @param {Object} colorStop Object with offset and color
     * @return {Gradient} thisArg
     */
    addColorStop(colorStops) {
        for (let position in colorStops) {
            let color = Color.fromString(colorStops[position]);
            this.colorStops.push({
                offset: parseFloat(position),
                color: color.toRgb(),
                opacity: color.getAlpha()
            });
        }
        return this;
    }

    /**
     * 对象应用矩阵时，其关联的本渐变对象也需要进行矩阵变换；
     * 注意：其执行顺序需在 渐变应用矩阵执行之后再来执行该变换
     * @param {*} trans 
     */
    transform(trans) {
        this.objTransform_ = trans.slice();
        // 此处仅记录变换矩阵，在渲染时进行坐标变换   
    }

    // 根据矩阵修改坐标
    doTransform(trans) {
        let coords = [[this.coords.x1, this.coords.y1], [this.coords.x2, this.coords.y2]];
        coords = Transform.applys(trans, coords);
        let newCoords = {
            "x1": coords[0][0],
            "y1": coords[0][1],
            "x2": coords[1][0],
            "y2": coords[1][1]
        };

        if (this.type === "radial") {
            let scale = Transform.getScale(trans);
            newCoords.r1 = this.coords.r1 * scale;
            newCoords.r2 = this.coords.r2 * scale;
        }
        this.coords = newCoords;
    }

    /**
     * 创建Canvas的Gradient对象
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @return {CanvasGradient}
     */
    create(ctx) {
        let gradient, coords = this.coords;

        if (!this.type) {
            return;
        }

        if (this.type === 'linear') {
            if (this.pixel != null && this.pixel.length == 2) {
                let pixel = this.pixel;
                gradient = ctx.createLinearGradient(pixel[0][0], pixel[0][1], pixel[1][0], pixel[1][1]);
            } else {
                gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);
            }
        } else if (this.type === 'radial') {
            if (this.pixel != null && this.pixel.length == 3) {
                let pixel = this.pixel;
                gradient = ctx.createRadialGradient(
                    pixel[0][0], pixel[0][1], Math.abs(pixel[2][0] - pixel[0][0]),
                    pixel[1][0], pixel[1][1], Math.abs(pixel[2][1] - pixel[1][1]));
            } else {
                gradient = ctx.createRadialGradient(coords.x1, coords.y1, coords.r1, coords.x2, coords.y2, coords.r2);
            }
        }

        for (let i = 0, len = this.colorStops.length; i < len; i++) {
            let color = this.colorStops[i].color,
                opacity = this.colorStops[i].opacity,
                offset = this.colorStops[i].offset;

            if (opacity >= 0 && opacity <= 1) {
                color = Color.fromString(color).setAlpha(opacity).toRgba();
            }
            gradient.addColorStop(offset, color);
        }

        return gradient;
    }

    /**
     * 获取具体的像素值，
     * 缩放时应先处理对象的坐标转换，然后处理渐变对象的坐标转换
     * @param {*} tool 
     * @param {*} geometry 
     */
    toPixel(tool, geometry) {
        let coords = [[this.coords.x1, this.coords.y1], [this.coords.x2, this.coords.y2]];
        let radius = (this.type === "linear" ? [0, 0] : [this.coords.r1, this.coords.r2]);

        let bbox = geometry.getBBox(false);
        let pixels = [];
        if (this.gradientUnits === 'pixels') {
            let nc = this._gradientTransform(coords, radius, bbox);
            pixels = Coordinate.transform2D(tool, nc, false);
        } else {
            // 如果坐标为百分比，且存在transform属性，则应先transform，然后计算为具体像素值
            coords = this._gradientTransform(coords, radius, [0, 0, 1, 1]);
            let width = Extent.getWidth(bbox);
            let height = Extent.getHeight(bbox);

            for (let i = 0, ii = coords.length; i < ii; i++) {
                // bbox[0] + 宽度*百分比
                // bbox[1] + 高度*百分比
                pixels.push([bbox[0] + width * coords[i][0], bbox[1] + height * coords[i][1]]);
            }
        }

        // 存储至实例变量中
        this.pixel = pixels;
    }

    /**
     * 根据gradientTransform属性，在渲染时进行矩阵变换
     */
    _gradientTransform(pixels, radius, bbox) {
        if (this.gradientTransform != null) {
            let transform = Transform.create();
            let transData = this.gradientTransform;
            if (Array.isArray(transData) && transData.length > 0) {
                for (let i = 0; i < transData.length; i++) {
                    let prop = transData[i];
                    if (prop.action == "translate") {
                        Transform.translate(transform, prop.value[0], prop.value[1]);
                    } else if (prop.action === "rotate") {
                        // 旋转的基点为bbox的左上点
                        Transform.rotateAtOrigin(transform, MathUtil.toRadians(prop.value), [bbox[0], bbox[1]]);
                        // Transform.rotateAtOrigin(transform, MathUtil.toRadians(prop.value), Extent.getCenter(bbox));
                    } else if (prop.action === "scale") {
                        Transform.scale(transform, prop.value[0], prop.value[1]);
                    } else if (prop.action == "matrix") {
                        Transform.multiply(transform, prop.value);
                    }
                }
                pixels = Transform.applys(transform, pixels);
                radius = [radius[0] * Transform.getScale(transform), radius[1] * Transform.getScale(transform)];
            }
        }

        // 执行对象应用矩阵变换
        if (this.objTransform_ != null) {
            pixels = Transform.applys(this.objTransform_, pixels);
            radius = [radius[0] * Transform.getScale(this.objTransform_), radius[1] * Transform.getScale(this.objTransform_)];
        }

        // 将半径信息添加到pixel数组中
        if (radius[0] >= 0 && radius[1] > 0) {
            pixels.push([pixels[0][0] + radius[0], pixels[1][1] + radius[1]]);
        }

        return pixels;
    }

    clone() {
        return new Gradient(this);
    }
}

/**
 * 画板对象
 * @param {*} options 
 * @returns Canvas
 */
function createCanvas(options = {}) {
    let width = options.width || 50;
    let height = options.height || 50;
    let viewBox = options.viewBox || [0, 0, width, height];

    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext('2d');
    ctx.scale(width / Extent.getWidth(viewBox), height / Extent.getHeight(viewBox));

    return canvas;
}

/**
 * 删除画板
 * @param  {...Object} canvases 
 */
function releaseCanvas(...canvases) {
    canvases.forEach((c) => {
        c.width = 0;
        c.height = 0;
    });
}

/**
 * 位图状态
 */
const ImageState = {
    IDLE: 0,
    LOADING: 1,
    LOADED: 2,
    ERROR: 3,
    EMPTY: 4,
    ABORT: 5
};

/**
 * 异步加载的图形对象
 */
class ImageObject {
    constructor(src, callback) {
        this.blankTile = new window.Image();
        this.blankTile.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAB9JREFUOE9jZKAQMFKon2HUAIbRMGAYDQNQPhr4vAAAJpgAEX/anFwAAAAASUVORK5CYII=";  // 临时瓦片Image

        // fileUrl
        this.src_ = src;
        this.image_ = new window.Image();
        //this.image_.crossOrigin = "anonymous";   // 跨域,不发送用户凭据（即允许对未经过验证的图像进行跨源下载）
        this.state = ImageState.IDLE;
        this.waitToDraw = false;

        // 是否下载切片，当无法下载时可将该值设置为false
        this.isLoadImage_ = true;

        // load finish callback
        if (typeof (callback) == "function") {
            this.imageLoadedCallback = callback;
            this.waitToDraw = true;
        }

        // 开始加载Image
        this.load();
    }

    setCallback(callback) {
        if (typeof (callback) === "function") {
            this.waitToDraw = true;
            this.imageLoadedCallback = callback;
        }
    }

    /**
     * 返回切片状态
     */
    getState() {
        return this.state;
    }

    /**
     * 获取切片对应的Image
     */
    getImage() {
        if (this.state == ImageState.LOADED) {  // 已装载完毕
            return this.image_;
        } else {                                     // 没有装载或出现错误
            return this.blankTile;
        }
    };

    /**
     * 装入切片位图
     */
    load() {
        if (this.state == ImageState.IDLE || this.state == ImageState.ERROR) {
            this.state = ImageState.LOADING;
            let that = this;
            this.image_.addEventListener('load', function (e) { return that.onload(); }, { once: true });
            this.image_.addEventListener('error', function (e) { return that.onerror(); }, { once: true });
            this.image_.src = this.isLoadImage_ === true ? this.src_ : this.blankTile.src;
        }
    };

    /**
     * 装入成功事件 
     */
    onload() {
        if (this.image_.naturalWidth && this.image_.naturalHeight) {
            this.state = ImageState.LOADED;
        } else {
            this.state = ImageState.EMPTY;
        }
        // 当image装载完成后，若已经执行了draw，则需重新draw
        if (this.waitToDraw) {
            if (typeof (this.imageLoadedCallback) === "function") {
                this.imageLoadedCallback(this.image_);
            }
        }
    }

    /**
     * 切片装入失败事件 
     */
    onerror() {
        this.state = ImageState.ERROR;
    }
}

/**
 * 位图Load对象，用于加载图片，加载完成后执行回调。当重复加载同一图片时，图片只会加载一次，所有callback均会执行，最后执行finishCallback
 * @private
 */
class ImageLoader {
    constructor() {
    }

    /**
     * 加载图片
     * @param {String} src 
     * @param {Function} callback 位图对象加载之后的回调
     * @param {Function} finishCallback 位图对象加载完成，且回调执行完成后执行的函数
     */
    static load(src, callback, finishCallback) {
        let that = this;
        let img = this.ImageCollection.get(src);
        if (img == null) {
            let image = new window.Image();
            image.onload = function () {
                that._loaded(src, image);
            };
            image.src = src;
            this.ImageCollection.set(src, { "imageLoadedCallback": [callback], "finishCallback": finishCallback });
        } else {
            img.imageLoadedCallback.push(callback);
        }
    }

    /**
     * 如果多次load同一个位图，则合并这些位图的
     * @param {*} src 
     * @param {*} image 
     */
    static _loaded(src, image) {
        let cs = this.ImageCollection.get(src);
        cs.imageLoadedCallback.forEach(call => {
            call(image);
        });
        cs.finishCallback();
        this.ImageCollection.delete(src);
    }
}
ImageLoader.ImageCollection = new Map();

/**
 * 图案填充效果类
 */
class Pattern {

    /**
     * @param {Object} options 
     * @param {String} [options.type] 类型: canvas, image, simple
     * @param {String} [options.repeat] 重复: repeat, repeat-x, repeat-y or no-repeat
     */
    constructor(options = {}) {
        /**
         * 重复属性，取值为：repeat, repeat-x, repeat-y or no-repeat
         */
        this.repeat = options.repeat || 'repeat';

        /**
         * pattern类型
         */
        this.type = options.type || 'canvas';            // canvas, image, simple

        /**
         * 当pattern为canvas类型时，geomList则作为canvas中渲染的Geomerty对象集合
         */
        this.geomList = options.geomList || [];

        /**
         * 当pattern为canvas类型时， 以下属性为render()属性
         */
        this.patternTransform = options.patternTransform;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.viewBox = options.viewBox || [];

        // type = simple 的专用属性
        this.color = options.color;
        this.rotation = options.rotation;
        this.lineWidth = options.lineWidth || 0.5;

        // 如果没有指定宽高信息，则根据geomList确定宽高
        if ((this.width == 0 || this.height == 0) && this.type === "canvas") {
            let extent = Extent.createEmpty();
            this.geomList.forEach(element => {
                //if (element instanceof Geometry) {
                let objBBox = element.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
                //}
            });
            this.width = Extent.getWidth(extent);
            this.height = Extent.getHeight(extent);

            if (this.viewBox == null || this.viewBox.length == 0) {
                this.viewBox = [0, 0, this.width, this.height];
            }
        }

        // 渲染时的画板像素坐标值
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height]];

        /**
         * 当pattern为image类型时，source则作为背景图片
         */
        this.source;
        if (this.type === "image") {
            if (typeof options.imageSrc == 'string') {
                this.source = new ImageObject(this.source);
            } else if (options.image instanceof ImageObject) {
                this.source = options.image;
            }
        }
    }

    /**
     * 加载背景图片图案
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Function} callback callback(CanvasPattern)
     */
    loadImagePattern(ctx, callback) {
        if (this.source && this.source instanceof ImageObject) {
            return this.create(ctx, callback);
        } else {
            let that = this;
            this.source = new ImageObject(this.source, function (img) {
                if (this.width == 0 || this.height == 0) {
                    this.width = img.width;
                    this.height = img.height;
                }
                callback && callback(that.create(ctx));
            });
            return null;
        }
    }

    /**
     * 创建画板填充图案对象
     * @param {CanvasRenderingContext2D} ctx Context to create pattern
     * @return {CanvasPattern}
     */
    create(ctx, callback) {
        let that = this;
        if (this.type == "image") {
            if (this.source.getState() == ImageState.LOADED) {
                let image = this.source.getImage();
                if (typeof (callback) == "function") {
                    callback(ctx.createPattern(image, this.repeat));
                } else {
                    return ctx.createPattern(image, this.repeat);
                }
            } else {
                if (typeof (callback) == "function") {
                    this.source.setCallback(function (image) {
                        callback(ctx.createPattern(image, that.repeat));
                    });
                } else {
                    // 位图未加载成功，且没有回调，则返回空对象
                    return null;
                }
            }
        } else if (this.type == "simple") {
            return this.createSimple(ctx, {
                "size": Math.max(this.width, this.height),
                "rotation": this.rotation,
                "color": this.color
            })
        } else {
            // 实例化画板，并绘制图案
            let width = this.pixel[1][0] - this.pixel[0][0];
            let height = this.pixel[1][1] - this.pixel[0][1];

            // 此处在建立画板对象时传入viewBox对象，渲染时将根据宽高的信息缩放内部Geometry
            let canvas = createCanvas({ "width": width, "height": height, "viewBox": this.viewBox, "transform": this.patternTransform });
            let pctx = canvas.getContext('2d');
            this.geomList.forEach(element => {
                //if (element instanceof Geometry) {
                element.draw(pctx, element.getStyle());
                //}
            });
            // 返回画板填充图案对象
            return ctx.createPattern(canvas, this.repeat);
        }
    }

    /**
     * 获取具体的像素值，
     * 完全缩放时应先处理对象的坐标转换，然后处理渐变对象的坐标转换
     * @param {*} tool 
     */
    toPixel(tool) {
        // 坐标:[[x,y], [x+width, y+height]]
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        // 执行矩阵变换
        let nc = this._patternTransform(coords);
        // 转换为屏幕坐标
        let pixels = Coordinate.transform2D(tool, nc, false);
        // 存储至实例变量中
        this.pixel = pixels;
    }

    /**
     * 根据gradientTransform属性，在渲染时进行矩阵变换
     */
    _patternTransform(pixels) {
        if (Array.isArray(this.patternTransform)) {
            pixels = Transform.applys(this.patternTransform, pixels);
        }
        // 执行对象应用矩阵变换
        if (Array.isArray(this.objTransform_)) {
            pixels = Transform.applys(this.objTransform_, pixels);
        }
        return pixels;
    }

    /**
     * 对象应用矩阵时，其关联的本填充图案对象也需要进行矩阵变换；
     * 注意：其执行顺序需在 渐变应用矩阵执行之后再来执行该变换
     * @param {*} trans 
     */
    transform(trans) {
        this.objTransform_ = trans.slice();
        // 此处仅记录变换矩阵，在渲染时进行坐标变换
    }

    // 根据矩阵修改坐标
    doTransform(trans) {
        // TOOD
    }

    /**
     * 克隆
     * @returns Object
     */
    clone() {
        return new Pattern(this);
    }

    /**
     * 建立斜线pattern
     * @param {Object} options {lineWidth, size, color, rotation, repeat} 
     */
    createSimple(ctx, options = {}) {
        let lineWidth = (options.lineWidth || 0.5),
            size = (options.size || 40),
            color = (options.color || "#9FFFFF"),
            rotation = (options.rotation || 0),
            repeat = (options.repeat || "repeat");     //可选值为: repeat, repeat-x, repeat-y, no-repeat

        while (rotation < 0) {
            rotation = rotation + 360;
        }
        while (rotation >= 180) {
            rotation = rotation - 180;
        }
        let width, height;
        let x1, y1, x2, y2;
        if (rotation >= 0 && rotation < 90) {
            [x1, y1] = [0, 0];
            x2 = Math.floor(size);
            y2 = Math.floor(x2 * Math.tan(MathUtil.toRadians(rotation)));
            [width, height] = [x2, y2];
        } else if (rotation >= 90 && rotation < 180) {
            x1 = Math.floor(size * Math.tan(MathUtil.toRadians(rotation - 90)));
            y1 = 0;
            x2 = 0;
            y2 = size;
            [width, height] = [x1, y2];
        }

        let canvas = createCanvas({ width: width, height: height });
        let pctx = canvas.getContext('2d');
        pctx.beginPath();
        pctx.moveTo(x1, y1);
        pctx.lineTo(x2, y2);
        pctx.lineWidth = lineWidth;
        pctx.strokeStyle = color;
        pctx.stroke();

        return ctx.createPattern(canvas, repeat);
    }
}

const DATA_LAYER_ID = 10000;
let layerId = DATA_LAYER_ID;
let lastSeqID = 0;
let WATER_LAYER_ZINDEX = DATA_LAYER_ID - 9900;

/**
 * 返回一个唯一字符串
 */
function getUniqueID(prefix, len) {
    if (prefix == null) {
        prefix = "G";
    } else {
        prefix = prefix.replace(dotless, "_");
    }
    lastSeqID += 1;
    len = (len == null ? prefix.length + 7 : (len > prefix.length ? len : 10));
    return prefix + _zeroPad(lastSeqID, len - prefix.length, 32);
}
function _zeroPad(num, len, radix) {
    let str = num.toString(radix || 10);
    while (str.length < len) {
        str = "0" + str;
    }
    return str.toUpperCase();
}

function getLayerId() {
    layerId++;
    return layerId;
}

/**
 * 定义鼠标光标类型<br/>
 * 鼠标移动到“说明”时，可查看该光标的形状
 * @class
 */
const Cursor = {
    /** <span style="cursor:default">Default type</span> */
    DEFAULT: 'default',

    /** <span style="cursor:crosshair">Crosshair type</span> */
    CROSSHAIR: 'crosshair',

    /** <span style="cursor:pointer">Pointer type</span> */
    POINTER: 'pointer',

    /** <span style="cursor:move">Move type</span> */
    MOVE: 'move',

    /** <span style="cursor:text">Text type</span> */
    TEXT: 'text',

    /** <span style="cursor:wait">Wait type</span> */
    WAIT: 'wait',

    /** <span style="cursor:help">Help type</span> */
    HELP: 'help',

    /** <span style="cursor:n-resize">N-resize type</span> */
    N_RESIZE: 'n-resize',

    /** <span style="cursor:ne-resize">NE-resize type</span> */
    NE_RESIZE: 'ne-resize',

    /** <span style="cursor:e-resize">E-resize type</span> */
    E_RESIZE: 'e-resize',

    /** <span style="cursor:se-resize">SE-resize type</span> */
    SE_RESIZE: 'se-resize',

    /** <span style="cursor:s-resize">S-resize type</span> */
    S_RESIZE: 's-resize',

    /** <span style="cursor:sw-resize">SW-resize type</span> */
    SW_RESIZE: 'sw-resize',

    /** <span style="cursor:w-resize">W-resize type</span> */
    W_RESIZE: 'w-resize',

    /** <span style="cursor:nw-resize">NW-resize type</span> */
    NW_RESIZE: 'nw-resize',

    /** <span style="cursor:ns-resize">NS-resize type</span> */
    NS_RESIZE: 'ns-resize',

    /** <span style="cursor:ew-resize">EW-resize type</span> */
    EW_RESIZE: 'ew-resize',

    /** <span style="cursor:nwse-resize">NWSE-resize type</span> */
    NWSE_RESIZE: 'nwse-resize',

    /** <span style="cursor:nesw-resize">NESW-resize type</span> */
    NESW_RESIZE: 'nesw-resize'
};

const defaultCtrlBorderProp = {
    "ml": {    // middle left
        cmd: 4,
        cursor: Cursor.E_RESIZE
    },
    "mr": {    // middle right
        cmd: 6,
        cursor: Cursor.W_RESIZE
    },
    "mb": {    // middle buttom
        cmd: 8,
        cursor: Cursor.S_RESIZE
    },
    "mt": {     // middle top
        cmd: 2,
        cursor: Cursor.N_RESIZE
    },
    "tl": {    // top left
        cmd: 1,
        cursor: Cursor.NW_RESIZE
    },
    "tr": {    // top right
        cmd: 3,
        cursor: Cursor.NE_RESIZE
    },
    "bl": {    // bottom left
        cmd: 7,
        cursor: Cursor.SW_RESIZE
    },
    "br": {    // bottom right
        cmd: 9,
        cursor: Cursor.SE_RESIZE
    },
    "mid": {    // middle
        cmd: 5,
        cursor: Cursor.MOVE
    }
};

/**
 * 边框对象
 */
class GeomBorder {
    constructor(size) {
        /**
         * 控制点
         */
        this.controlPoints = [];

        /**
         * 控制点大小
         */
        this.borderSize = size || 10;
    }

    getControlPoint(coord) {
        let controlPoint;
        for (let i = 0, len = this.controlPoints.length; i < len; i++) {
            let p = this.controlPoints[i];
            let buffer = 4;
            if (Collide.pointRect({ "x": coord[0], "y": coord[1] },
                {
                    "x": p.x - p.width / 2 - buffer, "y": p.y - p.width / 2 - buffer,
                    "width": p.width + 2 * buffer, "height": p.height + 2 * buffer
                })) {
                controlPoint = p;
                break;
            }
        }
        return controlPoint;
    }

    /**
     * 
     * @param {*} ctx 
     * @param {*} options 
     */
    draw(ctx, options) {

        let boxProp = options.prop;
        let bbox = options.extent;

        ctx.save();
        let pixels = [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]];
        ctx.beginPath();
        for (let i = 0; i < pixels.length; i++) {
            let pixel = pixels[i];
            if (i == 0) {
                ctx.moveTo(pixel[0], pixel[1]);
            } else {
                ctx.lineTo(pixel[0], pixel[1]);
            }
        }
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#007F80";
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // 绘制控制点
        let size = this.borderSize;
        let getPosition = function (cmd) {
            let y = (cmd === 1 || cmd === 2 || cmd === 3 ?
                (bbox[1]) :
                (cmd === 4 || cmd === 5 || cmd === 6 ? ((bbox[1] + bbox[3]) / 2) : bbox[3]));
            let x = (cmd === 1 || cmd === 4 || cmd === 7 ?
                (bbox[0]) :
                (cmd === 2 || cmd === 5 || cmd === 8 ? ((bbox[0] + bbox[2]) / 2) : bbox[2]));
            return [x, y];
        };

        // 绘制编辑控件
        let that = this;
        this.controlPoints = [];
        let points = Object.keys(boxProp);
        ctx.fillStyle = "#00E5E6";
        points.forEach(c => {
            let p = boxProp[c];
            if (p.cmd > 0 && p.enabled != false) {
                // cmd == 11 多边形顶点移动编辑
                let pos = p.cmd == 11 ? p.coord : getPosition(p.cmd);
                ctx.fillRect(pos[0] - size / 2, pos[1] - size / 2, size, size);
                that.controlPoints.push({
                    x: pos[0],
                    y: pos[1],
                    width: size,
                    height: size,
                    cursor: p.cursor,
                    cmd: p.cmd,
                    ringIdx: p.ringIdx >= 0 ? p.ringIdx : -1,
                    idx: p.idx == null ? -1 : p.idx
                });
            }
        });

        ctx.restore();
    }
}

/**
 * 通用样式
 * @class
 */
const __GemoStyle = {
    /**
     * 描述画笔（绘制图形）颜色或者样式的属性
     */
    "color": "StringColor|Gradient|Pattern",
    /**
     * 描述填充颜色和样式的属性。
     */
    "fillColor": "StringColor|Gradient|Pattern",
    /**
     * 透明度, 取值范围为: 0~1
     */
    "opacity": 1,
    /**
     * 设置要在绘制新形状时应用的合成操作的类型
     */
    "compositeOperation": "source-over|source-in|source-out|source-atop|" +
        "destination-over|destination-in|destination-out|destination-atop|" +
        "lighter|copy|xor|multiply|screen|overlay|darken|lighten|" +
        "color-dodge|color-burn|hard-light|soft-light|" +
        "difference|exclusion|hue|saturation|color|luminosity",
    /**
     * 模糊效果程度
     */
    "shadowBlur": 0,
    /**
     * 模糊颜色
     */
    "shadowColor": "StringColor",
    /**
     * 阴影水平偏移距离
     */
    "shadowOffsetX": 0,
    /**
     * 阴影垂直偏移距离
     */
    "shadowOffsetY": 0,
    /**
     * 提供模糊、灰度等过滤效果的属性 <br>
     * 详见https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/filter
     */
    "filter": "String",
    /**
     * 运行样式缩放
     */
    "allowStyleScale": false,
    /**
     * 动态路名文本样式
     */
    "labelStyle": null,
    /**
     * 矩阵变换数组，其格式为：<br>
     * [
     *     {"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *     {"action":"scale", "value":[2, 2]}, 
     *     {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}
     * ]
     */
    "transData": []
};

/**
 * 点样式包含的属性
 * @class
 */
const PointStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0
};
Object.assign(PointStyle, __GemoStyle);

/**
 * 线样式包含的属性
 * @class
 */
const LineStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 虚线样式
     */
    "dash": [4, 4],
    /**
     * 虚线偏移量
     */
    "dashOffset": 2,
    /**
     * 边终点的形状
     */
    "lineCap": "butt|square|round",
    /**
     * 连接属性
     */
    "lineJoin": "miter|round|bevel",
    /**
     * 斜接长度
     */
    "miterLimit": 5
};
Object.assign(LineStyle, __GemoStyle);

/**
 * 面样式包含的属性
 * @class
 */
const SurfaceStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 是否填充
     */
    "fillStyle": 1,
    /**
     * 填充规则：一种算法，决定点是在路径内还是在路径外
     */
    "fillRule": "nonzero|evenodd",
    /**
     * 边终点的形状
     */
    "lineCap": "butt|square|round",
    /**
     * 连接属性
     */
    "lineJoin": "miter|round|bevel",
    /**
     * 斜接长度
     */
    "miterLimit": 10
};
Object.assign(SurfaceStyle, __GemoStyle);

/**
 * 符号样式包含的属性
 * @class
 */
const SymbolStyle = {
    /**
     * 符号样式优先
     */
    "symbolPrior": false
};
Object.assign(SymbolStyle, __GemoStyle);

/**
 * 文本样式包含的属性
 * @class
 */
const TextStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 字体名称
     */
    "fontName": "宋体",
    /**
     * 字体大小
     */
    "fontSize": 16,
    /**
     * 是否斜体
     */
    "fontItalic": false,
    /**
     * 是否粗体
     */
    "fontBold": false,
    /**
     * 字体的粗细程度
     */
    "fontWeight": 400,
    /**
     * 是否下划线
     */
    "textDecoration": 1,
    /**
     * 水平对齐方式
     */
    "textAlign": "left|center|right",
    /**
     * 垂直对齐方式
     */
    "textBaseline": "top|middle|buttom|ideographic|alphabetic|hanging",
    /**
     * 最小显示的字体大小
     */
    "minFontSize": 6,
    /**
     * 是否填充优先
     */
    "fillPrior": true,
    /**
     * 字母之间的间距
     */
    "letterSpacing": 0,
    /**
     * 单词之间的间距
     */
    "wordSpacing": 0,
    /**
     * 是否具有边框
     */
    "fontBorder": true,
    /**
     * 边框颜色
     */
    "borderColor": "StringColor",
    /**
     * 边框透明度
     */
    "borderOpacity": 1
};
Object.assign(TextStyle, __GemoStyle);

/**
 * 图像样式包含的属性
 * @class
 */
const ImageStyle = {
    /**
     * 是否具有边框
     */
    "border": true,
    /**
     * 边框颜色
     */
    "borderColor": "StringColor",
    /**
     * 是否平滑
     */
    "imageSmoothingEnabled": true,
    /**
     * 平滑度
     */
    "imageSmoothingQuality": "low|medium|high"
};
Object.assign(ImageStyle, __GemoStyle);

/**
 * 几何类型名称
 */
const GGeometryType = {
    POINT: "Point",
    CIRCLE: "Circle",
    ELLIPSE: "Ellipse",
    POLYLINE: "Polyline",
    POLYGON: "Polygon",
    RECT: "Rect",
    CLIP: "Clip",
    TRIANGLE: "Triangle",
    MARK: "Mark",
    IMAGE: "Image",
    SYMBOL: "Symbol",
    PATH: "Path",
    GROUP: "Group",
    TEXT: "Text"
};

/**
 * 几何名称
 */
const GGShapeType = {
    POINT: 1,
    TEXT: 2,
    LINE: 3,
    SURFACE: 4,
    IMAGE: 5,
    SYMBOL: 6,
    OTHER: 9
};

/**
 * GeoJSON对象类型
 */
const GGGeoJsonType = {
    POINT: "Point",
    MULTI_POINT: "MultiPoint",
    POLYGON: "Polygon",
    MULTI_POLYGON: "MultiPolygon",
    LINE: "LineString",
    MULTI_LINE: "MultiLineString",
};

Object.freeze(GGeometryType);
Object.freeze(GGShapeType);

/**
 * 几何对象类型基础类
 * @abstract
 */
class Geometry extends EventTarget {
    /**
     * 构造函数
     * @param {GGeometryType} type 
     */
    constructor(options = {}, attrNames) {
        super();
        /**
         * GGeometryType
         */
        this.type;

        /**
         * 对象ID
         */
        this.uid;

        /**
         * GGShapeType
         */
        this.shapeType;

        /**
         * 坐标
         */
        this.coords = [];
        this.pixel = [];

        /**
         * 旋转属性
         */
        this.rotation = 0;
        this.origin;
        this.originPixel;

        /**
         * 样式
         */
        this.style = {};
        this._styleScale = 1;

        /**
         * 附加样式
         */
        this.addStyle = null;

        /**
         * 属性
         */
        this.properties = null;

        /**
         * 边框对象（在getBorder()时构造该对象)
         */
        this.ctrlBorder;

        /**
         * 控制外框属性，缺省控制外框包含了9个点，对于某些几何对象可能不需要这么多控制点，可通过该属性控制
         */
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp);

        /**
         * 是否激活状态
         */
        this._focus = false;

        // 初始化
        this.attrNames = attrNames || [];
        // this.initialize(options, attrNames);
    }

    /**
     * 初始化, 通过options赋值给属性
     */
    initialize(options={}) {
        let attrs = ["coords", "rotation", "origin", "properties", "style", "innerSeqId", "uid", "labelStyle"];
        this.attrNames = this.attrNames.concat(attrs);

        // 将options赋值给对象属性
        let that = this;
        this.attrNames.forEach(attr => {
            if (attr == "coords") {
                that.setCoord(options[attr]);
            } else if (attr == "style" && options[attr] != null) {
                that.setStyle(Object.assign({}, options[attr]));
            } else if (attr == "properties" && options[attr] != null) {
                that.properties = Object.assign({}, options[attr]);
            } else if (options[attr] != null) {
                that[attr] = options[attr];
            }
        });

        if (this.uid == null) {
            this.uid = getUniqueID();
        }
    }

    /**
     * 获取对象ID
     */
    getUid() {
        return this.uid;
    }

    /**
     * 获取对象类型
     * @returns GGeometryType类型
     */
    getType() {
        return this.type;
    }

    /**
     * 获取几何类型（点、线、面）
     * @returns String
     */
    getShapeType() {
        return this.shapeType;
    }

    /**
     * 获取对象样式
     * @returns style
     */
    getStyle() {
        return this.style;
    }

    /**
     * 设置对象样式
     * @param {Object} style 
     */
    setStyle(style) {
        if (style instanceof Object) {
            if (style.override === true) {
                this.style = null;
            }
            let keys = [];
            let shapeType = this.getShapeType();
            switch (shapeType) {
                case GGShapeType.POINT:
                    keys = Object.keys(PointStyle);
                    break;
                case GGShapeType.LINE:
                    keys = Object.keys(LineStyle);
                    break;
                case GGShapeType.SURFACE:
                        keys = Object.keys(SurfaceStyle);
                        break;
                case GGShapeType.SYMBOL:
                    keys = Object.keys(SymbolStyle);
                    break;
                case GGShapeType.TEXT:
                    keys = Object.keys(TextStyle);
                    break;
                case GGShapeType.IMAGE:
                    keys = Object.keys(ImageStyle);
                    break;
            }
            Object.keys(style).forEach(prop => {
                if (keys.indexOf(prop) >= 0) {
                    this.style[prop] = style[prop];
                }
            });
        }
    }

    /**
     * 对象是否具有焦点
     * 具有焦点的对象将会绘制外框，通常在编辑的时候需激活对象，然后进行编辑
     * @returns boolean
     */
    isFocus() {
        return this._focus;
    }

    /**
     * 设置对象焦点
     * @param {Boolean} bool 
     */
    setFocus(bool) {
        this._focus = (bool === true);
    }

    /**
     * 获取对象坐标
     * @returns 坐标数组
     */
    getCoord() {
        return this.coords.slice();
    }

    /**
     * 设置对象坐标位置
     * @param {Coord} coord 
     */
    setCoord(coords) {
        if (coords == null) ; else {
            this.coords = coords;
            this.pixel = coords.slice();
        }
    }

    /**
     * 屏幕像素坐标
     * @returns 屏幕像素坐标数组
     */
    getPixel() {
        return this.pixel.length === 0 ? [] : this.pixel.slice();
    }

    /**
     * 设置对象像素位置
     * @param {Coord} pixel 
     */
    setPixel(pixel) {
        this.pixel = pixel;
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, this.coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 样式中的某些属性转换为屏幕坐标
     * @param {Object} tool
     */
    styleToPixel(tool) {
        // 处理transform属性中“旋转”时的‘基点’坐标
        let transData = this.style.transData;
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let obj = transData[i];
                if (obj.action === "rotate") {
                    obj.originPixel = Coordinate.transform2D(tool, obj.origin, false);
                }
            }
        }

        // 处理“旋转”时的‘基点’坐标
        if (this.origin != null && Array.isArray(this.origin) && this.origin.length == 2 && typeof (this.origin[0]) == "number" && typeof (this.origin[1]) == "number") {
            this.originPixel = Coordinate.transform2D(tool, this.origin, false);
        }

        // 处理渐变对象中的坐标
        let that = this;
        let attrName = ["color", "fillColor"];
        attrName.forEach(attr => {
            if (that.style[attr] != null && typeof (that.style[attr]) === "object") {
                if (that.style[attr] instanceof Gradient) {
                    // 缩放时，渐变对象需要同步缩放
                    that.style[attr].toPixel(tool, that);
                } else if (that.style[attr] instanceof Pattern) {
                    // 缩放时，图案对象根据allowStyleScale进行矢量缩放
                    //if (that.style.allowStyleScale === true) {   // (style.allowStyleScale === true ? that._styleScale : 1)
                    that.style[attr].toPixel(tool);
                    //}
                }
            }
        });
    }

    /**
     * 获取对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; ++i) {
            if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
            if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
            if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
            if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
        }
        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 获取符号内部的对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBoxInsideSymbol(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; ++i) {
            if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
            if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
            if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
            if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
        }
        return extent;
    }

    /**
     * 判断某点是否在当前对象的边框内，拾取时可根据此返回值判断是否被拾取到
     * @abstract
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否像素坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] });
    }


    // TODO 可参考 openLayer 中的定义
    distanceTo(geometry, options) {
        ClassUtil.abstract();
    }

    // TODO 可参考 openLayer 中的定义 
    getCentroid() {
        ClassUtil.abstract();
    }

    /**
     * 修改对象属性值
     * @param {*} propName 
     * @param {*} propValue 
     */
    prop(propName, propValue) {
        if (propValue) {
            this[propName] = propValue;
        } else {
            return this[propName];
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return ClassUtil.abstract();
    }

    /**
     * 绘制对象图形
     * @abstract
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ClassUtil.abstract();
    }

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        this.draw(ctx, style, frameState);
    }

    /**
     * 绘制控制外框
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 
     */
    drawBorder(ctx, style) {
        let bbox = this.getBBox(false);
        if (Extent.getWidth(bbox) > 16 || Extent.getHeight(bbox) > 16) {
            this.getBorder().draw(ctx, { "extent": bbox, "prop": this.ctrlBorderProp });
        }
    }

    /**
     * 获取控制外框对象
     * @returns GeomBorder 具有焦点时控制外框对象
     */
    getBorder() {
        if (this.ctrlBorder == null) {
            this.ctrlBorder = new GeomBorder();
        }
        return this.ctrlBorder;
    }

    /**
     * 获取对象的附加样式
     * @returns Object
     */
    getRenderStyle() {
        return this.addStyle;
    }

    /**
     * 设置对象的附加样式
     * @param {Object} style 
     */
    setRenderStyle(style) {
        this.addStyle = (style == null ? null : Object.assign({}, style));
    }

    /**
     * 设置画板样式
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     */
    setContextStyle(ctx, style) {
        // 线宽
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? this._styleScale : 1);
        if (ctx.lineWidth != lineWidth) {
            ctx.lineWidth = lineWidth;
        }

        // 线型
        if (style.dash != null && style.dash.length > 1) {
            let dash = style.dash.slice();
            if (style.allowStyleScale === true) {
                for (let i = 0; i < dash.length; i++) {
                    dash[i] = (dash[i] * this._styleScale);
                }
            }
            ctx.setLineDash(dash);
            if (style.dashOffset != null) {
                ctx.lineDashOffset = style.dashOffset;
            }
        }

        // 描边属性，边框终点的形状，stroke-linecap属性的值有三种可能值：
        // butt用直边结束线段，它是常规做法，线段边界 90 度垂直于描边的方向、贯穿它的终点。(default)
        // square的效果差不多，但是会稍微超出实际路径的范围，超出的大小由stroke-width控制
        // round表示边框的终点是圆角，圆角的半径也是由stroke-width控制的。
        if (style.lineCap != null && style.lineCap != ctx.lineCap) {
            ctx.lineCap = style.lineCap;
        }

        // 连接属性，控制两条描边线段之间,它有三个可用的值:
        // miter: 默认值，表示用方形画笔在连接处形成尖角(default)
        // round: 表示用圆角连接，实现平滑效果
        // bevel: 连接处会形成一个斜接
        if (style.lineJoin != null && style.lineJoin != ctx.lineJoin) {
            ctx.lineJoin = style.lineJoin;
        }

        // 斜接长度（斜接的外尖角和内夹角之间的距离）(default：10)
        if (style.miterLimit != null && style.miterLimit != ctx.miterLimit) {
            ctx.miterLimit = style.miterLimit;
        }

        // 滤镜
        if (style.filter != null) {
            ctx.filter = style.filter;
        }

        // 透明度
        if (style.opacity != null) {
            ctx.globalAlpha = style.opacity;
        }

        // 合成操作类型
        if (style.compositeOperation != null) {
            ctx.globalCompositeOperation = style.compositeOperation;
        }

        // 阴影
        // 模糊效果程度
        if (style.shadowBlur > 0) {
            ctx.shadowBlur = style.shadowBlur;
        }
        // 模糊颜色
        if (style.shadowColor != null && style.shadowColor != "none") {
            ctx.shadowColor = style.shadowColor;
        }
        // 阴影**水平**偏移距离
        if (style.shadowOffsetX > 0) {
            ctx.shadowOffsetX = style.shadowOffsetX;
        }
        // 阴影**垂直**偏移距离
        if (style.shadowOffsetY > 0) {
            ctx.shadowOffsetY = style.shadowOffsetY;
        }
    }

    /**
     * 获取填充/描边的颜色值或特殊效果
     * @param {String|Object} param 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns 如果颜色值为字符串则直接返回颜色，如果颜色值为对象则返回创建的渐变对象
     */
    getColor(param, ctx) {
        if (typeof (param) === "object") {
            if (param instanceof Gradient) {
                return param.create(ctx);
            } else if (param instanceof Pattern) {
                return param.create(ctx);
            }
        } else {
            return param;
        }
    }

    /**
     * 描边和填充
     * @param {Object} style 
     */
    strokeAndFill(ctx, style) {
        // paint-order是一个新的属性，可设置是描边和填充的顺序，包含了三个值：markers stroke fill
        // 如果没有指定值，默认顺序将是 fill, stroke, markers
        // 当只指定一个值的时候，这个值将会被首先渲染，然后剩下的两个值将会以默认顺序渲染，当只指定两个值的时候，这两个值会以指定的顺序渲染，接着渲染剩下的未指定的那个。
        if (style.fillStyle == 1 && style.fillColor != "none") {
            ctx.fillStyle = this.getColor(style.fillColor, ctx);
            if (style.fillRule === 'evenodd') {
                // 填充属性：evenodd, nonzero(缺省值)
                ctx.fill('evenodd');
            } else {
                ctx.fill();
            }
        }
        if (style.color != "none") {  // style.color != null && 
            ctx.strokeStyle = this.getColor(style.color, ctx);
            ctx.stroke();
        }
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} pixels 
     * @param {Boolean} isClosePath 
     */
    drawPolyline(ctx, pixels, isClosePath = false) {
        if (pixels == null) {
            return;
        }

        let num = pixels.length;
        for (let i = 0; i < num; i++) {
            let pixel = pixels[i];
            if (pixel == null) {
                // debugger;
                continue;
            }
            if (i == 0) {
                ctx.moveTo(pixel[0], pixel[1]);
            } else {
                ctx.lineTo(pixel[0], pixel[1]);
            }
        }
        if (isClosePath === true) {
            ctx.closePath();
        }
    }

    /**
     * 画布矩阵变换
     * 渲染时根据对象的transData属性变换画板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} transData 
     * [{"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *  {"action":"scale", "value":[2, 2]}, 
     *  {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}]
     */
    renderTransform(ctx, transData) {
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let prop = transData[i];
                if (prop.action == "translate") {
                    ctx.translate(prop.value[0], prop.value[1]);
                } else if (prop.action === "scale") {
                    ctx.scale(prop.value[0], prop.value[1]);
                } else if (prop.action === "rotate") {
                    let [originX, originY] = (prop.originPixel == null || prop.originPixel.length == 0 ? prop.origin : prop.originPixel);
                    // 移动到原点
                    ctx.translate(originX, originY);
                    // 旋转
                    ctx.rotate(prop.value * Math.PI / 180);
                    // 恢复初始位置
                    ctx.translate(-originX, -originY);
                }
            }
        }
    }

    /**
     * 旋转画板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} rotateArr  [angle, originX, originY]
     */
    renderRotate(ctx, rotateArr) {
        if (Array.isArray(rotateArr) && rotateArr[0] != 0) {
            let [originX, originY] = [0, 0];
            if (rotateArr.length == 1) {          // 中心点旋转
                let bbox = this.getBBox(false);
                let [w, h] = [Extent.getWidth(bbox), Extent.getHeight(bbox)];
                [originX, originY] = [bbox[0] + w / 2, bbox[1] + h / 2];
            } else if (rotateArr.length == 3) {
                // origin旋转
                if (rotateArr[1] != null && rotateArr[2] != null) {
                    [originX, originY] = [rotateArr[1], rotateArr[2]];
                } else {
                    let bbox = this.getBBox(false);
                    [originX, originY] = [bbox[0], bbox[1]];
                }
            }

            // 移动到原点
            ctx.translate(originX, originY);
            // 旋转
            ctx.rotate(MathUtil.toRadians(rotateArr[0]));
            // 恢复初始位置
            ctx.translate(-originX, -originY);
        }
    }

    /**
     * 对象平移
     * @param {*} dx 
     * @param {*} dy 
     */
    translate(dx, dy) {
        // let coords = this.getCoord();
        // let dest = Coordinate.translate(coords, dx, dy);
        // this.setCoord(dest);
        let trans = Transform.create();
        Transform.translate(trans, dx, dy);
        this.transform(trans);
    }

    /**
     * 对象缩放
     * @param {*} sx 
     * @param {*} opt_sy 
     * @param {*} opt_anchor 
     */
    scale(sx, sy, opt_anchor) {
        // let coords = this.getCoord();
        // let dest;
        // if(opt_anchor == null) {
        //     dest = Coordinate.scale(coords, sx, sy);
        // } else {
        //     dest = Coordinate.scaleByAnchor(coords, sx, sy, opt_anchor);
        // }
        // this.setCoord(dest);

        let trans = Transform.create();
        if (opt_anchor) {
            Transform.translate(trans, opt_anchor[0], opt_anchor[1]);
            Transform.scale(trans, sx, sy);
            Transform.translate(trans, - opt_anchor[0], - opt_anchor[1]);
        } else {
            Transform.scale(trans, sx, sy);
        }
        this.transform(trans);
    }

    /**
     * 对象旋转
     * @param {*} angle 
     * @param {*} opt_anchor
     */
    rotate(angle, opt_anchor) {
        // let coords = this.getCoord();
        // let dest;
        // if(opt_anchor == null) {
        //     dest = Coordinate.rotate(coords, angle);
        // } else {
        //     dest = Coordinate.rotateByAnchor(coords, angle, opt_anchor);
        // }
        // this.setCoord(dest);
        let trans = Transform.create();
        Transform.rotateAtOrigin(trans, angle, opt_anchor);
        this.transform(trans);
    }

    /**
     * 将对象移动至某点
     * @param {number} dx
     * @param {number} dy
     */
    moveTo(dx = 0, dy = 0) {
        let bbox = this.getBBox();
        let center = Extent.getCenter(bbox);
        let offsetX = dx - center[0];
        let offsetY = dy - center[1];
        this.translate(offsetX, offsetY);
    }

    /**
     * 坐标变换，将几何图形的每个坐标从一个坐标参考系转换到另一个坐标参照系
     * 对象实例化之后，访问该方法可变换当前对象的坐标等信息
     * 注意: 缩放操作需同比例缩放宽高、字体大小等信息，因此
     *      1 由于某些子类的坐标信息中描述了长度信息（例如：宽、高、半径等），这类子类需要重写该方法，重新计算描述长度的信息
     *      2 Text对象中的fontSize需进行同比例缩放
     *      3 Image对象中的图形宽高需同比例缩放
     * @param {Transform} matrix 
     */
    transform(matrix) {
        let coords = this.getCoord();

        // coords: 坐标变换
        this.setCoord(Coordinate.transform2D(matrix, coords, true));

        // 缩放倍数可以通过矩阵的行列式（即ad-bc）得到。行列式的值就是缩放倍数的平方。如果你要求解每个轴的缩放倍数，那么x轴的缩放倍数就是a，y轴的缩放倍数就是d。
        // 旋转角度可以通过计算矩阵的反正切（atan2(b, a)）得到。这将给出x轴和y轴之间的角度差，即旋转角度。
        // 注意这里计算的是逆时针旋转的角度，如果你想要顺时针的角度，需要加上180度（或在度数为负时取补数）。

        // 椭圆形、字体需根据transform计算倾斜角度
        let angle = MathUtil.toDegrees(Math.atan2(matrix[1], matrix[0]));

        // 矩形、圆形、椭圆形等对象需根据transform重新计算宽高半径等数据
        Transform.rotate(matrix, MathUtil.toRadians(-angle));
        let scale = [matrix[0], matrix[3]];
        Transform.rotate(matrix, MathUtil.toRadians(angle));
        // console.info(this.type, "angle:" + angle, "scale:" + scale.join(", "));

        // 组、图元、路径等对象需根据transform变换其子对象
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let child = this.childGeometrys[i];
                child.transform(matrix);
            }
        }

        // 渐变样式需根据transform变换相应坐标数据
        let fillObj = this.style.fillColor;
        if (fillObj instanceof Gradient) {
            fillObj.transform(matrix);
        } else if (fillObj instanceof Pattern) {
            fillObj.transform(matrix);
        }

        // 样式缩放，例如线宽
        if (this.style.lineWidth > 0 && this.style.allowStyleScale === true) {
            this.style.lineWidth = this.style.lineWidth * Transform.getScale(matrix);
        }
        return { angle, scale }
    }

    // /**
    //  * 获取简化的对象
    //  * @param {*} squaredTolerance 
    //  */
    // getSimplifiedGeometry(squaredTolerance) {
    // }

    /**
     * 获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return this.type;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return this.coords.slice();
    }

    /**
     * 获取对象GeoJSON属性
     * @returns 属性信息
     */
    getGeoJSONProperties() {
        let prop = Object.assign({}, this.properties);
        if (prop.hasOwnProperty("symbol")) {
            delete prop.symbol;
        }
        if (prop.hasOwnProperty("innerSeqId")) {
            delete prop.innerSeqId;
        }
        return prop;
    }

    /**
     * 转换为GeoJSON格式坐标
     * @returns JS对象
     * @abstract
     */
    toGeoJSON() {
        return {
            "type": "Feature",
            "geometry": {
                "type": this.getGeoJSONType(),
                "coordinates": this.getGeoJSONCoord()
            },
            "properties": this.getGeoJSONProperties()
        }
    }

    /**
     * well-known text
     * https://www.cnblogs.com/duanxingxing/p/5144257.html
     */
    toWKT() {

    }

    /**
     * 获取对象字符串
     * @returns 坐标数组
     */
    toString() {
        return JSON.stringify(this.toData());
    }

    /**
     * 获取当前对象属性
     * @returns Object
     */
    toData(options = {}) {
        let decimals = options.decimals == null ? 2 : options.decimals;
        let more = options.more === true;
        let that = this;
        let obj = {};
        let extract = options.id ? ["innerSeqId"] : ["innerSeqId", "uid"];
        obj.type = this.getType();
        this.attrNames.forEach(attr => {
            if (that[attr] != null && extract.indexOf(attr) < 0) {
                if (attr === "coords") {
                    obj[attr] = Coordinate.toFixed(that[attr], decimals);
                } else if (typeof (that[attr]) == "object") {
                    if (Array.isArray(that[attr])) {
                        if (that[attr].length > 0) {
                            obj[attr] = that[attr];
                        }
                    } else if (Object.keys(that[attr]).length > 0) {
                        obj[attr] = that[attr];
                    }
                } else {
                    if ((typeof (that[attr]) == "number")) {
                        if (that[attr] != 0) {
                            obj[attr] = MathUtil.toFixed(that[attr], decimals);
                        }
                    } else {
                        obj[attr] = that[attr];
                    }
                }
            }
        });

        // 如果对象包含了x和y属性，则无需返回coords属性
        if (obj.x != null && obj.y != null) {
            delete obj.coords;
        }
        if (more === true) {
            obj.pixel = this.getPixel();
        }
        return obj;
    }
}

/**
 * 特殊点的渲染类，包括正方形、三角形、五角星、圆形、笑脸、红桃、方块、梅花、黑桃
 */
class PointSharp {

    /**
     * 绘制圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 直径
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawRound(ctx, x, y, size, style) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.strokeStyle = style.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制正方形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawSquare(ctx, x, y, size, style) {
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        // 正方形坐标
        let x1 = - size / 2;
        let x2 = x1 + size;
        let y1 = - size / 2;
        let y2 = y1 + size;
        let coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    static _drawPolygon(ctx, coords, style) {
        let num = coords.length;
        ctx.beginPath();
        for (let i = 0; i < num; i++) {
            let point = coords[i];
            if (i == 0) {
                ctx.moveTo(point[0], point[1]);
            } else {
                ctx.lineTo(point[0], point[1]);
            }
        }
        ctx.closePath();
        ctx.lineWidth = style.lineWidth == null ? 1 : style.lineWidth;
        if (style.fillColor != null && style.fillColor != "none") {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        }
        if (style.color != null && style.color != "none") {
            ctx.strokeStyle = style.color;
            ctx.stroke();
        }
    }

    /**
     * 绘制三角形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高/底边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawTriangle(ctx, x, y, size, style) {
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }
        let x1 = 0;
        let y1 = - size / 2;
        let x2 = x1 + size / 2;
        let y2 = y1 + size;
        let x3 = x1 - size / 2;
        let y3 = y1 + size;
        let coords = [[x1, y1], [x2, y2], [x3, y3], [x1, y1]];
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    /**
     * 绘制五角星
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawStar(ctx, x, y, size, style) {
        if (size == null || size < 4) size = 4;
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        //设半径：r=50，圆心：x=100，y=100 
        //1 最上一个顶点坐标为：x1=100,y1=50                                 (x,y-r);
        //2 左边第二个顶点坐标为：x2=x-50*sin72度，y2=y-50*cos72度            (x-r*sin72度，y-r*cos72度);
        //3 右边第二个顶点坐标为：x3=x+50*sin72度，y3=y-50*cos72度            (x+r*sin72度,y-r*cos72度);   
        //4 左边第三个顶点坐标为：x4=x-50*sin36度，y4=y+50*cos36度            (x-r*sin36度,y+r*cos36度);
        //5 右边第三个顶点坐标为：x5=x+50*sin36度，y5=y+50*cos36度            (x+r*sin36度，y+r*cos36度) 

        let rad1 = Math.sin(0.4 * Math.PI);     //sin(72)  
        let rad2 = Math.cos(0.4 * Math.PI);     //cos(72)  
        let rad3 = Math.sin(0.2 * Math.PI);     //sin(36)  
        let rad4 = Math.cos(0.2 * Math.PI);     //cos(36)  
        let r = size / 2;
        let x1 = 0; let y1 = 0 - r;             // 1 上
        let x2 = 0 - r * rad3; let y2 = 0 + r * rad4;      // 3 左下
        let x3 = 0 + r * rad1; let y3 = 0 - r * rad2;      // 5 右上
        let x4 = 0 - r * rad1; let y4 = 0 - r * rad2;      // 2 左上
        let x5 = 0 + r * rad3; let y5 = 0 + r * rad4;      // 4 右下

        let coords = [[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x5, y5], [x1, y1]];
        if (style.fillColor == null || style.fillColor === "none") { //空心刷子
            style.fillColor = style.color;
        } else {
            style.color = style.fillColor;
        }

        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    /**
     * 规则形状，包括五角星、三角形等
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} points 点数 
     * @param {int} radius 半径 
     * @param {int} radius2 凹半径 
     * @param {Object} style 风格
     */
    static drawRegularShape(ctx, x, y, points, radius = 16, radius2 = 0, style) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(x, y);

        ctx.beginPath();
        if (radius2 !== radius) {
            points = 2 * points;
        }

        let lineWidth = style.lineWidth == null ? 0 : style.lineWidth;

        for (let i = 0; i <= points; i++) {
            let angle0 = i * 2 * Math.PI / points - Math.PI / 2 + (style.angle == null ? 0 : style.angle);
            let radiusC = i % 2 === 0 ? radius : radius2;
            ctx.lineTo(radiusC * Math.cos(angle0), radiusC * Math.sin(angle0));
        }

        if (style.fillColor != null && style.fillColor != "none") {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        } else {
            ctx.strokeStyle = style.color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
        ctx.closePath();
        ctx.restore();
    }

    /**
     * 绘制任意正多边形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 正多边形外切圆的直径
     * @param {int} sideNum 边数
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawRegularPolygon(ctx, x, y, size, sideNum, style) {
        let coords = this._getEdgeCoords(size, sideNum);
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    // 求正多边形坐标 （size为正多边形外切圆的直径，sideNum为多边形的边数）
    static _getEdgeCoords(size, sideNum) {
        let vPoint = [];                            //vPoint为返回得到的多边形状的各顶点坐标
        let arc = Math.PI / 2 - Math.PI / sideNum;
        let r = size / 2;
        for (let i = 0; i < sideNum; i++) {
            arc = arc - 2 * Math.PI / sideNum;
            vPoint[i] = [r * Math.cos(arc), r * Math.sin(arc)];
        }
        return vPoint;
    }

    // 求正多边形坐标 （r为正多边形的边长，sideNum为多边形的边数）
    static _getPloyCoord(r, sideNum) {
        let vPoint = [];                            //vPoint为返回得到的多边形状的各顶点坐标
        let R = (r / 2) / Math.sin(Math.PI / sideNum);

        if (sideNum % 2 == 1) {
            vPoint.push([0, R]);
            let arc = Math.PI / 2;
            for (let i = 0; i < sideNum - 1; i++) {
                arc -= (2 * Math.PI) / sideNum;
                vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            }
        } else {
            let arc = Math.PI / 2 - Math.PI / sideNum;
            vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            for (let i = 0; i < sideNum - 1; i++) {
                arc -= (2 * Math.PI) / sideNum;
                vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            }
        }
        return vPoint;
    }

    /**
     * 绘制笑脸
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 笑脸直径
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawFace(ctx, x, y, size, style = {}) {
        if (size < 10) size = 10;    // 笑脸的最小大小为10
        size = size / 20;            // size：眼睛大小(半径)，笑脸大小是眼睛大小的10倍

        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        ctx.beginPath();
        ctx.arc(0, 0, 10 * size, 0, Math.PI * 2, true);  // Outer circle
        ctx.moveTo(7 * size + 0, 0);
        ctx.arc(0, 0, 7 * size, 0, Math.PI, false);    // Mouth
        ctx.moveTo(0 - 2 * size, 0 - 2.5 * size);
        ctx.arc(0 - 3 * size, 0 - 2.5 * size, size, 0, Math.PI * 2, true);  // Left eye
        ctx.moveTo(0 + 4 * size, 0 - 2.5 * size);
        ctx.arc(0 + 3 * size, 0 - 2.5 * size, size, 0, Math.PI * 2, true);  // Right eye
        ctx.closePath();
        ctx.strokeStyle = style.color; //"rgb(0,0,0)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 绘制黑桃
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawSpade(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        let bottomWidth = width * 0.7;
        let topHeight = height * 0.7;
        let bottomHeight = height * 0.3;

        ctx.beginPath();
        ctx.moveTo(x, y);

        // top left of spade          
        ctx.bezierCurveTo(
            x, y + topHeight / 2,             // control point 1
            x - width / 2, y + topHeight / 2, // control point 2
            x - width / 2, y + topHeight      // end point
        );

        // bottom left of spade
        ctx.bezierCurveTo(
            x - width / 2, y + topHeight * 1.3, // control point 1
            x, y + topHeight * 1.3,             // control point 2
            x, y + topHeight                    // end point
        );

        // bottom right of spade
        ctx.bezierCurveTo(
            x, y + topHeight * 1.3,             // control point 1
            x + width / 2, y + topHeight * 1.3, // control point 2
            x + width / 2, y + topHeight        // end point
        );

        // top right of spade
        ctx.bezierCurveTo(
            x + width / 2, y + topHeight / 2,  // control point 1
            x, y + topHeight / 2,              // control point 2
            x, y                               // end point
        );
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom of spade
        ctx.beginPath();
        ctx.moveTo(x, y + topHeight);
        ctx.quadraticCurveTo(
            x, y + topHeight + bottomHeight,                  // control point
            x - bottomWidth / 2, y + topHeight + bottomHeight // end point
        );
        ctx.lineTo(x + bottomWidth / 2, y + topHeight + bottomHeight);
        ctx.quadraticCurveTo(
            x, y + topHeight + bottomHeight,                  // control point
            x, y + topHeight                                  // end point
        );
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制红心
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawHeart(ctx, x, y, size, style) {
        ctx.save();

        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        ctx.beginPath();
        let topCurveHeight = height * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
            x, y,
            x - width / 2, y,
            x - width / 2, y + topCurveHeight
        );

        // bottom left curve
        ctx.bezierCurveTo(
            x - width / 2, y + (height + topCurveHeight) / 2,
            x, y + (height + topCurveHeight) / 2,
            x, y + height
        );

        // bottom right curve
        ctx.bezierCurveTo(
            x, y + (height + topCurveHeight) / 2,
            x + width / 2, y + (height + topCurveHeight) / 2,
            x + width / 2, y + topCurveHeight
        );

        // top right curve
        ctx.bezierCurveTo(
            x + width / 2, y,
            x, y,
            x, y + topCurveHeight
        );

        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制梅花
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawClub(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        let circleRadius = width * 0.3;
        let bottomWidth = width * 0.5;

        // top circle
        ctx.beginPath();
        ctx.arc(x, y + circleRadius + (height * 0.05), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom right circle
        ctx.beginPath();
        ctx.arc(x + circleRadius, y + (height * 0.6), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom left circle
        ctx.beginPath();
        ctx.arc(x - circleRadius, y + (height * 0.6), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // center filler circle
        ctx.beginPath();
        ctx.arc(x, y + (height * 0.5), circleRadius / 2, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom of club
        ctx.beginPath();
        ctx.moveTo(x, y + (height * 0.6));
        ctx.quadraticCurveTo(x, y + height, x - bottomWidth / 2, y + height);
        ctx.lineTo(x + bottomWidth / 2, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + (height * 0.6));
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制方块
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawDiamond(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);

        // top left edge
        ctx.lineTo(x - width / 2, y);
        // bottom left edge
        ctx.lineTo(x, y + height / 2);
        // bottom right edge
        ctx.lineTo(x + width / 2, y);
        // closing the path automatically creates the top right edge
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制花朵
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {int} sideNum 花瓣数，最小为3， 最大为8
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawFlower(ctx, x, y, size, sideNum, style) {
        ctx.save();

        if (sideNum < 3) sideNum = 4;
        if (sideNum > 8) sideNum = 6;
        size--;

        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        ctx.beginPath();

        // 绘制花瓣
        for (let n = 0; n < sideNum; n++) {
            let theta1 = ((Math.PI * 2) / sideNum) * (n + 1);
            let theta2 = ((Math.PI * 2) / sideNum) * (n);
            let x1 = (size * Math.sin(theta1)) + x;
            let y1 = (size * Math.cos(theta1)) + y;
            let x2 = (size * Math.sin(theta2)) + x;
            let y2 = (size * Math.cos(theta2)) + y;
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
        }
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }

        // 绘制花蕾
        ctx.beginPath();
        ctx.arc(x, y, size / 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

// 没有指定大小时该点的直径
let __defaultPointSize = 1;

/**
 * 点对象类型
 * @extends Geometry
 */
class Point extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 点坐标, 其格式为[x,y]或[[x,y],[x+size]]
     * @param {Object} style {}
     * @param {Object} properties 
     */
    constructor(options, attrs) {
        // 简单点{size, pointType}
        // 图标点{src, centerAsOrigin, height, width}

        // 属性初始化
        super(options, attrs || ["x", "y", "rotation", "pointType", "size", "src", "centerAsOrigin", "width", "height"]);

        // 类型
        this.type = GGeometryType.POINT;

        // 几何类型
        this.shapeType = GGShapeType.POINT;

        // 初始化
        this.initialize(options);

        // 点类型
        this.pointType;

        // 图标url，当存在该值时，点类型为图标
        this.src;

        // 坐标点是否位于图标的中心，默认:true
        this.centerAsOrigin = this.centerAsOrigin || true;

        // 坐标
        this.x;
        this.y;
        this.size = (this.size == null ? 0 : this.size);
        this.drawsize = 0; //最近画图时的大小

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // width, height
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width + this.size, this.y + this.height + this.size]];

        // 控制外框属性
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp, { "ml": { enabled: false }, "mr": { enabled: false }, "mb": { enabled: false }, "mt": { enabled: false } });
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.size, this.y + this.size]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致异常
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     if (this.coords.length > 1) {
        //         // width, height
        //         this.width = this.coords[1][0] - this.coords[0][0];
        //         this.height = this.coords[1][1] - this.coords[0][1];
        //         this.size = Math.max(this.width, this.height);
        //     }
        // }

        this.pixel = this.coords.slice();
    }

    /**
     * 设置点尺寸
     * @param {*} size 
     */
    setSize(size) {
        this.size = size;
        this.width = this.height = Math.abs(size);
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POINT;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return this.coords.slice();
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords;
        if (this.width > 0 && this.height > 0) {
            coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        } else {
            coords = [[this.x, this.y], [this.x + this.size, this.y + this.size]];
        }
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let size = Math.abs(coords[1][0] - coords[0][0]) / 2;
        let extent = [coords[0][0] - size, coords[0][1] - size, coords[0][0] + size, coords[0][1] + size];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        if (this.src != null) {
            if (this.centerAsOrigin === true) {
                if (this.width <= 0)
                    return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] - this.drawsize / 2, "y": objCoords[0][1] - this.drawsize / 2, "width": this.drawsize, "height": this.drawsize });
                else
                    return Collide.pointRect({ "x": point[0], "y": point[1] },
                        { "x": objCoords[0] - this.width / 2, "y": objCoords[1] - this.height / 2, "width": this.width, "height": this.height });
            } else {
                if (this.width <= 0)
                    return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] - this.drawsize / 2, "y": objCoords[0][1] - this.drawsize, "width": this.drawsize, "height": this.drawsize });
                else
                    return Collide.pointRect({ "x": point[0], "y": point[1] },
                        { "x": objCoords[0] - this.width / 2, "y": objCoords[1] - this.height, "width": this.width, "height": this.height });
            }
        } else {
            let size = Math.abs(Math.max(objCoords[1][0] - objCoords[0][0], objCoords[1][1] - objCoords[0][1]) / 2);
            if (size <= 0)
                size = this.drawsize;
            return Collide.pointCircle({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0], "y": objCoords[0][1], "radius": size });
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Point(this);
    }

    /**
     * 点的的矩阵变换，除了坐标的变换，还需对Size或宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];
        this.size = this.size * transResult.scale[0];

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制点
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // 如果样式中包含了imgFileUrl属性，则该点类型为位图类型
        let imageUrl = this.src != null ? this.src : style.imgUrl;
        if (imageUrl != null) {
            // 第一个回调是当位图已经load完成的时候的回调，
            // 第二个则位图当时还未load完成，异步加载之后的loaded回调；
            // 考虑到还有其他shape渲染在位图之上，因此此处需要重新渲染整个图层
            let that = this;
            frameState.getLayer().getSource().loadImage(imageUrl, function (image) {
                that.drawImage(ctx, style, image, frameState);
            }, function () {
                frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
            });
        } else {
            let pixel = this.getPixel();
            let [x, y] = pixel[0];
            let size = Math.max(pixel[1][0] - x, pixel[1][1] - y);

            // 当从外部数据加载数据时（例如geojson），pointType属性可能从style赋值
            let pointType = this.pointType != null ? this.pointType : style.pointType;

            // 注：size = 0 时取样式中的大小或缺省大小
            if (size == 0) {
                //size = (pointType < 3 || pointType > 16 ? __defaultPointSize : __defaultPointSize);
                size = style.size == null ? __defaultPointSize : style.size;
            } else if (size < 0) {
                // 当size为负值时，其像素大小为其size的绝对值大小
                size = Math.abs(this.size);
            } else if (size > 1200) {
                console.warn("point size is too large");
            }
            style.angle = this.rotation;  // 旋转角度

            //根据样式pointType确定点类型
            if (pointType == 1) {
                PointSharp.drawRegularShape(ctx, x, y, 3, size / 2, size / 6, style);
            } else if (pointType == 2) {
                PointSharp.drawRegularShape(ctx, x, y, 4, size / 2, size / 6, style);
            } else if (pointType == 3) {
                PointSharp.drawTriangle(ctx, x, y, size, style);
            } else if (pointType == 4) {
                PointSharp.drawSquare(ctx, x, y, size, style);
            } else if (pointType == 5) {
                PointSharp.drawStar(ctx, x, y, size, style);
            } else if (pointType >= 6 && pointType <= 10) {
                PointSharp.drawRegularPolygon(ctx, x, y, size, pointType, style);
            } else if (pointType == 11) {
                PointSharp.drawFace(ctx, x, y, size, style);
            } else if (pointType == 12) {
                PointSharp.drawSpade(ctx, x, y, size, style);
            } else if (pointType == 13) {
                PointSharp.drawHeart(ctx, x, y, size, style);
            } else if (pointType == 14) {
                PointSharp.drawClub(ctx, x, y, size, style);
            } else if (pointType == 15) {
                PointSharp.drawDiamond(ctx, x, y, size, style);
            } else if (pointType >= 16 && pointType <= 19) {
                PointSharp.drawFlower(ctx, x, y, size, pointType - 12, style);
            } else if (pointType < 0) {
                return;
            } else {
                ctx.save();
                ctx.beginPath();
                let radius = size / 2;
                ctx.arc(x, y, radius, 0, Math.PI * 2, true);
                // 设置样式并渲染出来
                if (style.fillColor != null) style.fillStyle = 1;
                this.setContextStyle(ctx, style);
                this.strokeAndFill(ctx, style);
                ctx.restore();
            }
            this.drawsize = size;

            // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
            // Object.assign(this.style, { "renderWidth": size, "renderHeight": size });
        }
    }

    /**
     * 在Canvas上绘制Image
     */
    drawImage(ctx, style, image) {
        let height = this.height > 0 ? this.height : this.size > 0 ? this.size : image.height;
        let width = this.width > 0 ? this.width : this.size > 0 ? this.size * (image.width / image.height) : image.width;

        // 图标大小
        if (style.scale > 0) {
            width = width * style.scale;
            height = height * style.scale;
        }

        // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
        // Object.assign(this.style, { "renderWidth": width, "renderHeight": height });

        //Object.assign(style, { width, height });
        let pixels = this.getPixel();
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，矩形的旋转需通过画板的旋转来实现
        if (this.rotation != null && this.rotation != 0) {
            this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
        }

        ctx.translate(pixels[0][0], pixels[0][1]);
        if (this.centerAsOrigin === true) {
            // 坐标位置=位图中心点
            ctx.drawImage(image, - width / 2, - height / 2, width, height);
        } else {
            // 坐标位置=位图下边中间
            ctx.drawImage(image, - width / 2, - height, width, height);
        }
        ctx.restore();
        this.drawsize = width;
    }
}

/**
 * 多边形对象类型
 * @extends Geometry
 */
class Polygon extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * options.coords 坐标, 其格式为多个LineRing，例如：[[[x,y],[x,y],……]]
     */
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.POLYGON;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);
    }

    /**
     * 设置对象坐标位置
     * 多边形坐标格式为LineRing数组，如果传递的多边形是LineRing，而不是LineRing数组，则需将其加入LineRing数组中   2023/12/17
     * @param {Coord} coord 
     */
    setCoord(coords) {
        if (coords == null) ; else {
            if (Array.isArray(coords)) {
                if (coords.length >= 2 && !Array.isArray(coords[0][0]) && !Array.isArray(coords[0][1])) {
                    this.coords = [coords];
                    this.pixel = [coords.slice()];
                } else {
                    this.coords = coords;
                    this.pixel = coords.slice();
                }
            }
        }
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool);
        
        let ringIdx = 0;  // 多边形坐标：环索引号
        let idx = 0;      // 多边形坐标：某个环的坐标索引号
        
        let that = this;
        this.ctrlBorderProp = {};

        let pixels = this.getPixel();
        pixels.forEach(pixel => {
            pixel.forEach(point => {
                // cmd == 11 多边形顶点移动编辑
                that.ctrlBorderProp[idx] = { "cmd": 11, "idx": idx, "ringIdx": ringIdx, "cursor": Cursor.POINTER, "coord": point.slice() };
                idx++;
            });
            ringIdx++;
            idx = 0;
        });
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return [this.coords.slice()];
    }

    /**
     * 获取对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let m = 0, mm = coords.length; m < mm; m++) {
            let coord = coords[m];
            for (let i = 0, ii = coord.length; i < ii; i++) {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        // 粗略检测：判定点与Bounding Box的碰撞
        let bbox = this.getBBox(useCoord);
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            // 精细检测：判定点与多边形的碰撞
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            return Collide.pointPoly({ "x": point[0], "y": point[1] }, objCoords[0]);
        } else {
            return false;
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Polygon(this);
    }

    /**
     * 绘制多边形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                let bbox = this.getBBox();
                let anchor = Extent.getCenter(bbox);
                this.renderRotate(ctx, [this.rotation, anchor[0], anchor[1]]);
                // this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);  // 左上角
            }
        }

        // 绘制多边形(多边形坐标包含了多个LineRing)
        let pixels = this.getPixel();
        ctx.beginPath();
        pixels.forEach(pixel => {
            this.drawPolyline(ctx, pixel, true);
        });

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style, frameState);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }
}

/**
 * 以多边形方式返回圆的坐标
 * @param {Array} center
 * @param {number} radius 
 * @param {int} sides 
 */
function circle2LineRing(center, radius, sides = 32) {
    let coordinates = [];
    let startAngle = 0;
    for (let i = 0; i <= sides; ++i) {
        let angle = startAngle + i * 2 * Math.PI / sides;
        coordinates[i] = [];
        coordinates[i][0] = center[0] + (radius * Math.cos(angle));
        coordinates[i][1] = center[1] + (radius * Math.sin(angle));
    }
    return coordinates;
}

/**
 * 以多边形形式返回矩形坐标
 * @param x
 * @param y
 * @param width
 * @param height
 */
function rect2LineRing(x, y, width, height) {
    let coordinates = [];
    coordinates.push([x, y]);
    coordinates.push([x + width, y]);
    coordinates.push([x + width, y + height]);
    coordinates.push([x, y + height]);
    coordinates.push([x, y]);
    return coordinates;
}

/**
 * 获取规则形状坐标，包括五角星、四角星等
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} center 中心点X坐标
 * @param {int} sides 点数 
 * @param {int} radius 半径 
 * @param {int} radius2 凹半径 
 * @param {Object} style 风格
 */
function getStarLineRing(center, radius = 16, radius2 = 0, sides) {
    let coordinates = [];
    let startAngle = 0;
    sides = sides * 2;
    if (radius2 == null || radius2 == 0) radius2 = radius / 3;
    for (let i = 0; i < sides; i++) {
        let radiusC = (i % 2 === 0 ? radius : radius2);
        let angle = startAngle + i * 2 * Math.PI / sides;
        coordinates[i] = [];
        coordinates[i][0] = center[0] + (radiusC * Math.cos(angle));
        coordinates[i][1] = center[1] + (radiusC * Math.sin(angle));
    }
    return coordinates;
}

/**
 * 圆对象类型
 * @extends Geometry
 */
class Circle extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        //console.info("x="+ options.x + ",y=" + options.y + ",radius=" + options.radius);
        // 属性初始化
        super(options, ["x", "y", "radius", "rotation", "startAngle", "endAngle", "anticlockwise"]);

        // 类型
        this.type = GGeometryType.CIRCLE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x = this.x || 0;        this.y = this.y || 0;
        // 半径
        this.radius = this.radius || 0;

        // 旋转角度（圆弧的属性）
        this.rotation = this.rotation || 0;

        // 起止角度
        this.startAngle = this.startAngle || 0;
        this.endAngle = this.endAngle || 360;

        // 是否逆时针方向绘制
        this.anticlockwise = (this.anticlockwise == null ? false : this.anticlockwise === true);

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.radius, this.y + this.radius]];

        // 控制外框属性
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp, { "ml": { enabled: false }, "mr": { enabled: false }, "mb": { enabled: false }, "mt": { enabled: false } });
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x - this.radius, this.y - this.radius], [this.x + this.radius, this.y + this.radius]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标, 其格式为[x,y,r] 或 [[x,y], [x+r, y+r]]
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x - this.radius, this.y - this.radius]);
                this.coords.push([this.x + this.radius, this.y + this.radius]);
            }
        } else if (coords.length === 2 && Array.isArray(coords[0]) && Array.isArray(coords[1])) {
            this.coords = coords.slice();
        } else {
            throw new Error("坐标格式错误");
        }

        // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 1) {
        //     // radius
        //     this.radius = Math.max(this.coords[1][0] - this.coords[0][0], this.coords[1][1] - this.coords[0][1]) / 2;
        //     // x, y
        //     this.x = this.coords[0][0] + this.radius;
        //     this.y = this.coords[0][1] + this.radius;
        // }

        this.pixel = this.coords.slice();
    }

    getCenter() {
        return [this.x, this.y];
    }

    getRadius() {
        return this.radius;
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return circle2LineRing([this.x, this.y], this.radius, 32);
    }

    // /**
    //  * 返回对象边界
    //  * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
    //  * @returns {Extent} extent
    //  */
    // getBBox(useCoord = true) {
    //     let coords = useCoord === false ? this.getPixel() : this.getCoord();
    //     let r = Math.abs(coords[1][0] - coords[0][0]);
    //     let extent = [coords[0][0] - r, coords[0][1] - r, coords[0][0] + r, coords[0][1] + r];

    //     // 计算线宽对bbox的影响
    //     let style = this.getStyle();
    //     let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth/2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
    //     return Extent.buffer(extent, lineWidth);
    // }
    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = [coords[0][0], coords[0][1], coords[1][0], coords[1][1]];
        return extent;
    }


    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let radius = Math.max((objCoords[1][0] - objCoords[0][0]), (objCoords[1][1] - objCoords[0][1])) / 2;
        return Collide.pointCircle({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] + radius, "y": objCoords[0][1] + radius, "radius": radius });
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Circle(this);
    }

    /**
     * 圆的矩阵变换，除了坐标的变换，还需进行半径大小的缩放 （coords[1]为半径大小，在矩阵变换之后，需重新计算该值）
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // radius, x, y
        this.radius = this.radius * transResult.scale[0];
        this.x = this.coords[0][0] + this.radius;
        this.y = this.coords[0][1] + this.radius;

        // 变换rx, ry        
        this.coords[1][0] = this.coords[0][0] + this.radius * 2;
        this.coords[1][1] = this.coords[0][1] + this.radius * 2;
    }

    /**
     * 绘制圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式{color, fillStyle, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // 画板变换
        this.renderTransform(ctx, style);
        // draw
        ctx.save();
        let pixel = this.getPixel();
        let x = (pixel[0][0] + pixel[1][0]) / 2;
        let y = (pixel[0][1] + pixel[1][1]) / 2;
        let radius = (pixel[1][0] - pixel[0][0]) / 2;
        this.drawRound(ctx, x, y, radius, style);
        ctx.restore();
    }

    /**
     * 绘制圆
     */
    drawRound(ctx, x, y, radius, style) {
        if (radius < 1) return;
        // radius = radius - (style.lineWidth == null ? 1 : style.lineWidth);  // 是否要限制当线宽对半径的影响
        ctx.beginPath();
        radius = radius > 1 ? radius : 1;
        ctx.arc(x, y, radius, MathUtil.toRadians(this.startAngle), MathUtil.toRadians(this.endAngle), this.anticlockwise);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
    }
}

/**
 * 椭圆对象类型
 * @extends Geometry
 */
class Ellipse extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "radiusX", "radiusY", "rotation", "startAngle", "endAngle", "anticlockwise"]);

        // 类型
        this.type = GGeometryType.ELLIPSE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x = this.x || 0;
        this.y = this.y || 0;

        // 半径
        this.radiusX = this.radiusX || 0;
        this.radiusY = this.radiusY || this.radiusX;

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 起止角度
        this.startAngle = this.startAngle || 0;
        this.endAngle = this.endAngle || 360;

        // 是否逆时针方向绘制
        this.anticlockwise = (this.anticlockwise == null ? false : this.anticlockwise === true);

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.radiusX, this.y + this.radiusY]];
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.radiusX, this.y + this.radiusY]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标值
     * @param {Array} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.radiusX, this.y + this.radiusY]);
            }
        } else if (coords.length === 4) {
            this.coords.push([coords[0], coords[1]]);
            this.coords.push([coords[0] + coords[2], coords[1] + coords[3]]);
        } else if (coords.length === 2 && Array.isArray(coords[0]) && Array.isArray(coords[1])) {
            this.coords = coords.slice();
        } else {
            throw new Error("椭圆的坐标格式错误");
        }

        // 以下代码在执行旋转操作后调用本方法时会造成rx和ry的值受到影响，导致变形
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 1) {
        //     // x, y
        //     [this.x, this.y] = this.coords[0];
        //     // rx, ry
        //     this.radiusX = this.coords[1][0] - this.coords[0][0];
        //     this.radiusY = this.coords[1][1] - this.coords[0][1];
        // }

        this.pixel = this.coords.slice();
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coords = this.getCoord();
        return circle2LineRing(coords[0], Math.abs(coords[1][0] - coords[0][0]), 32);
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let rx = Math.abs(coords[1][0] - coords[0][0]),
            ry = Math.abs(coords[1][1] - coords[0][1]);
        let extent = [coords[0][0] - rx, coords[0][1] - ry, coords[0][0] + rx, coords[0][1] + ry];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let rx = Math.abs(coords[1][0] - coords[0][0]),
            ry = Math.abs(coords[1][1] - coords[0][1]);
        let extent = [coords[0][0] - rx, coords[0][1] - ry, coords[0][0] + rx, coords[0][1] + ry];
        return extent;
    }


    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            return Collide.pointEllipse({ "x": point[0], "y": point[1] },
                { "x": objCoords[0][0], "y": objCoords[0][1], "radiusX": (objCoords[1][0] - objCoords[0][0]), "radiusY": (objCoords[1][1] - objCoords[0][1]) });
        } else {
            return false;
        }
    }
    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Ellipse(this);
    }

    /**
     * 椭圆的矩阵变换，除了坐标的变换，还需进行半径大小的缩放 （coords[1]为半径大小，在矩阵变换之后，需重新计算该值）
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);
        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换rx, ry
        this.radiusX = this.radiusX * transResult.scale[0];
        this.radiusY = this.radiusY * transResult.scale[1];
        this.coords[1][0] = this.coords[0][0] + this.radiusX;
        this.coords[1][1] = this.coords[0][1] + this.radiusY;

        // 渲染时旋转
        this.rotation = this.rotation > 0 ? [this.rotation + transResult.angle] : transResult.angle;
    }

    /**
     * 绘制椭圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式{color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 指定路径
        ctx.beginPath();
        this.drawEllipse(ctx, style);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
        ctx.restore();
    }

    /**
     * 绘制椭圆
     */
    drawEllipse(ctx, style) {
        let pixel = this.getPixel();
        let [x, y, rx, ry] = [pixel[0][0], pixel[0][1], Math.abs(pixel[1][0] - pixel[0][0]), Math.abs(pixel[1][1] - pixel[0][1])];

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // ellipse
        ctx.ellipse(x, y, rx, ry,
            MathUtil.toRadians(this.rotation),
            MathUtil.toRadians(this.startAngle),
            MathUtil.toRadians(this.endAngle),
            this.anticlockwise);

        // // 使用圆+画板变形的方式绘制椭圆
        //ctx.transform(1, 0, 0, ry / rx, 0, 0);
        //ctx.arc(x, y, rx, startAngle, endAngle, !clockwise);
    }
}

/**
 * 箭头渲染类
 */
class Arrow {
    constructor(options = {}) {
        /**
         * 箭头大小
         */
        this.arrowSize = options.arrowSize || 20;

        /**
         * 空心箭头的背景色
         */
        this.background = options.background || "transparent";
    }

    /**
     * 实心三角形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    triangleSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 4);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    /**
     * 空心三角形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    triangle(ctx, point) {
        ctx.save();
        if (ctx.lineWidth < 2) {
            ctx.lineWidth = 2;
        }
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 4);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 4);
        ctx.closePath();
        ctx.stroke();
        //ctx.fillStyle = this.background || '#ffffff';
        //ctx.fill();
        ctx.restore();
    }

    /**
     * 实心圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    circleSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.arc(point.x - r, point.y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    
    /**
     * 空心圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    circle(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.arc(point.x - r, point.y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = this.background || '#ffffff';
        ctx.fill();
        ctx.restore();
    }

    /**
     * 实心菱形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    diamondSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y);
        ctx.lineTo(fromX + r, point.y - r / 2);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX + r, point.y + r / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    /**
     * 空心菱形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    diamond(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y);
        ctx.lineTo(fromX + r, point.y - r / 2);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX + r, point.y + r / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = this.background || '#ffffff';
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * 单线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    line(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 3);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 上线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineUp(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 下线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineDown(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y + this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * 上线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineEnd(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - this.arrowSize / 2);
        ctx.lineTo(point.x, point.y + this.arrowSize / 2);
        ctx.stroke();
        ctx.restore();
    }
}

let _lastCode;

/**
 * polyline裁切
 * @param {*} points 
 * @param {*} bounds 
 * @returns Array
 */
function clipSegments(points, bounds) {
    let clippedPoints = [];
    let clippedPointsArray = [];
    //clippedPoints.push(points[0]);
    for (let i = 1, ii = points.length; i < ii; i++) {
        let a = points[i - 1];
        let b = points[i];
        let v = clipSegment(a, b, bounds, false);
        if (v != false) {
            if (clippedPoints.length == 0)
                clippedPoints.push(v[0]);
            clippedPoints.push(v[1]);
        } else {
            if (clippedPoints.length > 0) {
                clippedPointsArray.push(clippedPoints);
                clippedPoints = [];
            }
        }
    }
    if (clippedPoints.length > 0) {
        clippedPointsArray.push(clippedPoints);
        clippedPoints = [];
    }
    return clippedPointsArray;
}

// @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
// Clips the segment a to b by rectangular bounds with the
// [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
// (modifying the segment points directly!). Used by Leaflet to only show polyline
// points that are on the screen or near, increasing performance.
function clipSegment(p1, p2, bounds, useLastCode = false) {
    let a = p1, b = p2;
    let codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
        codeB = _getBitCode(b, bounds),

        codeOut, p, newCode;

    // save 2nd code to avoid calculating it on the next segment
    _lastCode = codeB;

    while (true) {
        // if a,b is inside the clip window (trivial accept)
        if (!(codeA | codeB)) {
            return [a, b];
        }

        // if a,b is outside the clip window (trivial reject)
        if (codeA & codeB) {
            return false;
        }

        // other cases
        codeOut = codeA || codeB;
        p = _getEdgeIntersection(a, b, codeOut, bounds);
        newCode = _getBitCode(p, bounds);

        if (codeOut === codeA) {
            a = p;
            codeA = newCode;
        } else {
            b = p;
            codeB = newCode;
        }
    }
}

/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a separate method for it.
 */
function clipPolygon(points, bounds) {
    let clippedPoints,
        edges = [1, 4, 2, 8],
        i, j, k,
        a, b,
        len, edge, p;

    for (i = 0, len = points.length; i < len; i++) {
        points[i]._code = _getBitCode(points[i], bounds);
    }

    // for each edge (left, bottom, right, top)
    for (k = 0; k < 4; k++) {
        edge = edges[k];
        clippedPoints = [];

        for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            a = points[i];
            b = points[j];

            // if a is inside the clip window
            if (!(a._code & edge)) {
                // if b is outside the clip window (a->b goes out of screen)
                if (b._code & edge) {
                    p = _getEdgeIntersection(b, a, edge, bounds);
                    p._code = _getBitCode(p, bounds);
                    clippedPoints.push(p);
                }
                clippedPoints.push(a);

                // else if b is inside the clip window (a->b enters the screen)
            } else if (!(b._code & edge)) {
                p = _getEdgeIntersection(b, a, edge, bounds);
                p._code = _getBitCode(p, bounds);
                clippedPoints.push(p);
            }
        }
        points = clippedPoints;
    }

    return points;
}

function _getBitCode(p, bounds) {
    let code = 0;

    if (p[0] < bounds[0]) { // left
        code |= 1;
    } else if (p[0] > bounds[2]) { // right
        code |= 2;
    }

    if (p[1] < bounds[1]) { // bottom
        code |= 4;
    } else if (p[1] > bounds[3]) { // top
        code |= 8;
    }

    return code;
}

function _getEdgeIntersection(a, b, code, bounds) {
    let dx = b[0] - a[0],
        dy = b[1] - a[1],
        min = [bounds[0], bounds[1]],
        max = [bounds[2], bounds[3]],
        x, y;

    if (code & 8) { // top
        x = a[0] + dx * (max[1] - a[1]) / dy;
        y = max[1];

    } else if (code & 4) { // bottom
        x = a[0] + dx * (min[1] - a[1]) / dy;
        y = min[1];

    } else if (code & 2) { // right
        x = max[0];
        y = a[1] + dy * (max[0] - a[0]) / dx;

    } else if (code & 1) { // left
        x = min[0];
        y = a[1] + dy * (min[0] - a[0]) / dx;
    }

    return [Math.round(x), Math.round(y)];
}

/**
 * 折线对象类型
 * @extends Geometry
 */
class Polyline extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x,y],[x,y],……]
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["startArrowType", "startArrowSize", "endArrowType", "endArrowSize"]);

        // 类型
        this.type = GGeometryType.POLYLINE;

        // 几何类型
        this.shapeType = GGShapeType.LINE;

        // 初始化
        this.initialize(options);

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 箭头样式
        this.startArrowType = this.startArrowType || 0;
        this.startArrowSize;
        this.endArrowType = this.endArrowType || 0;
        this.endArrowSize = this.endArrowSize || this.startArrowSize;
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool);
        let idx = 0;
        let that = this;
        this.ctrlBorderProp = {};
        this.pixel.forEach(point => {
            that.ctrlBorderProp[idx] = { "cmd": 11, "idx": idx, "cursor": Cursor.POINTER, "coord": point.slice() };
            idx++;
        });
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.LINE;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return coord;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bool = false;

        // 粗略检测：判定点与Bounding Box的碰撞
        let bbox = this.getBBox(useCoord);
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let num = objCoords.length;
        if (num == 2) { //两点的水平或垂直线段，pointRect会失败。
            if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[0][0], "y1": objCoords[0][1], "x2": objCoords[1][0], "y2": objCoords[1][1] }, (useCoord ? 0.5 : 2)))
                return true;
            else
                return false;
        }
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            for (let i = 0; i < num - 1; i++) {
                if (objCoords[i] == null) {
                    continue;
                }
                if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[i][0], "y1": objCoords[i][1], "x2": objCoords[i + 1][0], "y2": objCoords[i + 1][1] }, (useCoord ? 0.5 : 2))) {
                    bool = true;
                    break;
                }
            }
        }
        return bool;
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Polyline(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth, dash, dashOffset}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center, size}
     */
    draw(ctx, style, frameState) {
        ctx.save();
        let pixels = this.getPixel();

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                let bbox = this.getBBox();
                let anchor = Extent.getCenter(bbox);
                this.renderRotate(ctx, [this.rotation, anchor[0], anchor[1]]);
            }
        }

        // 绘制折线
        if (!(style.lineWidth < 0)) {
            ctx.beginPath();
            this.drawPolyline(ctx, pixels);

            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);

            // 绘制箭头
            if (this.startArrowType > 0) {
                this.drawArrow(ctx, [pixels[pixels.length - 2], pixels[pixels.length - 1]], this.startArrowType, this.startArrowSize);
            }
            if (this.endArrowType > 0) {
                this.drawArrow(ctx, [pixels[1], pixels[0]], this.endArrowType, this.endArrowSize);
            }
        }

        // 绘制动态路名
        if (style.labelStyle != null && this.properties.name != null && this.properties.name.length > 0) {
            _drawDynamicRoadName(ctx, this, style.labelStyle, frameState);
        }
        ctx.restore();
    }

    /**
     * 绘制箭头
     * @param {*} ctx 
     * @param {*} segment 
     * @param {*} arrawType 
     * @param {*} arraySize 
     */
    drawArrow(ctx, segment, arrawType, arraySize) {
        let [x0, y0] = [segment[0][0], segment[0][1]];
        let [x1, y1] = [segment[1][0], segment[1][1]];
        let [w, h] = [x1 - x0, y1 - y0];
        let arrow = new Arrow({ "arrowSize": arraySize });

        // 计算直线与X轴正方形的夹角角度
        let angle;
        if (w >= 0 && h >= 0) {
            angle = MathUtil.toDegrees(Math.atan(h / w));
        } else if (w < 0 && h >= 0) {
            angle = 180 - MathUtil.toDegrees(Math.atan(h / -w));
        } else if (w < 0 && h < 0) {
            angle = MathUtil.toDegrees(Math.atan(h / w)) + 180;
        } else {
            angle = 360 - MathUtil.toDegrees(Math.atan(-h / w));
        }

        switch (arrawType) {
            case 1:   // 实心三角箭头
                arrow.triangleSolid(ctx, { "x": x1, "y": y1, angle });
                break;
            case 2:   // 实心菱形箭头
                arrow.diamondSolid(ctx, { "x": x1, "y": y1, angle });
                break;
            case 9:   // 距离标识
                arrow.lineEnd(ctx, { "x": x1, "y": y1, angle });
                break;
            default:   // 单线箭头
                arrow.line(ctx, { "x": x1, "y": y1, angle });
                break;
        }
    }
}

/**
 * 绘制动态路名
 * @private
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} pixels 
 * @param {Object} labelStyle 
 * @param {Object} frameState 
 */
function _drawDynamicRoadName(ctx, obj, labelStyle = {}, frameState) {
    let s = obj.properties.name.split("");
    if (s.length > 0) {
        let size = frameState.size;
        let pixels = obj.getPixel();
        let bounds = [0, 0, size.width, size.height]; //屏幕宽高
        let style = Object.assign({
            "font": "16px 黑体",
            "fillColor": "black",
            "color": "#CCCCCC",
            "lineWidth": 1,
            "textAlign": "center",
            "textBaseline": "middle"
        }, labelStyle);

        let inpixelsarray = clipSegments(pixels, bounds);
        for (let i = 0; i < inpixelsarray.length; i++) {
            let inpixels = inpixelsarray[i];
            if (inpixels != null && inpixels.length >= 2) {
                let one_ratio = 1.0 / (s.length + 1);
                let length = Measure.getLength(inpixels);
                let textwidth = parseInt(style.font) * 1.2;
                if (one_ratio * length < textwidth)
                    continue;
                if (Math.abs(inpixels[0][0] - inpixels[inpixels.length - 1][0]) < Math.abs(inpixels[0][1] - inpixels[inpixels.length - 1][1])) {
                    if (inpixels[0][1] - inpixels[inpixels.length - 1][1] > 0) //从下到上
                        inpixels = Coordinate.reverse(inpixels);
                } else {
                    if (inpixels[0][0] - inpixels[inpixels.length - 1][0] > 0) //从右到左
                        inpixels = Coordinate.reverse(inpixels);
                }
                ctx.save();
                ctx.font = style.font;
                ctx.fillStyle = style.fillColor;
                ctx.strokeStyle = style.color;
                ctx.lineWidth = style.lineWidth;
                ctx.textAlign = style.textAlign;
                ctx.textBaseline = style.textBaseline;

                let sratio = 0;
                if (one_ratio * length > textwidth) {
                    sratio = ((length - (s.length - 1) * textwidth) / 2) / length;
                    one_ratio = textwidth / length;
                }
                let ratio = sratio;
                for (let i = 0; i < s.length; i++) {
                    ratio += one_ratio;
                    let val = Measure.solveRatioPointOnPolyline(ratio, inpixels);
                    if (val != null) {
                        ctx.strokeText(s[i], val.out[0], val.out[1]);
                        ctx.fillText(s[i], val.out[0], val.out[1]);
                    }
                }
                ctx.restore();
            }
        }
    }
}

/**
 * 路径对象类型
 * @extends Geometry
 */
class Path extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x,y],[x,y],……]
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["commands", "childGeometrys"]);

        // 类型
        this.type = GGeometryType.PATH;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.MULTI_LINE;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return coord;
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; i++) {
            if (Array.isArray(coord[i][0])) {
                for (let j = 0, jj = coord[i].length; j < jj; j++) {
                    if (coord[i][j][0] < extent[0]) { extent[0] = coord[i][j][0]; }
                    if (coord[i][j][1] < extent[1]) { extent[1] = coord[i][j][1]; }
                    if (coord[i][j][0] > extent[2]) { extent[2] = coord[i][j][0]; }
                    if (coord[i][j][1] > extent[3]) { extent[3] = coord[i][j][1]; }
                }
            } else {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let childCoord = useCoord === false ? this.childGeometrys[i].getPixel() : this.childGeometrys[i].getCoord();
                let rx = Math.abs(childCoord[0][0] - childCoord[1][0]), ry = Math.abs(childCoord[0][1] - childCoord[1][1]);
                let childExtent = [childCoord[0][0] - rx, childCoord[0][1] - ry, childCoord[0][0] + rx, childCoord[0][1] + ry];
                extent = Extent.merge(childExtent, extent);
            }
        }

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; i++) {
            if (Array.isArray(coord[i][0])) {
                for (let j = 0, jj = coord[i].length; j < jj; j++) {
                    if (coord[i][j][0] < extent[0]) { extent[0] = coord[i][j][0]; }
                    if (coord[i][j][1] < extent[1]) { extent[1] = coord[i][j][1]; }
                    if (coord[i][j][0] > extent[2]) { extent[2] = coord[i][j][0]; }
                    if (coord[i][j][1] > extent[3]) { extent[3] = coord[i][j][1]; }
                }
            } else {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let childCoord = useCoord === false ? this.childGeometrys[i].getPixel() : this.childGeometrys[i].getCoord();
                let rx = Math.abs(childCoord[0][0] - childCoord[1][0]), ry = Math.abs(childCoord[0][1] - childCoord[1][1]);
                let childExtent = [childCoord[0][0] - rx, childCoord[0][1] - ry, childCoord[0][0] + rx, childCoord[0][1] + ry];
                extent = Extent.merge(childExtent, extent);
            }
        }
        return extent;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] });
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
        this.setPixel(Coordinate.transform2D(tool, this.coords, false));
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                this.childGeometrys[i].toPixel(tool);
            }
        }
    }

    /**
     * 对象平移
     * @param {*} deltaX 
     * @param {*} deltaY 
     */
    translate(deltaX, deltaY) {
        let coords = this.getCoord();
        let dests = [];
        for (let i = 0, len = coords.length; i < len; i++) {
            let dest = Coordinate.translate(coords[i], deltaX, deltaY);
            dests.push(dest);
        }
        this.setCoord(dests);
    }

    /**
     * 对象缩放
     * @param {*} sx 
     * @param {*} opt_sy 
     * @param {*} opt_anchor 
     */
    scale(sx, sy, opt_anchor) {
        let coords = this.getCoord();
        let dests = [];
        for (let i = 0, len = coords.length; i < len; i++) {
            let dest = Coordinate.scaleByAnchor(coords[i], sx, sy, opt_anchor);
            dests.push(dest);
        }
        this.setCoord(dests);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Path(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth, dash, dashOffset, startArrowSize, endArrowSize}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        style = Object.assign({}, Path.defaultStyle, style);
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 绘制路径
        this.drawPath(ctx, this.getPixel(), style);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        // // 绘制外框
        // let pixels = this.getBBox(false);
        // ctx.strokeRect(pixels[0], pixels[1], pixels[2] - pixels[0], pixels[3] - pixels[1]);

        ctx.restore();
    }

    drawPath(ctx, pixels, style) {
        if (pixels == null) {
            return;
        }

        let num = pixels.length;
        ctx.beginPath();
        let ellIdx = 0;
        for (let i = 0; i < num; i++) {
            let pixel = pixels[i];
            let cmd = this.commands[i].toUpperCase();
            if (cmd == "M") {
                ctx.moveTo(pixel[0][0], pixel[0][1]);
                for (let m = 1; m < pixel.length; m += 1) {
                    ctx.lineTo(pixel[m][0], pixel[m][1]);
                }
            } else if (cmd == "L" || cmd == "H" || cmd == "V") {
                for (let m = 0; m < pixel.length; m += 1) {
                    ctx.lineTo(pixel[m][0], pixel[m][1]);
                }
            } else if ((cmd == "Z")) {
                ctx.closePath();
            } else if (cmd == "C" || cmd == "S") {
                for (let m = 0; m < pixel.length; m += 3) {
                    ctx.bezierCurveTo(pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1], pixel[m + 2][0], pixel[m + 2][1]);
                }
            } else if (cmd == "Q" || cmd == "T") {
                for (let m = 0; m < pixel.length; m += 2) {
                    ctx.quadraticCurveTo(pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1]);
                }
            } else if (cmd == "A") {
                let idx = 0;
                // 椭圆弧线
                for (let m = ellIdx; m < this.childGeometrys.length; m++) {
                    let obj = this.childGeometrys[m];
                    // let objStyle = obj.getStyle();
                    // let objPixel = obj.getPixel();
                    // let [x, y, rx, ry] = [objPixel[0][0], objPixel[0][1], Math.abs(objPixel[1][0] - objPixel[0][0]), Math.abs(objPixel[1][1] - objPixel[0][1])];
                    // let angle = (objStyle.angle == null ? 0 : objStyle.angle);
                    //  //let rotation = objStyle.rotation == null ? angle * Math.PI / 180 : objStyle.rotation * Math.PI / 180;
                    // let rotation = (Array.isArray(objStyle.rotate) && objStyle.rotate.length > 0) ? MathUtil.toRadians(objStyle.rotate[0] + angle) : MathUtil.toRadians(angle);
                    // let startAngle = objStyle.startAngle == null ? 0 : objStyle.startAngle;
                    // let endAngle = objStyle.endAngle == null ? Math.PI * 2 : objStyle.endAngle;
                    // let clockwise = objStyle.clockwise == null ? true : objStyle.clockwise;
                    // ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle, !clockwise);
                    // if(LOG_LEVEL > 5) console.info("ctx.ellipse(%d, %d, %d, %d, %f, %f, %f, %s)", x, y, rx, ry, rotation, startAngle, endAngle, !clockwise);

                    // 访问椭圆对象绘制椭圆弧 
                    obj.drawEllipse(ctx, obj.getStyle());
                    ellIdx++;
                    idx++;
                    if (idx >= pixel.length) break;
                }
            } else {
                continue;
            }
        }
    }
}

/**
 * 折线的缺省风格
 */
Path.defaultStyle = { "lineWidth": 1 };

/**
 * 折线对象-数据类型
 * @extends Geometry
 */
class MultiPolyline extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords       // 坐标, 其格式为[[[x,y],[x,y],……],[[x,y],[x,y],……]]
     * @param {Object} style 
     * @param {Object} properties 
     */
    //constructor(coords = [], style, properties = {}) {
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.POLYLINE;

        // 几何类型
        this.shapeType = GGShapeType.LINE;

        // 初始化
        this.initialize(options);
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.MULTI_LINE;
    }

    addLine(line, style) {
        this.coords.push(line.getCoord());
        this.pixel.push(line.pixel);

        let lineStyle = Object.assign({}, style);
        for (let k in lineStyle) {
            if (lineStyle[k] == null) {
                delete lineStyle[k];
            }
        }
        Object.assign(this.style, lineStyle);
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let x = 0, xx = coords.length; x < xx; x++) {
            for (let i = 0, ii = coords[x].length; i < ii; ++i) {
                if (coords[x][i][0] < extent[0]) { extent[0] = coords[x][i][0]; }
                if (coords[x][i][1] < extent[1]) { extent[1] = coords[x][i][1]; }
                if (coords[x][i][0] > extent[2]) { extent[2] = coords[x][i][0]; }
                if (coords[x][i][1] > extent[3]) { extent[3] = coords[x][i][1]; }
            }
        }

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
  * 返回对象边界
  * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
  * @returns {Extent} extent
  */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let x = 0, xx = coords.length; x < xx; x++) {
            for (let i = 0, ii = coords[x].length; i < ii; ++i) {
                if (coords[x][i][0] < extent[0]) { extent[0] = coords[x][i][0]; }
                if (coords[x][i][1] < extent[1]) { extent[1] = coords[x][i][1]; }
                if (coords[x][i][0] > extent[2]) { extent[2] = coords[x][i][0]; }
                if (coords[x][i][1] > extent[3]) { extent[3] = coords[x][i][1]; }
            }
        }
        return extent;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Point} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        let bool = false;
        for (let x = 0, xx = coords.length; x < xx; x++) {
            let objCoords = coords[x];
            for (let i = 0, ii = objCoords.length; i < ii - 1; i++) {
                if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[i][0], "y1": objCoords[i][1], "x2": objCoords[i + 1][0], "y2": objCoords[i + 1][1] }, (useCoord ? 0.5 : 2))) {
                    bool = true;
                    break;
                }
            }
            if (bool === true) break;
        }
        return bool;
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new MultiPolyline(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth, dash, dashOffset, startArrowSize, endArrowSize}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();
        let pixels = this.getPixel();

        if (pixels != null && pixels.length > 0) {
            // 画板变换
            this.renderTransform(ctx, style.transData);
            // 绘制
            this.drawMultiPolyline(ctx, pixels, style);

            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);
        }

        ctx.restore();
    }

    drawMultiPolyline(ctx, pixels, style) {
        ctx.beginPath();
        for (let x = 0, xx = pixels.length; x < xx; x++) {
            let cpixels = pixels[x];
            if (cpixels == null) { continue; }
            for (let i = 0, ii = cpixels.length; i < ii; i++) {
                let pixel = cpixels[i];
                if (pixel == null) {
                    continue;
                }
                if (i == 0) {
                    ctx.moveTo(pixel[0], pixel[1]);
                } else {
                    ctx.lineTo(pixel[0], pixel[1]);
                }
            }
        }
    }
}

/**
 * 等腰三角形
 * @extends Geometry
 */
class Triangle extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x1,y1],[x2,y2]]   对角两点坐标
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rotation"]);

        // 类型
        this.type = GGeometryType.TRIANGLE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;
    }

    /**
     * 转换为屏幕坐标
     * 当对象既包含了x,y属性又包含了coords属性时，x, y, width, height 属性优先于 coords属性
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("矩形坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
            }

            // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
            // setCoord时更新对象几何属性
            // if (Array.isArray(this.coords) && this.coords.length > 1) {
            //     // x, y
            //     [this.x, this.y] = this.coords[0];
            //     // width, height
            //     this.width = this.coords[1][0] - this.coords[0][0];
            //     this.height = this.coords[1][1] - this.coords[0][1];
            // }
        }
        this.pixel = this.coords.slice();
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let pixels = this.getCoord();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);
        let coord1 = [pixels[0][0] + width / 2, pixels[0][1]];
        let coord2 = [pixels[0][0], pixels[0][1] + height];
        let coord3 = [pixels[0][0] + width, pixels[0][1] + height];
        return [[coord1, coord2, coord3, coord1]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let width = Math.abs(objCoords[1][0] - objCoords[0][0]);
        let height = Math.abs(objCoords[1][1] - objCoords[0][1]);
        let coord1 = [objCoords[0][0] + width / 2, objCoords[0][1]];
        let coord2 = [objCoords[0][0], objCoords[0][1] + height];
        let coord3 = [objCoords[0][0] + width, objCoords[0][1] + height];
        return Collide.pointPoly({ "x": point[0], "y": point[1] }, [coord1, coord2, coord3, coord1]);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Triangle(this);
    }

    /**
     * 三角形的矩阵变换，除了坐标的变换，还需对Size或宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制三角形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转(旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 绘制三角形
        let coord1 = [pixels[0][0] + width / 2, pixels[0][1]];
        let coord2 = [pixels[0][0], pixels[0][1] + height];
        let coord3 = [pixels[0][0] + width, pixels[0][1] + height];

        ctx.beginPath();
        this.drawPolyline(ctx, [coord1, coord2, coord3, coord1]);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }
}

/**
 * 矩形对象类型
 * @extends Geometry
 */
class Rect extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rx", "ry", "rotation", "originX", "originY"]);

        // 类型
        this.type = GGeometryType.RECT;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x;
        this.y;

        // 宽和高
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 圆角矩形半径
        this.rx = this.rx || 0;
        this.ry = this.ry || this.rx;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height], [this.x + this.rx, this.y + this.ry]];
    }

    /**
     * 转换为屏幕坐标
     * 当对象既包含了x,y属性又包含了coords属性时，x, y, width, height 属性优先于 coords属性
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        if (this.rx > 0 || this.ry > 0) {
            coords.push([this.x + this.rx, this.y + this.ry]);
        }
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("矩形坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
                this.coords.push([this.x + this.rx, this.y + this.ry]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0] + this.width, coords[1] + this.height];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else if (coords.length === 3) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1]) && Array.isArray(coords[2])) {
                    this.coords = coords.slice();   // 圆角矩形
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
                // if (coords.length === 4) 
                // this.coords[0] = [coords[0], coords[1]];
                // this.coords[1] = [coords[0] + coords[2], coords[1] + coords[3]];
            }

            // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致矩形变形
            // // setCoord时更新对象几何属性
            // if (Array.isArray(this.coords) && this.coords.length > 1) {
            //     // x, y
            //     [this.x, this.y] = this.coords[0];

            //     // width, height
            //     this.width = this.coords[1][0] - this.coords[0][0];
            //     this.height = this.coords[1][1] - this.coords[0][1];
            //     // rx, ry
            //     this.rx = (this.coords.length === 3 ? this.coords[2][0] - this.coords[0][0] : 0);
            //     this.ry = (this.coords.length === 3 ? this.coords[2][1] - this.coords[0][1] : 0);
            // }
        }
        this.pixel = this.coords.slice();
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return [[[coord[0][0], coord[0][1]], [coord[0][0], coord[1][1]], [coord[1][0], coord[1][1]], [coord[1][0], coord[0][1]], [coord[0][0], coord[0][1]]]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let width = Math.abs(objCoords[1][0] - objCoords[0][0]);
        let height = Math.abs(objCoords[1][1] - objCoords[0][1]);
        let rect = [objCoords[0][0], objCoords[0][1], width, height];
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": rect[0], "y": rect[1], "width": rect[2], "height": rect[3] });
    }

    /**
     * 克隆对象
     * @returns Rect
     */
    clone() {
        return new Rect(this);
    }

    /**
     * 矩形的的矩阵变换，除了坐标的变换，还需对宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 处理圆角矩形
        if (this.rx > 0 || this.ry > 0) {
            this.rx = this.rx * transResult.scale[0];
            this.ry = this.ry * transResult.scale[1];
        }

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制矩形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth, angle}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 计算矩形属性
        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转(矩形旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 不提供自旋转功能（之前的功能会导致渐变功能错误） 2023.9.9
        if (pixels.length > 2) {
            // 圆角矩形
            let rx = pixels[2][0] - pixels[0][0];
            let ry = pixels[2][1] - pixels[0][1];
            this.roundRect(ctx, pixels[0][0], pixels[0][1], width, height, Math.max(rx, ry));
        } else {
            ctx.beginPath();
            this.drawPolyline(ctx, [pixels[0], [pixels[1][0], pixels[0][1]], pixels[1], [pixels[0][0], pixels[1][1]]], true);
        }

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }

    /**
     * 绘制圆角矩形
     * https://blog.csdn.net/weixin_44953227/article/details/111561677
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} w 
     * @param {Number} h 
     * @param {Number} r 
     */
    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) { r = w / 2; }
        if (h < 2 * r) { r = h / 2; }
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

/**
 * 标记对象-数据类型
 * @extends Point
 */
class Mark extends Point {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[x,y]，坐标位置为位图下边中间
     * @param {Object} style 
     * @param {Object} properties 
     * @param {String} src
     */
    constructor(options) {
        // 属性初始化
        super(options, ["filePath"]);

        // 类型
        this.type = GGeometryType.MARK;

        // 几何类型
        this.shapeType = GGShapeType.IMAGE;

        // 初始化
        this.initialize(options);

        // 文件路径
        this.filePath = (this.filePath == null ? "./images/icon.png" : this.filePath);

        // 旋转角度
        this.angle = 0;

        // 标记大小
        this.size = 16;
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }
        this.pixel = this.coords.slice();
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let r = this.size / 2;
        let extent = [coord[0] - r, coord[1] - r, coord[0] + r, coord[1] + r];
        return extent;
    }

    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        return getBBox(useCoord);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Mark(this);
    }

    /**
     * 绘制图标
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor}
     */
    draw(ctx, style, frameState) {
        if (ctx == null) ctx = this._context;

        let scale = 1;
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // image
        let imgUrl;
        if (typeof (this.filePath) === "object") {
            if (this.filePath.length > 0) {
                // 根据比例尺选择图标
                let bgScale = frameState.scale;
                if (bgScale > 75000) {
                    scale = 0.8;
                    imgUrl = this.filePath[this.filePath.length - 1];
                } else if (bgScale > 40000) {
                    imgUrl = this.filePath[(this.filePath.length > 1 ? 1 : 0)];
                } else {
                    imgUrl = this.filePath[0];
                    scale = (bgScale < 1200 ? 2 : 1);
                }
            } else {
                throw new Error("marker iconFile argument error", this);
            }
        } else {
            imgUrl = this.filePath;
        }

        // 位图缩放
        Object.assign(style, { scale, imgUrl });

        // 渲染Image
        let imageObj = frameState.getLayer().getSource().getImageFromCache(imgUrl);
        if (imageObj != null && imageObj.getState() === ImageState.LOADED) {
            this.drawImage(ctx, style, imageObj.getImage(), frameState);
        } else {
            let that = this;
            // 加入缓存中，以便于下次使用
            frameState.getLayer().getSource().add2Cache(style.imgUrl);
            // 同时使用ImageLoader下载和渲染图片
            ImageLoader.load(imgUrl, function (image) {
                that.drawImage(ctx, style, image, frameState);
            }, function () {
                // frameState.getLayer().getGraph().getRenderer().renderFrame(false);
                frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
            });
        }
        ctx.restore();
    }

    /**
     * 在Canvas上绘制Image
     */
    drawImage(ctx, style, image, frameState) {
        super.drawImage(ctx, style, image, frameState);

        let pixel = this.getPixel();
        // 将点信息添加至usemap对象中
        let usemap = frameState.getLayer().getGraph().mainCanvasMarkObj;
        if (usemap !== undefined) {
            let width = this.style.renderWidth;
            let height = this.style.renderHeight;
            let imageSize = (width > height ? width / 2 : height / 2);
            let title = (this.properties == null || this.properties.title == null ? null : this.properties.title);
            let click = (this.properties == null || this.properties.click == null ? null : this.properties.click);
            let mouseUp = (this.properties == null || this.properties.mouseUp == null ? null : this.properties.mouseUp);
            let mouseDown = (this.properties == null || this.properties.mouseDown == null ? null : this.properties.mouseDown);
            let mouseMove = (this.properties == null || this.properties.mouseMove == null ? null : this.properties.mouseMove);
            let area = $("<area shape =\"circle\" layerid=\"" + frameState.getLayer().getZIndex() + "\" coords =\"" + (pixel[0] - width / 2 + width / 2) + "," + (pixel[1] - height + height / 2) + "," + imageSize + "\"" + (title === null ? "" : " title=\"" + title + "\"") + "/>");
            if (click != null || mouseUp != null) {
                area.bind('mouseup', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        if (mouseUp != null) {
                            rtn = mouseUp(e);
                        } else {
                            rtn = click(e);
                        }
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            }
            if (mouseDown != null) {
                area.bind('mousedown', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        rtn = mouseDown(e);
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            } else {
                area.bind('mousedown', function (e) {
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return false;
                });
            }
            if (mouseMove != null) {
                area.bind('mousemove', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        rtn = mouseMove(e);
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            } else {
                area.bind('mousemove', function (e) {
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return false;
                });
            }
            $(usemap).append(area);
        }
    };
}

/**
 * 图形对象类型
 * @extends Geometry
 */
class Image extends Geometry {
    /**
     * 构造函数
     * @param {Coord} coords 
     * @param {Object} style 两角坐标, 其格式为[[x1,y1],[x2,y2]]
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["src", "x", "y", "width", "height", "sx", "sy", "sWidth", "sHeight", "rotation", "originX", "originY", "uid"]);

        // 类型
        this.type = GGeometryType.IMAGE;

        // 几何类型
        this.shapeType = GGShapeType.IMAGE;

        // 初始化
        this.initialize(options);

        // 唯一ID，如果包含了this.uid属性，则该值为唯一ID，否则为this.src
        this.uid = (this.uid == null ? (this.src == null ? (Date.now() + "_" + Math.random() * 10000) : this.src) : this.uid);

        // 图片路径
        this.src;

        // 坐标
        this.x;
        this.y;

        // width, height
        this.width = this.width || 0;
        this.height = this.height || 0;

        // sx, sy, sWidth, sHeight
        this.sx = this.sx || 0;
        this.sy = this.sy || 0;
        this.sWidth = this.sWidth || 0;
        this.sHeight = this.sHeight || 0;

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                if (this.width > 0 && this.height > 0) {
                    this.coords.push([this.x + this.width, this.y + this.height]);
                }
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
        // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     if (this.coords.length > 1) {
        //         // width, height
        //         this.width = this.coords[1][0] - this.coords[0][0];
        //         this.height = this.coords[1][1] - this.coords[0][1];
        //     }
        // }

        this.pixel = this.coords.slice();
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return [[[coord[0][0], coord[0][1]], [coord[0][0], coord[1][1]], [coord[1][0], coord[1][1]], [coord[1][0], coord[0][1]], [coord[0][0], coord[0][1]]]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        try {
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            let width = Math.abs(objCoords[1][0] - objCoords[0][0]);
            let height = Math.abs(objCoords[1][1] - objCoords[0][1]);
            let rect = [objCoords[0][0], objCoords[0][1], width, height];
            return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": rect[0], "y": rect[1], "width": rect[2], "height": rect[3] });
        } catch (e) {
            return false;
        }
    }

    /**
     * 克隆对象
     * @returns Image
     */
    clone() {
        return new Image(this);
    }

    /**
     * 矩形的的矩阵变换，除了坐标的变换，还需对宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 渲染时旋转
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制矩形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth, angle}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();
        let that = this;

        // 计算矩形属性
        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);
        if (width == null) {
            width = this.width != null ? this.width : 0;
        }
        if (height == null) {
            height = this.height != null ? this.height : 0;
        }

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 设置样式
        this.setContextStyle(ctx, style);

        // 图像专有样式
        // 设置图像平滑度
        if (style.imageSmoothingQuality == "low" || style.imageSmoothingQuality == "medium" || style.imageSmoothingQuality == "high") {
            ctx.imageSmoothingQuality = style.imageSmoothingQuality;
        }
        // 设置图片是否平滑
        if (style.imageSmoothingEnabled === false) {
            ctx.imageSmoothingEnabled = false;
        }

        // 第一个回调是当位图已经load完成的时候的回调，第二个则位图当时还未load完成，异步加载之后的loaded回调；
        // 考虑到还有其他shape渲染在位图之上，因此需要重新渲染整个图层
        frameState.getLayer().getSource().loadImage(this.src, function (obj) {
            if (width > 0 && height > 0) {
                ctx.drawImage(obj, pixels[0][0], pixels[0][1], width, height);
            } else {
                ctx.drawImage(obj, pixels[0][0], pixels[0][1]);
                that.width = obj.width;
                that.height = obj.height;
                that.setCoord();
            }
        }, function () {
            frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
        });
        ctx.restore();
    }

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        ctx.save();

        // 计算矩形属性
        let pixels = this.getPixel();
        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 绘制着色框
        let bbox = this.getBBox(false);
        if (style.fillColor != null && style.fillColor != "none") {
            style.fillStyle = 1;
        }
        ctx.beginPath();
        ctx.rect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
        ctx.restore();
    }
}

/**
 * 符号对象类型
 * @extends Geometry
 * @desc coords: [centerCoord]
 */
class Symbol extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 中心点坐标, 其格式为[[x,y]] 
     * @param {Object} style { addBorder} 渲染的宽和高
     * @param {Object} properties {}  
     * @param {Object} symbol {childGeometrys, width, height} 符号自身的信息
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rotation", "symbol"]);

        // 类型
        this.type = GGeometryType.SYMBOL;

        // 几何类型
        this.shapeType = GGShapeType.SYMBOL;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x;
        this.y;

        // 字体宽和高（当vectorSize=true时，按照fontHeight缩放字体，否则才会判断字体宽和高）
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // 临时变量
        this._renderWidth = 0;
        this._renderHeight = 0;
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     // width, height
        //     this.width = this.coords[1][0] - this.coords[0][0];
        //     this.height = this.coords[1][1] - this.coords[0][1];
        // }

        this.pixel = this.coords.slice();
    }

    /**
     * 返回对象边界（符号外框）
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === true ? this.getCoord() : this.getPixel();
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);
        let extent = Extent.createEmpty();
        extent[0] = coords[0][0] - width / 2;
        extent[1] = coords[0][1] - height / 2;
        extent[2] = coords[0][0] + width / 2;
        extent[3] = coords[0][1] + height / 2;

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 返回对象边界(符号轮廓，相比较getBBox()，计算结果更为精细)
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox2(useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);
        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Text" || innerObj.getType() == "Point")
                continue;
            bbox = Extent.merge(innerObj.getBBoxInsideSymbol(true), bbox);
        }
        let cosa, sina;
        bbox[0] -= 0.5;
        bbox[1] -= 0.5;
        bbox[2] -= 0.5;
        bbox[3] -= 0.5;
        if (useCoord /*&& this.symbol.originAtLeftTop*/) {
            let tmp = -bbox[1];
            bbox[1] = -bbox[3];
            bbox[3] = tmp;
            cosa = Math.cos(-this.rotation * Math.PI / 180);
            sina = Math.sin(-this.rotation * Math.PI / 180);
        } else {
            cosa = Math.cos(this.rotation * Math.PI / 180);
            sina = Math.sin(this.rotation * Math.PI / 180);
        }
        let coordsborder = [], coordsborderx, coordsbordery;
        coordsborderx = coords[0][0] + bbox[0] * width * cosa - bbox[1] * sina * height;
        coordsbordery = coords[0][1] + bbox[0] * width * sina + bbox[1] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[2] * width * cosa - bbox[1] * sina * height;
        coordsbordery = coords[0][1] + bbox[2] * width * sina + bbox[1] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[2] * width * cosa - bbox[3] * sina * height;
        coordsbordery = coords[0][1] + bbox[2] * width * sina + bbox[3] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[0] * width * cosa - bbox[3] * sina * height;
        coordsbordery = coords[0][1] + bbox[0] * width * sina + bbox[3] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        return coordsborder;
    }

    /**
    /* 获取锚点个数 
    */
    GetPinNumber() {
        let count = 0;
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Point")
                count++;
        }
        return count;
    }

    /**
    /* 获取锚点坐标, index: 第index个锚点，从1到GetPinNumber
    /* 返回锚点坐标
    */
    GetPinCoord(index, useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        if (index <= 0)
            return coords[0];
        let count = 0;
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);

        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Point") {
                count++;
                if (count == index) {
                    bbox = Extent.merge(innerObj.getBBoxInsideSymbol(true), bbox);
                    break;
                }
            }
        }
        if (count < index)
            return coords[0];
        let cosa, sina;
        bbox[0] -= 0.5;
        bbox[1] -= 0.5;
        bbox[2] -= 0.5;
        bbox[3] -= 0.5;
        if (useCoord /*&& this.symbol.originAtLeftTop*/) {
            let tmp = -bbox[1];
            bbox[1] = -bbox[3];
            bbox[3] = tmp;
            cosa = Math.cos(-this.rotation * Math.PI / 180);
            sina = Math.sin(-this.rotation * Math.PI / 180);
        } else {
            cosa = Math.cos(this.rotation * Math.PI / 180);
            sina = Math.sin(this.rotation * Math.PI / 180);
        }
        bbox[0] = (bbox[0] + bbox[2]) * 0.5;
        bbox[1] = (bbox[1] + bbox[3]) * 0.5;
        let pincoord;
        pincoord = [coords[0][0] + bbox[0] * width * cosa - bbox[1] * sina * height, coords[0][1] + bbox[0] * width * sina + bbox[1] * cosa * height];
        return pincoord;
    }

    /**
    /* 根据路口上的路段id
    /* 返回相关的路段
    */
    GetConnectedREdge(dataset_) {
        let edges = [];
        for (let i = 0; i < this.properties.edge.length; i++) {
            let edgeobj = dataset_.getNode(this.properties.edge[i].block,
                this.properties.edge[i].entityId);
            if (edgeobj == null)
                continue;
            edges.push(edgeobj);
        }
        return edges;
    }

    /**
    /* 路口参数发生变化后，修改连接的路段的起止点坐标
    /* 返回相关的路段
    */
    UpdateConnectedREdge(dataset_) {
        let edges = [];
        for (let i = 0; i < this.properties.edge.length; i++) {
            let edgeobj = dataset_.getNode(this.properties.edge[i].block,
                this.properties.edge[i].entityId);
            if (edgeobj == null)
                continue;
            edgeobj = edgeobj.geometryObj;
            let edgecoord = edgeobj.getCoord();
            if (edgeobj.properties.head.entityId == this.properties.entityId)
                edgecoord[0] = this.GetPinCoord(edgeobj.properties.head.lid);
            else
                edgecoord[edgecoord.length - 1] = this.GetPinCoord(edgeobj.properties.tail.lid);
            edgeobj.setCoord(edgecoord);
            edges.push(edgeobj);
        }
        return edges;
    }

    /**
    * 绘制控制外框
    * @param {CanvasRenderingContext2D} ctx 
    * @param {Object} style 
    */
    drawBorder(ctx, style) {
        ctx.save();
        let bbox = this.getBBox2(false);
        this.drawPolyline(ctx, bbox, true);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#007F80";
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        // let bbox = this.getBBox(useCoord); // this.getBBox2(useCoord);
        // return Collide.pointRect({"x":point[0], "y":point[1]}, {"x":bbox[0], "y":bbox[1], "width":bbox[2] - bbox[0], "height":bbox[3] - bbox[1]});

        let objCoords = this.getBBox2(useCoord);
        return Collide.pointPoly({ "x": point[0], "y": point[1] }, objCoords);
    }

    /**
     * 设置符号的像素坐标，且重新计算置子对象坐标
     * @param {Array} pixelArray 
     */
    setPixel(pixelArray) {
        this.pixel = pixelArray;
        let width = this._renderWidth == null ? this.width : this._renderWidth;
        let height = this._renderHeight == null ? this.height : this._renderHeight;
        if (width > 0 && height > 0) {
            // 使用Transform进行坐标变换
            let transform = Transform.create();
            let v = (this.symbol.originAtLeftTop === false ? -1 : 1);
            let symbolWidth = this.symbol.width;
            let symbolHeight = this.symbol.height;
            Transform.compose(transform, width / 2, height / 2, width / symbolWidth, v * height / symbolHeight, 0, -symbolWidth / 2, -symbolHeight / 2);

            // 使用Matrix进行坐标变换
            let symbolInnerExtent = this.symbol.bbox; //[0, 0, this.symbol.width, this.symbol.height];
            let canvasExtent = [0, 0, width, height];
            // 使用Matrix类进行坐标变换
            let symbolMatrix = new Ratio();
            symbolMatrix.setCanvasExtent(canvasExtent);
            symbolMatrix.setWorldExtent(symbolInnerExtent);
            symbolMatrix.setWorldExtentOrigin(this.symbol.originAtLeftTop !== false);

            // 符号内部坐标转换(矢量缩放)
            for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
                let innerObj = this.symbol.childGeometrys[i];
                innerObj.toPixel(symbolMatrix);
            }

        } else {
            for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
                let innerObj = this.symbol.childGeometrys[i];
                innerObj.setPixel(innerObj.getCoord());
            }
        }
    }

    /**
     * 转换为屏幕坐标
     *  @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());

        // 转换为屏幕坐标
        let coord = this.coords;
        let pixel = Coordinate.transform2D(tool, coord, false);

        // 计算符号渲染的宽和高
        let coordwh = [coord[0][0] + this.width, coord[0][1] + this.height];
        let pixelwh = Coordinate.transform2D(tool, coordwh, false);
        this._renderWidth = pixelwh[0] - pixel[0][0];
        this._renderHeight = Math.max(pixelwh[1], pixel[0][1]) - Math.min(pixelwh[1], pixel[0][1]);
        // 计算符号内部对象渲染的像素
        this.setPixel(pixel);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Symbol(this);
    }

    /**
     * 符号的的矩阵变换，除了坐标的变换，还需对宽高进行缩放
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);
        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 子对象变换（无需逐个对子对象进行变换2023/9/28）
        //  对子对象进行变换会造成子对象布局错落
        //  符号应做为一个整体变换，而不需要逐个对子对象变换，就好比一幅画，如果是翻转，应该是对整幅画进行翻转，而不是对每一个子对象进行翻转
        // if (this.symbol != null && this.symbol.childGeometrys != null && this.symbol.childGeometrys.length > 0) {
        //     this.symbol.childGeometrys.forEach(geom => {
        //         geom.transform(trans)
        //     })
        // };

        // 符号的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 符号渲染
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 起始位置
        let pixels = this.getPixel();

        // 旋转，矩形的旋转需通过画板的旋转来实现
        if (this.rotation != null && this.rotation != 0) {
            this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
        }

        // 平移
        ctx.translate(pixels[0][0], pixels[0][1]);

        if (style.overView == true && frameState.dist > style.overViewMaxDist) {
            // 概貌渲染
            style.fillColor = style.color;
            ctx.beginPath();
            let radius = (style.overViewSize ? style.overViewSize : 1);
            ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);
        } else {
            // 符号渲染
            let width = this._renderWidth == null ? this.width : this._renderWidth;
            let height = this._renderHeight == null ? this.height : this._renderHeight;
            if (width > 4 && height > 4) {

                // 渲染符号内部结构
                if (this.symbol != null && this.symbol.childGeometrys != null && this.symbol.childGeometrys.length > 0) {
                    /*let tmpSymbol = document.createElement("canvas");
                    tmpSymbol.width = width * 2;
                    tmpSymbol.height = height * 2;
                    let tmpSymbolCtx = tmpSymbol.getContext("2d");
                    this._drawSymbol(this.symbol.childGeometrys, tmpSymbolCtx, style, frameState);
                    ctx.drawImage(tmpSymbol, -width / 2, -height / 2, width * 2, height * 2);*/
                    // debugger;
                    ctx.save();
                    ctx.translate(-width * 0.5, -height * 0.5);
                    this._drawSymbol(this.symbol.childGeometrys, ctx, style, frameState);
                    ctx.restore();
                }

                // 符号外框
                if (style.addBorder === true) {
                    ctx.strokeStyle = "#0000FF";
                    ctx.strokeRect(-width / 2, -height / 2, width, height);
                }
            }
        }
        ctx.restore();
    }

    /**
     * 渲染符号内部shape
     * @param {Array} list 
     * @param {Object} style 
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawSymbol(list, ctx, style, frameState) {
        if (ctx == null) ctx = this._context;
        for (let i = 0, ii = list.length; i < ii; i++) {
            let innerObj = list[i];
            if (this.isFocus() == false && innerObj.getType() == "Point")
                continue;
            // 缺省情况下，符号内部shape样式优先于符号样式
            let newStyle = this._getSymbolStyle(innerObj.style, style);
            if (typeof (newStyle.function) === "function") {
                newStyle.function(innerObj, newStyle, frameState);
            }
            // 逐个shape渲染
            innerObj.draw(ctx, newStyle, frameState);
        }
    }

    /**
     * 获取样式
     * @param {Object} objStyle 
     * @param {Object} parentStyle 
     * @returns style
     */
    _getSymbolStyle(objStyle, parentStyle) {
        let style = Object.assign({}, objStyle);

        // 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
        let symbolPrior = (parentStyle.symbolPrior === true ? true : false);

        // 排除的样式，这些样式需针对性处理，例如柱变符号是有两个圈组成的，第一个圈使用符号颜色且不填充，第二个圈应保留符号的颜色且需要填充
        let excludeAttr = ["color", "fillColor", "lineWidth", "fillStyle"];

        // 父对象style优先于对象style
        if (parentStyle != null && symbolPrior === true) {
            // 将父对象的有效样式复制到子对象中
            Object.keys(parentStyle).forEach(key => {
                if (parentStyle[key] != null) {
                    if (excludeAttr.indexOf(key) < 0) style[key] = parentStyle[key];
                }
            });
        } else {
            // 子对象样式优先，仅将父对象比子对象多的样式复制到子对象中
            Object.keys(parentStyle).forEach(key => {
                if (parentStyle[key] != null && objStyle[key] == null) {
                    style[key] = parentStyle[key];
                }
            });
        }

        // 使用父对象颜色
        if (symbolPrior && parentStyle.color != null && parentStyle.color != "none") {
            style.color = parentStyle.color;
        }
        // 使用父对象颜色作为填充色
        if (symbolPrior && parentStyle.fillColor != null && parentStyle.fillColor != "none" && style.fillStyle != 0) {
            style.fillColor = parentStyle.fillColor;
        }
        // 使用父对象线宽
        if (symbolPrior && parentStyle.lineWidth != null) {
            style.lineWidth = parentStyle.lineWidth * (objStyle.lineWidth == null ? 1 : objStyle.lineWidth);
        }

        return style;
    }
}

/**
 * 裁切对象
 * @extends Geometry
 */
class Clip extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.CLIP;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);
    }

    /**
     * 设置样式
     * @param {*} style 
     */
    setStyle(style) {
        this.style = Object.assign({}, style, { "lineWidth": 0, "allowStyleScale": false });
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return [[[coord[0][0], coord[0][1]], [coord[0][0], coord[1][1]], [coord[1][0], coord[1][1]], [coord[1][0], coord[0][1]], [coord[0][0], coord[0][1]]]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} coord 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(coord, useCoord = true) {
        return false;
    }

    /**
     * 克隆对象
     * @returns Clip
     */
    clone() {
        return new Clip(this);
    }

    /**
     * 绘制矩形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // ctx.save();
        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 设置样式
        // this.setContextStyle(ctx, style);
        // 计算矩形属性
        let pixels = this.getPixel();
        ctx.beginPath();
        ctx.moveTo(pixels[0][0], pixels[0][1]);
        ctx.lineTo(pixels[1][0], pixels[0][1]);
        ctx.lineTo(pixels[1][0], pixels[1][1]);
        ctx.lineTo(pixels[0][0], pixels[1][1]);
        ctx.closePath();
        // ctx.stroke();
        ctx.clip();
        // ctx.restore();
    }
}

/**
 * 组对象类型
 * @extends Geometry
 * @desc coords: [centerCoord]
 */
class Group extends Geometry {
    /**
     * 构造函数
     * @param {Coord} coords 中心点坐标
     * @param {Object} style {width, height, addBorder} 渲染的宽和高
     * @param {Object} properties
     */
    constructor(options) {
        // 属性初始化
        super(options, ["childGeometrys"]);


        this.childGeometrys = this.childGeometrys || [];

        // 类型
        this.type = GGeometryType.GROUP;
        
        // 几何类型
        this.shapeType = GGShapeType.SURFACE;
        
        // 初始化
        this.initialize(options);
    }

    /**
     * 返回对象边界（符号外框）
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === true ? this.getCoord() : this.getPixel();
        let extent = [coords[1][0], coords[1][1], coords[2][0], coords[2][1]];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }
    
    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool);
        // 组对象内部坐标转换(矢量缩放)
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                this.childGeometrys[i].toPixel(tool);
            }
        }
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} coord 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({"x":point[0], "y":point[1]}, {"x":bbox[0], "y":bbox[1], "width":bbox[2] - bbox[0], "height":bbox[3] - bbox[1]});
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Group(this);
    }

    /**
     * 符号渲染
     */
    draw(ctx, style, frameState) {
        ctx.save();
        
        // 画板变换
        this.renderTransform(ctx, style.transData);
        
        // 设置样式
        this.setContextStyle(ctx, style);

        // 起始位置
        let pixel = this.getPixel();

        // 渲染
        if (Math.abs(pixel[2][0] - pixel[1][0]) > 4 && Math.abs(pixel[2][1] - pixel[1][1]) > 4) {
            // 渲染符号内部结构
            if (this.childGeometrys != null && this.childGeometrys.length > 0) {
                let list = this.childGeometrys;
                for (let i = 0, ii = list.length; i < ii; i++) {
                    let innerObj = list[i];
                    // 缺省情况下，符号内部shape样式优先于符号样式
                    let newStyle = this._getGroupStyle(innerObj.getStyle(), style);
                    if (typeof (newStyle.function) === "function") {
                        newStyle.function(innerObj, newStyle, frameState);
                    }
                    // 逐个shape渲染
                    innerObj.draw(ctx, newStyle, frameState);
                }
            }

            // 符号外框
            if (style.addBorder === true) {
                ctx.strokeStyle = "#0000FF";
                ctx.strokeRect(pixel[1][0], pixel[1][1], Math.abs(pixel[2][0] - pixel[1][0]), Math.abs(pixel[2][1] - pixel[1][1]));
            }
        } 
        ctx.restore();
    }

    /**
     * 获取样式
     * @param {Object} objStyle 
     * @param {Object} parentStyle 
     * @param {Boolean} parentPrior 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
     * @returns style
     */
    _getGroupStyle(objStyle, parentStyle) {
        let style = Object.assign({}, objStyle);

        // 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
        let parentPrior = (parentStyle.parentPrior === true ? true : false);

        // 父对象style优先于对象style
        if (parentStyle != null && parentPrior === true) {
            // 将父对象的有效样式复制到子对象中
            Object.keys(parentStyle).forEach(key=>{
                if(parentStyle[key] != null) {
                    style[key] = parentStyle[key];
                }
            });
        } else {
            // 子对象样式优先，仅将父对象比子对象多的样式复制到子对象中
            Object.keys(parentStyle).forEach(key=>{
                if(parentStyle[key] != null && objStyle[key] == null) {
                    style[key] = parentStyle[key];
                }
            });
        }

        // // 父对象style优先于对象style
        // if (parentStyle != null) {
        //     // 使用父对象颜色
        //     if (parentPrior && parentStyle.color != null && parentStyle.color != "none") {
        //         style.color = parentStyle.color;
        //     }
        //     // 使用父对象颜色作为填充色
        //     if (parentPrior && parentStyle.fillColor != null && parentStyle.fillColor != "none" && style.fillStyle != 0) {
        //         style.fillColor = parentStyle.fillColor;
        //     }
        //     // 使用父对象线宽
        //     if (parentPrior && parentStyle.lineWidth != null) {
        //         style.lineWidth = parentStyle.lineWidth * (objStyle.lineWidth == null ? 1 : objStyle.lineWidth)
        //     }

        //     if(parentStyle.allowStyleScale === true) {
        //         style.allowStyleScale = true;
        //     }
        // }

        return style;
    }
}

/*
 * 文字缺省风格
 */
const __defaultTextStyle = {
    fontItalic: 0, fontBold: 0, fontBorder: false, minFontSize: 4,
    lineWidth: 0,
    // fontSize: "14", textAlign: "left"
};

// fontName: Verdana, Arial, Helvetica, sans-serif;

/**
 * 文本对象类型
 * @extends Geometry
 */
class Text extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 点坐标, 其格式为[[x,y],[x+size]]
     * @param {Object} style 样式 {lineWidth, color, fillColor, fillPrior, fontSize, fontName, fontItalic, fontBold,  textAlign, textBaseline, letterSpacing, fontBorder, borderColor, borderOpacity}
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "text", "vectorSize", "width", "height", "rotation", "maxWidth", "vertical"]);

        // 类型
        this.type = GGeometryType.TEXT;

        // 几何类型
        this.shapeType = GGShapeType.TEXT;

        // 初始化
        this.initialize(options);

        // 文本
        this.text;

        // 是否垂直排列
        this.vertical = this.vertical === true;

        // 坐标
        this.x;
        this.y;

        // 字体宽和高（当vectorSize=true时，按照fontHeight缩放字体，否则才会判断字体宽和高）
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 最大宽度 (对应于：ctx.fillText(text,x,y,maxWidth))，  由于在图形缩放后，该值暂不支持跟随缩放，因此不建议使用该属性
        this.maxWidth = this.maxWidth || -1;

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // 是否缩放字体（优先级最高）
        this.vectorSize = (this.vectorSize === false ? false : true);

        // 字体大小 (缩放时根据此变量计算style.fontSize)
        this._fontHeight = this.style ? this.style.fontSize || 12 : 12;

        // 临时变量
        this._allowMaxWidth = 0;
        this._renderWidth = 0;
        this._renderHeight = 0;

        // 兼容上一个版本的properties构造模式
        if (this.text == null) {
            this.text = this.properties ? this.properties.text : "";
        }

        // 像素坐标初始化
        this.pixel = [[this.x, this.y]];

        // 控制外框属性
        this.ctrlBorderProp = {};
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x, this.y]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致异常
        // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     if (this.coords.length > 1) {
        //         // width, height
        //         this.width = this.coords[1][0] - this.coords[0][0];
        //         this.height = this.coords[1][1] - this.coords[0][1];
        //     }
        // }
        this.pixel = this.coords.slice();
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POINT;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return this.coords.slice();
    }

    /**
     * 设置样式
     * @param {*} style 
     */
    setStyle(style) {
        super.setStyle(style);
        // 矢量字体大小，当vectorSize=true时，字体大小随着图形缩放而缩放
        if (style.fontSize > 0) {
            this._fontHeight = style.fontSize;
        }
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();

        // 矢量字体才考虑宽度和高度对BBOX的影响
        let textLength = this.text.length;
        let width, height;

        if (useCoord == true) {
            width = this.width > 0 ? this.width : this._fontHeight * textLength;
            height = this.height > 0 ? this.height : this._fontHeight;
        } else {
            width = this._renderWidth; // this.style.fontSize * textLength;
            height = this._renderHeight; //this.style.fontSize;
        }

        // 根据字体水平对齐方式确定文本的bbox
        let left, top;
        if (this.style.textAlign == "center" || this.style.textAlign == "middle") {
            left = coord[0][0] - width / 2;
        } else if (this.style.textAlign == "right") {
            left = coord[0][0] - width;
        } else {
            left = coord[0][0];
        }
        // 属性值有 top(文本块的顶部), hanging(悬挂基线), middle(文本块的中间), alphabetic(标准的字母基线), ideographic(表意字基线), bottom(文本块的底部)
        if (this.style.textBaseline == "middle") {
            top = coord[0][1] - height / 2;
        } else if (this.style.textBaseline == "bottom" || this.style.textBaseline == "ideographic") {
            top = coord[0][1] - height;
        } else if (this.style.textBaseline == "alphabetic") {
            top = coord[0][1] - height;        } else {    // top,  "hanging"
            top = coord[0][1];
        }
        return [left, top, left + width, top + height];
    }
    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        return this.getBBox(useCoord);
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] });
    }

    /**
     * 转换为屏幕坐标
     *  @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());

        let pixel = Coordinate.transform2D(tool, [this.coords[0][0], this.coords[0][1]], false);
        this.setPixel([[pixel[0], pixel[1]]]);

        // 如果properties中包含了text，且style中vectorSize==true或包含了width和height，则该文本字体大小为矢量大小
        if (this.vectorSize === true && this._fontHeight > 0) {
            let point = Coordinate.transform2D(tool, [this.coords[0][0], this.coords[0][1] + this._fontHeight], false);
            this.style.fontSize = Math.round(Math.abs(point[1] - pixel[1]));  // 使用高度作为字体大小
            this._allowMaxWidth = this.style.fontSize * this.text.length;
        } else if (this.width > 0 && this.height > 0) {
            let point = Coordinate.transform2D(tool, [this.coords[0][0] + this.width, this.coords[0][1] + this.height], false);
            this.style.fontSize = Math.round(Math.abs(point[1] - pixel[1]));  // 使用高度作为字体大小
            this._allowMaxWidth = Math.abs(point[0] - pixel[0]);
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Text(this);
    }

    /**
     * 文本的矩阵变换，除了坐标的变换，还需进行字体大小的缩放
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 文字的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;

        // 字体缩放
        this._fontHeight = this._fontHeight * transResult.scale[0];
        if (this.width > 0 && this.height > 0) {
            this.width = this.width * transResult.scale[0];
            this.height = this.height * transResult.scale[0];
        }
    }

    /**
     * 绘制文本
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        if (this.text == null || this.text.length == 0) return;
        let pixel = this.getPixel();

        style = Object.assign({}, __defaultTextStyle, style);

        // 忽略太小的字体
        if (style.fontSize <= style.minFontSize) return;
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 旋转，文字的旋转需通过画板的旋转来实现(文本旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixel[0][0], pixel[0][1]]);
            }
        }

        // 设置样式
        // 优先使用字体高度为字体大小，如果超过了文本宽度，则需缩小字体大小
        ctx.font = this._getFontStyle(style);

        // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
        let textHeight = parseInt(style.fontSize);
        let textWidth = ctx.measureText(this.text).width;
        this._renderWidth = textWidth;
        this._renderHeight = textHeight;

        // 如果样式指定了textWidth，且小于实际宽度，则需要将文字缩小至指定的宽度中
        if (this._allowMaxWidth > 0 && textWidth > this._allowMaxWidth) {
            ctx.font = this._getFontStyle(style, textWidth);
        } else {
            this._allowMaxWidth = textWidth;
        }

        // 垂直对齐方式， 属性值有 top(文本块的顶部), hanging(悬挂基线), middle(文本块的中间), alphabetic(标准的字母基线), ideographic(表意字基线), bottom(文本块的底部)
        ctx.textBaseline = (style.textBaseline == null ? "top" : style.textBaseline);

        // 水平对齐方式， 属性值有 start(文本对齐界线开始的地方)、end(文本对齐界线结束的地方)、left(文本左对齐)、right(文本右对齐)、center(文本居中对齐)
        ctx.textAlign = (style.textAlign == null ? "left" : style.textAlign);

        // letterSpacing
        if (style.letterSpacing != null) {
            ctx.letterSpacing = style.letterSpacing;
        }
        if (style.wordSpacing != null) {
            ctx.wordSpacing = style.wordSpacing;
        }

        // 设置样式
        this.setContextStyle(ctx, style);

        // 是否垂直排列
        if (this.vertical === true) {
            this._drawVerticalText(ctx, this.text, style, pixel[0][0], pixel[0][1]);
        } else {
            this._drawText(ctx, this.text, style, pixel[0][0], pixel[0][1], this._allowMaxWidth, textHeight, frameState);
        }

        ctx.restore();
    }

    _drawText(ctx, text, style, x, y, textWidth, textHeight, frameState) {
        if (textHeight <= 4 && (frameState == null || !frameState.getLayer().isUseTransform())) {
            ctx.lineWidth = 1;
            ctx.fillStyle = (style.fillColor == null || style.fillColor == "none") ? (style.color == null ? "#D0D0D0" : style.color) : style.fillColor;
            ctx.fillStyle = ctx.fillStyle + "50";   // 透明度
            ctx.fillRect(x, y, textWidth, textHeight);
            return;
        }

        // 绘制背景（带边框矩形）
        if (style.fontBorder === true || style.fontBorder === 1 || style.fontBorder === "true") {
            let borderColor = (style.borderColor == null ? "#D0D0D0" : style.borderColor);
            let opacity = (style.borderOpacity == null ? "B4" : style.borderOpacity);    // 透明度，使用16进制表示，B4对应十进制为180，即0.7
            if (opacity < 1) opacity = (256 * opacity).toString(16);                     // 使用#FFFFFF00方式表达颜色

            ctx.fillStyle = borderColor + opacity;
            ctx.fillRect(x - 8, y - 8, textWidth + 16, textHeight + 16);
            ctx.lineWidth = 1;
            ctx.strokeStyle = borderColor;
            ctx.strokeRect(x - 8, y - 8, textWidth + 16, textHeight + 16);
        }

        // 文字背景
        if (style.color != null && style.color != "none") {
            if (style.lineWidth > 0) {
                ctx.strokeStyle = style.color;
                if (this.maxWidth > 0) {
                    ctx.strokeText(text, x, y, this.maxWidth);
                } else {
                    ctx.strokeText(text, x, y);
                }
            } else {
                if (style.fillColor == null || style.fillColor == "none") {
                    style.fillColor = style.color;
                }
            }
        } else {
            if (style.fillColor == null || style.fillColor == "none") {
                style.fillColor = "#000000";
            }
        }

        // 绘制文字
        if (style.fillColor != null && style.fillColor != "none" || style.fillPrior === true) {
            ctx.fillStyle = style.fillColor != null && style.fillColor != "none" ? this.getColor(style.fillColor, ctx) : style.color;
            if (this.maxWidth > 0) {
                ctx.fillText(text, x, y, this.maxWidth);
            } else {
                ctx.fillText(text, x, y);
            }
        }
    }

    /**
     * 字体风格
     * @param {Object} style
     * @param {int} textWidth 
     * @returns String
     * format:font-style font-variant font-weight font-size line-height font-family
     *        font-style: none normal italic obliquefont (风格：是否斜体)
     *        font-variant: none normal small-caps  (变体)
     *        font-weight: none normal bold (分量)
     *        font-size: 12px
     *        line-height: 1.2 3
     *        font-family: Arial '宋体'
     */
    _getFontStyle(style, textWidth = 0) {
        let fontStyle = "";

        if (style.fontItalic == 1 || style.fontItalic == true) {
            fontStyle += "italic ";
        }
        if (style.fontBold == 1 || style.fontBold == true) {
            fontStyle += "bold ";
        } else if (style.fontWeight) {
            fontStyle += style.fontWeight + " ";
        }

        let fontSize = this.getFontHeight(style, textWidth) + "px ";
        fontStyle += fontSize;

        let fontName = style.fontName === undefined || style.fontName.indexOf('\'') > -1 || style.fontName.indexOf(',') > -1 || style.fontName.indexOf('"') > -1
            ? style.fontName : '"' + style.fontName + '"';

        fontStyle += fontName + " ";

        // 更多属性
        // if (style.textDecoration) {
        //     fontStyle += "text-decoration: " + style.textDecoration + "; ";
        // }

        return fontStyle;
    }

    /**
     * 获取字体大小， 计算规则：
     * 1、根据style.fontSize获取字体大小，
     * 2、如果指定了渲染的宽度(width)且keepWidth=true，则字体渲染的宽度优先，根据宽度计算字体大小
     * @param {Object} style 
     * @param {int} textWidth 
     * @returns int
     */
    getFontHeight(style, textWidth) {
        // 1、从样式中获取字体尺寸
        let fontSize = style.fontSize;

        // 2、判断样式中是否包含scale属性
        if (style.scale != null && typeof (style.scale) === "number") {
            // 如果指定了文字宽度，则字体大小在getPixel的时候由height指定
            if (this.width == null && this.height == null) {
                fontSize = fontSize * style.scale;
            }
        }

        // 3、判断样式中是否指定了textWidth属性，如果指定了该属性，则根据该属性调整字体大小
        fontSize = (textWidth > 0 && this._allowMaxWidth != null ? fontSize * (this._allowMaxWidth / textWidth) : fontSize);
        return fontSize;
    }

    /**
     * 绘制垂直文本
     * @param {*} ctx 
     * @param {*} text 
     * @param {*} x 
     * @param {*} y 
     */
    _drawVerticalText(ctx, text, style, x, y) {
        let arrText = text.split('');
        let arrWidth = arrText.map(function (letter) {
            return ctx.measureText(letter).width;
        });

        ctx.save();
        let align = ctx.textAlign;
        let baseline = ctx.textBaseline;

        if (align == 'left' || align == 'start') {
            x = x + Math.max(...arrWidth) / 2;
        } else if (align == 'right') {
            x = x - Math.max(...arrWidth) / 2;
        }
        if (baseline == 'bottom' || baseline == 'alphabetic' || baseline == 'ideographic') {
            y = y - arrWidth[0] / 2;
        } else if (baseline == 'top' || baseline == 'hanging') {
            y = y + arrWidth[0] / 2;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let that = this;
        // 开始逐字绘制
        arrText.forEach(function (letter, index) {
            // 是否需要旋转判断
            let code = letter.charCodeAt(0);
            if (code <= 256) {
                // 英文字符，旋转90°
                ctx.translate(x, y);
                ctx.rotate(90 * Math.PI / 180);
                ctx.translate(-x, -y);
            } else if (index > 0 && text.charCodeAt(index - 1) < 256) {
                // y修正
                y = y + arrWidth[index - 1] / 2;
            }
            //ctx.fillText(letter, x, y);
            that._drawText(ctx, letter, style, x, y);
            // 旋转坐标系还原成初始态
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // 确定下一个字符的y坐标位置
            let letterWidth = arrWidth[index];
            y = y + letterWidth;
        });
        ctx.restore();
    };

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        style = Object.assign({}, __defaultTextStyle, style);
        // 忽略太小的字体
        if (style.fontSize <= style.minFontSize) return;

        let pixel = this.getPixel();
        ctx.save();
        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 旋转，文字的旋转需通过画板的旋转来实现(文本旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixel[0][0], pixel[0][1]]);
            }
        }

        // 绘制着色框
        let bbox = this.getBBox(false);
        if (style.fillColor != null && style.fillColor != "none") {
            style.fillStyle = 1;
        }
        ctx.beginPath();
        ctx.rect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
        ctx.restore();
    }
}

/**
 * 对象通用样式：
 * 
 * {
 *     "allowStyleScale" : true/false              // 缩放时对象的线宽等属性是否等比例缩放
 *     "transform"                                 // 对象的变形属性
 *     "angle": 30                                 // 旋转角度
 * 
 *     "lineWidth": 1                              // 线宽
 *     "dash"     : [4 4]                          // 虚线样式
 *     "dashOffset" : int                          // 虚线的Offset属性
 *     "lineCap"  : butt/square/round              // 线的末端样式
 *     "lineJoin" : miter/round/bevel              // 线的连接处样式

 *     "color"      "FFFFFF"                       // 边框颜色
 *     "fillStyle": 1/0                            // 是否填充
 *     "fillColor": "#FFFFFF"                      // 填充颜色
 * }
 */


/**
 * 从图层样式中获取指定类型的样式
 * @param {GGShapeType} shapeType 
 * @param {Object} layerStyle 
 * @example
 * layerStyle的对象格式如下：
 * {
 *     "layerPrior" : false,                      // 公共样式，是否图层样式优先
 *     "dynamic" : function(layer, frameState){}  // 图层动态样式
 * 
 *     "pointLineWidth": 2,                       // 点符号线宽
 *     "pointColor": rgba(0,0,0,255),             // 点符号颜色
 *     "pointFillColor": rgba(255,0,0,255),       // 点符号填充色
 *     
 *     "lineWidth": 1,                            // 线宽
 *     "lineType": 2,                             // 线类型
 *     "lineColor": rgba(0,0,0,255),              // 线颜色
 *     "lineFillColor": rgba(0,0,0,255),          // 线填充色
 *     
 *     "surfaceLineWidth": 1,                     // 面的线宽
 *     "surfaceType": 1,                          // 面型
 *     "surfaceFillColor": rgba(0,0,0,255),       // 面的填充色
 *     "surfaceColor": rgba(0,0,0,255),           // 面的边框颜色
 *     
 *     "textColor": rgba(0,0,0,255),              // 文本颜色
 *     "textShadowColor": rgba(0,0,0,255),        // 文本阴影颜色
 *     "textFontName": "黑体",                    // 中文字体
 *     "textFontName2": "Aribe"                   // 英文字体
 * } 或
 * {
 *     "color"
 *     "fillColor"
 *     "***"
 * }
 * @returns Style
 */
function getTypeStyle(shapeType, layerStyle) {
    let style = {};

    if (layerStyle == null) {
        return style;

    } else if (layerStyle.lineColor != null || layerStyle.textColor != null || layerStyle.surfaceColor != null) {
        if (layerStyle.layerPrior === true) {
            style.layerPrior = true;
        }
        if (shapeType === GGShapeType.SURFACE) {
            // 面的边框颜色
            if (layerStyle.surfaceColor != null) {
                style.color = layerStyle.surfaceColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }

            // 面型
            if (layerStyle.surfaceType != null) {
                style.surfaceType = layerStyle.surfaceType;
                // surfaceType=0不填充，1填充，2……其他面型
                if (layerStyle.surfaceType > 0) {
                    style.fillStyle = 1;
                    // 面的填充色
                    if (layerStyle.surfaceFillColor != null) {
                        style.fillColor = layerStyle.surfaceFillColor;
                    } else if (layerStyle.fillColor != null) {
                        style.fillColor = layerStyle.fillColor;
                    }
                }
            }

            // 面的线宽
            if (layerStyle.surfaceLineWidth != null) {
                style.lineWidth = layerStyle.surfaceLineWidth;
            } else if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else if (shapeType === GGShapeType.TEXT) {
            // 中文字体 + 英文字体
            style.fontName = (layerStyle != null ? layerStyle.textFontName + "," + layerStyle.textFontName2 : null);

            // 文本颜色
            if (layerStyle.textColor != null) {
                style.color = layerStyle.textColor;
                style.fillColor = layerStyle.textColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
                style.fillColor = layerStyle.color;
            }
            // 文本阴影颜色
            if (layerStyle.textShadowColor != null) {
                style.borderColor = layerStyle.textShadowColor;
            }
        } else if (shapeType === GGShapeType.POINT) {
            // 点符号颜色
            if (layerStyle.pointColor != null) {
                style.color = layerStyle.pointColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }
            // 点符号填充色
            if (layerStyle.pointFillColor != null) {
                style.fillStyle = 1;
                style.fillColor = layerStyle.pointFillColor;
            } else if (layerStyle.fillColor != null) {
                style.fillStyle = 1;
                style.fillColor = layerStyle.fillColor;
            }
            // 点符号线宽
            if (layerStyle.pointLineWidth != null) {
                style.lineWidth = layerStyle.pointLineWidth;
            } else if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else if (shapeType === GGShapeType.LINE) {
            // 线颜色
            if (layerStyle.lineColor != null) {
                style.color = layerStyle.lineColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }
            // 线填充色
            if (layerStyle.lineFillColor != null) {
                style.fillStyle = 0;
                // style.fillColor = layerStyle.lineFillColor;
            }
            // 线类型
            if (layerStyle.lineType != null) {
                Object.assign(style, getLineType(layerStyle.lineType));
            }
            if (layerStyle.dashOffset != null) {
                style.dashOffset = layerStyle.dashOffset;
            }
            // 线宽
            if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else {
            for (let p in layerStyle) {
                style[p] = layerStyle[p];
            }
        }

        // 有些源数据中描述颜色仅仅使用 0,0,0的格式，需转换为 rgb(0,0,0)格式
        if (style.color != null) {
            if (style.color.indexOf("rgb") == -1 && style.color.split(",").length === 4) {
                style.color = "rgba(" + style.color + ")";
            } else if (style.color.indexOf("rgb") == -1 && style.color.split(",").length === 3) {
                style.color = "rgb(" + style.color + ")";
            }
        }
        if (style.fillColor != null) {
            if (style.fillColor.indexOf("rgb") == -1 && style.fillColor.split(",").length === 4) {
                style.fillColor = "rgba(" + style.fillColor + ")";
            } else if (style.fillColor.indexOf("rgb") == -1 && style.fillColor.split(",").length === 3) {
                style.fillColor = "rgb(" + style.fillColor + ")";
            }
        }

        return style;
    } else {
        for (let p in layerStyle) {
            style[p] = layerStyle[p];
        }
        return style;
    }
}

function getColor(strColor) {
    if (strColor == null) {
        return undefined;
    } else {
        let seg = strColor.split(",");
        if (seg.length === 4) {
            seg[3] = 255 - seg[3];
            return "rgba(" + seg.join(",") + ")";
        } else if (seg.length === 3) {
            return "rgb(" + strColor + ")";
        } else {
            return strColor;
        }
    }
}

function getLineType(type) {
    let obj = {};
    if (type == 0) ; else if (type == 1) {
        obj = { "dash": [8, 8, 8, 8] };
    } else if (type == 2) {
        obj = { "dash": [4, 4, 4, 4] };
    } else if (type == 3) {
        obj = { "dash": [16, 4, 2, 4] };
    } else {
        obj = { "dash": [12, 16, 12, 16] };
    }
    return obj;
    // typedef	enum	{
    //     GK_LINESTYLE_SOLID	= 0,
    //     GK_LINESTYLE_DASH,
    //     GK_LINESTYLE_DOT,
    //     GK_LINESTYLE_DASHDOT, = 3
    //     GK_LINESTYLE_DASHDOTDOT,
    //     GK_LINESTYLE_PIXEL_FILL,
    //     GK_LINESTYLE_WIDTH_FILL,
    //     GK_LINESTYLE_BACK_DASH,
    //     GK_LINESTYLE_BACK_DOT,
    //     GK_LINESTYLE_BACK_DASHDOT,
    //     GK_LINESTYLE_BACK_DASHDOTDOT,
    //     GK_LINESTYLE_USER_START
    // }	GkLineStyleType;
}

const EventType = {
    RenderBefore: 201,          // graph, 图形渲染之前触发
    RenderAfter: 202,           // graph, 图形渲染之后触发
    ComposeBefore: 211,         // layer, 图层渲染之前触发
    ComposeAfter: 212,          // layer, 图层渲染之后触发
    LayerModified:213,          // layer, 图层发生变化
    Loader: 221,                // source
};


const EventKeyCode = {

    /**
     * Constant: KEY_SPACE
     * {int}
     */
    KEY_SPACE: 32,
    
    /** 
     * Constant: KEY_BACKSPACE 
     * {int} 
     */
    KEY_BACKSPACE: 8,

    /** 
     * Constant: KEY_TAB 
     * {int} 
     */
    KEY_TAB: 9,

    /** 
     * Constant: KEY_RETURN 
     * {int} 
     */
    KEY_RETURN: 13,

    /** 
     * Constant: KEY_ESC 
     * {int} 
     */
    KEY_ESC: 27,

    /** 
     * Constant: KEY_LEFT 
     * {int} 
     */
    KEY_LEFT: 37,

    /** 
     * Constant: KEY_UP 
     * {int} 
     */
    KEY_UP: 38,

    /** 
     * Constant: KEY_RIGHT 
     * {int} 
     */
    KEY_RIGHT: 39,

    /** 
     * Constant: KEY_DOWN 
     * {int} 
     */
    KEY_DOWN: 40,

    /** 
     * Constant: KEY_DELETE 
     * {int} 
     */
    KEY_DELETE: 46
};

/**
 * 黑白调节滤镜 <br>
 * 对每个像素的R, G, B 三个值平均值大于125则设为255 反之设为0
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Black(imageData, options = {}) {
    let data = imageData.data,
        len = data.length;

    for (var i = 0; i < len; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg >= 125 ? 255 : 0;
    }
}

/**
 * 模糊调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {blurRadius} blurRadius: between 1 and 100
 */
function Blur(imageData, options = {}) {
    let blurRadius = options.blurRadius || 10;
    let radius = Math.round(blurRadius);
    if (radius > 0) {
        __blur_filterGaussBlurRGBA(imageData, radius);
    }
}
class __blur_Stack {
    constructor() {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.a = 0;
        this.next = null;
    }
}

let __blur_mul_table = [
    512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292,
    512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292,
    273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259,
    496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292,
    282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373,
    364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259,
    507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381,
    374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292,
    287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461,
    454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373,
    368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309,
    305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259,
    257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442,
    437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381,
    377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332,
    329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
    289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259,
];

let __blur_shg_table = [
    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17,
    17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19,
    19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24,
];

function __blur_filterGaussBlurRGBA(imageData, radius) {
    let pixels = imageData.data,
        width = imageData.width,
        height = imageData.height;
    let x, y, i, p, yp, yi, yw,
        r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum,
        pr, pg, pb, pa, rbs;
    let div = radius + radius + 1,
        widthMinus1 = width - 1,
        heightMinus1 = height - 1,
        radiusPlus1 = radius + 1,
        sumFactor = (radiusPlus1 * (radiusPlus1 + 1)) / 2,
        stackStart = new __blur_Stack(),
        stackEnd = null,
        stack = stackStart,
        stackIn = null,
        stackOut = null,
        mul_sum = __blur_mul_table[radius],
        shg_sum = __blur_shg_table[radius];

    for (i = 1; i < div; i++) {
        stack = stack.next = new __blur_Stack();
        if (i === radiusPlus1) {
            stackEnd = stack;
        }
    }
    stack.next = stackStart;
    yw = yi = 0;
    for (y = 0; y < height; y++) {
        r_in_sum =
            g_in_sum =
            b_in_sum =
            a_in_sum =
            r_sum =
            g_sum =
            b_sum =
            a_sum =
            0;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;
        stack = stackStart;
        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }
        for (i = 1; i < radiusPlus1; i++) {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = pg = pixels[p + 1]) * rbs;
            b_sum += (stack.b = pb = pixels[p + 2]) * rbs;
            a_sum += (stack.a = pa = pixels[p + 3]) * rbs;
            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;
            stack = stack.next;
        }
        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++) {
            pixels[yi + 3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa !== 0) {
                pa = 255 / pa;
                pixels[yi] = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
            }
            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;
            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;
            p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;
            r_in_sum += stackIn.r = pixels[p];
            g_in_sum += stackIn.g = pixels[p + 1];
            b_in_sum += stackIn.b = pixels[p + 2];
            a_in_sum += stackIn.a = pixels[p + 3];
            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;
            a_sum += a_in_sum;
            stackIn = stackIn.next;
            r_out_sum += pr = stackOut.r;
            g_out_sum += pg = stackOut.g;
            b_out_sum += pb = stackOut.b;
            a_out_sum += pa = stackOut.a;
            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;
            stackOut = stackOut.next;
            yi += 4;
        }
        yw += width;
    }
    for (x = 0; x < width; x++) {
        g_in_sum =
            b_in_sum =
            a_in_sum =
            r_in_sum =
            g_sum =
            b_sum =
            a_sum =
            r_sum =
            0;
        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;
        stack = stackStart;
        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }
        yp = width;
        for (i = 1; i <= radius; i++) {
            yi = (yp + x) << 2;
            r_sum += (stack.r = pr = pixels[yi]) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = pg = pixels[yi + 1]) * rbs;
            b_sum += (stack.b = pb = pixels[yi + 2]) * rbs;
            a_sum += (stack.a = pa = pixels[yi + 3]) * rbs;
            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;
            stack = stack.next;
            if (i < heightMinus1) {
                yp += width;
            }
        }
        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++) {
            p = yi << 2;
            pixels[p + 3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa > 0) {
                pa = 255 / pa;
                pixels[p] = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[p + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[p + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
            }
            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;
            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;
            p = (x + ((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width) << 2;
            r_sum += r_in_sum += stackIn.r = pixels[p];
            g_sum += g_in_sum += stackIn.g = pixels[p + 1];
            b_sum += b_in_sum += stackIn.b = pixels[p + 2];
            a_sum += a_in_sum += stackIn.a = pixels[p + 3];
            stackIn = stackIn.next;
            r_out_sum += pr = stackOut.r;
            g_out_sum += pg = stackOut.g;
            b_out_sum += pb = stackOut.b;
            a_out_sum += pa = stackOut.a;
            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;
            stackOut = stackOut.next;
            yi += width;
        }
    }
}

/**
 * 亮度调节滤镜 <br>
 * 如果需要调亮，就把 rgb 每个值往上调；如果要调暗，就往下调
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {brightness}  brightness: between 0 and 1
 */
function Brighten(imageData, options = {}) {
    let brightness = (options.brightness || 0.1) * 255,
        data = imageData.data,
        len = data.length;

    for (let i = 0; i < len; i += 4) {
        data[i] += brightness;
        data[i + 1] += brightness;
        data[i + 2] += brightness;
    }
}

/**
 * 熔铸调节滤镜 <br>
 * 对每个像素的R, G, B 三个值平均值大于125则设为255 反之设为0
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Casting(imageData, options = {}) {
    let data = imageData.data,
        len = data.length;

    for (var i = 0; i < len; i += 4) {
        let r = data[i],
            g = data[i + 1],
            b = data[i + 2];
        let newR = (r * 128) / (g + b + 1);
        let newG = (g * 128) / (r + b + 1);
        let newB = (b * 128) / (g + r + 1);
        let rgbArr = [newR, newG, newB].map((e) => {
            return e < 0 ? e * -1 : e;
        });
        [data[i], data[i + 1], data[i + 2]] = rgbArr;
    }
}

/**
 * 对比度调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {contrast} contrast: between -100 and 100
 */
function Contrast(imageData, options = {}) {
	let contrast = options.contrast || 20;
    var adjust = Math.pow((contrast + 100) / 100, 2);
    var data = imageData.data,
        nPixels = data.length,
        red = 150, green = 150, blue = 150;

    for (let i = 0; i < nPixels; i += 4) {
        red = data[i];
        green = data[i + 1];
        blue = data[i + 2];
        red /= 255;
        red -= 0.5;
        red *= adjust;
        red += 0.5;
        red *= 255;
        green /= 255;
        green -= 0.5;
        green *= adjust;
        green += 0.5;
        green *= 255;
        blue /= 255;
        blue -= 0.5;
        blue *= adjust;
        blue += 0.5;
        blue *= 255;
        red = red < 0 ? 0 : red > 255 ? 255 : red;
        green = green < 0 ? 0 : green > 255 ? 255 : green;
        blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;
        data[i] = red;
        data[i + 1] = green;
        data[i + 2] = blue;
    }
}

/**
 * 浮雕调节滤镜 <br>
 * 浮雕图像效果是指图像的前景前向凸出背景。<br>
 * 所谓的“浮雕”处理是指图像上的一个像素和它左上方的那个像素之间的差值的一种处理过程，为了使图像保持一定的亮度并呈现灰色，在处理过程中为这个差值加上一个数值为128的常量，需要注意的是，当设置一个像素值的时候，它和它的左上方的像素都要被用到，为了避免用到已经设置过的像素，应该从图像的右下方的像素开始处理，这样还会出现一个问题就是图像最左方和最上方的没有得到处理，这里我把它们的像素值设为128。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {embossStrength, embossWhiteLevel, embossDirection, embossBlend}
 */
function Emboss(imageData, options = {}) {
    let strength = (options.embossStrength || 0.5) * 10,
        greyLevel = (options.embossWhiteLevel || 0.5) * 255,
        direction = (options.embossDirection || "top-left"),
        blend = (options.embossBlend == null ? false : options.embossBlend),
        dirY = 0,
        dirX = 0,
        data = imageData.data,
        w = imageData.width,
        h = imageData.height,
        w4 = w * 4, 
        y = h;

    switch (direction) {
        case 'top-left':
            dirY = -1;
            dirX = -1;
            break;
        case 'top':
            dirY = -1;
            dirX = 0;
            break;
        case 'top-right':
            dirY = -1;
            dirX = 1;
            break;
        case 'right':
            dirY = 0;
            dirX = 1;
            break;
        case 'bottom-right':
            dirY = 1;
            dirX = 1;
            break;
        case 'bottom':
            dirY = 1;
            dirX = 0;
            break;
        case 'bottom-left':
            dirY = 1;
            dirX = -1;
            break;
        case 'left':
            dirY = 0;
            dirX = -1;
            break;
        default:
            console.error('Unknown emboss direction: ' + direction);
    }
    do {
        let offsetY = (y - 1) * w4;
        let otherY = dirY;
        if (y + otherY < 1) {
            otherY = 0;
        }
        if (y + otherY > h) {
            otherY = 0;
        }
        let offsetYOther = (y - 1 + otherY) * w * 4;
        let x = w;
        do {
            let offset = offsetY + (x - 1) * 4;
            let otherX = dirX;
            if (x + otherX < 1) {
                otherX = 0;
            }
            if (x + otherX > w) {
                otherX = 0;
            }

            let offsetOther = offsetYOther + (x - 1 + otherX) * 4;
            let dR = data[offset] - data[offsetOther];
            let dG = data[offset + 1] - data[offsetOther + 1];
            let dB = data[offset + 2] - data[offsetOther + 2];
            let dif = dR;
            let absDif = dif > 0 ? dif : -dif;
            let absG = dG > 0 ? dG : -dG;
            let absB = dB > 0 ? dB : -dB;
            if (absG > absDif) {
                dif = dG;
            }
            if (absB > absDif) {
                dif = dB;
            }

            dif *= strength;
            if (blend) {
                let r = data[offset] + dif;
                let g = data[offset + 1] + dif;
                let b = data[offset + 2] + dif;
                data[offset] = r > 255 ? 255 : r < 0 ? 0 : r;
                data[offset + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
                data[offset + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
            } else {
                let grey = greyLevel - dif;
                if (grey < 0) {
                    grey = 0;
                }
                else if (grey > 255) {
                    grey = 255;
                }
                data[offset] = data[offset + 1] = data[offset + 2] = grey;
            }
        } while (--x);
    } while (--y);
}

/**
 * 增强调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {enhance}  enhance: between 0 and 1
 */
function Enhance(imageData, options = {}) {
    let data = imageData.data,
        nSubPixels = data.length,
        rMin = data[0],
        rMax = rMin,
        r,
        gMin = data[1],
        gMax = gMin,
        g,
        bMin = data[2],
        bMax = bMin,
        b,
        i;

    let enhanceAmount = options.enhance || 0.1;
    if (enhanceAmount === 0) {
        return;
    }
    for (i = 0; i < nSubPixels; i += 4) {
        r = data[i + 0];
        if (r < rMin) {
            rMin = r;
        } else if (r > rMax) {
            rMax = r;
        }
        g = data[i + 1];
        if (g < gMin) {
            gMin = g;
        } else if (g > gMax) {
            gMax = g;
        }
        b = data[i + 2];
        if (b < bMin) {
            bMin = b;
        } else if (b > bMax) {
            bMax = b;
        }
    }
    if (rMax === rMin) {
        rMax = 255;
        rMin = 0;
    }
    if (gMax === gMin) {
        gMax = 255;
        gMin = 0;
    }
    if (bMax === bMin) {
        bMax = 255;
        bMin = 0;
    }
    
    let rMid, rGoalMax, rGoalMin, gMid, gGoalMax, gGoalMin, bMid, bGoalMax, bGoalMin;
    if (enhanceAmount > 0) {
        rGoalMax = rMax + enhanceAmount * (255 - rMax);
        rGoalMin = rMin - enhanceAmount * (rMin - 0);
        gGoalMax = gMax + enhanceAmount * (255 - gMax);
        gGoalMin = gMin - enhanceAmount * (gMin - 0);
        bGoalMax = bMax + enhanceAmount * (255 - bMax);
        bGoalMin = bMin - enhanceAmount * (bMin - 0);
    } else {
        rMid = (rMax + rMin) * 0.5;
        rGoalMax = rMax + enhanceAmount * (rMax - rMid);
        rGoalMin = rMin + enhanceAmount * (rMin - rMid);
        gMid = (gMax + gMin) * 0.5;
        gGoalMax = gMax + enhanceAmount * (gMax - gMid);
        gGoalMin = gMin + enhanceAmount * (gMin - gMid);
        bMid = (bMax + bMin) * 0.5;
        bGoalMax = bMax + enhanceAmount * (bMax - bMid);
        bGoalMin = bMin + enhanceAmount * (bMin - bMid);
    }
    for (i = 0; i < nSubPixels; i += 4) {
        data[i + 0] = __remap(data[i + 0], rMin, rMax, rGoalMin, rGoalMax);
        data[i + 1] = __remap(data[i + 1], gMin, gMax, gGoalMin, gGoalMax);
        data[i + 2] = __remap(data[i + 2], bMin, bMax, bGoalMin, bGoalMax);
    }
}
function __remap(fromValue, fromMin, fromMax, toMin, toMax) {
    let fromRange = fromMax - fromMin, toRange = toMax - toMin, toValue;
    if (fromRange === 0) {
        return toMin + toRange / 2;
    }
    if (toRange === 0) {
        return toMin;
    }
    toValue = (fromValue - fromMin) / fromRange;
    toValue = toRange * toValue + toMin;
    return toValue;
}

/**
 * 灰度调节滤镜 <br>
 * 使用 加权平均值 的方式计算出灰度照片
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Grayscale (imageData, options = {}) {
    let data = imageData.data,
        len = data.length,
        brightness;

    for (let i = 0; i < len; i += 4) {
        brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        // brightness = 0.3 * data[i] + 0.6 * data[i + 1] + 0.1 * data[i + 2];   // 另一种效果
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
    }
}

/**
 * HSL调节滤镜 <br>
 * https://blog.csdn.net/qq_41176800/article/details/104230797
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {hue, saturation, luminance} <br>
 * hue: // 饱和度(Saturation)，用0%~100%表示。 <br>
 * saturation: // 色相(Hue)，三者中意义相同，用0~360°来表示。 <br>
 * luminance: // 亮度(Lightness)，表示白色的量，用0%~100%表示。颜色的明亮程度由L控制。所以，某种最纯的颜色，饱和度为100%，亮度却是50%。
 */
function HSL(imageData, options = {}) {
    let data = imageData.data,
        nPixels = data.length,
        v = 1,
        s = Math.pow(2, (options.saturation || 0)), 
        h = Math.abs((options.hue || 0) + 360) % 360,
        l = (options.luminance || 0) * 127; 

    let vsu = v * s * Math.cos((h * Math.PI) / 180), vsw = v * s * Math.sin((h * Math.PI) / 180);
    let rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw, rg = 0.587 * v - 0.587 * vsu + 0.33 * vsw, rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
    let gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw, gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw, gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
    let br = 0.299 * v - 0.3 * vsu + 1.25 * vsw, bg = 0.587 * v - 0.586 * vsu - 1.05 * vsw, bb = 0.114 * v + 0.886 * vsu - 0.2 * vsw;
    let r, g, b, a;
    for (let i = 0; i < nPixels; i += 4) {
        r = data[i + 0];
        g = data[i + 1];
        b = data[i + 2];
        a = data[i + 3];
        data[i + 0] = rr * r + rg * g + rb * b + l;
        data[i + 1] = gr * r + gg * g + gb * b + l;
        data[i + 2] = br * r + bg * g + bb * b + l;
        data[i + 3] = a;
    }
}

/**
 * 色相/明度/饱和度调节滤镜 <br>
 * HSB（Hue、Saturation、Brightness/Value）HSB也称为HSV <br>
 * HSB与HSL是对RGB色彩模式的另外两种描述方式，尝试描述比RGB更准确的感知颜色联系 <br>
 * https://blog.csdn.net/qq_41176800/article/details/104230797
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {hue, saturation, value} <br>
 * hue: 色相, 用0~360°来表示 <br>
 * saturation: 饱和度(Saturation)，用0%~100%表示 <br>
 * value: 明度(Brightness/Value)，表示光的量，用0%~100%表示
 */
function HSV(imageData, options = {}) {
    let data = imageData.data,
        nPixels = data.length,
        v = Math.pow(2, options.value || 0), 
        s = Math.pow(2, options.saturation || 0),
        h = Math.abs((options.hue || 0) + 360) % 360;

    let vsu = v * s * Math.cos((h * Math.PI) / 180), vsw = v * s * Math.sin((h * Math.PI) / 180);
    let rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw, rg = 0.587 * v - 0.587 * vsu + 0.33 * vsw, rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
    let gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw, gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw, gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
    let br = 0.299 * v - 0.3 * vsu + 1.25 * vsw, bg = 0.587 * v - 0.586 * vsu - 1.05 * vsw, bb = 0.114 * v + 0.886 * vsu - 0.2 * vsw;
    let r, g, b, a;

    for (let i = 0; i < nPixels; i += 4) {
        r = data[i + 0];
        g = data[i + 1];
        b = data[i + 2];
        a = data[i + 3];
        data[i + 0] = rr * r + rg * g + rb * b;
        data[i + 1] = gr * r + gg * g + gb * b;
        data[i + 2] = br * r + bg * g + bb * b;
        data[i + 3] = a;
    }
}

/**
 * 反色调节滤镜 <br>
 * 反色的原理就是用 255 减去原来的值。也就是说红、绿、蓝各自取反。<br>
 * 在反色效果中，不需要修改 a ，因为它负责不透明度。而 rgb 如果都是 255 ，就是白色，如果都是 0 就是黑色。比如 rgb(10, 200, 100) ，那么反色就是 rgb(245, 55, 155)。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Invert(imageData, options = {}) {
    let data = imageData.data,
        len = data.length,
        i;

    for (i = 0; i < len; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
}

/**
 * 万花筒调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {kaleidoscopePower, kaleidoscopeAngle}
 */
function Kaleidoscope(imageData, options = {}) {
    let xSize = imageData.width,
        ySize = imageData.height;
    let x, y, xoff, i, r, g, b, a, srcPos, dstPos;
    let power = Math.round(options.kaleidoscopePower || 2);
    let angle = Math.round(options.kaleidoscopeAngle || 0);
    let offset = Math.floor((xSize * (angle % 360)) / 360);
    if (power < 1) {
        return;
    }

    let tempCanvas = createCanvas();
    tempCanvas.width = xSize;
    tempCanvas.height = ySize;
    let scratchData = tempCanvas.getContext('2d').getImageData(0, 0, xSize, ySize);
    releaseCanvas(tempCanvas);

    __toPolar(imageData, scratchData, {
        polarCenterX: xSize / 2,
        polarCenterY: ySize / 2,
    });
    let minSectionSize = xSize / Math.pow(2, power);
    while (minSectionSize <= 8) {
        minSectionSize = minSectionSize * 2;
        power -= 1;
    }
    minSectionSize = Math.ceil(minSectionSize);
    let sectionSize = minSectionSize;
    let xStart = 0, xEnd = sectionSize, xDelta = 1;
    if (offset + minSectionSize > xSize) {
        xStart = sectionSize;
        xEnd = 0;
        xDelta = -1;
    }
    for (y = 0; y < ySize; y += 1) {
        for (x = xStart; x !== xEnd; x += xDelta) {
            xoff = Math.round(x + offset) % xSize;
            srcPos = (xSize * y + xoff) * 4;
            r = scratchData.data[srcPos + 0];
            g = scratchData.data[srcPos + 1];
            b = scratchData.data[srcPos + 2];
            a = scratchData.data[srcPos + 3];
            dstPos = (xSize * y + x) * 4;
            scratchData.data[dstPos + 0] = r;
            scratchData.data[dstPos + 1] = g;
            scratchData.data[dstPos + 2] = b;
            scratchData.data[dstPos + 3] = a;
        }
    }
    for (y = 0; y < ySize; y += 1) {
        sectionSize = Math.floor(minSectionSize);
        for (i = 0; i < power; i += 1) {
            for (x = 0; x < sectionSize + 1; x += 1) {
                srcPos = (xSize * y + x) * 4;
                r = scratchData.data[srcPos + 0];
                g = scratchData.data[srcPos + 1];
                b = scratchData.data[srcPos + 2];
                a = scratchData.data[srcPos + 3];
                dstPos = (xSize * y + sectionSize * 2 - x - 1) * 4;
                scratchData.data[dstPos + 0] = r;
                scratchData.data[dstPos + 1] = g;
                scratchData.data[dstPos + 2] = b;
                scratchData.data[dstPos + 3] = a;
            }
            sectionSize *= 2;
        }
    }
    __fromPolar(scratchData, imageData, { polarRotation: 0 });
}
let __toPolar = function (src, dst, opt) {
    let srcPixels = src.data,
        dstPixels = dst.data,
        xSize = src.width,
        ySize = src.height,
        xMid = opt.polarCenterX || xSize / 2,
        yMid = opt.polarCenterY || ySize / 2,
        i, x, y,
        r = 0, g = 0, b = 0, a = 0;

    let rad,
        rMax = Math.sqrt(xMid * xMid + yMid * yMid);
    x = xSize - xMid;
    y = ySize - yMid;
    rad = Math.sqrt(x * x + y * y);
    rMax = rad > rMax ? rad : rMax;
    let rSize = ySize,
        tSize = xSize,
        radius, theta;
    let conversion = ((360 / tSize) * Math.PI) / 180, sin, cos;

    for (theta = 0; theta < tSize; theta += 1) {
        sin = Math.sin(theta * conversion);
        cos = Math.cos(theta * conversion);
        for (radius = 0; radius < rSize; radius += 1) {
            x = Math.floor(xMid + ((rMax * radius) / rSize) * cos);
            y = Math.floor(yMid + ((rMax * radius) / rSize) * sin);
            i = (y * xSize + x) * 4;
            r = srcPixels[i + 0];
            g = srcPixels[i + 1];
            b = srcPixels[i + 2];
            a = srcPixels[i + 3];
            i = (theta + radius * xSize) * 4;
            dstPixels[i + 0] = r;
            dstPixels[i + 1] = g;
            dstPixels[i + 2] = b;
            dstPixels[i + 3] = a;
        }
    }
};

let __fromPolar = function (src, dst, opt) {
    let srcPixels = src.data,
        dstPixels = dst.data,
        xSize = src.width,
        ySize = src.height,
        xMid = opt.polarCenterX || xSize / 2,
        yMid = opt.polarCenterY || ySize / 2,
        i, x, y, dx, dy,
        r = 0, g = 0, b = 0, a = 0;

    let rad, rMax = Math.sqrt(xMid * xMid + yMid * yMid);
    x = xSize - xMid;
    y = ySize - yMid;
    rad = Math.sqrt(x * x + y * y);
    rMax = rad > rMax ? rad : rMax;

    let rSize = ySize,
        tSize = xSize,
        radius, theta,
        phaseShift = opt.polarRotation || 0;
    let x1, y1;

    for (x = 0; x < xSize; x += 1) {
        for (y = 0; y < ySize; y += 1) {
            dx = x - xMid;
            dy = y - yMid;
            radius = (Math.sqrt(dx * dx + dy * dy) * rSize) / rMax;
            theta = ((Math.atan2(dy, dx) * 180) / Math.PI + 360 + phaseShift) % 360;
            theta = (theta * tSize) / 360;
            x1 = Math.floor(theta);
            y1 = Math.floor(radius);
            i = (y1 * xSize + x1) * 4;
            r = srcPixels[i + 0];
            g = srcPixels[i + 1];
            b = srcPixels[i + 2];
            a = srcPixels[i + 3];
            i = (y * xSize + x) * 4;
            dstPixels[i + 0] = r;
            dstPixels[i + 1] = g;
            dstPixels[i + 2] = b;
            dstPixels[i + 3] = a;
        }
    }
};

/**
 * 面膜调节滤镜 <br>
 * 先定义一个马赛克范围参数，该参数越大，马赛克的格子就越大。通过该参数去到当前正在操作的像素的四周像素，并将这些像素的颜色值求出一个平均值，然后该像素四周的像素都使用求出来的颜色值。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {threshold}
 * @method
 */
const Mask = (function () {
    return function (imageData, options = {}) {
        var threshold = options.threshold || 200,
            mask = __backgroundMask(imageData, threshold);
        if (mask) {
            mask = __erodeMask(mask, imageData.width, imageData.height);
            mask = __dilateMask(mask, imageData.width, imageData.height);
            mask = __smoothEdgeMask(mask, imageData.width, imageData.height);
            __applyMask(imageData, mask);
        }
        return imageData;
    };

    function __pixelAt(idata, x, y) {
        var idx = (y * idata.width + x) * 4;
        var d = [];
        d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
        return d;
    }

    function __rgbDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) +
            Math.pow(p1[1] - p2[1], 2) +
            Math.pow(p1[2] - p2[2], 2));
    }

    function __rgbMean(pTab) {
        var m = [0, 0, 0];
        for (var i = 0; i < pTab.length; i++) {
            m[0] += pTab[i][0];
            m[1] += pTab[i][1];
            m[2] += pTab[i][2];
        }
        m[0] /= pTab.length;
        m[1] /= pTab.length;
        m[2] /= pTab.length;
        return m;
    }

    function __backgroundMask(idata, threshold) {
        var rgbv_no = __pixelAt(idata, 0, 0);
        var rgbv_ne = __pixelAt(idata, idata.width - 1, 0);
        var rgbv_so = __pixelAt(idata, 0, idata.height - 1);
        var rgbv_se = __pixelAt(idata, idata.width - 1, idata.height - 1);
        var thres = threshold || 10;
        if (__rgbDistance(rgbv_no, rgbv_ne) < thres &&
            __rgbDistance(rgbv_ne, rgbv_se) < thres &&
            __rgbDistance(rgbv_se, rgbv_so) < thres &&
            __rgbDistance(rgbv_so, rgbv_no) < thres) {
            var mean = __rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);
            var mask = [];
            for (var i = 0; i < idata.width * idata.height; i++) {
                var d = __rgbDistance(mean, [
                    idata.data[i * 4],
                    idata.data[i * 4 + 1],
                    idata.data[i * 4 + 2],
                ]);
                mask[i] = d < thres ? 0 : 255;
            }
            return mask;
        }
    }

    function __applyMask(idata, mask) {
        for (var i = 0; i < idata.width * idata.height; i++) {
            idata.data[4 * i + 3] = mask[i];
        }
    }

    function __erodeMask(mask, sw, sh) {
        var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a === 255 * 8 ? 255 : 0;
            }
        }
        return maskResult;
    }

    function __dilateMask(mask, sw, sh) {
        var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a >= 255 * 4 ? 255 : 0;
            }
        }
        return maskResult;
    }

    function __smoothEdgeMask(mask, sw, sh) {
        var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a;
            }
        }
        return maskResult;
    }

})();

/**
 * 噪声调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {noise} noise: between 0 and 1
 */
function Noise(imageData, options = {}) {
    let noise = options.noise || 0.2;
    var amount = noise * 255,
        data = imageData.data,
        nPixels = data.length,
        half = amount / 2, i;

    for (i = 0; i < nPixels; i += 4) {
        data[i + 0] += half - 2 * half * Math.random();
        data[i + 1] += half - 2 * half * Math.random();
        data[i + 2] += half - 2 * half * Math.random();
    }
}

/**
 * 像素化调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {noise} pixelSize: between 5 and 100
 */
function Pixelate(imageData, options = {}) {
    var pixelSize = Math.ceil(options.pixelSize || 8),
        width = imageData.width,
        height = imageData.height,
        x, y, i, red, green, blue, alpha,
        nBinsX = Math.ceil(width / pixelSize),
        nBinsY = Math.ceil(height / pixelSize),
        xBinStart, xBinEnd, yBinStart, yBinEnd, xBin, yBin, pixelsInBin,
        data = imageData.data;

    if (pixelSize <= 0) {
        console.error('pixelSize value can not be <= 0');
        return;
    }

    for (xBin = 0; xBin < nBinsX; xBin += 1) {
        for (yBin = 0; yBin < nBinsY; yBin += 1) {
            red = 0;
            green = 0;
            blue = 0;
            alpha = 0;
            xBinStart = xBin * pixelSize;
            xBinEnd = xBinStart + pixelSize;
            yBinStart = yBin * pixelSize;
            yBinEnd = yBinStart + pixelSize;
            pixelsInBin = 0;
            for (x = xBinStart; x < xBinEnd; x += 1) {
                if (x >= width) {
                    continue;
                }
                for (y = yBinStart; y < yBinEnd; y += 1) {
                    if (y >= height) {
                        continue;
                    }
                    i = (width * y + x) * 4;
                    red += data[i + 0];
                    green += data[i + 1];
                    blue += data[i + 2];
                    alpha += data[i + 3];
                    pixelsInBin += 1;
                }
            }
            red = red / pixelsInBin;
            green = green / pixelsInBin;
            blue = blue / pixelsInBin;
            alpha = alpha / pixelsInBin;
            for (x = xBinStart; x < xBinEnd; x += 1) {
                if (x >= width) {
                    continue;
                }
                for (y = yBinStart; y < yBinEnd; y += 1) {
                    if (y >= height) {
                        continue;
                    }
                    i = (width * y + x) * 4;
                    data[i + 0] = red;
                    data[i + 1] = green;
                    data[i + 2] = blue;
                    data[i + 3] = alpha;
                }
            }
        }
    }
}

/**
 * 色调分离调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {levels} levels: between 0 and 1
 */
function Posterize(imageData, options = {}) {
    var levels = Math.round((options.levels || 0.5) * 254) + 1,
        data = imageData.data,
        len = data.length,
        scale = 255 / levels, i;

    for (i = 0; i < len; i += 1) {
        data[i] = Math.floor(data[i] / scale) * scale;
    }
}

/**
 * 调节RGBA通道滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {red, green, blue, alpha}
 */
function RGBA(imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        red = __checkRGB(options.red || 0),
        green = __checkRGB(options.green || 0),
        blue = __checkRGB(options.blue || 0),
        alpha = __checkAlpha(options.alpha || 0),
        ia;

    for (let i = 0; i < nPixels; i += 4) {
        ia = 1 - alpha;
        data[i] = red * alpha + data[i] * ia;
        data[i + 1] = green * alpha + data[i + 1] * ia;
        data[i + 2] = blue * alpha + data[i + 2] * ia;
    }
}
/**
 * 调节RGB通道滤镜
 * @param {*} imageData 
 * @param {*} options 
 */
const RGB = function (imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        red = __checkRGB(options.red || 255),
        green = __checkRGB(options.green || 255),
        blue = __checkRGB(options.blue || 255),
        brightness;

    for (let i = 0; i < nPixels; i += 4) {
        brightness = (0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]) / 255;
        data[i] = brightness * red;
        data[i + 1] = brightness * green;
        data[i + 2] = brightness * blue;
        data[i + 3] = data[i + 3];
    }
};


/**
 * RGB蒙版滤镜
 * 如果要做红色蒙版，首先求 rgb 3个通道的平均值，将平均值赋给红通道（r），最后将绿和蓝通道设置为0。
 * @param {*} imageData 
 * @param {*} options 
 */
const RGBMask = function (imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        mask = (options.mask || 0),
        val;
    if(mask > 2 || mask < 0) mask = 0;

    for (let i = 0; i < nPixels; i += 4) {
        val = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = (mask == 0 ? val : 0);
        data[i + 1] = (mask == 1 ? val : 0);
        data[i + 2] = (mask == 2 ? val : 0);
    }
};


function __checkRGB(val = 0) {
    if (val > 255) {
        return 255;
    } else if (val < 0) {
        return 0;
    } else {
        return Math.round(val);
    }
}

function __checkAlpha(val = 1) {
    if (val > 1) {
        return 1;
    } else if (val < 0) {
        return 0;
    } else {
        return val;
    }
}

/**
 * 怀旧滤镜
 * 怀旧效果是有点偏黄的黑白灰照片，红 + 绿 = 黄。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Sepia(imageData, options = {}) {
    let data = imageData.data,
        nPixels = data.length,
        i, r, g, b;

    for (i = 0; i < nPixels; i += 4) {
        r = data[i + 0];
        g = data[i + 1];
        b = data[i + 2];
        data[i + 0] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
}

/**
 * 曝光过度调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Solarize(imageData, options = {}) {
    var data = imageData.data,
        w = imageData.width,
        h = imageData.height,
        w4 = w * 4,
        y = h;

    do {
        var offsetY = (y - 1) * w4;
        var x = w;
        do {
            var offset = offsetY + (x - 1) * 4;
            var r = data[offset];
            var g = data[offset + 1];
            var b = data[offset + 2];
            if (r > 127) {
                r = 255 - r;
            }
            if (g > 127) {
                g = 255 - g;
            }
            if (b > 127) {
                b = 255 - b;
            }
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
        } while (--x);
    } while (--y);
}

/**
 * 大理石滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {threshold}, threshold: between 0 and 1
 */
function Threshold(imageData, options = {}) {
    let level = (options.threshold || 0.5) * 255,
        data = imageData.data,
        len = data.length;

    for (let i = 0; i < len; i += 1) {
        data[i] = data[i] < level ? 0 : 255;
    }
}

/**
 * 滤镜名称空间
 */
const Filter = {
    /**
     * 取指定名称的滤镜
     * @param {String} name 
     * @returns Filter function
     */
    getFilter: function (name) {
        name = name.toLowerCase();
        let filter;
        switch (name) {
            case "black":
                filter = Black;
                break;
            case "blur":
                filter = Blur;
                break;
            case "brighten":
                filter = Brighten;
                break;
            case "castingd":
                filter = Casting;
                break;
            case "contrast":
                filter = Contrast;
                break;
            case "emboss":
                filter = Emboss;
                break;
            case "enhancea":
                filter = Enhance;
                break;
            case "grayscale":
                filter = Grayscale;
                break;
            case "hsl":
                filter = HSL;
                break;
            case "hsv":
                filter = HSV;
                break;
            case "invert":
                filter = Invert;
                break;
            case "kaleidoscope":
                filter = Kaleidoscope;
                break;
            case "mask":
                filter = Mask;
                break;
            case "noise":
                filter = Noise;
                break;
            case "pixelate":
                filter = Pixelate;
                break;
            case "posterize":
                filter = Posterize;
                break;
            case "rgba":
                filter = RGBA;
                break;
            case "rgb":
                filter = RGB;
                break;
            case "rgbmask":
                filter = RGBMask;
                break;
            case "sepia":
                filter = Sepia;
                break;
            case "solarize":
                filter = Solarize;
                break;
            case "threshold":
                filter = Threshold;
                break;
            default:
                filter = null;
                break;
        }
        return filter;
    }
};

/**
 * 矢量数据图层渲染类
 */
class VectorRenderer extends LayerRenderer {
    constructor() {
        super();
    }

    /**
     * 将source合成画面
     */
    composeBuffer(frameState) {
        let beginTime = Date.now();
        let t1 = 0, t2 = 0, t3 = 0;
        // 取出待渲染的数据
        let buffer;
        if (frameState.extent == null) {
            buffer = this.getLayer().getSource().getData();
        } else {
            buffer = this.getLayer().getSource().getExtentData(frameState.extent);
        }
        t1 = (Date.now() - beginTime);
        beginTime = Date.now();
        // 清空mainCanvasMarkObj中的内容
        if (this.getLayer().getGraph().mainCanvasMarkObj !== undefined) {
            let layerId = this.getLayer().getZIndex();
            $(this.getLayer().getGraph().mainCanvasMarkObj).children("[layerid='" + layerId + "']").remove();
        }

        // 触发图层事件
        this.getLayer().triggerEvent(EventType.ComposeBefore, { "layer": this.getLayer(), "frameState": frameState, "context": this._context, "buffer": buffer });

        let pointCount = 0;
        if (buffer == null || buffer.length == 0) {
            this.clearScreen();
        } else {
            this.clearScreen();
            // 坐标转换为像素
            pointCount = this._convert2Pixel(buffer, frameState);
            // 裁切, 测试并没有提升效率2023/7/7
            // if (frameState.extent != null) {
            //     this.clip(this._context, [0, 0, frameState.size.width, frameState.size.height]);
            // }
            t2 = (Date.now() - beginTime);
            beginTime = Date.now();

            // 在画板中渲染矢量数据
            if (this.getLayer().isUseTransform()) {
                this._context.save();
                let trans = frameState.coordinateToPixelTransform;
                this._context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4], trans[5]);
                this._loopDraw(buffer, this._context, frameState);
                this._context.restore();
            } else {
                this._loopDraw(buffer, this._context, frameState);
            }
            t3 = (Date.now() - beginTime);
        }

        // 返回执行时间
        let execTime = t1 + t2 + t3; //(Date.now() - beginTime);
        if ((execTime > 120) && execTime > 10) {
            console.debug("execute VectorRenderer.composeBuffer(), name:%s, time:%dms, nodeCount:%d, coordCount:%d, getData():%d, conver2Pixel():%d, loopDraw():%d",
                this.getLayer().getFullName(), execTime, (buffer == null ? 0 : buffer.length), pointCount, t1, t2, t3);
        }

        // 触发图层事件
        this.getLayer().triggerEvent(EventType.ComposeAfter, { "layer": this.getLayer(), "frameState": frameState, "context": this._context });

        return buffer == null ? 0 : buffer.length;
    }

    /**
     * 将坐标转换为像素
     * @param {Array} list
     */
    _convert2Pixel(list, frameState) {
        let pointCount = 0;
        if (this.getLayer().isUsePixelCoord() || this.getLayer().isUseTransform()) {
            let transform = Transform.create();
            for (let i = 0; i < list.length; i++) {
                let obj = list[i];
                if (obj instanceof Geometry) {
                    obj.toPixel(transform);
                    obj.styleToPixel(transform);
                    pointCount += obj.getCoord().length;
                }
            }
        } else {
            let ratio;
            if (frameState.useMatrix === true) {
                ratio = new Ratio();
                let size = frameState.size;
                ratio.setCanvasExtent([0, 0, size.width, size.height]);
                ratio.setWorldExtent(frameState.extent);
                ratio.setWorldExtentOrigin(this.getLayer().getGraph().originAtLeftTop);
            }
            // 逐个对象进行转换
            for (let i = 0; i < list.length; i++) {
                let obj = list[i];
                if (obj instanceof Geometry) {
                    if (frameState.useMatrix === true) {
                        obj.toPixel(ratio);
                        obj.styleToPixel(ratio);
                    } else {
                        obj.toPixel(frameState.coordinateToPixelTransform);
                        obj.styleToPixel(frameState.coordinateToPixelTransform);
                    }
                    pointCount += obj.getCoord().length;
                }
            }
        }
        return pointCount;
    }

    /**
     * 数据渲染
     * @param {Array} list 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} frameState
     */
    _loopDraw(list, ctx, frameState) {
        if (ctx == null) ctx = this._context;
        let mergeLineObj = new MultiPolyline({ "coords": [] });
        let mergeLine = false;

        ctx.save();

        // 整体偏移
        let offset = this.getLayer().getOffset();
        ctx.translate(offset.x, offset.y);

        // 逐个对象开始渲染
        for (let i = 0, ii = list.length; i < ii; i++) {
            let goon = true;
            let obj = list[i];
            let style = this._getStyle(obj);

            // 动态样式
            if (typeof (style.dynamicFn) === "function") {
                goon = style.dynamicFn(obj, style, frameState);
            }

            // 将polyline合并为multiPolyline，从而提高渲染效率
            if (obj.getType() === GGeometryType.POLYLINE && this.getLayer().getStyle().mergeLine === true && obj.getRenderStyle() == null) {
                mergeLineObj.addLine(obj, style);
                mergeLine = true;
                continue;
            }

            // 对象渲染
            if (style.visible !== false) {
                if (goon || goon == null) {
                    obj.draw(ctx, style, frameState);
                    // 绘制边框
                    if (obj.isFocus()) {
                        obj.drawBorder(ctx, style);
                    }
                    // 当frameState.viewGeomList不为空时，绘制用于拾取的颜色框
                    if (this._hitContext && frameState.viewGeomList != null && !this.getLayer().isAuxLayer()) {
                        let hitStyle = style;
                        let uniqueColor = obj.prop("uniqueColor");
                        if (uniqueColor == null) {
                            uniqueColor = Color.getUniqueColor().toHex();
                            obj.prop("uniqueColor", uniqueColor);
                        }
                        if (hitStyle.color != null && hitStyle.color != "none") {
                            hitStyle.color = uniqueColor;
                            frameState.viewGeomList.set(uniqueColor, obj);
                        }
                        if (hitStyle.fillColor != null && hitStyle.fillColor != "none") {
                            hitStyle.fillColor = uniqueColor;
                            frameState.viewGeomList.set(uniqueColor, obj);
                        }
                        // 绘制拾取颜色框
                        obj.drawHitBlock(this._hitContext, hitStyle, frameState);
                    }
                }
            }
        }

        if (mergeLine === true) {
            mergeLineObj.draw(ctx, mergeLineObj.style, frameState);
        }
        ctx.restore();
    }

    /**
     * 获取样式，优先级：对象样式>符号样式>图层样式
     * @param {Geometry} obj 
     * @returns style
     */
    _getStyle(obj) {
        let objStyle = obj.style;
        let layerStyle = this._getTypeStyle(obj, this.getLayer().getStyle());

        // 父style是否优先
        let layerPrior = (layerStyle !== null && layerStyle.layerPrior === true ? true : false);
        let style = (layerPrior ? Object.assign({}, objStyle, layerStyle) : Object.assign({}, layerStyle, objStyle));

        // 对象附加样式最优先
        Object.assign(style, obj.getRenderStyle());

        return style;
    }

    /**
     * 根据几何对象类型从layerStyle获取相应样式
     * @private
     * @param {*} obj 
     * @param {*} layerStyle 
     * @returns Object
     */
    _getTypeStyle(obj, layerStyle) {
        // 根据几何对象类型从layerStyle获取相应样式
        let style = {};
        if (obj instanceof Geometry) {
            if (obj instanceof Polygon) {
                style = getTypeStyle(GGShapeType.SURFACE, layerStyle);
            } else if (obj instanceof Text) {
                style = getTypeStyle(GGShapeType.TEXT, layerStyle);
            } else if (obj instanceof Point || obj instanceof Symbol) {
                style = getTypeStyle(GGShapeType.POINT, layerStyle);
            } else {
                style = getTypeStyle(GGShapeType.LINE, layerStyle);
            }
        } else {
            style = getTypeStyle(GGShapeType.OTHER, layerStyle);
        }
        return style;
    }

    /**
     * 裁切
     * @param {CanvasRenderingContext2D} context 
     * @param {*} extent 
     * @private
     */
    clip(context, extent) {
        let topLeft = Extent.getTopLeft(extent);
        let topRight = Extent.getTopRight(extent);
        let bottomRight = Extent.getBottomRight(extent);
        let bottomLeft = Extent.getBottomLeft(extent);
        //context.save();
        context.beginPath();
        context.moveTo(topLeft[0], topLeft[1]);
        context.lineTo(topRight[0], topRight[1]);
        context.lineTo(bottomRight[0], bottomRight[1]);
        context.lineTo(bottomLeft[0], bottomLeft[1]);
        context.clip();
        context.closePath();
        //context.restore()
    };

    /**
     * 清空画板内容
     * @param {CanvasRenderingContext2D} ctx 
     * @returns Object
     */
    clearContext(ctx) {
        let size = this.getSize();
        ctx.clearRect(0, 0, size.width, size.height);
        return this;
    }
}

/**
 * 四叉树空间索引类
 *
 * 象限索引编号如下：
 *  1  |  0
 * ----+----
 *  2  |  3
 */
class QuadTree {
    constructor(bbox, lvl, parent, idx = "0") {
        /**
         * 象限位置和大小
         */
        this.bounds = bbox || { x: 0, y: 0, width: 0, height: 0 };

        /**
         * 最大可包含的对象数量
         */
        this.maxObjects = 10;

        /**
         * 对象类型GeometryObject
         */
        this.objects = [];

        /**
         * 子象限
         */
        this.nodes = [];
        /**
         * 级别
         */
        this.level = lvl || 0;

        /**
         * 最大级别
         */
        this.maxLevels = 5;

        /**
         * 父节点
         */
        this.parent = parent;

        /**
         * 名称
         */
        this.name = (parent == null ? "" : (parent.name + "-")) + idx;
    }

    /*
     * 清除四叉树和对象的所有节点
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }
        this.nodes = [];
    };

    /*
     * 返回树节点中所有对象
     */
    getAllObjects(objArray) {
        if (objArray == null) objArray = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(objArray);
        }
        for (let i = 0, len = this.objects.length; i < len; i++) {
            objArray.push(this.objects[i]);
        }
        return objArray;
    };

    /*
     * 返回对象可能碰撞的所有对象
     */
    findObjects(obj, objArray) {
        if (objArray == null) {
            objArray = [];
        }
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }
        let index = this.getIndex(obj.getBBox());
        if (index != -1 && this.nodes.length > 0) {
            this.nodes[index].findObjects(obj, objArray);
        }
        for (let i = 0, len = this.objects.length; i < len; i++) {
            objArray.push(this.objects[i]);
        }
        return objArray;
    };

    /**
     * 根据extent获取数据
     * @param {*} obj 
     * @returns Array
     */
    getObjects(extent) {
        let qd = this.getQuadTree(extent);
        let result = [];

        // 分析该四叉树中的所有对象
        let inList = qd.getAllObjects();
        let area = extent.slice();
        for (let i = 0, ii = inList.length; i < ii; i++) {
            let objExtent = inList[i].getBBox();
            if (Extent.containsExtent(area, objExtent) || Extent.intersects(area, objExtent)) {
                result.push(inList[i]);
            }
        }

        // 分析该四叉树父节点中的所有对象
        let pqd = qd.parent;
        while (pqd != null) {
            for (let i = 0, ii = pqd.objects.length; i < ii; i++) {
                let objExtent = pqd.objects[i].getBBox();
                if (Extent.containsExtent(area, objExtent) || Extent.containsExtent(objExtent, area) || Extent.intersects(area, objExtent)) {
                    result.push(pqd.objects[i]);
                }
            }
            pqd = pqd.parent;
        }

        return result;
    }

    /*
     * 返回obj所在的GQuadTree节点
     */
    getQuadTree(extent) {
        if (typeof extent === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }
        let index = this.getIndex(extent);
        if (index != -1 && this.nodes.length > 0) {
            return this.nodes[index].getQuadTree(extent);
        } else {
            return this;
        }
    };

    /*
     * 将对象插入到四叉树中。如果树超出了容量，它将拆分所有对象并将其添加到相应的节点。
     */
    insert(obj) {
        if (typeof obj === "undefined") {
            return;
        }

        if (obj instanceof Array) {
            for (let i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }
            return;
        }

        if (this.nodes.length > 0) {
            let index = this.getIndex(obj.getBBox());
            // 只有当对象可以完全容纳在一个子节点中时，才将其添加到子节点 
            if (index != -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }

        this.objects.push(obj);
        // 防止无限分割
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes[0] == null) {
                this.split();
            }
            let i = 0;
            while (i < this.objects.length) {
                let index = this.getIndex(this.objects[i].getBBox());
                if (index != -1) {
                    this.nodes[index].insert((this.objects.splice(i, 1))[0]);
                } else {
                    i++;
                }
            }
        }
    };

    /*
     * 确定对象属于哪个节点。-1表示对象不能完全适应节点，并且是当前节点的一部分
     */
    getIndex(extent) {
        let index = -1;

        // 构造对象的x,y,width, height属性
        // let extent = obj.getBBox();
        let objPos = { x: extent[0], y: extent[1], width: extent[2] - extent[0], height: extent[3] - extent[1] };

        let verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        let horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        // 对象可以完全放在顶部象限内
        let topQuadrant = (objPos.y < horizontalMidpoint && objPos.y + objPos.height < horizontalMidpoint);
        // 对象可以完全放在底部量块内
        let bottomQuadrant = (objPos.y > horizontalMidpoint);

        // 对象可以完全放在左侧象限内
        if (objPos.x < verticalMidpoint && objPos.x + objPos.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        } else if (objPos.x > verticalMidpoint) {  // 对象可以在正确的范围内完全修复
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };

    /*
     * 将节点拆分为4个子节点
     */
    split() {
        let subWidth = (this.bounds.width / 2) | 0;
        let subHeight = (this.bounds.height / 2) | 0;
        this.nodes[0] = new QuadTree({ x: this.bounds.x + subWidth, y: this.bounds.y, width: subWidth, height: subHeight }, this.level + 1, this, 0);
        this.nodes[1] = new QuadTree({ x: this.bounds.x, y: this.bounds.y, width: subWidth, height: subHeight }, this.level + 1, this, 1);
        this.nodes[2] = new QuadTree({ x: this.bounds.x, y: this.bounds.y + subHeight, width: subWidth, height: subHeight }, this.level + 1, this, 2);
        this.nodes[3] = new QuadTree({ x: this.bounds.x + subWidth, y: this.bounds.y + subHeight, width: subWidth, height: subHeight }, this.level + 1, this, 3);
    };

    print(opt = { total: 0, num: 0, includeChid: true }) {
        opt.num += 1;
        opt.total += this.objects.length;
        let space = "";
        for (let i = 0; i < this.level; i++) {
            space = space + "    ";
        }

        console.info("%slevel:%d, name:%s, extent:%d,%d,%d,%d, objCount:%d", space,
            this.level, this.name, this.bounds.x, this.bounds.y, this.bounds.x + this.bounds.width, this.bounds.y + this.bounds.height, this.objects.length);

        if (opt.includeChid == true) {
            for (let idx in this.nodes) {
                this.nodes[idx].print(opt);
            }
        }
        return opt;
    }
}

/**
 * 最近最少使用的缓存类
 * @description LRU是Least Recently Used的缩写,意思是最近最少使用，是一种Cache替换算法。
 * Cache的容量有限，因此当Cache的容量用完后，而又有新的内容需要添加进来时，就需要挑选并舍弃原有的部分内容，从而腾出空间来放新内容。
 * LRU Cache 的替换原则就是将最近最少使用的内容替换掉。其实，LRU译成最久未使用会更形象， 因为该算法每次替换掉的就是一段时间内最久没有使用过的内容。
 */
class LRUCache {
    /**
     * 构造函数
     */
    constructor() {
        /**
         * 缓存对象数
         * @private
         * @type {number} 
         */
        this.count_ = 0;

        /**
         * 缓存数据
         *  {
         *     key_ : key, 
         *     newer : null,
         *     older : this.newest_,     //比当前对象更老的对象
         *     value_ : value            //比当前对象更新的对象
         *   }
         * @private 
         * @type {Object}
         */
        this.entries_ = {};

        /**
         * 最先加入缓存的对象
         * @private 
         * @type {Object}
         */
        this.oldest_ = null;

        /**
         * 最后加入缓存的对象
         * @private 
         * @type {Object}
         */
        this.newest_ = null;
    }

    /**
     * 清除缓存
     */
    clear() {
        this.count_ = 0;
        this.entries_ = {};
        this.oldest_ = null;
        this.newest_ = null;
    }

    /**
     * 判断取缓存中是否包含某对象
     * @param {string} key Key. 
     * @return {boolean} Contains key.
     */
    containsKey(key) {
        return this.entries_.hasOwnProperty(key);
    }

    /**
     * 取缓存中的对象值
     * @param {string} key Key. 
     * @return {T} Value.
     */
    get(key) {
        var entry = this.entries_[key];
        if(entry == null) {
            return null;
        } else if (entry === this.newest_) {
            return entry.value_;
        } else if (entry === this.oldest_) {
            this.oldest_ = (this.oldest_.newer);
            this.oldest_.older = null;
        } else {
            entry.newer.older = entry.older;
            entry.older.newer = entry.newer;
        }
        entry.newer = null;
        entry.older = this.newest_;
        this.newest_.newer = entry;
        this.newest_ = entry;
        return entry.value_;
    }

    /**
     * 取缓存中的对象数量
     * @return {number} Count.
     */
    getCount() {
        return this.count_;
    }

    /**
     * 取缓存中所有对象的Key
     * @return {Array.<string>} Keys. 
     */
    getKeys() {
        var keys = new Array(this.count_);
        var i = 0;
        var entry;
        for (entry = this.newest_; entry; entry = entry.older) {
            keys[i++] = entry.key_;
        }
        return keys;
    }

    /**
     * 取缓存中所有对象的Value
     * @return {Array.<T>} Values. 
     */
    getValues() {
        var values = new Array(this.count_);
        var i = 0;
        var entry;
        for (entry = this.newest_; entry; entry = entry.older) {
            values[i++] = entry.value_;
        }
        return values;
    }

    /**
     * 取最老的缓存对象值
     * @return {T} Last value. 
     * 
     */
    peekLast() {
        return this.oldest_.value_;
    }

    /**
     * 取最老的缓存对象的Key值
     * @return {string} Last key.  
     */
    peekLastKey() {
        return this.oldest_.key_;
    }

    /**
     * 取最老的对象，并在缓存中删除该对象
     * @return {T} value Value.  
     */
    pop() {
        var entry = this.oldest_;
        delete this.entries_[entry.key_];
        if (entry.newer) {
            entry.newer.older = null;
        }
        this.oldest_ = (entry.newer);
        if (!this.oldest_) {
            this.newest_ = null;
        }
        --this.count_;
        return entry.value_;
    }

    /**
     * 更新缓存中指定Key的对应的缓存对象值
     * @param {string} key Key.
     * @param {T} value Value.
     */
    replace(key, value) {
        this.get(key); // update `newest_`
        this.entries_[key].value_ = value;
    }

    /**
     * 设置缓存中指定Key对应的缓存对象值
     * @param {string} key Key.
     * @param {T} value Value.
     */
    set(key, value) {
        var entry = {
            key_: key,
            newer: null,
            older: this.newest_,     //比当前对象更老的对象
            value_: value            //比当前对象更新的对象
        };
        if (!this.newest_) {
            this.oldest_ = entry;       // 最老的对象
        } else {
            this.newest_.newer = entry;
        }
        this.newest_ = entry;           // 最新的对象
        this.entries_[key] = entry;
        ++this.count_;
    }
}

/**
 * 图形缓存类
 */
class ImageCache extends LRUCache {
    /**
     * 构造函数
     */
    constructor(opt_highWaterMark) {
        super();
        this.highWaterMark_ = (opt_highWaterMark !== undefined) ? opt_highWaterMark : 1024;
    }

    /**
     * 是否能够缓存
     */
    canExpireCache() {
        return this.getCount() > this.highWaterMark_;
    }

    /**
     * 过期处理
     */
    expireCache(usedTiles) {
        let tileKey;
        while (this.canExpireCache()) {
            tileKey = this.peekLastKey();
            if (Array.isArray(usedTiles)) {
                if (usedTiles.indexOf(tileKey) >= 0) {  // 判断oldest对象是否在需保留的数组中
                    break;
                } else {
                    this.pop();
                }
            } else {
                this.pop();
            }
        }
    }
}

/**
 * 常量：缓存位图文件数量
 */
const IMAGE_CACHE_SIZE = 1000;

/**
 * 数据源基础类
 */
class BaseSource extends EventTarget {
    constructor(options) {
        super();

        /**
         * 数据集合
         */
        this.dataBuffer = [];

        /**
         * 图像集合
         */
        this.imageBuffer = [];

        /**
         * 图层
         */
        this.layer = null;

        /**
         * 最后一次的屏幕范围
         */
        this.lasterExtent = [];
    }

    /**
     * 清除已有数据
     */
    clearData(id) {
        //savaData(this.dataBuffer);   // 在清除数据之前，将该数据存储起来，可方便调试
        if (id == null) {
            this.dataBuffer = [];
        } else {
            // 移除指定ID的dataBuffer
            for (let i = this.dataBuffer.length - 1, ii = 0; i >= ii; i--) {
                let obj = this.dataBuffer[i];
                if (obj.getUid() == id) {
                    this.dataBuffer.splice(i, 1);
                }
            }
        }
    }

    /**
     * 读取数据
     */
    getData(id) {
        if (this.dataBuffer.length > 0) {
            if (id == null) {
                return this.dataBuffer;
            } else {
                let datas = [];
                // 按ID进行过滤
                for (let i = 0, ii = this.dataBuffer.length; i < ii; i++) {
                    let obj = this.dataBuffer[i];
                    if (obj.properties != null && obj.properties.id == id) {
                        datas.push(obj);
                    }
                }
                return datas;
            }
        } else {
            return [];
        }
    }

    /**
     * 增加数据
     */
    add(data, isTop) {
        if (isTop === true) {
            if (data.length > 0) {
                this.dataBuffer = data.concat(this.dataBuffer);
            } else {
                this.dataBuffer.unshift(data);
            }
        } else {
            if (data.length > 0) {
                this.dataBuffer = this.dataBuffer.concat(data);
            } else {
                this.dataBuffer.push(data);
            }
        }
    }

    /**
     * 取图层
     */
    getLayer() {
        return this.layer;
    }

    /**
     * 设置图层
     * 初始化Layer对象时，将会调用此方法
     */
    setLayer(layer) {
        this.layer = layer;
    }
}

/**
 * 矢量数据源解析格式抽象类
 */
class FeatureFormat {
    readFeatures(source, options) {
        return ClassUtil.abstract(source, options);
    }
}

/**
 * GGeometry列表数据格式解析
 */
class GeometryFormat extends FeatureFormat {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readFeatures(features) {
        let listData = [];
        
        // 单图层数据
        if (features.length > 0 && features[0].name == null) {
            listData = this._loadData(features);
        } 
        // 多图层数据
        else {
            for (let i = 0; i < features.length; i++) {
                listData = listData.concat(this._loadData(features[i].data));
            }
        }
        return listData;
    }
    
    _loadData(features) {
		let listData = [];
		for (let i = 0, ii = features.length; i < ii; i++) {
				if ( features[i] instanceof Geometry) {
              listData.push(features[i]);
            } else {
            	let geomObj = createGeom(features[i]);           
            	listData.push(geomObj);
            }
        }
        return listData;
	}
}

/**
 * 根据Geom数据创建Geometry对象
 * @param {Object} obj 
 * @returns GeometryObject
 */
function createGeom(obj) {
    let geomObj;
    if (obj.type === GGeometryType.POINT) {
        geomObj = new Point(obj);
    } else if (obj.type === GGeometryType.CIRCLE) {
        geomObj = new Circle(obj);
    } else if (obj.type === GGeometryType.ELLIPSE) {
        geomObj = new Ellipse(obj);
    } else if (obj.type === GGeometryType.POLYLINE) {
        geomObj = new Polyline(obj);
    } else if (obj.type === GGeometryType.POLYGON) {
        geomObj = new Polygon(obj);
    } else if (obj.type === GGeometryType.RECT) {
        geomObj = new Rect(obj);
    } else if (obj.type === GGeometryType.TRIANGLE) {
        geomObj = new Triangle(obj);
    } else if (obj.type === GGeometryType.MARK) {
        geomObj = new Mark(obj);
    } else if (obj.type === GGeometryType.SYMBOL) {
        geomObj = new Symbol(obj);
    } else if (obj.type === GGeometryType.TEXT) {
        geomObj = new Text(obj);
    } else if (obj.type === GGeometryType.IMAGE) {
        geomObj = new Image(obj);
    } else if (obj.type === GGeometryType.PATH) {
        geomObj = new Path(obj);
    } else {
        console.info("unsupport object", geomObj);
    }
    return geomObj;
}

/**
 * 计数器工具类
 */
class Counter {
    constructor(name) {
        this.name = (name == null ? "globle" : name);
        this.counterVariable = {};
    }

    /**
     * 计数
     * @param {String} key 
     * @param {int} val 
     */
    add(key, val = 1) {
        let objVal = this.counterVariable[key];
        if (objVal == null) {
            objVal = { "times": 1, "sum": val, "last": val };
        } else {
            objVal = { "times": objVal.times + 1, "sum": objVal.sum + val, "last": val };
        }
        this.counterVariable[key] = objVal;
    }

    /**
     * 重置计数器
     */
    reset() {
        this.counterVariable = {};
        return true;
    }

    /**
     * 在控制台显示计数信息
     * @param {Boolean} isSimple 
     */
    print(isSimple = false) {
        let times = 0;
        let sum = 0;

        if (isSimple === true) {
            // 计算平均数
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                times += val.times;
                sum += val.sum;
            }

            // 仅显示大于平均数的项
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                if (val.sum / val.times > sum / times) {
                    if (val.times === val.sum) {
                        console.info("%s => %d", key, val.times);
                    } else {
                        console.info("%s => times:%d, last:%d, sum:%d, averageValue:%f", key, val.times, val.last, val.sum, MathUtil.toFixed(val.sum / val.times, 2));
                    }
                }
            }
        } else {
            console.info(this.name + " => " + Object.keys(this.counterVariable).join(","));
            // 显示全部
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                if (val.times === val.sum) {
                    console.info("%s => %d", key, val.times);
                } else {
                    console.info("%s => times:%d, last:%d, sum:%d, averageValue:%f", key, val.times, val.last, val.sum, MathUtil.toFixed(val.sum / val.times, 2));
                }
                times += val.times;
                sum += val.sum;
            }
            // 显示求和统计
            if (times === sum) {
                console.info("total:" + times);
            } else {
                console.info("total: times:%d, sum:%d, averageValue:%f", times, sum, MathUtil.toFixed(sum / times, 2));
            }
        }
        return true;
    }
}

/**
 * ajax请求工具类
 * @class
 */
const AjaxUtil = {};

(function () {
    /**
     * 发送GET请求
     * @method
     * @param {Object} args 
     */
    AjaxUtil.get = function (args) {
        return this.send(Object.assign({}, args, { "method": "GET" }));
    };

    /**
     * 发送POST请求
     * @method
     * @param {Object} args 
     */
    AjaxUtil.post = function (args) {
        return this.send(Object.assign({}, args, { "method": "POST" }));
    };

    /**
     * 发送AJAX请求
     * @method
     * @param {Object} args {url, data, dataType, async, success, error, method, header, timeout, username, password}
     */
    AjaxUtil.send = function (args = {}) {

        Object.assign(args, { "async": true, "debug": false });
        if (args.method == null) {
            args.method = "GET";
        }

        const xhr = new XMLHttpRequest();

        // 请求方法， 默认值为GET
        const method = (args.method == null ? "GET" : args.method.toUpperCase());
        // true:异步， false:同步
        const async = (args.async == null ? true : args.async);


        // XML类型需指定为document
        if (args.dataType != null && args.dataType.toLowerCase() == "xml") {
            args.dataType = "document";
        }

        // 设置响应返回的数据格式
        if (async === true) {
            xhr.responseType = args.dataType != null ? args.dataType : "text";
        }

        // 设置xhr请求的超时时间, 当xhr为一个sync同步请求时，xhr.timeout必须置为0
        xhr.timeout = args.timeout == null ? 0 : args.timeout;   //0为不超时, 单位：milliseconds 毫秒

        //判断是否超时
        if (args.timeout) {
            setTimeout(function () {
                if (typeof (args.error) === "function") {
                    args.error({ "errorMsg": "timeout" });
                }
                xhr.abort();
            }, args.timeout);
        }

        // 注册相关事件回调处理函数
        let errorCallback = function (error) {
            if (typeof (args.error) === "function") {
                args.error({ "status": xhr.status, "statusText": xhr.statusText, "errorMsg": error });
            } else {
                console.error("发送ajax请求失败", e);
            }
        };
        xhr.onabort = function () {
            errorCallback("abort");
        };
        xhr.onerror = function () {
            errorCallback("error");
        };
        xhr.ontimeout = function () {
            errorCallback("timeout");
        };
        xhr.onload = function (e) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                if (typeof (args.success) === "function") {
                    if (args.dataType.toLowerCase() === "document") {
                        return args.success(xhr.responseXML);
                    } else if (args.dataType.toLowerCase() === "json" || args.dataType.toLowerCase() === "arraybuffer") {
                        return args.success(xhr.response);
                    } else {
                        return args.success(xhr.responseText);
                    }
                }
                console.debug("发送ajax请求结束");
            }
        };

        xhr.onloadend = function (e) {
            if (xhr.status == 404) {
                errorCallback("404 error");
            }
        };

        // 请求Header
        let header = args.header || {};

        if (method === "GET") {
            let url = args.url;

            // 将url中?后的数据和args.data合并为查询字符串
            let qs = _getParam(Object.assign(_url2Object(url), args.data));
            if (url.indexOf("?") > 0) {
                url = url.substr(0, args.url.indexOf("?"));
            }

            // 创建一个 get 请求, 
            xhr.open("GET", url + "?" + qs, async);
            // 设置request header
            _addHeader(xhr, header);

            //发送数据
            try {
                xhr.send();
            } catch (e) {
                errorCallback(e);
            }
        } else {
            // 创建一个 get 请求, 
            xhr.open("POST", args.url, async);
            // 设置request header
            header["Content-Type"] = "application/x-www-form-urlencoded";
            _addHeader(xhr, header);

            //发送数据
            try {
                xhr.send(args.data);
            } catch (e) {
                errorCallback(e);
            }
        }
    };

    /**
     * 把url中的查询字符串转为对象，主要是想当方式为get时，用data对象的参数覆盖掉url中的参数
     */
    function _url2Object(url) {
        let urlSplit = url.split("?");
        let queryArr = (urlSplit.length > 1 ? urlSplit[1].split("&") : []);
        let obj = {};
        for (let i = 0, ii = queryArr.length; i < ii; i++) {
            let segs = queryArr[i].split("=");
            let key = segs[0];
            let value = segs[1];
            obj[key] = value;
        }
        return obj;
    }

    // 序列化参数, 参考自jquery
    function _getParam(obj, traditional = false) {

        var rbracket = /\[\]$/;
        function isFunction(it) {
            return Object.prototype.toString.call(it) === "[object Function]";
        }

        function isObject(it) {
            return Object.prototype.toString.call(it) === "[object Object]";
        }

        function buildParams(prefix, obj, traditional, add) {
            if (Array.isArray(obj)) {
                // Serialize array item.
                obj.forEach(function (v, i) {
                    if (traditional || rbracket.test(prefix)) {
                        // Treat each array item as a scalar.
                        add(prefix, v);
                    } else {
                        // Item is non-scalar (array or object), encode its numeric index.
                        buildParams(
                            prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                            v,
                            traditional,
                            add
                        );
                    }
                });
            } else if (!traditional && isObject(obj)) {
                // Serialize object item.
                for (let name in obj) {
                    buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
                }
            } else {
                // Serialize scalar item.
                add(prefix, obj);
            }
        }

        // Serialize an array of form elements or a set of key/values into a query string
        function jollyparam(a, traditional) {
            var prefix,
                s = [],
                add = function (key, valueOrFunction) {
                    // If value is a function, invoke it and use its return value
                    var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
                    s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
                };
            // If an array was passed in, assume that it is an array of form elements.
            if (Array.isArray(a)) {
                // Serialize the form elements
                a.forEach(function (item) {
                    add(item.name, item.value);
                });
            } else {
                // If traditional, encode the "old" way (the way 1.3.2 or older did it), otherwise encode params recursively.
                for (prefix in a) {
                    buildParams(prefix, a[prefix], traditional, add);
                }
            }
            s.push("accTimeId=" + Date.now());
            // Return the resulting serialization
            return s.join("&");
        }

        return jollyparam(obj, traditional);
    }

    // 增加请求Header
    function _addHeader(xhr, headers) {
        for (let i in headers) {
            xhr.setRequestHeader(i, headers[i]);
        }
    }
    // function uploadFile() {
    //     var formData = new FormData();
    //     for (var i = 0; i < files.length; i++) {
    //         formData.append('files[]', files[i]);
    //     }
    //     xhr.send(formData);
    // }
}());

// 使用XMLHttpRequest对象来发送一个Ajax请求 （XMLHttpRequest Level 2）
//
// 参考1： http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html
// 参考2： https://www.jb51.net/article/185800.htm
//
// 使用 responseType 设置响应返回的数据格式
//    *  ""             String字符串    默认值
//    *  "text"         String字符串
//    *  "document"     Document对象    希望返回 XML 格式数据时使用
//    *  "json"         javascript 对象    存在兼容性问题，IE10/IE11不支持
//    *  "blob"         Blob对象，接收二进制数据, 接收示例：let blob = new Blob([xhr.response], {type: 'image/png'});
//    *  "arrayBuffer"  ArrayBuffer对象， 接收二进制数据（把二进制数据装在一个数组里），接收数据的时候，需要遍历这个数组
//     var arrayBuffer = xhr.response;
//     if (arrayBuffer) {
//         var byteArray = new Uint8Array(arrayBuffer);
//         for (var i = 0; i < byteArray.byteLength; i++) {
//             // do something
//         }
//      }
//
// xhr.statusText     服务器返回的状态文本
// xhr.status         服务器返回的状态码，等于200表示一切正常。
//
// xhr提供了3个属性来获取请求返回的数据，分别是：xhr.response、xhr.responseText、xhr.responseXML
// xhr.responseType   用来指定xhr.response的数据类型
// xhr.response       默认值为空字符串， 当请求完成时此属性才有正确的值， 请求未完成时responseType为""或"text"，responseType为其他值时，值为 null
// xhr.responseText   服务器返回的文本数据, 当responseType 为"text"、""时，xhr对象上才有此属性，此时才能调用xhr.responseText
// xhr.responseXML    服务器返回的XML格式的数据, 当responseType 为"text"、""、"document"时，xhr对象上才有此属性，此时才能调用xhr.responseXML，否则抛错
//
//
// xhr.open(method, url, async), 创建一个 post 请求,
//    *  第一个参数：请求的方式，如GET/POST/HEADER等，这个参数不区分大小写
//    *  第二个参数：请求的地址， 可以是相对地址或绝对地址
//    *  第三个参数：异步/同步，默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false
//       当xhr为同步请求时，有如下限制：
//         xhr.timeout必须为0
//         xhr.withCredentials必须为 false
//         xhr.responseType必须为""（注意置为"text"也不允许）
//
// xhr.open()只是创建了一个连接，但并没有真正开始数据的传输，而xhr.send()才是真正开始了数据的传输过程
//
// xhr.setRequestHeader(name, value), 设置request header
//     1、该方法必须在open()方法之后，send()方法之前调用，否则会抛错;
//     2、该方法可以调用多次，最终的值不会采用覆盖override的方式，而是采用追加append的方式
//
// xhr.send(data)的参数data可以是以下几种类型：
//    *  ArrayBuffer
//    *  Blob
//    *  Document
//    *  DOMString
//    *  FormData
//    *  null
// 如果是 GET/HEAD请求，send()方法一般不传参或传 null。不过即使你真传入了参数，参数也最终被忽略
//
// xhr.send(data)中data参数的数据类型会影响请求头部content-type的默认值：
//    *  如果data是 Document 类型，同时也是HTML Document类型，则content-type默认值为text/html;charset=UTF-8;否则为application/xml;charset=UTF-8；
//    *  如果data是 DOMString 类型，content-type默认值为text/plain;charset=UTF-8；
//    *  如果data是 FormData 类型，content-type默认值为multipart/form-data; boundary=[xxx]
//    *  如果data是其他类型，则不会设置content-type的默认值
//
// 使用"跨域资源共享"的前提，是浏览器必须支持这个功能，而且服务器端必须同意这种"跨域"。
//   在跨域请求中，client端必须手动设置xhr.withCredentials=true，且server端也必须允许request能携带认证信息（即response header中包含Access-Control-Allow-Credentials:true），这样浏览器才会自动将cookie加在request header中。
//   另外，要特别注意一点，一旦跨域request能够携带认证信息，server端一定不能将Access-Control-Allow-Origin设置为*，而必须设置为请求页面的域名。
//
//
// 进度信息
// 1、下载触发的是xhr对象的onprogress事件
//     xhr.onprogress = updateProgress;
// 2、上传触发的是xhr.upload对象的 onprogress事件
//     xhr.upload.onprogress = updateProgress;
//
// function updateProgress(event) {
//     if (event.lengthComputable) {
//         var percentComplete = event.loaded / event.total;
//     }
// }
// event.total是需要传输的总字节，event.loaded是已经传输的字节
//
// 与progress事件相关的，还有其他五个事件，可以分别指定回调函数
// * load事件：传输成功完成。
// * abort事件：传输被用户取消。
// * error事件：传输中出现错误。
// * loadstart事件：传输开始。
// * loadEnd事件：传输结束，但是不知道成功还是失败。
//
// onreadystatechange是XMLHttpRequest独有的事件
// xhr.onreadystatechange = function () {
//     switch(xhr.readyState){
///        case 0: // 未初始化，尚未调用open()方法
//         case 1://OPENED  已经调用open()，尚未调用send()
//         //do something
//          break;
//         case 2://HEADERS_RECEIVED  已经调用send()，尚未接收到响应
//         //do something
//         break;
//         case 3://LOADING  已经接收到部分响应数据
//         //do something
//         break;
//         case 4://DONE 已经接收到全部响应数据，请求完成
//         //do something
//         break;
//     }
// 相关事件触发条件说明：
// * onreadystatechange    每当xhr.readyState改变时触发；但xhr.readyState由非0值变为0时不触发。
// * onloadstart           调用xhr.send()方法后立即触发，若xhr.send()未被调用则不会触发此事件。
// * onprogress            xhr.upload.onprogress在上传阶段(即xhr.send()之后，xhr.readystate=2之前)触发，每50ms触发一次；xhr.onprogress在下载阶段（即xhr.readystate=3时）触发，每50ms触发一次。
// * onload                当请求成功完成时触发，此时xhr.readystate=4
// * onloadend             当请求结束（包括请求成功和请求失败）时触发
// * onabort               当调用xhr.abort()后触发
// * ontimeout             xhr.timeout不等于0，由请求开始即onloadstart开始算起，当到达xhr.timeout所设置时间请求还未结束即onloadend，则触发此事件。
// * onerror               在请求过程中，若发生Network error则会触发此事件（若发生Network error时，上传还没有结束，则会先触发xhr.upload.onerror，再触发xhr.onerror；若发生Network error时，上传已经结束，则只会触发xhr.onerror）。注意，只有发生了网络层级别的异常才会触发此事件，对于应用层级别的异常，如响应返回的xhr.statusCode是4xx时，并不属于Network error，所以不会触发onerror事件，而是会触发onload事件。
//
// 当请求一切正常时，相关的事件触发顺序如下：
//     1、触发xhr.onreadystatechange(之后每次readyState变化时，都会触发一次)
//     2、触发xhr.onloadstart
//     //上传阶段开始：
//     3、触发xhr.upload.onloadstart
//     4、触发xhr.upload.onprogress
//     5、触发xhr.upload.onload
//     6、触发xhr.upload.onloadend
//     //上传结束，下载阶段开始：
//     7、触发xhr.onprogress
//     8、触发xhr.onload
//     9、触发xhr.onloadend
// 若xhr请求成功，就会触发xhr.onreadystatechange和xhr.onload两个事件

/**
 * 矢量数据数据源
 */
class VectorSource extends BaseSource {
    /**
     * 构造函数
     * @param {Object} options {data, projection, fileUrl, format, extent}
     */
    constructor(options = {}) {
        super(options);
        /**
         * 四叉树索引
         */
        this.quadTree = null;

        /**
         * 数据对象顺序号
         */
        this.seqId = 0;

        /**
         * 解析格式对象
         */
        this.format = options.format || new GeometryFormat();

        /**
         * 数据坐标范围
         */
        this.extent = options.extent;

        /**
         * 下载数据时的数据格式
         */
        this.dataType = options.dataType || "json";

        /**
         * 投影
         */
        this.projection = options.projection;

        // 加载数据
        if (options.data != null) {
            this.loadData(options.data);
        } else if (options.fileUrl != null) {
            this.loadFile(options.fileUrl, options.callback);
        }

        /**
         * 图片缓存
         */
        this.imageCache = new ImageCache(IMAGE_CACHE_SIZE);
        this._canCache = true;
    }

    /**
     * 从文件中读取矢量数据
     */
    loadFile(fileUrl, success, failure) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: this.dataType,
            success: function (features) {
                if (that.format != null && that.format instanceof FeatureFormat) {
                    let listData = that.format.readFeatures(features, that.projection);
                    // 加载数据
                    that.add(listData);
                } else {
                    throw new Error("source initialize error : format is not specifal")
                }
                // 触发事件
                that.triggerEvent(EventType.Loader, { "source": this });

                // 建立空间索引
                that.buildIndex();
                // 数据渲染
                if (that.getLayer() != null && that.getLayer().getGraph() != null) {
                    that.getLayer().getGraph().render();
                }
                if (typeof (success) === "function") {
                    success(features);
                }
            },
            error: function (res) {
                if (typeof (failure) === "function") {
                    failure(res);
                } else {
                    console.error("load file error", res);
                }
            }
        });
    }

    /**
     * 装载Geomtory数据至数据源中
     * features: [GeometryObject, GeometryObject]
     */
    loadData(features) {
        let listData;

        // 格式化数据
        if (this.format != null && this.format instanceof FeatureFormat) {
            listData = this.format.readFeatures(features, this.projection);
            // 加载数据
            this.add(listData);
        } else {
            throw new Error("source initialize error : format is not specifal")
        }

        // 建立空间索引
        // this.buildIndex();

        return listData;
    }

    /**
     * 增加矢量数据至数据源中
     */
    add(geomList) {
        let that = this;
        if (Array.isArray(geomList)) {
            geomList.forEach(function (geom) {
                if (geom instanceof Geometry) {
                    that._add(geom);
                } else {
                    //console.debug("add()参数错误", geomList);
                    that._add(createGeom(geom));
                }
            });
        } else {
            if (geomList instanceof Geometry) {
                that._add(geomList);
            } else {
                //console.debug("add()参数错误", geomList);
                that._add(createGeom(geomList));
            }
        }
        if (this.getLayer() && this.getLayer().getGraph()) {
            this.getLayer().getGraph().render();
        }
        return geomList;
    }

    /**
     * 增加Geomtory对象至数据源中
     */
    _add(geom) {
        if (geom instanceof Geometry) {
            geom.innerSeqId = this._getNextSeq();
            this.dataBuffer.push(geom);
            if (geom.getType() === GGeometryType.MARK) {
                this.add2Cache(geom.filePath);
            } else if (geom.getType() === GGeometryType.IMAGE) {
                if (geom.src != null) {
                    this.add2Cache(geom.src);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * 是否进行切片缓存
     */
    canCache() {
        return this._canCache;
    }

    /**
     * 清除指定ID数据，如果ID为空则清除数据源中所有数据
     */
    clearData(id) {
        super.clearData(id);
        this.imageCache.expireCache();
        this.quadTree = null;
    }

    /**
     * 根据ID获取对应的Geom对象
     */
    queryDataById(id) {
        for (let i = this.dataBuffer.length - 1; i >= 0; i--) {
            let geom = this.dataBuffer[i];
            if (geom.uid === id) {
                return geom;
            }
        }
        return null;
    }

    /**
     * 清除指定类型的数据
     */
    clearTypeData(type) {
        for (let i = this.dataBuffer.length - 1; i >= 0; i--) {
            let geom = this.dataBuffer[i];
            if (geom.getType() === type) {
                this.dataBuffer.splice(i, 1);
            }
        }
    }

    /**
     * 获取内部ID，用于空间索引内部使用
     */
    _getNextSeq() {
        this.seqId++;
        return this.seqId;
    }

    /**
     * 设置格式对象
     */
    setFormat(format) {
        this.format = format;
    }

    /**
     * 获取格式对象
     */
    getFormat() {
        return this.format;
    }

    /**
     * 将图片数据加至缓存中
     * filePath:可为string，或者为array
     */
    add2Cache(filePath, imageUid) {
        if (imageUid == null) imageUid = filePath;
        if (filePath == null) return;
        if (Array.isArray(filePath)) {
            let images = [];
            for (let i = 0; i < filePath.length; i++) {
                let url = filePath[i];
                if (!this.imageCache.containsKey(url)) {
                    images.push(this.add2Cache(url));
                }
            }
            return images;
        } else {
            // 缓存数据
            if (!this.imageCache.containsKey(filePath)) {
                let image = new ImageObject(filePath);
                this.imageCache.set(imageUid, image);
                return image;
            } else {
                return null;
            }
        }
    }

    /**
     * 从缓存中获取Image对象
     * @param {*} src 
     */
    getImageFromCache(src) {
        if (this.imageCache.containsKey(src)) {
            return this.imageCache.get(src);
        } else {
            return null;
        }
    }

    /**
     * 加载Image对象
     * @param {String} src 位图的url或base64内容
     * @param {Function} callback 如果位图已经准备好，则执行该回调
     * @param {Function} asyncCallback 如果位图没有准备好，则load完成之后执行该回调
     */
    loadImage(src, callback, asyncCallback) {
        let imageObj = this.getImageFromCache(src);
        if (imageObj == null) {
            imageObj = this.add2Cache(src);
            imageObj.setCallback(asyncCallback);
        } else {
            if (imageObj.getState() === ImageState.LOADED) {
                callback(imageObj.getImage());
            } else {
                imageObj.setCallback(asyncCallback);
            }
        }
    }

    /**
     * 构建四叉树索引
     */
    buildIndex() {
        if (!this.getLayer() || !this.getLayer().isUsePixelCoord()) {
            let maxExtent = this.extent == null ? this.getBBox() : this.extent;
            if ( this.quadTree ) {
            	this.quadTree.clear();
            	delete this.quadTree;
            }
            this.quadTree = new QuadTree({ x: maxExtent[0], y: maxExtent[1], width: maxExtent[2] - maxExtent[0], height: maxExtent[3] - maxExtent[1] });
            this.quadTree.insert(this.dataBuffer);
        }
    }

    /**
     * 获取指定范围内的数据
     */
    getExtentData(extent) {
        if (this.quadTree == null) {
            return this.getData();
        } else {
            let data = this.quadTree.getObjects(extent);
            data.sort(function (obj1, obj2) {
                return obj1.innerSeqId - obj2.innerSeqId;
            });
            // console.info("getExtentData(), count=" + data.length);
            return data;
        }
    }

    /**
     * 获取数据源中的最大空间范围
     */
    getBBox() {
        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            if (geom instanceof Geometry) {
                let obbox = geom.getBBox();
                bbox = Extent.merge(obbox, bbox);
            }
        }
        return bbox;
    }

    /**
     * @deprecated
     */
    getMaxExtent() {
        console.info("该方法已更名为getBBox(), 请使用新的名称！");
        return this.getBBox();
    }

    /**
     * 在控制台打印几何数据对象信息（调试用）
     */
    print() {
        let counter = new Counter("source: " + this.getLayer().getFullName());
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            counter.add(geom.getType(), geom.getCoord().length);
        }
        counter.print();
    }

    /**
     * 将数据源转换为GeoJSON格式
     * @returns GeoJSON
     */
    toGeoJSON() {
        let features = [];
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            features.push(geom.toGeoJSON());
        }
        return { features }
    }

    /**
     * 以矢量数据格式返回当前数据源中的数据
     */
    toData(options = {}) {
        let features = [];
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            if (options.string === true) {
                features.push(JSON.stringify(geom.toData(options)));
            } else {
                features.push(geom.toData(options));
            }
        }
        return features;
    }
}

/**
 * 齿轮箱图层基类Layer类
 * @description 说明：zIndex越大越在上层
 */
class Layer extends EventTarget {
    /**
     * 构造函数
     * @param {Object} options 图层选项{source, renderer, zIndex, name, visible, style, maxResolution, minResolution, opacity, usePixelCoord}
     */
    constructor(options = {}) {
        super();
        ClassUtil.assert(options.source != null, "source 不能为空");
        /**
         * 数据源，负责存储接收GearBox传过来的点线面等数据
         */
        this.source = options.source;
        this.source.setLayer(this);

        // ClassUtil.assert(options.renderer != null, "renderer 不能为空");
        /**
         * 渲染对象，负责将source中的点线面等数据在Canvas中渲染出来
         */
        this.renderer = (options.renderer == null ? (options.source instanceof VectorSource ? new VectorRenderer() : new LayerRenderer()) : options.renderer);
        this.renderer.setLayer(this);

        /**
         * 缺省图层渲染样式
         * 通常情况下对象的样式优先于图层的样式，如果图层的样式中包含了prior属性，则图层的样式优先于对象的样式
         * 图层样式包含的属性比较多，参见 style.js 文件中的说明
         * @private
         */
        this.style_ = Object.assign({ "layerPrior": false }, options.style);  // fillColor: "none", 

        // 渲染顺序，越小越早渲染
        this.zIndex_ = (options.zIndex == undefined || options.zIndex == null ? getLayerId() : options.zIndex);

        // 图层ID
        this.layerId_ = (options.id == undefined || options.id == null ? this.zIndex_ : options.id);

        // 图层名称
        this.layerName_ = (options.name == undefined || options.name == null ? "<空>" : options.name);

        // 是否显示该图层
        this.visible_ = (options.visible === false ? false : true);

        // 最大分辨率
        this.maxResolution_ = (options.maxResolution == undefined || options.maxResolution == null ? Infinity : options.maxResolution);

        // 最小分辨率
        this.minResolution_ = (options.minResolution == undefined || options.minResolution == null ? 0 : options.minResolution);

        // 最大高程
        this.maxDistinct_ = (options.maxDistinct == undefined || options.maxDistinct == null ? Infinity : options.maxDistinct);

        // 最小高程
        this.minDistinct_ = (options.minDistinct == undefined || options.minDistinct == null ? 0 : options.minDistinct);

        // 透明度
        this.opacity_ = (options.opacity == undefined || options.opacity == null ? 1 : options.opacity);

        // 是否使用矩阵变换坐标
        this.useTransform_ = (options.useTransform == undefined || options.useTransform == null ? false : options.useTransform);

        // 是否使用像素坐标
        this.usePixelCoord_ = (options.usePixelCoord == undefined || options.usePixelCoord == null ? false : options.usePixelCoord);

        // 图层属性
        this.type = options.type || "data";

        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;

        // 图层状态，包括 图层名称、zIndex、最大分辨率，最小分辨率，透明度、是否可见等属性
        this.state_ = {
            layer: (this)
        };
    }

    /**
     * 是否使用矩阵变换实现交互操作
     * @returns Boolean
     */
    isUseTransform() {
        return this.useTransform_;
    }

    /**
     * 是否使用像素作为坐标
     * @returns Boolean
     */
    isUsePixelCoord() {
        return this.usePixelCoord_;
    }

    /**
     * 获取图层数据源
     */
    getSource() {
        return this.source;
    }

    /**
     * 获取取图层渲染器
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * 设置图形对象
     */
    setGraph(graph) {
        this.graph = graph;
    }

    /**
     * 取图形对象
     */
    getGraph() {
        return this.graph;
    }

    /**
     * 取图层ID
     * @returns 图层名称
     */
    getId() {
        return this.layerId_;
    }

    /**
     * 取图层名称
     * @returns 图层名称
     */
    getName() {
        return this.layerName_;
    }

    getFullName() {
        return this.layerId_ + "-" + this.layerName_;
    }

    /**
     * 设置渲染次序
     */
    getZIndex() {
        return this.zIndex_;
    }

    /**
     * 获取图层渲染样式
     * @returns style
     */
    getStyle() {
        return this.style_;
    }

    /**
     * 设置图层渲染样式
     * @param {Object} style {color, fillColor, lineWidth, dynamic}
     */
    setStyle(style) {
        this.style_ = style;
    }

    /**
     * 是否显示该图层
     * @returns boolean
     */
    getVisible() {
        return this.visible_;
    }

    /**
     * 设置是否显示
     * @param {Boolean} visible
     */
    setVisible(visible) {
        this.visible_ = visible;
    }

    /**
     * 获取图层透明度 (between 0 and 1).
     */
    getOpacity() {
        return (this.opacity_);
    }

    /**
     * 设置透明度, 0 to 1.
     */
    setOpacity(opacity) {
        this.opacity_ = opacity;
    }

    /**
     * 获取最大分辨率值
     */
    getMaxResolution() {
        return (this.maxResolution_);
    }

    /**
     * 获取最小分辨率值
     */
    getMinResolution() {
        return (this.minResolution_);
    }

    /**
     * 设置渲染该图层的最大分辨率值
     */
    setMaxResolution(maxResolution) {
        this.maxResolution_ = maxResolution;
    }

    /**
     * 设置渲染该图层的最小分辨率值
     */
    setMinResolution(minResolution) {
        this.minResolution_ = minResolution;
    }

    /**
     * 获取最大高程值
     */
    getMaxDistinct() {
        return (this.maxDistinct_);
    }

    /**
     * 获取最小高程值
     */
    getMinDistinct() {
        return (this.minDistinct_);
    }

    /**
     * 根据resolution判断图层是否可见
     */
    visibleAtResolution() {
        let resolution = this.getGraph().getView().getResolution();
        return this.visible_ && resolution >= this.minResolution_ && resolution < this.maxResolution_;
    }

    /**
     * 根据distinct判断图层是否可见
     */
    visibleAtDistinct() {
        let width = Extent.getWidth(this.getGraph().getExtent()) * Math.sqrt(3);
        return this.visible_ && width >= this.minDistinct_ && width < this.maxDistinct_;
    }

    getOffset() {
        return { "x": this.offsetX, "y": this.offsetY };
    }

    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    /**
     * 是否为辅助层
     */
    isAuxLayer() {
        return this.type === "aux" ? true : false;
    }

    /**
     * 获取图层属性
     * @returns Object
     */
    getLayerState() {
        this.state_.opacity = this.getOpacity();
        this.state_.visible = this.getVisible();
        this.state_.zIndex = this.getZIndex();
        this.state_.maxResolution = this.getMaxResolution();
        this.state_.minResolution = Math.max(this.getMinResolution(), 0);
        this.state_.maxDistinct = this.getMaxDistinct();
        this.state_.minDistinct = Math.max(this.getMinDistinct(), 0);
        return this.state_;
    };
}

/**
 * View是Graph对象的一个属性，其作用包括：<br>
 * 1、当前视图信息：中心点Center、 分辨率resolution、坐标范围 Extent、 zoom<br>
 * 2、可允许的视图信息：最大分辨率、 最小分辨率、 分辨率层级、 minZoom、 maxZoom<br>
 * 3、通过改变view属性中的center和resolution实现Graph图形的缩放、漫游等功能<br>
 * 4、视图限制、例如限制缩放比例，限制视点范围等<br>
 * <br>
 * 分辨率的确定规则：<br>
 * 1、手动指定<br>
 * 2、自动计算（根据图形的最大范围进行计算，默认为15个级别）<br>
 */
class View {
    /**
     * 构造函数
     * @param {Object} options
     * options: <br>
     * 1、指定各级分辨率：{resolutions, center, resolutionScaleConstrain, resolution/zoom}<br>
     * 2、根据extent和canvasSize计算各级率：{extent, canvasSize, center, resolutionScaleConstrain, resolution/zoom, zoomFactor, maxResolution, minResolution }
     */
    constructor(options = {}) {
        // 允许最大和最小的缩放倍率
        this.resolutionScaleConstrain = options.resolutionScaleConstrain || 50;
        // 初始化
        this.initialize(options);
    }

    /**
     * 完善信息
     * @param {Object} options 
     */
    initialize(options) {
        // 分辨率选项
        let info = this._getResolutionOptions(options);
        this.maxResolution = info.maxResolution;
        this.minResolution = info.minResolution;
        this.zoomFactor_ = info.zoomFactor;

        // 中心点坐标
        this.center = (this.center == null && options.center == null ? info.center : (this.center == null ? options.center : this.center));

        // 图形尺寸
        this.viewPortSize = info.canvasSize;

        // 约束范围
        this.extentConstrain = options.extentConstrain || [-Infinity, -Infinity, Infinity, Infinity];

        // 约束分辨率显示倍率
        if (options.resolutionScaleConstrain != null) {
            this.resolutionScaleConstrain = options.resolutionScaleConstrain;
        }

        // 各级分辨率
        this.resolutions_ = options.resolutions;

        // 当前分辨率
        if (this.resolution == null || isNaN(this.resolution)) {
            if (options.resolution !== undefined) {
                this.resolution = options.resolution;
            } else if (options.zoom !== undefined) {
                this.setZoom(options.zoom);
            } else {
                this.resolution = this.maxResolution;
            }
        }
    }

    /**
     * 视图是否可用
     */
    isDef() {
        return !!this.getCenter() && this.getResolution() !== undefined && !isNaN(this.getResolution());
    }

    /**
     * 获取中心点坐标
     */
    getCenter() {
        return this.center;
    }

    /**
     * 获取最大层级的分辨率
     */
    getMaxResolution() {
        return this.maxResolution;
    }

    /**
     * 获取最小层级的分辨率
     */
    getMinResolution() {
        return this.minResolution;
    }

    /**
     * 返回当前的分辨率
     */
    getResolution() {
        return this.resolution;
    }

    /**
     * 返回当前视图的分辨率数组
     */
    getResolutions() {
        return this.resolutions_;
    }

    /**
     * 获取图形显示范围
     * @returns Extent
     */
    getExtent() {
        let size = this.viewPortSize;
        let extent = [
            this.center[0] - this.resolution * size.width / 2,
            this.center[1] - this.resolution * size.height / 2,
            this.center[0] + this.resolution * size.width / 2,
            this.center[1] + this.resolution * size.height / 2
        ];
        return extent;
    }

    /**
     * 取视图状态.
     */
    getState(isMore = false) {
        let center = this.getCenter();
        let resolution = this.getResolution();
        if (isMore === true) {
            return ({
                center: center.slice(),
                resolution: resolution,
            });
        } else {
            return ({
                center: center.slice(),
                resolution: resolution,
                zoom: this.getZoom()
            });
        }
    }

    /**
     * 返还当前的zoom level，如果初始化View时没有指定resolutions, 则该方法返回 undefined
     */
    getZoom() {
        let zoom;
        let resolution = this.getResolution();
        if (resolution !== undefined && resolution >= this.minResolution && resolution <= this.maxResolution) {
            let offset = 0;
            let max, zoomFactor;
            if (this.resolutions_) {
                let nearest = View.linearFindNearest(this.resolutions_, resolution, 1);
                offset += nearest;
                if (nearest == this.resolutions_.length - 1) {
                    return offset;
                }
                max = this.resolutions_[nearest];
                zoomFactor = max / this.resolutions_[nearest + 1];
            } else {
                max = this.maxResolution;
                zoomFactor = this.zoomFactor_;
            }
            zoom = offset + Math.log(max / resolution) / Math.log(zoomFactor);
        }
        return zoom;
    }

    /**
     * 根据锚点和分辨率计算中心点
     * @param {Number} resolution 
     * @param {PointCoord} anchor 
     * @returns center
     */
    calculateCenterZoom(resolution, anchor) {
        let center;
        let currentCenter = this.getCenter();
        let currentResolution = this.getResolution();
        if (currentCenter !== undefined && currentResolution !== undefined) {
            let x = anchor[0] - resolution * (anchor[0] - currentCenter[0]) / currentResolution;
            let y = anchor[1] - resolution * (anchor[1] - currentCenter[1]) / currentResolution;
            center = [x, y];
        }
        return center;
    }

    /**
     * 改变视图位置，根据四角坐标和窗口像素宽高。（开窗缩放）
     * GG图形中，在确定了extent后，访问此方法显示地图背景
     * @param {Extent} extent
     * @param {Object} size {width, height}
     */
    fill(extent, size) {
        // 计算分辨率
        let minResolution = 0;
        let resolution = this._getResolutionForExtent(extent, size);
        resolution = isNaN(resolution) ? minResolution : Math.max(resolution, minResolution);
        this.setResolution(resolution);

        // 计算中心点
        let centerX = (extent[0] + extent[2]) / 2;
        let centerY = (extent[1] + extent[3]) / 2;
        this.setCenter([centerX, centerY]);
    }

    /**
     * 取分辨率， 根据所提供的范围（以地图单位）和大小（以像素为单位）。 
     * @private
     */
    _getResolutionForExtent(extent, size) {
        let xResolution = Extent.getWidth(extent) / size.width;
        let yResolution = Extent.getHeight(extent) / size.height;
        return Math.max(xResolution, yResolution);
    }

    /**
     * 改变视图位置，将指定坐标显示在指定位置处
     */
    centerOn(coordinate, size, position) {
        let resolution = this.getResolution();
        let centerX = (size.width / 2 - position[0]) * resolution + coordinate[0];
        let centerY = (position[1] - size.height / 2) * resolution + coordinate[1];
        this.setCenter([centerX, centerY]);
    }

    /**
     * 设置中心点（改变视图位置）
     * @param {PointCoord} center 
     */
    setCenter(center) {
        this.center = center;
    }

    /**
     * 中心点约束
     * @param {Array} center 
     * @returns Array
     */
    constrainCenter(center) {
        if (center) {
            return [
                MathUtil.clamp(center[0], this.extentConstrain[0], this.extentConstrain[2]),
                MathUtil.clamp(center[1], this.extentConstrain[1], this.extentConstrain[3])
            ];
        } else {
            return undefined;
        }
    };

    /**
     * 设置当前分辨率（缩放视图）
     * @param {Number} resolution 
     */
    setResolution(resolution) {
        return this.constrainResolution(resolution);
    }

    /**
     * 分辨率约束
     * @param {*} resolution 
     * @returns float
     */
    constrainResolution(resolution) {
        let succ = false;
        let max = this.getMaxResolution() * this.resolutionScaleConstrain;
        let min = this.getMinResolution() / this.resolutionScaleConstrain / 2;

        if (resolution > max) {
            this.resolution = max;
        } else if (resolution < min) {
            this.resolution = min;
        } else {
            this.resolution = resolution;
            succ = true;
        }
        return succ;
    };

    /**
     *  设置当前层级（缩放视图）
     */
    setZoom(zoom) {
        let resolutions = this.getResolutions();
        let resolution;
        // 目前仅支持设置整数的层级，如需支持小数层级，可在此基础上进行线性处理
        zoom = Math.floor(zoom);
        if (resolutions == null) {
            resolution = this.maxResolution / Math.pow(this.zoomFactor_, zoom);
        } else {
            if (zoom >= 0 && zoom < resolutions.length) {
                resolution = resolutions[zoom];
            } else if (zoom < 0) {
                resolution = resolutions[0];
            } else {
                resolution = resolutions[resolutions.length - 1];
            }
        }
        this.setResolution(resolution);
    }

    /**
     * 获取视图选项
     * @private
     * @param {Object} options {resolutions, extent, canvasSize, zoomFactor, maxResolution, minResolution}
     * @return {Object} {maxResolution, minResolution, zoomFactor}
     */
    _getResolutionOptions(options) {
        let maxResolution;
        let minResolution;

        // 各层之间的宽高比，缺省值为2，说明上层的宽是下层宽的2倍，上层的高是下层高的2倍，即上层的分辨率是下层分辨率的4倍
        let defaultZoomFactor = 2;
        let zoomFactor = options.zoomFactor !== undefined ? options.zoomFactor : defaultZoomFactor;
        let defaultMaxZoom = 5;
        let center = null;
        let canvasSize = options.canvasSize;

        // 1、指定各级分辨率：{resolutions}
        if (options.resolutions != null) {
            let resolutions = options.resolutions;
            maxResolution = resolutions[0];
            minResolution = resolutions[resolutions.length - 1];
        } else if (options.extent != null && options.canvasSize != null) {
            // 2、根据extent和canvasSize计算各级率：{extent, canvasSize, zoomFactor, maxResolution, minResolution }
            let extent = options.extent;
            center = Extent.getCenter(extent);

            // 根据extent计算最大最小resolution
            let widthResolution = Extent.getWidth(extent) / canvasSize.width;
            let heightResolution = Extent.getHeight(extent) / canvasSize.height;
            let defaultMaxResolution = Math.max(widthResolution, heightResolution);
            let defaultMinResolution = defaultMaxResolution / Math.pow(zoomFactor, defaultMaxZoom);

            // 优先使用options中的maxResolution
            maxResolution = options.maxResolution;
            if (maxResolution === undefined) {
                maxResolution = defaultMaxResolution;
            }
            // 优先使用options中的minResolution
            minResolution = options.minResolution;
            if (minResolution === undefined) {
                minResolution = defaultMinResolution;
            }
        } else ;
        return { maxResolution, minResolution, zoomFactor, center, canvasSize };
    }

    /**
     * 从数组中查找与target最接近的值的索引
     * @param {Array} arr 从大到小排序的数组
     * @param {Number} target 
     * @param {int} direction 
     * @returns 数组索引
     */
    static linearFindNearest(arr, target, direction) {
        let n = arr.length;
        if (arr[0] <= target) {
            return 0;
        } else if (target <= arr[n - 1]) {
            return n - 1;
        } else {
            let i;
            if (direction > 0) {
                for (i = 1; i < n; ++i) {
                    if (arr[i] < target) {
                        return i - 1;
                    }
                }
            } else if (direction < 0) {
                for (i = 1; i < n; ++i) {
                    if (arr[i] <= target) {
                        return i;
                    }
                }
            } else {
                for (i = 1; i < n; ++i) {
                    if (arr[i] == target) {
                        return i;
                    } else if (arr[i] < target) {
                        if (arr[i - 1] - target < target - arr[i]) {
                            return i - 1;
                        } else {
                            return i;
                        }
                    }
                }
            }
            return n - 1;
        }
    }

    // /**
    //  * 通过范围计算得到地图分辨率数组
    //  * @param {Extent} extent
    //  * @param {Size} size 
    //  * @returns Array
    //  */
    // static getResolutions(extent, size) {
    //     let widthResolution = Extent.getWidth(extent) / size.width;
    //     let heightResolution = Extent.getHeight(extent) / size.height;
    //     let maxResolution = Math.max(widthResolution, heightResolution);

    //     var resolutions = new Array(10);
    //     var z;
    //     for (var z = 0; z < resolutions.length; z++) {
    //         resolutions[z] = maxResolution / Math.pow(2, z);
    //     }
    //     // 返回分辩率数组resolutions
    //     return resolutions;
    // }
}

/**
 * 雅都动态投影
 */
class DynamicTransform {
    constructor() {
    }

    /**
     * 视点变化时，初始化动态投影参数
     */
    static resetParaForExtent(extent) {
        var centerX = (extent[0] + extent[2]) / 2;
        var centerY = (extent[1] + extent[3]) / 2;
        this._resetPara(centerX, centerY);
    }

    /**
     * 视点变化时，初始化动态投影参数
     */
    static _resetPara(ref_x, ref_y) {
        var j, w, rw, s, t, m;
        this.m_ref_x = ref_x;
        this.m_ref_y = ref_y;
        j = 0.01 * ref_x + 104;
        w = 0.01 * ref_y + 36;
        this.m_ori_rj = 0.017453292519943 * j;
        rw = 0.017453292519943 * w;
        this.m_ori_n = Math.sin(rw);
        s = 0.081819191 * this.m_ori_n;
        t = Math.tan((1.57079632679490 - rw) * 0.5) / Math.pow((1 - s) / (1 + s), 0.040909596);
        m = Math.cos(rw) / (this.m_ori_n * Math.sqrt(1 - s * s));
        this.m_ori_r = m * 6378.137;
        this.m_ori_af = this.m_ori_r / Math.pow(t, this.m_ori_n);

        //console.dir({"m_ref_x":m_ref_x, "m_ref_y":m_ref_y, "m_ori_rj":m_ori_rj, "m_ori_n":m_ori_n, "m_ori_r":m_ori_r, "m_ori_af":m_ori_af});
    }

    /*
     * 求动态投影X坐标
     */
    static projToWorld(coord) {
        if(isNaN(this.m_ref_x) && isNaN(this.m_ref_y)) return coord;

        let [x, y] = coord;
        if (this.m_ori_af == null) return x;
        var j, w, rj, rw, s, r, t, a;

        j = 0.01 * x + 104;
        w = 0.01 * y + 36;
        rj = 0.017453292519943 * j;
        rw = 0.017453292519943 * w;
        s = 0.081819191 * Math.sin(rw);
        t = Math.tan((1.57079632679490 - rw) * 0.5) / Math.pow((1 - s) / (1 + s), 0.040909596);
        r = this.m_ori_af * Math.pow(t, this.m_ori_n);
        a = this.m_ori_n * (rj - this.m_ori_rj);
        x = this.m_ref_x + r * Math.sin(a);
        y = this.m_ref_y + this.m_ori_r - r * Math.cos(a);

        return [x, y];
    }

    /**
     * WGS84坐标转动态投影坐标
     * @param {Array} coord 
     * @returns Coord
     */
    static BLH84ToXY(coord) {
        let [lat, lon] = coord;
        var x = 100 * (lat - 104);
        var y = 100 * (lon - 36);
        return [x, y];
    }
}

DynamicTransform.m_ref_x = NaN;    // 窗口中心点X坐标值
DynamicTransform.m_ref_y = NaN;    // 窗口中心点Y坐标值
DynamicTransform.m_ori_rj = NaN;   // 窗口中心点经度（弧度）
DynamicTransform.m_ori_n = NaN;    //
DynamicTransform.m_ori_r = NaN;    //
DynamicTransform.m_ori_af = NaN;   //

/**
 * 图形对象渲染类
 */
class GraphRenderer extends RendererBase {
    constructor(graph, options) {
        super();

        /**
         * 图形对象
         */
        this.graph_ = graph;

        /**
         * 实际画板，对应界面中显示的画板对象
         */
        this.mainCanvas = null;

        /**
         * 计数器
         */
        this.counter = new Counter("GraphRenderer");

        /**
         * 滤镜名称
         */
        this.filterName = options.filter;
        this.filterOptions = options.filterOptions;
    }

    /**
     * 获取图形对象
     */
    getGraph() {
        return this.graph_;
    }

    /**
     * 获取视图尺寸
     */
    getSize() {
        let width = this.mainCanvas.width;
        let height = this.mainCanvas.height;
        return { width, height };
    }

    /**
     * 获取主画板对象
     */
    getMainCanvas() {
        return this.mainCanvas;
    }

    setMainCanvas(canvas) {
        this.mainCanvas = canvas;
    }

    /**
     * 数据渲染前的准备
     */
    prepareFrame() {
        // 初始化图形画板
        this.initCanvas(this.getSize());

        // 初始化各图层画板
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            let layerRenderer = layers[i].getRenderer();
            layerRenderer.initCanvas(this.getSize());
        }
    }

    /**
     * 合成Graph图形
     * @return 执行时间
     */
    composeBuffer(frameState) {
        let beginTime = Date.now();
        let nodeNum = 0;

        // 修订动态投影参数
        if (frameState.dynamicProjection === true) {
            DynamicTransform.resetParaForExtent(frameState.extent);
        }

        // 清空上一次界面中的geomList
        if (frameState.viewGeomList != null && frameState.viewGeomList.size > 0) {
            frameState.viewGeomList.clear(); // = new Map();	
        }

        // 逐个图层合成图形
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].getVisible() && layers[i].visibleAtResolution() && layers[i].visibleAtDistinct()) {
                let goon = true;
                // 动态样式
                let style = layers[i].getStyle();
                if (typeof (style.dynamic) === "function") {
                    goon = style.dynamic(layers[i], frameState);
                }
                if (goon || goon == null) {
                    let layerRenderer = layers[i].getRenderer();
                    let layerBeginTime = Date.now();
                    nodeNum += layerRenderer.composeBuffer(Object.assign({}, frameState, {
                        "getLayer": function () {
                            return layers[i];
                        }
                    }));
                    this.counter.add("name:" + layers[i].getFullName(), (Date.now() - layerBeginTime));
                }
            }
        }

        // 计算执行时间
        let execTime = (Date.now() - beginTime);
        if (execTime > 200) {
            console.debug("execute GraphRenderer.composeBuffer(), time:%dms, nodeNum:%d", execTime, nodeNum);
        }
        return execTime;
    }

    /**
     * 合并各图层图形，先将各个图层合成的图形渲染至工作画板，最后将工作画板的内容渲染至主画板
     * @return 执行时间
     */
    renderFrame() {
        let beginTime = Date.now();

        // 工作画板清屏，设置背景颜色
        let size = this.getSize();
        this._context.clearRect(0, 0, size.width, size.height);
        let bgColor = this.getGraph().getBgColor();
        if (bgColor != null) {
            this._context.fillStyle = bgColor;
            this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height);
        }

        // 将各图层已合成的图形合并至工作画板中, 图层渲染顺序：按照数组顺序排序
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].getVisible() && layers[i].visibleAtResolution() && layers[i].visibleAtDistinct()) {
                let layerRenderer = layers[i].getRenderer();
                //layerRenderer.getImage().toDataURL()  可在控制台中预览该图层
                let opacity = layers[i].getOpacity();
                if (opacity > 1) opacity = 1;
                if (opacity >= 0 && opacity <= 1) {
                    this._context.globalAlpha = opacity;
                }
                this._context.drawImage(layerRenderer.getImage(), 0, 0);

                // 点击拾取层
                if (this._hitContext && layerRenderer.getHitImage() && !layers[i].isAuxLayer()) {
                    this._hitContext.drawImage(layerRenderer.getHitImage(), 0, 0);
                }
                // 清除已渲染的图层，释放内存
                // layerRenderer.clearScreen();
            }
        }

        // 将工作画板中的内容，渲染至mainCanvas
        let ctx = this.mainCanvas.getContext("2d");
        ctx.clearRect(0, 0, size.width, size.height);
        ctx.drawImage(this.getImage(), 0, 0);

        // 滤镜处理
        this.filter(ctx);

        // 计算执行时间
        let execTime = (Date.now() - beginTime);
        return execTime;
    }

    /**
     * 滤镜处理
     */
    filter(ctx) {
        if (this.filterName != null) {
            let size = this.getSize();
            let imageData = ctx.getImageData(0, 0, size.width, size.height);
            let filter = Filter.getFilter(this.filterName);
            if (filter != null) {
                filter(imageData, this.filterOptions);
                ctx.putImageData(imageData, 0, 0);
            }
        }
    }

    /**
     * 获取图形中指定位置的颜色值
     * @param {Array} point 
     * @returns color
     */
    getColor(point) {
        if (this._hitContext) {
            let imageData = this._hitContext.getImageData(point[0], point[1], 1, 1);
            if (imageData.data[0] === 0 && imageData.data[1] === 0 && imageData.data[2] === 0 && imageData.data[3] === 0) {
                return null;
            } else {
                return new Color(imageData.data[0], imageData.data[1], imageData.data[2], imageData.data[3]).toHex();
            }
        } else {
            return null;
        }
    }
}

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
    };

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
    };

    /**
     * 设置css样式
     * @param {Element} el 对象名称
     * @param {String} style 样式名称
     * @param {String} val 样式值
     */
    DomUtil.setStyle = function (el, style, val) {
        el.style[style] = val;
    };

    /**
     * 创建HTML对象
     * @param {String} tagName 
     * @param {String} className 
     * @param {Element} container 
     * @returns Element
     */
    DomUtil.create = function (tagName, className, container) {
        let el = document.createElement(tagName);
        el.className = className || '';

        if (container) {
            container.appendChild(el);
        }
        return el;
    };

    /**
     * 移除HTML对象
     * @param {Element} el 
     */
    DomUtil.remove = function (el) {
        let parent = el.parentNode;
        if (parent) {
            parent.removeChild(el);
        }
    };

    /**
     * 移除所有子对象
     * @param {Element} el 
     */
    DomUtil.empty = function (el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    };

    /**
     * 移到最上面
     * @param {Element} el 
     */
    DomUtil.toFront = function (el) {
        let parent = el.parentNode;
        if (parent && parent.lastChild !== el) {
            parent.appendChild(el);
        }
    };

    /**
     * 移到最下面，也就是最先渲染，其他对象将会显示在该对象上面
     * @param {Element} el 
     */
    DomUtil.toBack = function (el) {
        let parent = el.parentNode;
        if (parent && parent.firstChild !== el) {
            parent.insertBefore(el, parent.firstChild);
        }
    };

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
    };

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
    };

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
    };

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
    };

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
    };

    /*
     * 事件绑定
     * @examples: DomUtil.on(element, "mouseup", function(e){})
     */
    DomUtil.on = function (obj, types, fn, context) {
        if (types && typeof types === 'object') {
            for (let type in types) {
                __addOne(obj, type, types[type], fn);
            }
        } else {
            types = __splitWords(types);
            for (let i = 0, len = types.length; i < len; i++) {
                __addOne(obj, types[i], fn, context);
            }
        }
        return this;
    };

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
    };

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
    };

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
    };

    /**
     * Does `stopPropagation` and `preventDefault` at the same time.
     * @param {Event} e 
     */
    DomUtil.stop = function (e) {
        this.preventDefault(e);
        this.stopPropagation(e);
    };

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

/**
 * Url工具类
 * @class
 */
const UrlUtil = {};

(function () {
    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") return;

    /**
     * 获取url上携带的参数
     * @returns {Array}
     */
    UrlUtil.getUrlArgs = function() {
        if (location.search === "") return [];
        let searchString = location.search.split("?"),  param = [];
        let seg = searchString[1].split("&");
        for (let i = 0; i < seg.length; i++) {
            let val = seg[i].split("=");
            if (val.length <= 1) continue;
            param[i] = val[1];
        }
        return param;
    };

    /**
     * 获取通过Url传递的参数
     * @param {String} sHref 
     * @param {String} sArgName 
     * @returns param
     */
    UrlUtil.getArgsFromHref = function(sHref, sArgName) {
        var args = sHref.split("?");
        var retval = null;
        var str;

        if (args[0] === sHref) { /*参数为空*/
            return retval;
            /*无需做任何处理*/
        } else {
            args = args[1].split("&");
            for (var i = 0; i < args.length; i++) {
                str = args[i];
                var arg = str.split("=");
                if (arg.length <= 1) continue;
                if (arg[0] == sArgName) {
                    retval = arg[1];
                    break;
                }
            }
            return decodeURIComponent(retval);
        }
    };

    /**
     * 获取web路径 2016-7-18 
     * @returns String
     * @example 
     * 当前服务地址为：http://localhost:8080/web/frame/frame.jsp时，该方法返回： "http://localhost:8080/web"
     */
    UrlUtil.getRootPathOfWeb = function() {
        //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var currentPath = window.document.location.href;
        //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pathName = window.document.location.pathname;
        var pos = currentPath.indexOf(pathName);
        //获取主机地址，如： http://localhost:8083
        var localhostPaht = currentPath.substring(0, pos);
        //获取带"/"的项目名，如：/uimcardprj
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhostPaht + projectName);
    };

    /**
     * 获取根路径
     * @returns {string} 
     * @example 
     * 当前服务地址为：http://localhost:8080/web/frame/frame.jsp时，该方法返回： "/web"
     */
    UrlUtil.getContextPath = function() {
        let pathName = document.location.pathname;
        let index = pathName.substring(1).indexOf("/");
        return pathName.substring(0, index + 1);
    };
}());

/**
 * 图形鼠标操作
 * 滚轮缩放、鼠标移动、鼠标中键漫游、hover、触摸缩放
 */
class GraphMouseOp {

    /**
     * 构造函数
     * @param {RenderObject} render 
     * @param {Object} options {mapZoom, mapMove}
     */
    constructor(render, options = {}) {
        this.render_ = render;
        this.targetElement = render.getWrapObj();

        /**
         * 鼠标中键漫游
         */
        this._lastClientX = 0;
        this._lastClientY = 0;
        this._beginMove = false;

        /**
         * 触摸事件双指缩放
         */
        this._beginZoom = false;
        this.touchZoonDist = 0;

        //  缺省缩放方法
        this.defaultMapZoom = options.mapZoom;     //MouseWheelZoom

        //  缺省漫游方法
        this.defaultMapMove = options.mapMove;

        /**
         * time事件，用于监视鼠标移动的位置
         */
        this.intervalTimeId_ = -1;

        /**
         * 鼠标最近移动时的位置和时间
         */
        this.lastMovePointer_ = { "time": Infinity, "position": [Infinity, Infinity], "clientPosition": [Infinity, Infinity] };

        /**
         * 最后一次单击时间
         */
        this.lastClickTime = 0;
        this.lastClickTimeFunc = 0;

        // 
        this.eventObj = null;

        // 
        this.isWorkable_ = true;
    }

    /**
     * 单击事件是否可用
     */
    enabled(bool) {
        if (bool) {
            DomUtil.setStyle(this.targetElement, "cursor", "");
            if (this.isWorkable_ === false) {
                this.isWorkable_ = true;
                // this.mouseenter({ "offsetX": 0, "offsetY": 0 });
            }
        } else {
            this.isWorkable_ = false;
        }
    };

    /**
     * 
     * @param {*} event 
     */
    setEvent(event) {
        this.eventObj = event;
    }

    /**
     * 图形对象
     */
    getRender() {
        return this.render_;
    }

    /**
     * 滚轮事件
     * @param {*} e 
     * @returns boolean
     */
    onWheel(e) {
        if (this.isWorkable_ === true) {
            DomUtil.stop(e);
            if (this.defaultMapZoom != null && (typeof this.defaultMapZoom === "function")) {
                let delta = (e.deltaY > 0 ? -1 : 1);   // 垂直滚动距离其值为：100/-100
                let offsetX = e.offsetX;
                let offsetY = e.offsetY;
                return this.defaultMapZoom({ op: delta, x: offsetX, y: offsetY });
            }
        } else {
            return false;
        }
    }

    /**
     * click Event
     * @param {*} e 
     */
    onClick(e) {
        // console.info("graph.mouse click");
    }

    /**
     * 鼠标双击事件
     * @param {Object} e 
     */
    onDblclick(e) {
        let rtn = false;
        if (this.eventObj != null && typeof (this.eventObj.dblclick) === "function") {
            rtn = this.eventObj.dblclick(e); //Object.assign({}, e, { x, y, "mouse": this }));
        }
        return rtn || false;
    }

    /**
     * 鼠标移动
     * @param {Object} e 
     * @param {int} x 
     * @param {int} y 
     */
    onMouseMove(e) {
        let [x, y] = [e.offsetX, e.offsetY];
        // 鼠标中键移动
        if (this._beginMove === true) {
            return this._doMapMove(x, y);
        }

        // 自定义鼠标操作
        if (this.eventObj != null && typeof (this.eventObj.mouseMove) === "function") {
            this.eventObj.mouseMove(e); //Object.assign({}, e, { x, y, "mouse": this }));
        }

        // 分析hover状态
        let moveExtent = Extent.buffer([x, y, x, y], 10);
        if (!Extent.containsXY(moveExtent, this.lastMovePointer_.position)) {
            this.lastMovePointer_ = {
                "time": (new Date()).getTime(),
                "position": [x, y],
                "clientPosition": [e.clientX, e.clientY]
            };
            if (this.eventObj != null && typeof (this.eventObj.mouseHoverEnd) == "function") {
                this.eventObj.mouseHoverEnd(e); //Object.assign({}, e, { "x": x, "y": y, "mouse": this }));
            }
        }
        return false;
    }

    /**
    * 鼠标按钮按下事件
    * @param {Object} e 
    */
    onMouseDown(e) {
        let that = this;
        let rtn = false;
        let [x, y] = [e.offsetX, e.offsetY];

        // 执行附加事件的mouseDown
        if (e.button == 0) {    // 鼠标左键
            if (that.eventObj != null && typeof (that.eventObj.mouseDown) === "function") {
                rtn = that.eventObj.mouseDown(e);  // Object.assign({}, e, { x, y, "mouse": that });
            }
        }

        if (e.button == 1) {    // 鼠标中键
            this.previousCursor_ = DomUtil.getStyle(this.targetElement, "cursor");
            DomUtil.setStyle(this.targetElement, "cursor", "url(" + UrlUtil.getContextPath() + "/adam.lib/images/cursor/hand-close.cur), move");
            this._lastClientX = x; //e.offsetX;
            this._lastClientY = y; //e.offsetY;
            this._beginMove = true;
        }

        return rtn == null ? false : rtn;
    }

    /**
     * 鼠标按钮抬起事件
     * @param {Object} e 
     */
    onMouseUp(e) {
        let rtn = true;
        let that = this;

        if (that.eventObj != null) {
            if (e.button == 0) {         //IE:1, FF:0 鼠标左键
                let callback = (typeof (that.eventObj) === "function" ? that.eventObj : that.eventObj.mouseUp);
                if (callback != null) {
                    rtn = callback(e);
                }
            } else if (e.button == 2) {    // 鼠标右键
                //执行右键回调
                let callback = that.eventObj.rclick;
                if (typeof (callback) === "function") {
                    rtn = callback(e);
                }

            }
            if (rtn === false) return rtn;
        }
        if (e.button == 1) {    // 鼠标中键
            DomUtil.setStyle(that.targetElement, "cursor", that.previousCursor_);
        }

        that._beginMove = false;
        that.lastClickTime = Date.now();
        return rtn || false;
    }

    /**
     * 鼠标移出
     * @param {Object} e 
     */
    onMouseOut(e) {
        this.lastMovePointer_.time = Infinity;
        if (this.intervalTimeId_ > 0) {
            window.clearInterval(this.intervalTimeId_);
        }        return false;
    }

    /**
     * 鼠标移入
     * @param {Object} e 
     */
    onMouseEnter(e) {
        //监测鼠标的hover事件
        let that = this;
        if (this.intervalTimeId_ > 0) {
            window.clearInterval(this.intervalTimeId_);
        }        this.lastMovePointer_.time = Infinity;
        this.intervalTimeId_ = window.setInterval(function () {
            if ((new Date()).getTime() - that.lastMovePointer_.time > 1100) {
                that.lastMovePointer_.time = Infinity;
                that._doMouseHover(e);
            }
        }, 400);
        return false;
    }

    /**
     * 鼠标hover事件处理
     * @param {Object} e 
     */
    _doMouseHover(e) {
        // let that = this;
        // let pos = this.lastMovePointer_.position;
        // let clientPos = this.lastMovePointer_.clientPosition;

        if (this.eventObj != null && typeof (this.eventObj.mouseHover) === "function") {
            this.eventObj.mouseHover(e);
            //Object.assign({}, e, {
            //    "x": pos[0],
            //    "y": pos[1],
            //    "clientX": clientPos[0],
            //    "clientY": clientPos[1],
            //    "mouse": this,
            //    "targetElement": that.targetElement
            //}));
        }
        return false;
    }

    /**
     * 触摸事件开始
     * @param {EventTarget} e 
     */
    onTouchStart(e) {
        //阻止触摸时浏览器的缩放、滚动条滚动等
        e.preventDefault();
        const touches = e.touches;
        if (touches.length == 2) {
            let diffX = touches[0].clientX - touches[1].clientX;
            let diffY = touches[0].clientY - touches[1].clientY;
            this.touchZoonDist = Math.sqrt(diffX * diffX + diffY * diffY);
            this._beginZoom = true;
        } else if (touches.length == 1) {
            this._beginMove = true;
            let touch = touches[0];          //获取第一个触点
            this._lastClientX = parseInt(touch.clientX); //页面触点X坐标
            this._lastClientY = parseInt(touch.clientY); //页面触点Y坐标
        }
    }

    /**
     * 触摸事件结束
     * @param {EventTarget} e 
     */
    onTouchEnd(e) {
        this._beginMove = false;
        this._beginZoom = false;
    }

    /**
     * 触摸事件移动中
     * @param {EventTarget} e 
     */
    onTouchMove(e) {
        //阻止触摸时浏览器的缩放、滚动条滚动等
        e.preventDefault();
        const touches = e.touches;
        if (this._beginMove === true && touches.length === 1) {
            // 单指触摸移动
            let touch = touches[0]; //获取第一个触点
            this._doMapMove(parseInt(touch.clientX), parseInt(touch.clientY));
        } else if (touches.length === 2 && this._beginZoom === true) {
            let diffX = touches[0].clientX - touches[1].clientX;
            let diffY = touches[0].clientY - touches[1].clientY;
            let touchZoonDist = Math.sqrt(diffX * diffX + diffY * diffY);
            let touchZoonCenter = [(touches[0].clientX + touches[1].clientX) / 2, (touches[0].clientY + touches[1].clientY) / 2];

            if (this.defaultMapZoom != null && (typeof this.defaultMapZoom === "function")) {
                let scale = this.touchZoonDist / touchZoonDist;
                if (scale > 1.02 || scale < 0.98) {
                    this.defaultMapZoom({ "scale": scale, "x": touchZoonCenter[0], "y": touchZoonCenter[1] });
                    this.touchZoonDist = touchZoonDist;
                }
            }
        }
    }

    /**
     * 按键事件
     * @param {EventTarget} e 
     */
    onKeyDown(e) {
        if (this.eventObj != null && typeof (this.eventObj.keyDown) === "function") {
            this.eventObj.keyDown(e);
        }
    }

    /**
     * 漫游
     * @param {int} x 
     * @param {int} y 
     */
    _doMapMove(x, y) {
        let that = this;
        let _doit = function (callback) {
            window.setTimeout(function () {
                let xdist = x - that._lastClientX;
                let ydist = y - that._lastClientY;
                if (Math.abs(xdist) > 10 || Math.abs(ydist) > 10) {
                    callback(Object.assign({ xdist, ydist }, { x, y, "mouse": that }));
                    that._lastClientX = x;
                    that._lastClientY = y;
                }
                that.moveing = false;
            });
        };

        if (this._beginMove === true) {
            if (this.moveing) {
                return false;
            } else {
                if (this.eventObj != null && this.eventObj.mapMove != null) {
                    this.moveing = true;
                    _doit(this.eventObj.mapMove);
                    return true;
                } else {
                    if (this.defaultMapMove != null) {
                        _doit(this.defaultMapMove);
                    }
                    return false;
                }
            }
        }
        return false;
    }
}

/**
 * 图形事件父类
 */
class GraphEvent {
    constructor(options) {
        /**
         * 右键单击时是否结束该事件
         */
        this.rightClickCancel = options.rightClickCancel == null ? true : options.rightClickCancel == true;

        /**
         * 
         */
        this.render;

        /**
         * 鼠标形状
         */
        this.cursor = Cursor.DEFAULT;
    }

    /**
     * 设置事件分发对象
     * @param {Object} parent 
     */
    setParent(render) {
        this.render = render;
    }

    /**
     * 设置是否允许右键单击结束当前事件
     * @param {Boolean} bool 
     */
    setRightClickCancel(bool) {
        this.rightClickCancel == (bool == true);
    }

    /**
     * 结束当前事件
     */
    end() {
        this.render.endEvent();
    }

    /**
     * 事件：键盘按键
     * @param {Event} e 
     */
    keyDown(e) {
        e.keyCode;
    }
}

/*----------------------------------------------------------------------------
|  抽象数据类型
|        版本: V2.0    2023-05-31  hjq
|
|  Stack          栈（先进后出）
|  Queue          队列（先进先出）
|  PriorityQueue  优先队列（先进先出）
|  LinkList       链表
|  Set            集合
|  Dictionay      字典
|  Graph          图
|  Collection     集合
|
|-----------------------------------------------------------------------------
|  Copyright (c) 1993 - 2023 雅都软件
|----------------------------------------------------------------------------*/

/**
 * 栈类（先进后出）
 */
class Stack {
    constructor() {
        this.data = [];
    }

    /**
     * 压栈操作
     */
    push(obj) {
        this.data.push(obj);
    }

    /**
     * 出栈操作
     */
    pop() {
        return this.data.pop();
    }

    /**
     * peek操作
     */
    peek() {
        return this.data[this.data.length - 1];
    }

    /**
     * 判断栈中的元素是否为空
     */
    isEmpty() {
        return this.data.length == 0;
    }

    /**
     * 获取栈中元素的个数
     */
    size() {
        return this.data.length;
    }

    /**
     * 清空栈
     */
    clear() {
        this.data = [];
    }
}

/**
 * 队列(先进先出)
 */
class Queue {
    constructor() {
        this.data = [];
    }

    /**
     * 入队
     */
    enqueue(obj) {
        this.data.push(obj);
    }

    /**
     *  出队
     */
    dequeue() {
        var obj = this.data.shift();
        return obj;
    }

    /**
     * 队列是否为空
     */
    isEmpty() {
        return this.data.length == 0;
    }

    /**
     * 返回队列长度
     */
    size() {
        return this.data.length;
    }

    /**
     * 清空队列
     */
    clear() {
        this.data = [];
    }

    /**
     * 返回队列
     */
    toArray() {
        return this.data;
    }

    /**
     * 返回队列中第一个对象值
     */
    front() {
        return this.data[0];
    }
}

/**
 * 图结构
 */
let Graph$1 = class Graph {

    constructor() {
        //存储顶点
        this.vertexes = [];
        //存储边
        this.edges = {};

    }

    //添加顶点
    addVertex(v) {
        if (!this.vertexes.includes(v)) {
            this.vertexes.push(v);
            this.vertexes[v] = [];
        }
    }

    //添加边
    addEdge(a, b) {
        if (this.vertexes.includes(a) && this.vertexes.includes(b)) {
            if (!this.vertexes[a].includes(b)) {
                this.vertexes[a].push(b);
                this.vertexes[b].push(a);
            }
        }
    }

    //打印邻接表
    print() {
        this.vertexes.forEach(element => {
            let s = element + " => ";
            this.vertexes[element].forEach(element2 => {
                s += element2;
            });
            console.log(s);
        });
    }

    //广度优先遍历
    //用颜色标记状态 white -> 未探索  grey -> 已发现  black -> 已探索
    bfs(v, callback) {
        if(!this.vertexes.includes(v)) {
            return;
        }

        //初始化颜色
        let color = this._initColor();
        //创建队列
        let queue = new Queue();
        queue.enqueue(v);

        while (!queue.isEmpty()) {
            // 正在遍历的顶点now
            let now = queue.dequeue();
            // 增加回调函数，从而可在回调中判断是否停止或退出等判断
            if (callback) {
                let rtn = callback(now);
                if(rtn === -1) {                 // 退出遍历
                    break;
                } else if(rtn === 1) {           // 不遍历该对象连接的其他对象
                    continue;
                }
            }
            // 遍历now相连的每个顶点
            this.vertexes[now].forEach(element => {
                if (color[element] === 'white') {
                    queue.enqueue(element);
                    color[element] = 'grey';
                }
            });
            color[now] = 'black';
        }
    }

    //广度优先遍历需要用到的函数，将每个顶点颜色初始化为white
    _initColor() {
        let color = {};
        this.vertexes.forEach(element => {
            color[element] = 'white';
        });
        return color;
    }


    //获取最短路径
    shortestPath(from, to) {
        //路径栈，从to不断寻找回溯点，在寻找过程中推进栈，最后后进先出拿出来
        let path = new CBStack();
        //包含 pre 回溯点 和 d 距离 的对象obj
        let obj = this.BFS(from);

        while (to !== from) {
            path.push(to);
            to = obj.pre[to];
        }
        path.push(to);

        let s = path.pop();
        while (!path.isEmpty()) {
            s += ' => ';
            s += path.pop();
        }
        return s;
    }

    //获取最短路径需要用到的改良的广度优先算法
    //回溯点 pre
    //距离   d
    BFS(v, callback) {
        //初始化颜色
        let color = this._initColor();
        //创建队列
        let queue = new Queue();
        queue.enqueue(v);

        let d = {}, pre = {};
        //初始化d和pre
        this.vertexes.forEach(element => {
            d[element] = 0;
            pre[element] = null;
        });

        while (!queue.isEmpty()) {
            //正在遍历的顶点now
            let now = queue.dequeue();
            //遍历now相连的每个顶点
            this.vertexes[now].forEach(element => {
                if (color[element] === 'white') {
                    queue.enqueue(element);
                    color[element] = 'grey';

                    pre[element] = now;
                    d[element] = d[now] + 1;
                }
            });
            color[now] = 'black';
            if (callback) {
                callback(now);
            }
        }
        return {
            pre: pre,
            d: d
        };
    }

    //深度优先遍历
    dfs(v, callback) {
        let color = this._initColor();
        this._dfsFun(v, color, callback);
    }

    //深度优先遍历需要用到的遍历函数
    _dfsFun(v, color, callback) {
        color[v] = 'grey';
        this.vertexes[v].forEach(element => {
            if (color[element] === 'white') {
                this._dfsFun(element, color, callback);
            }
        });
        color[v] = 'black';
        if (callback) {
            callback(v);
        }
    }
};

/**
 * 图形窗口操作/渲染对象
 */
class RenderObject extends EventTarget {
    /**
     * 构造函数
     * @param {String} container 容器对象或容器ID
     * @param {Object} options 选项，对象格式为{mouse:true, mapZoom, mapMove}
     */
    constructor(container, options = { mouse: true }, graph) {
        super();

        if (container == null) {
            throw new Error("图形容器对象不能为空, RenderObject初始化失败");
        }

        /**
         * 是否可用
         */
        this.isWorkable_ = (options.mouse == null ? true : options.mouse == true);

        // 创建画布对象
        this._createCanvas(container);

        /**
         * 图形鼠标操作对象（滚轮缩放、鼠标移动、鼠标中键漫游、hover、触摸缩放）
         */
        this.graphMouseOp = new GraphMouseOp(this, options);
        this.graphMouseOp.enabled(this.isWorkable_);

        // 绑定事件
        this._bindEvent(graph);

        /**
         * 事件堆栈，当该值为null时，仍旧执行图形鼠标操作对象中的事件
         */
        this.eventObj = null;
        this.eventQuene = new Stack();

        /**
         * 鼠标状态
         */
        this.previousCursor_ = "default";
        this.pointerName_ = "default";
    }

    enabledMouse(enabled) {
        this.isWorkable_ = (enabled === true);
        this.graphMouseOp.enabled(this.isWorkable_);
    }

    /**
     * 创建画布及其相关dom对象
     */
    _createCanvas(container) {
        // 容器对象
        this.containerObj_ = DomUtil.get(container);

        // 画布容器(eventTarget)
        let wrapId = this.containerObj_.id + "_wrap";
        this.wrapObj_ = DomUtil.get(wrapId);

        if (this.wrapObj_ == null) {
            let body = DomUtil.create("div", "", this.containerObj_);
            body.style.position = "relative";

            // wrap
            this.wrapObj_ = DomUtil.create("div", "", body);
            this.wrapObj_.id = wrapId;
            this.wrapObj_.tabIndex = -1;
            this.wrapObj_.style.outline = "blue solid 0px";

            // canvas
            this.canvas_ = DomUtil.create("canvas", "", this.wrapObj_);
            this.canvas_.oncontextmenu = function () { return false };

        } else {
            let first = this.wrapObj_.firstElementChild;
            while (first && first.localName != "canvas") {
                first = first.nextElementSibling;
            }
            if (first == null) {
                throw new Error("图形容器对象错误, CWRenderObject初始化失败!");
            } else {
                this.canvas_ = first;
            }
        }

        // 取容器边框大小
        let borderWidthArray = DomUtil.getStyle(this.containerObj_, "border-width").split(" ");
        this.borderTopWidth = parseInt(borderWidthArray[0]);
        this.borderRightWidth = (borderWidthArray.length > 1 ? parseInt(borderWidthArray[1]) : this.borderTopWidth);
        this.borderBottomWidth = (borderWidthArray.length > 2 ? parseInt(borderWidthArray[2]) : this.borderTopWidth);
        this.borderLeftWidth = (borderWidthArray.length > 3 ? parseInt(borderWidthArray[3]) : this.borderRightWidth);

        // 画板大小缺省=容器内部大小
        let canvasWidth = (this.containerObj_.offsetWidth > 0 ? this.containerObj_.offsetWidth : parseInt(DomUtil.getStyle(this.containerObj_, "width"))) - this.borderLeftWidth - this.borderRightWidth;      // 像素宽
        let canvasHeight = (this.containerObj_.offsetHeight > 0 ? this.containerObj_.offsetHeight : parseInt(DomUtil.getStyle(this.containerObj_, "height"))) - this.borderTopWidth - this.borderBottomWidth;    // 像素高
        this.canvas_.width = canvasWidth > 20 ? canvasWidth : 20;
        this.canvas_.height = canvasHeight > 20 ? canvasHeight : 20;
        this.wrapObj_.style.height = canvasHeight + "px";
        this.wrapObj_.parentElement.style.height = canvasHeight + "px";
    }

    _bindEvent(graph) {
        // 绑定事件, mouseUp事件在mousedown触发后产生，绑定时不包含该事件
        let bindEventArray = [
            "wheel", "click", "dblclick",
            "mousemove", "mousedown", "mouseout", "mouseenter", "mouseover",
            "dragover", "dragenter", "dragleave",
            //     "resize", "focus", "blur",
            "keydown",
            "touchstart", "touchmove", "touchend"];


        let geomEvent = ["click", "mousemove", "mousedown"];
        let that = this;
        let msTouch = !!window.navigator.msMaxTouchPoints;
        bindEventArray.forEach(eventName => {
            if (eventName.indexOf('touch') === 0) {
                if (!msTouch) return;
            }
            that.wrapObj_.addEventListener(eventName, function (e) {
                let x = e.offsetX;
                let y = e.offsetY;
                let bubbling = true;
                if (graph.isEnabledGeomEvent() && geomEvent.indexOf(eventName) >= 0) {
                    // 先执行geom事件
                    if (graph.handleEvent(eventName, { x, y, e }) !== false) {
                        // 然后执行graph事件
                        if (that.isWorkable_ === true) {
                            bubbling = that.handleEvent(eventName, { x, y, e });
                        }
                    }
                } else {
                    //if (that.isWorkable_ === true) {
                    bubbling = that.handleEvent(eventName, { x, y, e });
                    //}
                }
                if (bubbling === false) {
                    DomUtil.stop(e);
                }
            });
        });
    }

    /**
     * 获取渲染对象大小
     * @returns {Object} size {width, height}
     */
    updateSize() {
        let owidth = this.canvas_.width;
        let oheight = this.canvas_.height;
        let width = (this.containerObj_.offsetWidth - this.borderLeftWidth - this.borderRightWidth);       // 像素宽
        let height = (this.containerObj_.offsetHeight - this.borderTopWidth - this.borderBottomWidth);    // 像素高;
        width = (width > 300 ? width : owidth);
        height = (height > 200 ? height : oheight);

        // 支持改变画板大小，而不改变容器大小
        // *** 修改画板的宽高将会清空画板中的内容 ***
        this.canvas_.width = width;
        this.canvas_.height = height;

        return { width, height };
    }

    /**
     * 当前渲染对象的事件绑定ID
     */
    getWrapObj() {
        return this.wrapObj_;
    }

    /**
     * 获取画板
     */
    getCanvas() {
        return this.canvas_;
    }

    /**
     * 移除对象
     */
    remove() {
        let wrapObj = this.getWrapObj();
        if (wrapObj != null) {
            wrapObj.parentElement.remove();
        }
    }

    getEvent() {
        return this.eventObj;
    }

    /**
     * 外部控制执行鼠标操作
     * @param {Object} event event如果为function，则表示mouseUp事件所执行的function，否则event需为对象类型
     * @example event的对象格式为{mouseUp, mouseDown, mouseMove, mapMove, rclick, dblclick, mouseHover, mouseHoverEnd}，属性值为各事件所执行的function
     * 其参数均为对象，包含e, x, y, mouse等属性，Object.assign(e, {x, y, mouse:this})
     */
    addEvent(event) {
        if (event instanceof GraphEvent) {
            // this.enabled(true);
            this.eventQuene.push(event);
            this.eventObj = event;
            this.setPointer(event.cursor);
            this.graphMouseOp.setEvent(this.eventObj);
            event.setParent(this);
        } else {
            throw new Error("参数错误");
        }
    }

    /**
     * 结束最后一次addEvent()的事件，恢复至上一次addEvent()指定的操作
     */
    endEvent() {
        if (this.eventQuene.isEmpty()) {
            this.eventObj = null;
            this.setPointer();
            this.graphMouseOp.setEvent(null);
        } else {
            // 移动最后一个
            this.eventQuene.pop();
            // 新的最后事件成为当前事件
            this.eventObj = this.eventQuene.peek();
            this.setPointer(this.eventObj == null ? null : this.eventObj.cursor);
            this.graphMouseOp.setEvent(this.eventObj);
        }
    }

    /**
     * 设置鼠标样式
     * @param {GP_CURSOR_TYPE} status 或者直接指定文件名 url(" + UrlUtil.getContextPath() + "/adam.lib/images/cursor/gk_std.cur) 
     */
    setPointer(name) {
        let pointer = name || "default";
        DomUtil.setStyle(this.getWrapObj(), "cursor", pointer);
        this.pointerName_ = name;
        return false;
    };

    /**
     * 返回鼠标当前状态
     */
    getPointer() {
        return (this.pointerName_ === undefined ? "default" : this.pointerName_);
    }

    /**
     * 事件分发，从target中通过该方法将鼠标事件分发至 click()、dblclick()等方法中
     * @param {*} name 
     * @param {*} args 
     */
    handleEvent(name, args) {

        // 触发已绑定的事件
        this.triggerEvent(name, args.e);

        // 触发图形事件
        let that = this;
        switch (name) {
            case "wheel":
                this.graphMouseOp.onWheel(args.e);
                break;
            case "click":
                this.graphMouseOp.onClick(args.e);
                break;
            case "dblclick":
                this.graphMouseOp.onDblclick(args.e);
                break;
            case "mousemove":
                this.graphMouseOp.onMouseMove(args.e);
                break;
            case "mousedown":
                // 添加mouseUp事件
                this.getWrapObj().ownerDocument.addEventListener("mouseup", function (e) {
                    let rtn = that.graphMouseOp.onMouseUp(e);
                    if (e.button == 2) {
                        if (rtn !== false && that.eventObj != null && that.eventObj.rightClickCancel === true) {
                            that.endEvent();  // 结束鼠标操作
                        }
                    }
                    return rtn;
                }, { "once": true });
                this.graphMouseOp.onMouseDown(args.e);
                break;
            case "mouseout":
                this.graphMouseOp.onMouseOut(args.e);
                break;
            case "mouseenter":
                this.graphMouseOp.onMouseEnter(args.e);
                break;
            case "touchstart":
                this.graphMouseOp.onTouchStart(args.e);
                break;
            case "touchend":
                this.graphMouseOp.onTouchEnd(args.e);
                break;
            case "touchmove":
                this.graphMouseOp.onTouchMove(args.e);
                break;
            case "keydown":
                this.graphMouseOp.onKeyDown(args.e);
                break;
        }
        if (this.eventObj != null && this.eventObj.cursor != null) {
            this.setPointer(this.eventObj.cursor);
        }
    }
}

class Control {
	constructor(options) {
		this.div = "";
	}

    setGraph(graph) {
        if (graph) {
            this.graph = graph;
            this.create();
        }
    }

    rebuild() {
        
    }

    show() {

    }

    hide() {

    }
}

/**
 * 缓动效果类, 指定参数随时间的变化率。<br>
 * <br>
 * 现实生活中的物体不会立即启动和停止，而且几乎永远不会以恒定的速度移动。<br>
 * 当我们打开抽屉时，我们首先快速移动它，当它出来时放慢速度。把东西掉在地板上，它会先向下加速，然后在碰到地板后反弹回来。<br>
 * 更多信息可参考：https://easings.net/zh-cn
 * @class
 */
const Easing = {};

(function () {
    /**
     * 启动缓慢，后期加速快(加速曲线)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.001, 0.008, 0.026, 0.064, 0.125, 0.215, 0.343, 0.512, 0.729, 1.0)
     */
    Easing.easeIn = function (t) {
        return Math.pow(t, 3);
    };

    /**
     * 启动加速快，结束缓慢(减速曲线)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.270, 0.488, 0.657, 0.784, 0.875, 0.936, 0.973, 0.992, 0.999, 1.0)
     */
    Easing.easeOut = function (t) {
        return 1 - Easing.easeIn(1 - t);
    };

    /**
     * 先缓慢加速后缓慢减速(加速减速曲线)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.028, 0.104, 0.215, 0.352, 0.5,   0.648, 0.784, 0.896, 0.972, 1.0)
     */
    Easing.inAndOut = function (t) {
        return 3 * t * t - 2 * t * t * t;
    };

    /**
     * 随着时间的推移保持恒定的速度(匀速)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     */
    Easing.linear = function (t) {
        return t;
    };

    /**
     * 来回运动
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.104, 0.352, 0.648, 0.896, 1.0,   0.896, 0.648, 0.352, 0.104, 0.0)
     */
    Easing.upAndDown = function (t) {
        if (t < 0.5) {
            return Easing.inAndOut(2 * t);
        } else {
            return 1 - Easing.inAndOut(2 * (t - 0.5));
        }
    };

    /**
     * easeInSine
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInSine = function (t) {
        return 1 - Math.cos((t * Math.PI) / 2);
    };

    /**
     * easeOutSine
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeOutSine = function (t) {
        return Math.sin((t * Math.PI) / 2);
    };

    /**
     * easeInOutQuint
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInOutQuint = function (t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    };

    /**
     * 二次In
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInQuad = function (t) {
        return t * t;
    };

    /**
     * 二次out
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeOutQuad = function (t) {
        return 1 - (1 - t) * (1 - t);
    };

    /**
     * 二次InOut
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInOutQuad = function (t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };
}());

// examples:
// let start = 0;
// let drawTime = 0;
// let duration = 1000;
// for(let i=0; i<10; i++) {
//     drawTime += 100;
//     console.info(Easing.inAndOut((drawTime - start) / duration));
// }

// 缓动函数另一种常见方式每个函数包含 t、b、c 和 d 四个参数
// t = Time - 表示动画开始以来经过的时间。通常从0开始，通过游戏循环或update函数来缓慢增加。
// b = Beginning value - 动画的起点，默认从0开始。
// c = Change in value - 从起点到终点的差值。
// d = Duration - 完成动画所需的时间。
// 例如：
// function easeInQuad (t, b, c, d) {
//     return c * (t /= d) * t + b;
// }
// end examples

/**
 * 动画处理工具类
 * @class
 */
const Animation = {};

(function () {
    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") {
        return {};
    }

    // 缺省帧率60帧/秒
    let TIME = Math.floor(1000 / 60);
    let stop, frame;
    let frames = {};
    let lastFrameTime = 0;
    let counter = 0;
    let loops = {};

    if (typeof window.requestAnimationFrame === 'function' && typeof window.cancelAnimationFrame === 'function') {
        frame = function (callback) {
            let id = Math.random();
            frames[id] = requestAnimationFrame(function onFrame(time) {
                if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                    lastFrameTime = time;
                    delete frames[id];
                    callback();
                } else {
                    frames[id] = requestAnimationFrame(onFrame);
                }
            });
            return id;
        };
        stop = function (id) {
            if (frames[id]) {
                cancelAnimationFrame(frames[id]);
            }
            delete loops[id];
        };
    } else {
        frame = function (callback) {
            return setTimeout(callback, TIME);
        };
        stop = function (timer) {
            delete loops[timer];
            return clearTimeout(timer);
        };
    }

    /**
     * 开始动画
     * @param {Function} callback 绘制帧函数
     * @param {int} duration 持续时间（动画执行时长（秒））
     * @param {int} frameRate 帧率（每秒执行多少次）
     * @returns int timer
     */
    Animation.start = function (callback, duration = 0, frameRate = 0) {
        duration = duration > 0 ? duration : Number.POSITIVE_INFINITY;
        if (frameRate > 0) {
            TIME = Math.floor(1000 / frameRate);
        }
        let id = ++counter;
        let start = Date.now();
        loops[id] = function () {
            if (loops[id] && Date.now() - start <= duration) {
                callback();
                if (loops[id]) {
                    frame(loops[id]);
                }
            } else {
                delete loops[id];
            }
        };
        frame(loops[id]);
        return id;
    };

    /**
     * 停止动画
     * @param {*} timer 
     */
    Animation.stop = function (timer) {
        return stop(timer);
    };

    /**
     * 执行一次 callback
     * @param {Function} callback 
     */
    Animation.frame = function (callback) {
        return frame(callback);
    };
}());

//  Canvas规范: https://html.spec.whatwg.org/multipage/canvas.html

/**
 * 图形管理类<br>
 * 图形管理类是 AnyGraph 图形开发引擎核心组件之一，是一个创建和管理图形的容器类；图形通常由多个图层组成，一个图层对应一个Source和Renderer。<br>
 * Graph类提供了以下功能：<br>
 * 1 图层管理<br>
 * 2 图形渲染<br>
 * 3 图形交互操作<br>
 * 4 图形数据管理<br>
 * 5 控件和事件管理
 */
class Graph extends EventTarget {
    /**
     * 构造函数
     * @param {Object} options {target, mouse, layers, view, originAtLeftTop, bgColor, useMatrix}  
     */
    constructor(options = {}) {
        super();

        let that = this;

        /**
         * 名称
         */
        this.name = options.name == null ? "graph" : options.name;

        /**
         * 渲染对象，负责将各个图层中的图形Canvas中渲染出来
         * @private
         */
        this.renderer_ = new GraphRenderer(this, { "filter": options.filter, "filterOptions": options.filterOptions });

        /**
         * 当没有指定view时，缺省是否显示全图
         * @private
         */
        this.defaultFullView_ = options.fullView || false;

        /**
         * 是否显示全图
         * @private
         */
        this.showFullView_ = this.defaultFullView_; 

        /**
         * 视图对象
         * @private
         */
        this.view_ = options.view == null ? null : options.view;

        /**
         * 背景颜色
         * @private
         */
        this.bgColor_ = options.bgColor;

        /**
         * 是否触发Geom对象事件
         * @private
         */
        this.isEnabledGeomEvent_ = options.enabledGeomEvent == null ? false : options.enabledGeomEvent === true;

        /**
         * 屏幕左上角是否为原点坐标，地理坐标的坐标原点为屏幕左下角，否则为屏幕左上角
         * @private
         */
        this.originAtLeftTop = options.originAtLeftTop === true || options.originAtLeftTop == null;     // true:左下， false:左上（同屏幕坐标）

        /**
         * 坐标 转换为 像素
         * @private
         */
        this.coordinateToPixelTransform_ = Transform.create();

        /**
         * 像素 转换为 坐标
         * @private
         */
        this.pixelToCoordinateTransform_ = Transform.create();

        /**
         * 是否为动态投影
         * @private
         */
        this.dynamicProjection_ = (options.dynamicProjection === true);

        /**
         * 是否使用Matrix进行坐标变换，系统提供了两种方式将世界坐标转换为屏幕坐标（Matrix和Transform)，Matrix的运行效率比transform略高，但无法提供旋转和平移等坐标变换
         * @private
         */
        this.useMatrix_ = (options.useMatrix == null || options.useMatrix === true);

        /**
         * 当前视点范围内的Gemo对象列表
         * @private
         */
        this.viewGeomList = options.hitGetColor === true ? new Map() : null;

        /**
         * target大小发生变化时的处理
         */
        //this.resizeObserver_ = new ResizeObserver(() => this._renderGraph());   // 页面初始化时会自动执行一次，导致重复渲染，因此暂时屏蔽 2024/1/12
        
        /**
         * Render对象，即包含画板和鼠标事件的对象，图形渲染载体
         */
        console.assert(options.target != null, "初始化失败，缺少必要的选项<target>");
        let render = null;
        let target = options.target;
        if (typeof (target) == "string") {
            render = new RenderObject(document.getElementById(options.target), {
                "mouse": options.mouse,
                "mapZoom": function (args) {
                    let anchor = that.getCoordinateFromPixel([args.x, args.y]);
                    let scale = (args.scale == null ? (args.op > 0 ? 0.8 : 1.25) : args.scale);
                    that.doZoom(scale, anchor);
                    return false;
                },
                "mapMove": function (args) {
                    that.doMove([args.xdist, args.ydist]);
                    return false;
                }
            }, this);
        } else if (typeof (target) == "object" && typeof (target.getCanvas) === "function") {
            render = target;
        } else {
            throw new Error("graph initialize error.")
        }

        if (render != null && render.getCanvas() != null) {
            this.renderObj_ = render;
            this.getRenderer().setMainCanvas(render.getCanvas());
            this.getRenderer().initCanvas(this.getRenderer().getSize());
            // this.resizeObserver_.observe(document.getElementById(options.target));
        }

        /**
         * 图层/背景图层
         */
        this.layers = [];
        if (options.layers != null && options.layers.length > 0) {
            options.layers.forEach(function (layer) {
                that.addLayer(layer);
            });
        }

        /**
         * 计数器
         * @private
         */
        this.counter = new Counter("graph");

        /**
         * render requestAnimalFrame id
         * @private
         */
        this.rafDelayId_;
    }

    /**
     * 设置图形名称
     */
    setName(name) {
        this.name = name;
    }

    /**
     * 清除当前图形对象的所有信息
     */
    remove() {
        this.layers.clear();
        // this.resizeObserver_.disconnect();
        this.getRenderObject().remove();
        Object.keys(this).forEach(key => {
            delete this[key];
        });
    }

    // /**
    //  * openLayer3
    //  * Clean up.
    //  */
    // disposeInternal() {
    //     this.controls.clear();
    //     this.interactions.clear();
    //     this.overlays_.clear();
    //     this.resizeObserver_.disconnect();
    //     this.setTarget(null);
    //     super.disposeInternal();
    // }

    /**
     * 增加图层
     * @param {Layer} layer 图层对象
     */
    addLayer(layer) {
        if (layer == null || !(layer instanceof Layer)) {
            layer = new Layer(Object.assign({
                "name": "缺省数据层",
                "zIndex": getLayerId(),
                "source": new VectorSource()
            }, layer));
        }
        layer.setGraph(this);
        layer.getRenderer().initCanvas(this.getRenderer().getSize());
        this.layers.push(layer);
        this.layers.sort(function (firstEl, secondEl) {
            return firstEl.getZIndex() - secondEl.getZIndex();
        });
        // 渲染
        this.render();
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "add", "layer": layer });
        return layer;
    }

    /**
     * 移除图层
     * @param {Layer} layer 图层对象
     */
    removeLayer(layer) {
        if (layer == null) return false;
        let bgType = layer.getId();
        for (let i = 0; i < this.layers.length; i++) {
            if (bgType === this.layers[i].getId()) {
                this.layers.splice(i, 1);
                return true;
            }
        }
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "remove", "layer": layer });
        return false;
    }

    /**
     * 移除所有图层
     */
    removeLayers() {
        for (let i = this.layers.length; i >= 0; i--) {
            this.layers.splice(i, 1);
        }
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "remove", "layer": [] });
    }

    /**
     * 获取指定图层
     * @param {int} bgType 图层ID
     */
    getLayer(id) {
        if (id === undefined) {
            for (let i = this.layers.length - 1; i >= 0; i--) {
                if (!this.layers[i].isAuxLayer()) {
                    return this.layers[i];
                }
            }
            return this.layers.length > 0 ? this.layers[0] : null;
        } else {
            for (let i = 0, len = this.layers.length; i < len; i++) {
                if (id === this.layers[i].getId()) {
                    return this.layers[i];
                }
            }
        }
        return null;
    }

    /**
     * 获取所有图层
     */
    getLayers() {
        return this.layers;
    }

    /**
     * 增加浮动层
     * 浮动层通常在数据层的上层，用于突出显示或绘制橡皮线
     */
    addOverLayer(options = {}) {
        let overLayer = new Layer({
            "source": new VectorSource(),
            "zIndex": options.overlayId > 0 ? options.overlayId : getLayerId() * 2,
            "type": "aux",
            "name": options.name ? options.name : "浮动层",
            "style": options.style ? options.style : { "color": "blue", "fillColor": "#FF8080" },
            "visible": true
        });

        return this.addLayer(overLayer);
    }

    /**
     * 增加控件
     */
    addControl(control) {
        if (control instanceof Control) {
            control.setGraph(this);
            control.show();
        }
    }

    /**
     * 移除控件
     */
    removeControl(control) {
        control.hide();
    }

    /**
     * 是否触发Geom对象事件
     * @returns {Boolean} 是/否
     */
    isEnabledGeomEvent() {
        return this.isEnabledGeomEvent_;
    }

    /**
     * 事件分发至对象中
     * @param {*} name 
     * @param {*} args 
     * @returns Boolean 如果返回false，则阻止事件冒泡
     */
    handleEvent(name, args) {
        // 根据鼠标的当前位置逐个图层，逐个对象判断是否相交，相交的对象添加至selectedGeomList中
        args = args || {};
        args.coord = this.getCoordinateFromPixel([args.x, args.y]);

        // 查询当前位置的GeomList
        let selectedGeomList = this.queryGeomList(args.coord);

        // 逐个触发geom对象事件
        let rtn = true;
        for (let i = 0, len = selectedGeomList.length; i < len; i++) {
            let geom = selectedGeomList[i];
            if (geom.triggerEvent(name, Object.assign(args, { "geometry": geom })) === false) {
                rtn = false;
            }
        }
        return rtn;
    }

    /**
     * 获取渲染器
     */
    getRenderer() {
        return this.renderer_;
    }

    /**
     * 设置图形的背景颜色
     */
    setBgColor(color) {
        this.bgColor_ = color;
    }

    /**
     * 获取背景颜色
     */
    getBgColor() {
        return this.bgColor_;
    }

    /**
     * 返回当前视图
     */
    getView() {
        if (this.view_ == null || !this.view_.isDef()) {
            let size = this.getRenderer().getSize();
            let maxExtent = Extent.createEmpty();
            // 缺省显示全图时，根据data计算viewPort
            if (this.defaultFullView_ === true || this.showFullView_ == true) {   // this.originAtLeftTop !== true || 
                maxExtent = this.getFullExtent();
                if (!Extent.isEmpty(maxExtent)) {
                    if (this.view_ == null) {
                        this.view_ = new View({ "extent": maxExtent, "canvasSize": size });
                        // 缺省视图为maxExtent的1.05倍  
                        this.view_.setResolution(this.view_.getResolution() * 1.01);
                    } else {
                        this.view_.initialize({ "extent": maxExtent, "canvasSize": size });
                    }
                }
            }
            // 否则使用当前画布的viewPort
            else {
                if (this.view_ == null) {
                    this.view_ = new View({ "extent": [0, 0, size.width, size.height], "canvasSize": size });
                } else {
                    this.view_.initialize({ "extent": [0, 0, size.width, size.height], "canvasSize": size });
                }
            }
        }

        return this.view_;
    }

    /**
     * 根据各图层的数据计算当前图形的最大范围
     */
    getFullExtent() {
        let maxExtent = Extent.createEmpty();
        for (let i = 0, ii = this.getLayers().length; i < ii; i++) {
            let layer = this.getLayers()[i];
            if (!layer.isUsePixelCoord()) {
                let source = layer.getSource();
                let gExtent = source.getBBox();
                maxExtent = Extent.merge(gExtent, maxExtent);
            }
        }
        return maxExtent;
    }


    /**
     * 查询图形中“包含”该坐标位置的对象
     * @param {Array} coord 坐标，其格式为[x,y] 或 [[x,y], [x,y]]
     * @returns Array GeomList
     */
    queryGeomList(coord) {
        let selectedGeomList = [];
        let extent = this.getExtent();
        let layers = this.getLayers();
        let point = (coord.length == 2 && !Array.isArray(coord[0]));

        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i];
            // 仅判断可见图层中的对象
            if (layer.getVisible() && layer.visibleAtResolution() && layer.visibleAtDistinct() && !layer.isAuxLayer()) {
                let geomList = layer.getSource().getExtentData(extent);

                // 逐个对象判断是否相交
                if (geomList != null && geomList.length > 0) {

                    let minX = Math.min(coord[0][0], coord[1][0]);
                    let minY = Math.min(coord[0][1], coord[1][1]);
                    let maxX = Math.max(coord[0][0], coord[1][0]);
                    let maxY = Math.max(coord[0][1], coord[1][1]);
                    let coordExtent = [minX, minY, maxX, maxY];

                    for (let j = 0, len = geomList.length; j < len; j++) {

                        // 根据点坐标进行查询
                        if (point) {
                            if (geomList[j].contain(coord, true)) {
                                selectedGeomList.push(geomList[j]);
                            }
                        }
                        // 判断coord与bbox是否相交
                        else {
                            let bbox = geomList[j].getBBox();
                            if (Extent.intersects(coordExtent, bbox)) {
                                selectedGeomList.push(geomList[j]);
                            }
                        }
                    }
                }
            }
        }

        // 按对象类别，与中心点距离等因素对相交的对象进行排序
        selectedGeomList.sort(function (a, b) {
            let extentA = a.getBBox(false);
            let extentB = b.getBBox(false);
            return Extent.getArea(extentA) - Extent.getArea(extentB);
        });

        return selectedGeomList;
    }

    /**
     * 同步图形渲染（立即进行图形渲染）
     */
    renderSync() {
        if (this.rafDelayId_) {
            window.cancelAnimationFrame(this.rafDelayId_);
            this.rafDelayId_ = undefined;
        }
        this._renderGraph();
    }

    /**
     * 异步图形渲染（使用RAF方式，在window下一次刷新时进行渲染）
     */
    render() {
        let that = this;
        if (this.rafDelayId_ === undefined) {
            this.rafDelayId_ = window.requestAnimationFrame(function () {
                that._renderGraph();
                that.rafDelayId_ = undefined;
            });
        }
    }

    /**
     * 重绘指定图层
     * @param {Layer} layer 
     * @returns 执行时间
     */
    renderLayer(layer) {
        let frameState = this.getFrameState();
        frameState.getLayer = function () {
            return layer;
        };
        // 触发事件
        this.triggerEvent(EventType.RenderBefore, { frameState, "graph": this });
        // 改变变换矩阵参数
        this.calculateMatrices2D(frameState);
        // 合成图形
        let style = layer.getStyle();
        if (typeof (style.dynamic) === "function") {
            style.dynamic(layer, frameState);
        }
        let execTime = layer.getRenderer().composeBuffer(frameState);
        execTime += this.getRenderer().renderFrame();
        // 触发事件
        this.triggerEvent(EventType.RenderAfter, { frameState, "graph": this });
        return execTime;
    }

    /**
     * 图形渲染
     * @private
     */
    _renderGraph() {
        let beginTime = Date.now();
        // canvas对象大小调整
        this.getRenderObject().updateSize();
        // 各图层大小调整
        this.getRenderer().prepareFrame();

        // 读取视图
        if (this.getView() != null && this.getView().isDef()) {
            let frameState = this.getFrameState();
            // 触发事件
            this.triggerEvent(EventType.RenderBefore, { frameState, "graph": this });
            // 改变变换矩阵参数
            this.calculateMatrices2D(frameState);
            // 各图层合成图形
            this.getRenderer().composeBuffer(frameState);
            // 将各图层的图形合成到主画板中
            this.getRenderer().renderFrame(true);
            // 触发事件
            this.triggerEvent(EventType.RenderAfter, { frameState, "graph": this });
        }
        this.counter.add("render " + this.name + " time", (Date.now() - beginTime));
        this.rafDelayId_ = undefined;
    }

    /**
     * 
     * @param {Geometry} geom 
     * @param {String} name 
     * @param {Object} val 
     */
    prop(geom, name, val) {
        geom[name] = val;
        this.render();
    }

    /**
     * 移除某个图层中的Geometry对象
     * @param {Geometry|String} geom 
     */
    removeGeom(geom) {
        let uid = (geom instanceof Geometry ? geom.getUid() : (typeof (geom) === "string" ? geom : (typeof (geom) === "object" ? geom.id : null)));
        if (uid == null) return;
        let layers = this.getLayers();
        for (let i = 0; i < layers.length; i++) {
            let geomList = layers[i].getSource().getData();
            if (geomList && geomList.length > 0) {
                for (let j = 0, len = geomList.length; j < len; j++) {
                    if (geomList[j].getUid() === uid) {
                        geomList.splice(j, 1);
                        break;
                    }
                }
            }
        }
        this.render();
    }

    /**
     * 获取图形信息
     * @returns Object
     */
    getFrameState() {
        let extent = this.getExtent();
        let frameState = Object.assign({
            "extent": extent,
            "size": this.getSize(),
            "dist": Extent.getWidth(extent) * Math.sqrt(3),
            "coordinateToPixelTransform": this.coordinateToPixelTransform_,
            "pixelToCoordinateTransform": this.pixelToCoordinateTransform_,
            "dynamicProjection": this.dynamicProjection_,
            "useMatrix": this.useMatrix_,
            "originAtLeftTop": this.originAtLeftTop,
            "viewGeomList": this.viewGeomList
        }, this.getView().getState());
        return frameState;
    }

    /**
     * 获取当前渲染范围
     * @returns Extent
     */
    getExtent() {
        let size = this.getSize();
        let viewState = this.getView().getState();
        let extent = [
            viewState.center[0] - viewState.resolution * size.width / 2,
            viewState.center[1] - viewState.resolution * size.height / 2,
            viewState.center[0] + viewState.resolution * size.width / 2,
            viewState.center[1] + viewState.resolution * size.height / 2
        ];
        return extent;
    }

    /**
     * 设置图形的视点范围，并重绘图形
     * @param {Extent} extent
     */
    showExtent(extent) {
        // 计算分辨率
        let canvasSize = this.getSize();
        let widthResolution = Extent.getWidth(extent) / canvasSize.width;
        let heightResolution = Extent.getHeight(extent) / canvasSize.height;
        let res = Math.max(widthResolution, heightResolution);
        // 计算中心点
        let center = Extent.getCenter(extent);
        // 改变视点
        this.getView().setCenter(center);
        this.getView().setResolution(res);
        this.render();
    }

    showFullView() {
        this.showFullView_ = true;
    }

    /**
     * 设置当前视图（中心点和密度），并重绘图形
     * @param {View} view
     */
    setView(view) {
        this.view_ = view;
        this.render();
    }

    /**
     * 改变视图位置
     * @param {Array} position 横向像素距离和纵向像素距离
     */
    doMove(position) {
        let state = this.getView().getState();
        let centerX = state.center[0] - position[0] * state.resolution;
        let centerY = state.center[1] + position[1] * state.resolution * (this.originAtLeftTop ? -1 : 1);
        this.getView().setCenter([centerX, centerY]);
        this.render();
    }

    /**
     * 放大/缩小图形
     * @param {Number} scale 缩放倍率 
     * @param {Coord} anchor 锚点坐标 
     */
    doZoom(scale = 1.5, anchor) {
        if (anchor == null) {
            anchor = this.getView().getCenter();
        }
        // 改变分辨率，并更加锚点计算中心点，从而进行缩放
        let resolution = this.getView().getResolution() * scale;
        let center = this.getView().calculateCenterZoom(resolution, anchor);
        if (this.getView().setResolution(resolution)) {
            this.getView().setCenter(center);
        }
        this.render();
    }

    /**
     * 具有动画效果的图形缩放
     * @param {Number} scale 缩放倍率 
     * @param {Coord} anchor 锚点坐标 
     */
    animailZoom(scale = 1.5, anchor, duration = 500) {
        let originalRes = this.getView().getResolution();
        let targetRes = this.getView().getResolution() * scale;
        let start = Date.now();
        let that = this;
        // 缺省锚点为中心点
        if(anchor == null) {
            anchor = Extent.getCenter(this.getExtent());
        }
        // 开始动画
        Animation.start(function () {
            let drawTime = Date.now() - 1;
            let delta = Easing.easeOut((drawTime - start) / duration);
            let res = originalRes + delta * (targetRes - originalRes);
            let center = that.getView().calculateCenterZoom(res, anchor);
            that.getView().setCenter(center);
            that.getView().setResolution(res);
            that.renderSync();
        }, duration);
    }

    /**
     * 具有动画效果的图形移动
     * @param {Coord} center 中心点坐标
     * @param {Number} resolution 新的分辨率，如果为空则不改变分辨率 
     * @param {int} duration 延时时间
     */
    animailMove(center, resolution, duration = 500) {
        let start = Date.now();
        let that = this;
        let originalCenter = this.getView().getCenter();
        let originalRes = this.getView().getResolution();

        // 开始动画
        Animation.start(function () {
            let drawTime = Date.now() - 1;
            let delta = Easing.easeOut((drawTime - start) / duration);
            let centerX = originalCenter[0] + delta * (center[0] - originalCenter[0]);
            let centerY = originalCenter[1] + delta * (center[1] - originalCenter[1]);
            that.getView().setCenter([centerX, centerY]);
            if (resolution != null && resolution > 0) {
                let res = originalRes + delta * (resolution - originalRes);
                that.getView().setResolution(res);
            }
            that.renderSync();
        }, duration);
    }

    /**
     * 渲染画板对象
     * @returns Render
     */
    getRenderObject() {
        return this.renderObj_;
    }

    /**
     * 获取图形的宽度和高度
     */
    getSize() {
        let width = this.getRenderer().getMainCanvas().width;
        let height = this.getRenderer().getMainCanvas().height;
        return { width, height };
    }

    /**
     * 像素坐标转地理坐标
     */
    getCoordinateFromPixel(pixel, precision = true) {
        //return Transform.apply(this.pixelToCoordinateTransform_, pixel.slice(), precision);
        return Coordinate.transform2D(this.pixelToCoordinateTransform_, pixel, precision);
    }

    /**
     * 地理坐标转像素坐标
     */
    getPixelFromCoordinate(coordinate) {
        return Coordinate.transform2D(this.coordinateToPixelTransform_, coordinate, false);
    }

    /**
     * 屏幕像素转变转地理坐标参数计算
     */
    calculateMatrices2D(frameState) {
        Transform.compose(this.coordinateToPixelTransform_,
            frameState.size.width / 2,
            frameState.size.height / 2,
            1 / frameState.resolution,
            (this.originAtLeftTop === true ? 1 : -1) / frameState.resolution, 0,
            -frameState.center[0],
            -frameState.center[1]);
        Transform.invert(Transform.setFromArray(this.pixelToCoordinateTransform_, this.coordinateToPixelTransform_));
    }

    /**
     * 在控制台显示所有图层信息
     */
    printLayers() {
        let layerCount = 0;
        let nodeCount = 0;
        console.info("current graph name:%s", this.name);
        for (let i = 0, ii = this.layers.length; i < ii; i++) {
            let layer = this.layers[i];
            console.info("id:%s, name:%s, order:%d, nodeNum:%d", layer.getId(), layer.getName(), layer.getZIndex(), layer.getSource().getData().length, layer.getLayerState());
            layerCount += 1;
            nodeCount += layer.getSource().getData().length;
        }
        return Object.assign({ layerCount, nodeCount }, this.getFrameState());
    }
}

/**
 * GeoJSON 数据格式解析
 */
class GeoJSONFormat extends FeatureFormat {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
        this.style = options.style;
        // 填充颜色集
        this.fillColorSet = options.fillColorSet;
        // 描边颜色集
        this.colorSet = options.colorSet;
        // idx
        this.fillColorIdx = 0;
        this.colorIdx = 0;
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readFeatures(data, proj) {
        let that = this;
        let listData = [];
        for (let i = 0, ii = data.features.length; i < ii; i++) {
            let obj = data.features[i];
            let style = this.getStyle(obj);
            let properties = this.getProperties(obj);
            if (obj.geometry == null || obj.geometry.coordinates == null) continue;
            let coords = obj.geometry.coordinates;
            if (obj.geometry.type == "Point") {
                let coord = that._project(coords, proj);
                listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, properties }));
            } else if (obj.geometry.type == "MultiPoint") {
                for (let x = 0; x < coords.length; x++) {
                    let coord = that._project(coords[x], proj);
                    listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, properties }));
                }
            } else if (obj.geometry.type == "LineString") {
                listData.push(new Polyline({ "coords": that._project(coords, proj), style, properties }));
            } else if (obj.geometry.type == "MultiLineString") {
                for (let x = 0; x < coords.length; x++) {
                    listData.push(new Polyline({ "coords": that._project(coords[x], proj), style, properties }));
                }
            } else if (obj.geometry.type == "Polygon") {
                for (let x = 0; x < coords.length; x++) {
                    listData.push(new Polygon({ "coords": that._project(coords[x], proj), style, properties }));
                }
            } else if (obj.geometry.type == "MultiPolygon") {
                for (let x = 0; x < coords.length; x++) {
                    for (let j = 0; j < coords[x].length; j++) {
                        listData.push(new Polygon({ "coords": that._project(coords[x][j], proj), style, properties }));
                    }
                }
            } else {
                throw new Error("不支持的类型：" + obj.geometry.type);
            }
        }

        return listData;
    }

    getStyle(feature) {
		//let colorSet = Color.band(new Color(128, 255, 255), new Color(0, 35, 188), 5);
        let style = {};
        if(this.style != null) {
			style = Object.assign({}, this.style);
			// 从随机填充颜色中选择一种颜色
			if(Array.isArray(this.fillColorSet) && this.fillColorSet.length > 0) {
				style.fillColor = this.fillColorSet[this.fillColorIdx++%this.fillColorSet.length];   // MathUtil.getRandomNum(0, this.fillColorSet.length - 1)
			}
			// 从随机描边颜色中选择一种颜色
			if(Array.isArray(this.colorSet) && this.colorSet.length > 0) {
				style.color = this.colorSet[this.colorIdx++%this.colorSet.length];  // MathUtil.getRandomNum(0, this.colorSet.length - 1)
			}
		}       
        return style;
    }

    getProperties(feature) {
        return feature.properties;
    }

    /**
     * 坐标转换
     * @param {Array} coords 
     * @param {Projection} proj 
     * @returns 转换后的坐标
     */
    _project(coords, proj) {
        if (proj == null) {
            return coords;
        } else {
            return proj.project(coords);
        }
    }
}

/**
 * @example:
 * GeoJSON 对象示例
 * {
 *    "type": "Feature",
 *    "id": "f1",
 *    "geometry": {...},
 *    "properties": {...},
 *    "title": "Example Feature"
 * }
 * {
 *     "type": "Point",
 *     "coordinates": [100.0, 0.0]
 * }
 * {
 *     "type": "LineString",
 *     "coordinates": [
 *         [100.0, 0.0],[101.0, 1.0]
 *     ]
 * }
 * {
 *     "type": "Polygon",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]
 *     ]
 * }
 * {
 *     "type": "Polygon",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
 *         [[100.8, 0.8], [100.8, 0.2], [100.2, 0.2], [100.2, 0.8], [100.8, 0.8]]
 *     ]
 * }
 * {
 *     "type": "MultiPoint",
 *     "coordinates": [
 *         [100.0, 0.0],[101.0, 1.0]
 *     ]
 * }
 * {
 *     "type": "MultiLineString",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 1.0]],
 *         [[102.0, 2.0],[103.0, 3.0]]
 *     ]
 * }
 * {
 *     "type": "MultiPolygon",
 *     "coordinates": [
 *         [
 *             [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
 *         ],
 *         [
 *             [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
 *             [[100.2, 0.2], [100.2, 0.8], [100.8, 0.8], [100.8, 0.2], [100.2, 0.2]]
 *         ]
 *     ]
 * }
 * {
 *     "type": "GeometryCollection",
 *     "geometries": [{
 *         "type": "Point",
 *         "coordinates": [100.0, 0.0]
 *     }, {
 *         "type": "LineString",
 *         "coordinates": [
 *             [101.0, 0.0], [102.0, 1.0]
 *         ]
 *     }]
 * }
 */

/**
 * 欣能JSON数据源，该数据源同GeoJson格式，但坐标值有所不同
 */
class XNGeoJsonData extends FeatureFormat {
    /**
     * 构造函数
     */
    constructor() {
        super();
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readFeatures(data, proj) {
        let that = this;
        let listData = [];
        for (let i = 0, ii = data.features.length; i < ii; i++) {
            let obj = data.features[i];
            let style = {};
            if (obj.geometry == null || obj.geometry.coordinates == null) continue;
            let coords = obj.geometry.coordinates;
            if (obj.geometry.type == "Point") {
                let coord = that._project(coords, proj);
                listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, "properties": obj.properties }));
            } else if (obj.geometry.type == "LineString") {
                listData.push(new Polyline({ "coords": that._project(coords, proj), style, "properties": obj.properties }));
            } else if (obj.geometry.type == "Polygon") {
                listData.push(new Polygon({ "coords": that._project(coords, proj), style, "properties": obj.properties }));
            } else {
                throw new Error("不支持的类型：" + obj.geometry.type);
            }
        }
        return listData;
    }

    /**
     * 坐标转换
     * @param {Array} coords 
     * @param {Projection} proj 
     * @returns 转换后的坐标
     */
    _project(coords, proj) {
        if (proj == null) {
            let num = coords.length;
            if (num === 2) {
                return coords;
            } else {
                let points = [];
                for (let i = 0; i < num; i += 2) {
                    points.push([coords[i], coords[i + 1]]);
                }
                return points;
            }
        } else {
            return proj.project(coords);
        }
    }
}

/**
 * CIM/G 数据格式解析
 */
class CimgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        this.symbolManager = options.symbol;
        //this.layerConfiguration = options.style;
        this.counter = new Counter("CimgFormat");
    }

    /**
     * 装载图形数据（该数据由Interface2020.jar程序转换CIM/G单线图数据转换而来）
     * @param {*} data 
     * data example:
     * [
     *     {"type":"polygon", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":",1000.642090,599.762939,1000.642090,603.240295,1004.922180,603.240295,1004.922180,599.762939,1000.642090,599.762939,"},
     *     {"type":"zhkg", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"566.608704,474.016632"},
     *     {"type":"ConnectLine", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"null,null"},
     *     {"type":"FeedLine", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"866.555908,1954.831421,866.117126,1954.333862,864.116577,1952.285156,864.032654,1951.949707,864.260254,1951.554321,868.130127,1948.307495,890.904602,1926.813843,893.152771,1925.015259"},
     *     {"type":"Text", "lineWidth":1, "lineType":1, "text":"国", "fontName":"宋体", "fontSize":0.086581, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"1562.815186,1058.258057,1562.901733,1058.344604"},
     * ] 
     */
    readFeatures(file) {
        let listData = [];
        let unknow = [];

        // 图形对象
        for (let i = 0, ii = file.nodes.length; i < ii; i++) {
            let obj = file.nodes[i];
            let style = { "color": getCimgColor(obj.color), "fillColor": getCimgColor(obj.fillColor) };
            if (obj.lineWidth >= 0) {
                style.lineWidth = obj.lineWidth;
            }
            let properties = { "tagName": obj.type, "id": obj.id, "name": obj.name };
            if (obj.type == "ConnectLine" || obj.type == "FeedLine" || obj.type == "Bus" || obj.type == "BusDis") {
                let coords = this.str2Line(obj.coords);
                if (obj.lineType === 2) {
                    style = Object.assign({ dash: [5, 3] }, style);
                } else {
                    style = Object.assign({}, style);
                }
                listData.push(new Polyline({ coords, style, properties }));
            } else if (obj.type == "polygon") {
                let coords = this.str2Line(obj.coords);
                style = Object.assign({}, style);
                listData.push(new Polygon({ coords, style, properties }));
            } else if (obj.type == "Text") {
                // obj.coords example: 940.547119,784.570435,944.146362,788.169678
                let coords = this.str2Line(obj.coords);
                listData.push(new Text({
                    "text": obj.text,
                    "vectorSize": true,
                    "x": coords[0][0],
                    "y": coords[0][1],
                    "rotation": obj.rotate,
                    "width": Math.abs(coords[1][0] - coords[0][0]) * obj.text.length,
                    "height": Math.abs(coords[1][1] - coords[0][1]),
                    "style": Object.assign(style, { fontBorder: false, "fontSize": obj.fontSize, "fontName": obj.fontName, "fillPrior": true }),
                    "properties": Object.assign(properties, {})
                }));
            } else {  // 加载符号
                // console.debug("符号<" + obj.type + "> :" + obj.symbolFileName);
                let symbol = this.symbolManager.getSymbol(obj.symbolFileName, 0, 0);
                let coords = this.str2Point(obj.coords);
                style = Object.assign({}, style);
                if (symbol != null) {
                    // CIM/G中符号坐标为未缩放前左上角的坐标
                    // 中心点坐标
                    let centerX = parseFloat(symbol.alignCenter.split(",")[0]);
                    let centerY = parseFloat(symbol.alignCenter.split(",")[1]);
                    listData.push(new Symbol({
                        symbol,
                        "x": coords[0] + centerX,
                        "y": coords[1] + centerY,
                        "rotation": obj.rotate,
                        style,
                        "width": symbol.width * obj.scaleX,
                        "height": symbol.height * obj.scaleY,
                        "properties": Object.assign({}, properties)
                    }));

                    // 调试用：符号外框
                    //listData.push(new Rect({"coords": [leftTopCoord, rightBottomCoord], "style": {color:"#0000FF"}, properties}));
                    // 调试用：符号中心点
                    //listData.push(new Point({"x": coords[0] + centerX, "y": coords[1] + centerY, "style": {color:"#FF0000", fillColor:"#FF0000", size:5}}));
                    // 调试用：cimg中的坐标点
                    //listData.push(new Point({"x": coords[0], "y":coords[1], "style": {color:"#0000FF", fillColor:"#0000FF", size:5}}));    
                } else {
                    listData.push(new Point({
                        "x": coords[0],
                        "y": coords[1],
                        "size": -1,
                        style,
                        properties
                    }));
                    if (unknow.findIndex(val => val == obj.symbolId) < 0) {
                        unknow.push(obj.symbolId);
                    }
                }
            }
        }

        if (unknow.length > 0) {
            console.warn("缺少CIM/G符号:" + unknow.join(","));
        }
        return listData;
    }

    /**
     * 字符串坐标转换为点坐标
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords 
     */
    str2Point(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 1) {
            return [parseFloat(seg[0]), parseFloat(seg[1])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的点坐标");
        }
    }

    /**
     * 字符串坐标转换为多点坐标
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords 
     */
    str2Line(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 1) {
            let flatCoords = [];
            for (let i = 0, ii = seg.length; i < ii; i += 2) {
                flatCoords.push([parseFloat(seg[i]), parseFloat(seg[i + 1])]);
            }
            return flatCoords;
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的线坐标");
        }
    }

    /**
     * 字符串坐标转换为矩形坐标（两点）
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Rect(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length == 4) {
            let p1 = [parseFloat(seg[0]), parseFloat(seg[1])];
            let p2 = [parseFloat(seg[2]), parseFloat(seg[3])];
            return [p1, p2];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的点坐标");
        }
    }

    /**
     * 字符串坐标转换为圆坐标，圆坐标格式为[x,y,r]
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Round(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 2) {
            return [parseFloat(seg[0]), parseFloat(seg[1]), parseFloat(seg[2])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的圆(x,y,r)坐标");
        }
    }

    /**
     * 字符串坐标转换为椭圆坐标，圆坐标格式为[x,y,rx,ry]
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Ellipse(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 3) {
            return [parseFloat(seg[0]), parseFloat(seg[1]), parseFloat(seg[2]), parseFloat(seg[3])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的椭圆(x,y,rx,ry)坐标");
        }
    }
}

function getCimgColor(colorString) {
    if (colorString == null) return null;
    if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 4) {
        colorString = "rgba(" + colorString + ")";
    } else if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 3) {
        colorString = "rgb(" + colorString + ")";
    }
    return colorString;
}

const SYMBOL_ADD_BORDER = false;

/**
 * G符号
 */
class BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        this.symbolCollection_ = {};
        this.originAtLeftTop = (options.originAtLeftTop == null ? true : (options.originAtLeftTop === false ? false : true));
    }

    /**
     * 获取所有符号
     * @returns Array
     */
    getKeyCollection() {
        let array = [];
        for (let obj in this.symbolCollection_) {
            let symbol = this.symbolCollection_[obj];
            array.push({ "id": symbol.id, "name": symbol.name, "stateCount": symbol.stateCount });
        }
        // 按符号ID排序
        array.sort((a, b) => a.id - b.id);
        return array;
    }

    /**
     * 获取符号对象
     * @param {String} id 
     * @returns {Object} 符号对象，其格式为: {name, width, height, alignCenter, id, state, childGeometrys}
     */
    getSymbol(id, state, layerSeq = 0) {
        let symbolData = this.symbolCollection_[id];
        if (symbolData == null) {
            return null;
        } else if (state == null) {
            // 缺省为最大状态的符号（开关类符号通常有两个状态，0:开，1:合)
            state = symbol.stateCount - 1;
        } else if (state > symbolData.stateCount - 1) {
            throw new Error("获取CIM/G符号失败：超过了最大状态号");
        }

        let childGeometrys = [];
        let shapes = symbolData.layers[layerSeq];
        for (let i = 0, ii = shapes.length; i < ii; i++) {
            if (shapes[i].properties.state === state) {
                childGeometrys.push(shapes[i].clone());
            } else if ( state != 0 && shapes[i].properties.state == 0 ) {
            	if ( shapes[i].getType() == "Point" ) { //pin值是各状态共享的,以便其它状态的符号获取锚点坐标
            		childGeometrys.push(shapes[i].clone());
            	}
            }
        }
        return Object.assign({}, symbolData, { "childGeometrys": childGeometrys });
        //return { "id": symbolData.id, "name": symbolData.name, "width": symbolData.width, "height": symbolData.height, "alignCenter": symbolData.alignCenter, "childGeometrys": childGeometrys };
    }

    /**
     * 获取符号列表
     * @param{int} columnNum 列数
     * @returns Array
     */
    getSymbolRenderList(columnNum = 10) {
        let gridWidth = 300;
        let gridHeight = 400;
        let space = [50, 180];
        let num = 0;
        let symbolIdArray = this.getKeyCollection();
        let list = [];
        for (let id in symbolIdArray) {
            let sym = symbolIdArray[id];
            for (let i = 0, ii = sym.stateCount; i < ii; i++) {
                let symbol = this.getSymbol(sym.id, i);
                if (symbol == null || symbol.childGeometrys.length == 0) continue;

                // 计算位置
                let col = Math.floor(num / columnNum);
                let row = num % columnNum;
                let x = row * (gridWidth + space[0]);
                let y = col * (gridHeight + space[1]);

                //符号
                let extent = correctExtent([0, 0, gridWidth, gridHeight], [0, 0, symbol.width, symbol.height]);
                let nw = extent[2] - extent[0];
                let nh = extent[3] - extent[1];
                list.push(new Symbol({
                    "x": x + gridWidth / 2, 
                    "y": y + gridHeight / 2,
                    "style": { "addBorder": SYMBOL_ADD_BORDER },
                    "width": nw, 
                    "height": nh, 
                    "symbol": symbol
                }));

                // 外框
                list.push(new Polygon({
                    "coords": [[x, y], [x, y + gridHeight], [x + gridWidth, y + gridHeight], [x + gridWidth, y], [x, y]],
                    "style": { "color": "#CCCCCC" }
                }));
/*
                // 增加名称文本
                list.push(new Text({
                    "text": (symbol.name + "/" + symbol.id + ":" + i),
                    "coords": [x, y + gridHeight + 50],
                    "width": gridWidth, "height": 30, 
                    "vectorSize":false,
                    "style": { fontBorder: false, "fillColor": "red" }
                }));
*/
                num += 1;
            }
        }

        console.debug("共加载了%d个符号, 按不同状态渲染符号数共%d个", symbolIdArray.length, num);
        return list;
    }

    /**
     * 装载符号文件
     * @param {String} fileUrl 
     */
    loadFile(callback, fileUrl) {
        ClassUtil.abstract();
    }

    /**
     * 装载符号数据
     * @param {String} fileUrl 
     */
    loadData(data) {
        ClassUtil.abstract();
    }
}

/**
 * XML文件操作工具类
 * @class
 */
const XmlUtil = {};

(function () {
    let prefix = null;

    /**
     * 加载XML字符串，可支持IE7+和FF等，IE9使用该方法返回的Document对象不支持Xpath
     * @param {String} str 
     * @returns Document
     */
    XmlUtil.loadXML = function(str) {
        var xmlDoc;
        if (window.DOMParser) { // IE9+, Firefox, Chrome
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(str, "text/xml");
        } else {                // IE7
            xmlDoc = _createXmlDocument();
            xmlDoc.async = false;
            xmlDoc.loadXML(str);                 // IE9无此方法
        }        return xmlDoc;
    };
    
    /**
     * 加载XML文件(可支持IE7+和FF等)
     * @param {String} url 
     * @param {Object} args {async, success}
     */
    XmlUtil.load = function(url, args = {}) {
        var xhr = _createXmlHttp();
        let async = args.async === true ? true : false;
        xhr.open("GET", url, async);
        xhr.send();
        if (async === true) {
            xhr.onload = function (e) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                    if (typeof (args.success) === "function") {
                        return args.success(xhr.responseXML);
                    }
                    console.debug("发送ajax请求结束");
                }
            };
        } else {
            return xhr.responseXML;
        }
    };

    /**
     * 获取Xml节点的值
     * @param {XmlElement} node 
     * @returns String
     */
    XmlUtil.getNodeValue = function(node) {
        var val;
        if (node == null) return null;
        if (window.DOMParser) {      //IE
            val = (node.childNodes.length > 0 ? node.childNodes[0].nodeValue : "");
        } else {                      //Mozilla
            try {
                val = node.text;
                if (!val) {
                    val = node.textContent;
                }
                if (!val) {
                    val = node.firstChild.nodeValue;
                }
            } catch (e) {
                val = node.textContent;
            }

        }        return val;
    };
    
    /**
     * 获取子节点
     * @param {XmlNode} node 
     * @param {String} childElementName 
     * @returns XmlNode
     */
    XmlUtil.getChildNode = function(node, childElementName) {
        if (node == null) return null;
        //var childNode= selectSingleNode(node, childElementName);             // 该方式需XPath支持
        var childNode = node.getElementsByTagName(childElementName);           // 该方式支持各种浏览器
        return childNode;
    };

    /**
     * 获取子节点的值
     * @param {XmlNode} node 
     * @param {String} childElementName 
     * @returns String nodeValue
     */
    XmlUtil.getChildNodeValue = function(node, childElementName) {
        var childNode = getChildNode(node, childElementName);
        if (childNode.length == 0) { return null; }        return getNodeValue(childNode[0]);
    };

    /**
     * 将XmlNode节点转换为字符串
     * @param {XmlNode} node 
     * @returns String
     */
    XmlUtil.getString = function(node) {
        if (typeof (node.xml) != "undefined") {
            return node.xml;
        } else {
            return (new XMLSerializer()).serializeToString(node);
        }
    };

    /**
     * 使用XPath搜索节点集
     * @param {XmlNode} node 
     * @param {String} xpath 
     * @param {String} nsr 
     * @returns Array 节点集
     */
    XmlUtil.selectNodes = function(node, xpath, nsr) {
        if (node == null || xpath == null) return [];
        if (typeof (node.selectNodes) != "undefined") {         // IE7,  IE9+（XmlHttp.responseXML）, （IE9使用createXmlDocument和DOMParser的loadXML时，无此方法）
            return node.selectNodes(xpath);
        } else {                                                // FF
            var output = [];
            var xpe = new XPathEvaluator();
            var nsResolver = xpe.createNSResolver(node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement);
            var oResult = xpe.evaluate(xpath, node, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            if (oResult != null) {
                var oElement = oResult.iterateNext();
                while (oElement) {
                    output.push(oElement);
                    oElement = oResult.iterateNext();
                }
            }            return output;
        }
    };

    /**
     * 使用XPath搜索节点
     * @param {XmlNode} node 
     * @param {String} xpath 
     * @param {String} nsr 
     * @returns XmlNode 节点
     */
    XmlUtil.selectSingleNode = function(node, xpath, nsr) {
        if (node == null || xpath == null) return null;
        if (typeof (node.selectSingleNode) != "undefined") {
            return node.selectSingleNode(xpath);
        } else {
            var xpe = new XPathEvaluator();
            //var nsResolver = xpe.createNSResolver( node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement);

            var ns = node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement;
            var nsResolver = nsr ? nsr : xpe.createNSResolver(ns);

            var xPathNode = xpe.evaluate(xpath, node, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return (xPathNode != null) ? xPathNode.singleNodeValue : null;
        }
    };

    /**
     * 使用XSLT转换XML文档
     * @param {Document} xmlSource 
     * @param {String} xslFileName 
     * @returns Document
     */
    XmlUtil.transform = function(xmlSource, xslFileName) {
        if (window.ActiveXObject) {    //支持IE6、IE7， 不支持IE9
            try {
                var xslt = new ActiveXObject(_getDomDocumentPrefix() + ".XSLTemplate");
                var xslDoc = new ActiveXObject(_getDomDocumentPrefix() + ".FreeThreadedDOMDocument");
                xslDoc.async = false;
                xslDoc.loadXML(loadXmlDocument(xslFileName));
                xslt.stylesheet = xslDoc;
                var xslProc = xslt.createProcessor();
                xslProc.input = xmlSource;
                xslProc.transform();

                var stroutput = xslProc.output;
                var docTarget = new ActiveXObject(_getDomDocumentPrefix() + ".DomDocument");
                docTarget.setProperty("SelectionLanguage", "XPath");
                docTarget.loadXML(stroutput);
                return docTarget;
            } catch (exp) {
                alert(exp.name + ": " + exp.message);
            }        } else {                      //支持FF
            try {
                var myXMLHTTPRequest = new XMLHttpRequest();
                myXMLHTTPRequest.open("GET", xslFileName, false);
                myXMLHTTPRequest.send(null);
                var xslStylesheet = myXMLHTTPRequest.responseXML;
                var xsltProcessor = new XSLTProcessor();
                xsltProcessor.importStylesheet(xslStylesheet);
                //xsltProcessor.setParameter(null, "parameter", null);
                //var fragment = xsltProcessor.transformToFragment(xmlSource, document);
                var docTarget = xsltProcessor.transformToDocument(xmlSource);
                return docTarget;
            } catch (exp) {
                alert(exp.name + ": " + exp.message);
            }
        }
    };

    function _getDomDocumentPrefix() {
        if (prefix) {
            return prefix;
        }        var prefixes = ["MSXML6", "MSXML5", "MSXML4", "MSXML3", "MSXML2", "MSXML", "Microsoft"];
        var o;
        for (var i = 0; i < prefixes.length; i++) {
            try {
                o = new ActiveXObject(prefixes[i] + ".DomDocument");
                prefix = prefixes[i];
                return prefix;
            }
            catch (ex) { }        }        throw new Error("Could not find an installed XML parser");
    }
    /**
     * 创建XMLHttpRequest对象
     * @returns XMLHttpRequest
     */
    function _createXmlHttp() {
        try {
            if (window.XMLHttpRequest) {    // ie9+, FF
                var req = new XMLHttpRequest();
                // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
                if (req.readyState == null) {
                    req.readyState = 1;
                    req.addEventListener("load", function () {
                        req.readyState = 4;
                        if (typeof req.onreadystatechange == "function") {
                            req.onreadystatechange();
                        };
                    }, false);
                };
                return req;
            } else if (window.ActiveXObject) {
                return new ActiveXObject(_getDomDocumentPrefix() + ".XmlHttp");
            };
        } catch (ex) { }        throw new Error("Your browser does not support XmlHttp objects");
    }

    // 可支持IE7+和FF等，IE9使用该方法返回的Document对象不支持LoadXML和Xpath
    function _createXmlDocument() {
        try {
            if (document.implementation && document.implementation.createDocument) {   // IE9+, FF
                var doc = document.implementation.createDocument("", "", null);

                // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
                if (doc.readyState == null) {
                    doc.readyState = 1;
                    doc.addEventListener("load", function () {
                        doc.readyState = 4;
                        if (typeof doc.onreadystatechange == "function") {
                            doc.onreadystatechange();
                        };
                    }, false);
                };
                return doc;
            } else if (window.ActiveXObject) {                                           // IE7
                var doc = new ActiveXObject(_getDomDocumentPrefix() + ".DomDocument");
                doc.setProperty("SelectionLanguage", "XPath");
                return doc;
            };
        } catch (ex) { }        throw new Error("Your browser does not support XmlDocument objects");
    }
}());

/**
 * 浏览器信息工具类
 * (source: leftlet)
 * @class
 */
const BrowserUtil = {};

(function () {

    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") {
        return {};
    }

    BrowserUtil.style = document.documentElement.style;

    // @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
    BrowserUtil.ie = 'ActiveXObject' in window;

    // @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
    BrowserUtil.ielt9 = BrowserUtil.ie && !document.addEventListener;

    // @property edge: Boolean; `true` for the Edge web browser.
    BrowserUtil.edge = 'msLaunchUri' in navigator && !('documentMode' in document);

    // @property webkit: Boolean;
    // `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
    BrowserUtil.webkit = userAgentContains('webkit');

    // @property android: Boolean
    // **Deprecated.** `true` for any browser running on an Android platform.
    BrowserUtil.android = userAgentContains('android');

    // @property android23: Boolean; **Deprecated.** `true` for browsers running on Android 2 or Android 3.
    BrowserUtil.android23 = userAgentContains('android 2') || userAgentContains('android 3');

    /* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */
    BrowserUtil.webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
    // @property androidStock: Boolean; **Deprecated.** `true` for the Android stock browser (i.e. not Chrome)
    BrowserUtil.androidStock = BrowserUtil.android && userAgentContains('Google') && BrowserUtil.webkitVer < 537 && !('AudioNode' in window);

    // @property opera: Boolean; `true` for the Opera browser
    BrowserUtil.opera = !!window.opera;

    // @property chrome: Boolean; `true` for the Chrome browser.
    BrowserUtil.chrome = !BrowserUtil.edge && userAgentContains('chrome');

    // @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
    BrowserUtil.gecko = userAgentContains('gecko') && !BrowserUtil.webkit && !BrowserUtil.opera && !BrowserUtil.ie;

    // @property safari: Boolean; `true` for the Safari browser.
    BrowserUtil.safari = !BrowserUtil.chrome && userAgentContains('safari');

    BrowserUtil.phantom = userAgentContains('phantom');

    // @property opera12: Boolean
    // `true` for the Opera browser supporting CSS transforms (version 12 or later).
    BrowserUtil.opera12 = 'OTransition' in BrowserUtil.style;

    // @property win: Boolean; `true` when the browser is running in a Windows platform
    BrowserUtil.win = navigator.platform.indexOf('Win') === 0;

    // @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
    BrowserUtil.ie3d = BrowserUtil.ie && ('transition' in BrowserUtil.style);

    // @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
    BrowserUtil.webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !BrowserUtil.android23;

    // @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
    BrowserUtil.gecko3d = 'MozPerspective' in BrowserUtil.style;

    // @property any3d: Boolean
    // `true` for all browsers supporting CSS transforms.
    BrowserUtil.any3d = !window.L_DISABLE_3D && (BrowserUtil.ie3d || BrowserUtil.webkit3d || BrowserUtil.gecko3d) && !BrowserUtil.opera12 && !BrowserUtil.phantom;

    // @property mobile: Boolean; `true` for all browsers running in a mobile device.
    BrowserUtil.mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

    // @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.
    BrowserUtil.mobileWebkit = BrowserUtil.mobile && BrowserUtil.webkit;

    // @property mobileWebkit3d: Boolean
    // `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
    BrowserUtil.mobileWebkit3d = BrowserUtil.mobile && BrowserUtil.webkit3d;

    // @property msPointer: Boolean
    // `true` for browsers implementing the Microsoft touch events model (notably IE10).
    BrowserUtil.msPointer = !window.PointerEvent && window.MSPointerEvent;

    // @property pointer: Boolean
    // `true` for all browsers supporting [pointer events]
    // (https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
    BrowserUtil.pointer = !!(window.PointerEvent || BrowserUtil.msPointer);

    // @property touchNative: Boolean
    // `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
    // **This does not necessarily mean** that the browser is running in a computer with
    // a touchscreen, it only means that the browser is capable of understanding
    // touch events.
    BrowserUtil.touchNative = 'ontouchstart' in window || !!window.TouchEvent;

    // @property touch: Boolean
    // `true` for all browsers supporting either [touch](#browser-touch) or [pointer](#browser-pointer) events.
    // Note: pointer events will be preferred (if available), and processed for all `touch*` listeners.
    BrowserUtil.touch = !window.L_NO_TOUCH && (BrowserUtil.touchNative || BrowserUtil.pointer);

    // @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
    BrowserUtil.mobileOpera = BrowserUtil.mobile && BrowserUtil.opera;

    // @property mobileGecko: Boolean
    // `true` for gecko-based browsers running in a mobile device.
    BrowserUtil.mobileGecko = BrowserUtil.mobile && BrowserUtil.gecko;

    // @property retina: Boolean
    // `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
    BrowserUtil.retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

    // @property passiveEvents: Boolean
    // `true` for browsers that support passive events.
    BrowserUtil.passiveEvents = (function () {
        let supportsPassiveOption = false;
        try {
            let opts = Object.defineProperty({}, 'passive', {
                get: function () { // eslint-disable-line getter-return
                    supportsPassiveOption = true;
                }
            });
            window.addEventListener('testPassiveEventSupport', falseFn, opts);
            window.removeEventListener('testPassiveEventSupport', falseFn, opts);
        } catch (e) {
            // Errors can safely be ignored since this is only a browser support test.
        }
        return supportsPassiveOption;
    }());

    // @property mac: Boolean; `true` when the browser is running in a Mac platform
    BrowserUtil.mac = navigator.platform.indexOf('Mac') === 0;

    // @property mac: Boolean; `true` when the browser is running in a Linux platform
    BrowserUtil.linux = navigator.platform.indexOf('Linux') === 0;

    function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
    }
}());

/**
 * 绘制调试信息，例如水印层、网格层
 */

/**
 * 背景工具类
 * @class
 */
const BgUtil = {};

(function () {

    /**
     * 按间隔生成网格
     * @param {Object} options {width, height, interval, color}
     */
    BgUtil.generateGrid = function (options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval || 10;
        let style = Object.assign(options.style || {}, { "color": options.color || "#FFCCCC", "lineWidth": options.lineWidth || 0.5 });

        for (let i = 0; i <= width; i += interval) {
            if (i % 100 == 0) {
                bgData.push(new Polyline({ "coords": [[i, 0], [i, height]], "style": Object.assign({}, style, { "lineWidth": 2 * style.lineWidth }) }));
            } else {
                bgData.push(new Polyline({ "coords": [[i, 0], [i, height]], style }));
            }
        }
        for (let j = 0; j <= height; j += interval) {
            if (j % 100 == 0) {
                bgData.push(new Polyline({ "coords": [[0, j], [width, j]], "style": Object.assign({}, style, { "lineWidth": 2 * style.lineWidth }) }));
            } else {
                bgData.push(new Polyline({ "coords": [[0, j], [width, j]], style }));
            }
        }

        // 绘制坐标值
        if (options.coord) {
            style = { "fillStyle": 1, "color": "none" };
            for (let x = 0; x <= width; x += 100) {
                for (let y = 0; y <= height; y += 100) {
                    if (x % 200 == 0 && y % 200 == 0) {
                        style.fillColor = "red";
                        style.font = "16px Arial, sans-serif";
                    } else {
                        style.fillColor = "blue";
                        style.font = "14px Arial, sans-serif";
                    }
                    bgData.push(new Text({ "x": x, "y": y + 10, "text": "(" + x + "," + y + ")", style }));
                    bgData.push(new Circle({ "x": x, "y": y, "radius": 4, style }));
                }
            }
        }

        // 绘制logo
        if (options.logo || true) {
            bgData.push(new Text({
                "x": width - 10, "y": 6, "text": "图形开发学院",
                "style": { "textBaseline": "top", "textAlign": "right", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
            bgData.push(new Text({
                "x": 10, "y": height - 6, "text": "www.graphAnywhere.com",
                "style": { "textBaseline": "bottom", "textAlign": "left", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
        }

        // 是否建立独立的网格层
        if (options.graph instanceof Graph) {
            let layer = new Layer({
                source: new VectorSource({ "data": bgData }),
                zIndex: WATER_LAYER_ZINDEX + 1,
                name: "网格层",
                type: "aux",
                usePixelCoord: true
            });
            options.graph.addLayer(layer);
            return layer;
        } else {
            return bgData;
        }
    };

    /**
     * 生成刻度尺
     * @param {Object} options {width, height, interval, style, size, coord, color}
     */
    BgUtil.generateScaleline = function (options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval == null ? 10 : options.interval;
        let style = Object.assign({ "color": options.color || "#b0250f", "fontSize": "12px", "lineWidth": 0.5 }, options.style);
        let size = options.size == null ? 10 : options.size;

        // 网格点
        if (options.coord != false) {
            for (let j = 2 * interval; j < height; j += interval) {
                for (let i = 2 * interval; i < width; i += interval) {
                    if (i % 100 === 0 && j % 100 === 0) {
                        bgData.push(new Point({ "x": i, "y": j, "size": 2, "style": Object.assign({}, style, { "color": "blue", "fillColor": "blue" }) }));
                    } else {
                        bgData.push(new Point({ "x": i, "y": j, "size": 1, style }));
                    }
                }
            }
        }

        // X轴(水平)
        for (let i = 1 * interval; i < width; i += interval) {
            let len, addStyle;
            if (i % 100 === 0) {
                addStyle = { "lineWidth": 2 };
                len = size * 1.5;
                bgData.push(new Text({ "x": i, "y": (len + 2), "text": i, "style": Object.assign({ "textAlign": "center" }, style) }));
            } else {
                len = size;
            }
            bgData.push(new Polyline({ "coords": [[i, 0], [i, len]], "style": Object.assign({}, style, addStyle) }));
        }

        // Y轴(垂直)
        for (let j = 1 * interval; j < height; j += interval) {
            let len, addStyle;
            if (j % 100 === 0) {
                addStyle = { "lineWidth": 2 };
                len = size * 1.5;
                bgData.push(new Text({ "x": (len + 2), "y": j, "text": j, "style": Object.assign({ "textBaseline": "middle" }, style) }));
            } else {
                len = size;
            }
            bgData.push(new Polyline({ "coords": [[0, j], [len, j]], "style": Object.assign({}, style, addStyle) }));
        }

        // 绘制logo
        if (options.logo || true) {
            bgData.push(new Text({
                "x": width - 10, "y": height - 6, "text": "图形开发学院",
                "style": { "textBaseline": "bottom", "textAlign": "right", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
            bgData.push(new Text({
                "x": 10, "y": height - 6, "text": "www.graphAnywhere.com",
                "style": { "textBaseline": "bottom", "textAlign": "left", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
        }

        // 建立图层
        if (options.graph instanceof Graph) {
            let layer = new Layer({
                source: new VectorSource({ "data": bgData }),
                zIndex: WATER_LAYER_ZINDEX + 2,
                name: "刻度层",
                type: "aux",
                usePixelCoord: true
            });
            options.graph.addLayer(layer);
            return layer;
        } else {
            return bgData;
        }
    };

    /**
     * 生成水印图层
     * @param {Object} options 选项{text, rotation, style} 
     * @returns {Layer} layer
     */
    BgUtil.generateWaterMarkLayer = function (options = {}) {
        let bgData = __generateTextData({
            "text": options.text == null ? "ADAM" : options.text,
            "rotation": options.rotation || -30,
            "vectorSize": false,
            "style": options.style == null ? {} : options.style
        });

        let layer = new Layer({
            source: new VectorSource({ "data": bgData }),
            zIndex: WATER_LAYER_ZINDEX,
            name: "水印层",
            type: "aux",
            style: { "color": "rgb(220, 220, 220)", "fillColor": "rgb(220, 220, 220)", "fontSize": 30, "fontName": "宋体", "textAlign": "center" },
            usePixelCoord: true,
            visible: true
        });

        return layer;
    };

    /**
     * 按间隔生成文字
     * @param {Object} options {width, height, interval, text, rotation, color, fontSize, style}
     */
    function __generateTextData(options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval == null ? 300 : options.interval;
        let style = options.style;
        let text = options.text == null ? "ADAM" : options.text;
        let rotation = options.rotation || 0;
        let vectorSize = options.vectorSize == null ? false : options.vectorSize === true;
        for (let i = 0; i < width; i += interval) {
            for (let j = 0; j < height; j += interval) {
                bgData.push(new Text({ "x": i, "y": j, "text": text, "vectorSize": vectorSize, "style": style, "rotation": rotation }));
            }
        }
        return bgData;
    }

})();

/**
 * @class
 * Credits: TweenEasing Equations by Robert Penner, <http://www.robertpenner.com/easing/>
 */
const TweenEasing = {};

/**
 * Linear缓动
 */
TweenEasing.Linear = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return c * t / d + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return c * t / d + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        return c * t / d + b;
    }
};

/**
 * Expo 缓动
 */
TweenEasing.Expo = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
};

/**
 * Quad 缓动
 */
TweenEasing.Quad = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return c * (t /= d) * t + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
};

/**
 * Tween class
 */
class Tween {

    constructor(easing) {
        /**
         * APIProperty: easing
         * {<TweenEasing>(Function)} TweenEasing equation used for the animation Defaultly set to TweenEasing.Expo.easeOut
         */
        this.easing = this.easing = (easing) ? easing : TweenEasing.Expo.easeOut;

        /**
         * APIProperty = begin
         * {Object} Values to start the animation with
         */
        this.begin = null;

        /**
         * APIProperty = finish
         * {Object} Values to finish the animation with
         */
        this.finish = null;

        /**
         * APIProperty = duration
         * {int} duration of the tween (number of steps)
         */
        this.duration = null;

        /**
         * APIProperty = callbacks
         * {Object} An object with start, eachStep and done properties whose values
         *     are functions to be call during the animation. They are passed the
         *     current computed value as argument.
         */
        this.callbacks = null;

        /**
         * Property = time
         * {int} Step counter
         */
        this.time = null;

        /**
         * APIProperty = minFrameRate
         * {Number} The minimum framerate for animations in frames per second. After
         * each step, the time spent in the animation is compared to the calculated
         * time at this frame rate. If the animation runs longer than the calculated
         * time, the next step is skipped. Default is 30.
         */
        this.minFrameRate = null;

        /**
         * Property = startTime
         * {Number} The timestamp of the first execution step. Used for skipping
         * frames
         */
        this.startTime = null;

        /**
         * Property = animationId
         * {int} Loop id returned by Animation.start
         */
        this.animationId = null;

        /**
         * Property = playing
         * {Boolean} Tells if the easing is currently playing
         */
        this.playing = false;
    }

    /**
     * APIMethod: start
     * Plays the Tween, and calls the callback method on each step
     * 
     * Parameters:
     * begin - {Object} values to start the animation with
     * finish - {Object} values to finish the animation with
     * duration - {int} duration of the tween (number of steps)
     * options - {Object} hash of options (callbacks (start, eachStep, done), minFrameRate)
     */
    start(begin, finish, duration, options) {
        this.playing = true;
        this.begin = begin;
        this.finish = finish;
        this.duration = duration;
        this.callbacks = options.callbacks;
        this.minFrameRate = options.minFrameRate || 30;
        this.time = 0;
        this.startTime = new Date().getTime();
        Animation.stop(this.animationId);
        this.animationId = null;

        if (this.callbacks && this.callbacks.start) {
            this.callbacks.start(this, this.begin);
        }
        let that = this;
        this.animationId = Animation.start(function () {
            that.play();
        });
    }

    /**
     * APIMethod: stop
     * Stops the Tween, and calls the done callback
     *     Doesn't do anything if animation is already finished
     */
    stop() {
        if (!this.playing) {
            return;
        }

        if (this.callbacks && this.callbacks.done) {
            this.callbacks.done(this.finish);
        }
        Animation.stop(this.animationId);
        this.animationId = null;
        this.playing = false;
    }

    /**
     * Method: play
     * Calls the appropriate easing method
     */
    play() {
        var value = {};
        for (var i in this.begin) {
            var b = this.begin[i];
            var f = this.finish[i];
            if (b == null || f == null || isNaN(b) || isNaN(f)) {
                throw new TypeError('invalid value for Tween');
            }

            var c = f - b;
            value[i] = this.easing(this.time, b, c, this.duration);
        }
        this.time++;

        if (this.callbacks && this.callbacks.eachStep) {
            // skip frames if frame rate drops below threshold
            if ((new Date().getTime() - this.startTime) / this.time <= 1000 / this.minFrameRate) {
                this.callbacks.eachStep(value);
            }
        }

        if (this.time > this.duration) {
            this.stop();
        }
    }
}

// let panMethod = TweenEasing.Expo.easeOut;

// let panTween = new Tween(panMethod);

// panTween.start({ x: 0, y: 0 }, vector, 500, {
//     callbacks: function (px) {
//         console.info(px);
//     },
//     done: function (px) {
//         console.info(px);
//     }
// });

/**
 * 符号文件名路径
 */
const CIMG_SYMBOL_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/cimg-symbol.json";

/**
 * G符号
 */
class CimgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
        this.symbolCollection_ = {};

        this.format = new CimgFormat();
    }

    /**
     * 装载SVG数据
     * @param {String} fileUrl 
     */
    loadFile(callback, fileUrl = CIMG_SYMBOL_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: "json",
            async: true,
            success: function (symbolNodes) {
                that.loadData(symbolNodes);
                // 执行回调
                if (typeof (callback) === "function") {
                    callback();
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    loadData(data) {
        // 逐个符号分析其属性和shape
        for (let i = 0, ii = data.length; i < ii; i++) {
            let symbol = this.analyzeSymbol(data[i]);
            if (symbol != null) {
                this.symbolCollection_[symbol.id] = symbol;
            }
        }    }

    /**
     * 分析符号数据
     * @param {XmlElement} node 
     */
    analyzeSymbol(symbol) {
        // 外框sharp
        let width = symbol.width;
        let height = symbol.height;
        let name = symbol.name;
        let id = symbol.fileName;
        let stateCount = symbol.stateCount;

        // 中心点坐标位置为已宽高的一半为准，而不是符号中的alignCenter属性
        let alignCenter = ((width / 2 + "," + height / 2) );

        let layers = [];
        for (let x = 0, xx = symbol.layers.length; x < xx; x++) {
            let data = [];
            for (let i = 0, ii = symbol.layers[x].length; i < ii; i++) {
                let geomObj = this._analyzeSymbolShape(symbol.layers[x][i], symbol);
                if (geomObj != null) {
                    data.push(geomObj);
                }
            }
            layers.push(data);
        }
        let bbox = [0, 0, width, height];
        return { id, name, width, height, stateCount, alignCenter, bbox, layers };
    }

    _analyzeSymbolShape(obj, symbol) {
        let geoObj;
        let color = (obj.color == null || obj.color == "null" ? null : "rgb(" + obj.color + ")");
        let fillColor = (obj.fillColor == null || obj.fillColor == "none" ? "none" : "rgb(" + obj.fillColor + ")");
        let fillStyle = (fillColor == "none" ? 0 : 1);
        let style = { color, fillColor, fillStyle, "lineWidth": 1 };
        let properties = { "state": obj.state, "type": obj.type };

        if (obj.type == "pin") {  // 锚点
            {
                let coord = this.format.str2Round(obj.coord);
                // 特殊显示锚点颜色
                geoObj = new Point({
                    "x": coord[0],
                    "y": coord[1],
                    "size": coord[2],
                    "style": Object.assign({}, style, { "fillStyle": 1, "fillColor": "#00FFFF", "color": "#00FF00" }),
                    properties
                });
            }
        } else if (obj.type == "line" || obj.type == "polyline") {
            let coords = this.format.str2Line(obj.coord);
            let startArrowType = obj.startArrowType;
            let startArrowSize = obj.startArrowSize;
            let endArrowType = obj.endArrowType;
            let endArrowSize = obj.endArrowSize;
            let lineStyle = Object.assign({}, style, { "fillColor": "none", startArrowType, startArrowSize, endArrowType, endArrowSize });
            geoObj = new Polyline({
                coords,
                "style": lineStyle,
                properties
            });
        } else if (obj.type == "polygon") {
            let coords = this.format.str2Line(obj.coord);
            geoObj = new Polygon({
                coords,
                "style": Object.assign({}, style, { "fillColor": "none" }),
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "triangle") { // 三角形
            let coords = this.format.str2Rect(obj.coord);
            geoObj = new Triangle({
                coords,
                style,
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "rect") {
            let coords = this.format.str2Rect(obj.coord);
            geoObj = new Rect({
                "x": coords[0][0],
                "y": coords[0][1],
                "width" : coords[1][0] - coords[0][0],
                "height" : coords[1][1] - coords[0][1],
                "rotation": obj.rotate,
                "style": Object.assign({}, style, { "fillColor": "none" }),
                properties
            });
        } else if (obj.type == "circle" || obj.type == "circlearc") {
            let coords = this.format.str2Round(obj.coord);
            geoObj = new Circle({
                "x": coords[0],
                "y": coords[1],
                "radius": coords[2],
                style,
                properties
            });
        } else if (obj.type == "ellipse") {
            let coords = this.format.str2Ellipse(obj.coord);
            geoObj = new Ellipse({
                "x": coords[0],
                "y": coords[1],
                "radiusX": coords[2],
                "radiusY": coords[3],
                style,
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "Text") {
            //example: {"type":"Text", "coord":"15.68,14.88,20,15" ,"color":"0,0,255", "fillColor":"0,255,0", "text":"KG"},
            let coord = this.format.str2Line(obj.coord);
            let textObj = new Text({
                "text": obj.text,
                "x": coord[0][0],
                "y": coord[0][1],
                "rotation": obj.rotate,
                "width": Math.abs(coord[1][0] - coord[0][0]),
                "height": Math.abs(coord[1][1] - coord[0][1]),
                "vectorSize": false,
                "style": Object.assign(style, { "fillPrior": true, "fontName":"黑体", "textBaseline":"top" }),
                "properties": properties
            });
            geoObj = textObj;
        } else {
            console.debug("未支持的几何类型: " + obj.type, symbol.id, symbol.fileName);
        }

        return geoObj;
    }
}

/**
 * 计算某个点的对称点坐标
 * @param {PointCoord} centerPoint 
 * @param {PointCoord} point 
 * @returns Array
 */
function getSymmetricPointRelative(point, centerPoint) {
    var a = centerPoint[0];
    var b = centerPoint[1];
    var x = point[0];
    var y = point[1];
    var nx = 2 * a - x;
    var ny = 2 * b - y;
    return [nx, ny];
}

/**
 * 将一段SVG椭圆曲线参数转换为canvas所能支持的椭圆曲线参数
 * @param {Number} x1 起点x坐标
 * @param {Number} y1 起点y坐标
 * @param {Number} rx 椭圆半径1
 * @param {Number} ry 椭圆半径2
 * @param {Number} phi 表示椭圆相对于 x 轴的旋转角度
 * @param {int} fA 允许选择一个大弧线（1）或一个小弧线（0）
 * @param {int} fS 允许选择一条顺时针旋转的弧线（1）或一条逆时针旋转的弧线（0）
 * @param {Number} x2 终点x坐标
 * @param {Number} y2 终点y坐标
 * @returns {Object} 椭圆曲线
 * @class
 * result: {
 *     cx: 49.99999938964844,
 *     cy: 49.99999938964844,
 *     startAngle: 2.356194477985314,
 *     deltaAngle: -3.141592627780225,
 *     endAngle: 5.497787157384675,
 *     clockwise: false
 * }
 */
let svgArcToCenterParam = (function () {

    // 对于大多数情况，实际上有四个不同的圆弧（两个不同的椭圆，每个椭圆有两个不同圆弧扫掠）满足这些约束。大圆弧标志和扫掠标志指示绘制四个圆弧中的哪一个，如下所示：
    // 1 在四个候选圆弧扫掠中，两个表示大于或等于180度的圆弧扫掠（“大圆弧”），两个代表小于或等于180°的圆弧扫荡（“小圆弧”）。如果大圆弧标志为“1”，则将选择两个较大圆弧扫掠中的一个；否则，如果大圆弧标志为“0”，则将选择较小的圆弧扫掠之一，
    // 2 如果扫描标志为“1”，则弧将沿“正角度”方向绘制（即，椭圆公式x=cx+rx*cos（θ）和y=cy+ry*sin（θ）被评估为使得θ从对应于当前点的角度开始，并正增加，直到弧达到（x，y））。
    //   值为0会导致电弧沿“负角度”方向绘制（即，θ从对应于当前点的角度值开始，然后减小，直到电弧达到（x，y））。
    // 
    // 椭圆弧参数超出范围
    //   所有椭圆弧参数（布尔标志除外）都允许使用任意数值，但用户代理在渲染曲线或计算其几何体时必须对无效值进行以下调整：
    // 1 如果线段的端点（x，y）与当前点（例如，前一个线段的端点）相同，则这相当于完全省略椭圆弧线段。
    // 2 如果rx或ry为0，则此圆弧将被视为连接端点的直线段（“lineto”）。
    // 3 如果rx或ry中的任何一个具有负号，则这些负号被丢弃；而是使用绝对值。
    // 4 如果rx、ry和x轴旋转不存在解（基本上，椭圆不够大，无法从当前点到达新端点），则椭圆将均匀放大，直到刚好有一个解（直到椭圆刚好足够大）。

    return function (x1, y1, rx, ry, phi, fA, fS, x2, y2) {

        var cx, cy, startAngle, deltaAngle, endAngle;
        var PIx2 = Math.PI * 2.0;

        if (rx < 0) {
            rx = -rx;
        }
        if (ry < 0) {
            ry = -ry;
        }
        if (rx == 0.0 || ry == 0.0) { // invalid arguments
            throw Error('rx and ry can not be 0');
        }

        phi *= Math.PI / 180;
        var s_phi = Math.sin(phi);
        var c_phi = Math.cos(phi);
        var hd_x = (x1 - x2) / 2.0; // half diff of x
        var hd_y = (y1 - y2) / 2.0; // half diff of y
        var hs_x = (x1 + x2) / 2.0; // half sum of x
        var hs_y = (y1 + y2) / 2.0; // half sum of y

        // F6.5.1
        var x1_ = c_phi * hd_x + s_phi * hd_y;
        var y1_ = c_phi * hd_y - s_phi * hd_x;

        // F.6.6 Correction of out-of-range radii
        //   Step 3: Ensure radii are large enough
        var lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
        if (lambda > 1) {
            rx = rx * Math.sqrt(lambda);
            ry = ry * Math.sqrt(lambda);
        }

        var rxry = rx * ry;
        var rxy1_ = rx * y1_;
        var ryx1_ = ry * x1_;
        var sum_of_sq = rxy1_ * rxy1_ + ryx1_ * ryx1_; // sum of square
        if (!sum_of_sq) {
            throw Error('start point can not be same as end point');
        }
        var coe = Math.sqrt(Math.abs((rxry * rxry - sum_of_sq) / sum_of_sq));
        if (fA == fS) { coe = -coe; }

        // F6.5.2
        var cx_ = coe * rxy1_ / ry;
        var cy_ = -coe * ryx1_ / rx;

        // F6.5.3
        cx = c_phi * cx_ - s_phi * cy_ + hs_x;
        cy = s_phi * cx_ + c_phi * cy_ + hs_y;

        var xcr1 = (x1_ - cx_) / rx;
        var xcr2 = (x1_ + cx_) / rx;
        var ycr1 = (y1_ - cy_) / ry;
        var ycr2 = (y1_ + cy_) / ry;

        // F6.5.5
        startAngle = __radian(1.0, 0.0, xcr1, ycr1);
        while (startAngle > PIx2) { startAngle -= PIx2; }
        while (startAngle < 0.0) { startAngle += PIx2; }

        // F6.5.6
        deltaAngle = __radian(xcr1, ycr1, -xcr2, -ycr2);
        while (deltaAngle > PIx2) { deltaAngle -= PIx2; }   // add by hjq 2023/8/29
        while (deltaAngle < 0.0) { deltaAngle += PIx2; }    // add by hjq 2023/8/29

        if (fS == false || fS == 0) { deltaAngle -= PIx2; }
        endAngle = startAngle + deltaAngle;
        while (endAngle > PIx2) { endAngle -= PIx2; }
        while (endAngle < 0.0) { endAngle += PIx2; }

        var outputObj = { /* cx, cy, startAngle, deltaAngle */
            cx: cx,
            cy: cy,
            startAngle: startAngle,
            deltaAngle: deltaAngle,
            endAngle: endAngle,
            clockwise: (fS == true || fS == 1)
        };

        return outputObj;
    }

    function __radian(ux, uy, vx, vy) {
        var dot = ux * vx + uy * vy;
        var mod = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
        var rad = Math.acos(dot / mod);
        if (ux * vy - uy * vx < 0.0) {
            rad = -rad;
        }
        return rad;
    }
}());

/**
 * Converts arc to a bunch of bezier curves
 * @param {Number} fx starting point x
 * @param {Number} fy starting point y
 * @param {Array} coords Arc command
 */
let fromArcToBeziers = (function () {
    return function (fx, fy, coords) {
        var rx = coords[1],
            ry = coords[2],
            rot = coords[3],
            large = coords[4],
            sweep = coords[5],
            tx = coords[6],
            ty = coords[7],
            segsNorm = arcToSegments(tx - fx, ty - fy, rx, ry, large, sweep, rot);

        for (var i = 0, len = segsNorm.length; i < len; i++) {
            segsNorm[i][1] += fx;
            segsNorm[i][2] += fy;
            segsNorm[i][3] += fx;
            segsNorm[i][4] += fy;
            segsNorm[i][5] += fx;
            segsNorm[i][6] += fy;
        }
        return segsNorm;
    };

    /* Adapted from http://dxr.mozilla.org/mozilla-central/source/content/svg/content/src/nsSVGPathDataParser.cpp
        * by Andrea Bogazzi code is under MPL. if you don't have a copy of the license you can take it here
        * http://mozilla.org/MPL/2.0/
        */
    function arcToSegments(toX, toY, rx, ry, large, sweep, rotateX) {
        var PI = Math.PI, th = rotateX * PI / 180,
            sinTh = Math.sin(th),
            cosTh = Math.cos(th),
            fromX = 0, fromY = 0;

        rx = Math.abs(rx);
        ry = Math.abs(ry);

        var px = -cosTh * toX * 0.5 - sinTh * toY * 0.5,
            py = -cosTh * toY * 0.5 + sinTh * toX * 0.5,
            rx2 = rx * rx, ry2 = ry * ry, py2 = py * py, px2 = px * px,
            pl = rx2 * ry2 - rx2 * py2 - ry2 * px2,
            root = 0;

        if (pl < 0) {
            var s = Math.sqrt(1 - pl / (rx2 * ry2));
            rx *= s;
            ry *= s;
        } else {
            root = (large === sweep ? -1.0 : 1.0) * Math.sqrt(pl / (rx2 * py2 + ry2 * px2));
        }

        var cx = root * rx * py / ry,
            cy = -root * ry * px / rx,
            cx1 = cosTh * cx - sinTh * cy + toX * 0.5,
            cy1 = sinTh * cx + cosTh * cy + toY * 0.5,
            mTheta = calcVectorAngle(1, 0, (px - cx) / rx, (py - cy) / ry),
            dtheta = calcVectorAngle((px - cx) / rx, (py - cy) / ry, (-px - cx) / rx, (-py - cy) / ry);

        if (sweep === 0 && dtheta > 0) {
            dtheta -= 2 * PI;
        } else if (sweep === 1 && dtheta < 0) {
            dtheta += 2 * PI;
        }

        // Convert into cubic bezier segments <= 90deg
        var segments = Math.ceil(Math.abs(dtheta / PI * 2)),
            result = [], mDelta = dtheta / segments,
            mT = 8 / 3 * Math.sin(mDelta / 4) * Math.sin(mDelta / 4) / Math.sin(mDelta / 2),
            th3 = mTheta + mDelta;

        for (var i = 0; i < segments; i++) {
            result[i] = segmentToBezier(mTheta, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY);
            fromX = result[i][5];
            fromY = result[i][6];
            mTheta = th3;
            th3 += mDelta;
        }
        return result;
    }

    function segmentToBezier(th2, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY) {
        var costh2 = Math.cos(th2),
            sinth2 = Math.sin(th2),
            costh3 = Math.cos(th3),
            sinth3 = Math.sin(th3),
            toX = cosTh * rx * costh3 - sinTh * ry * sinth3 + cx1,
            toY = sinTh * rx * costh3 + cosTh * ry * sinth3 + cy1,
            cp1X = fromX + mT * (-cosTh * rx * sinth2 - sinTh * ry * costh2),
            cp1Y = fromY + mT * (-sinTh * rx * sinth2 + cosTh * ry * costh2),
            cp2X = toX + mT * (cosTh * rx * sinth3 + sinTh * ry * costh3),
            cp2Y = toY + mT * (sinTh * rx * sinth3 - cosTh * ry * costh3);

        return ['C',
            cp1X, cp1Y,
            cp2X, cp2Y,
            toX, toY
        ];
    }

    /*
    * Private
    */
    function calcVectorAngle(ux, uy, vx, vy) {
        var ta = Math.atan2(uy, ux),
            tb = Math.atan2(vy, vx);
        if (tb >= ta) {
            return tb - ta;
        }
        else {
            return 2 * Math.PI - (ta - tb);
        }
    }

}());

/**
 * SVG路径分析
 */
class SvgPath {
    /**
     * 构造函数
     */
    constructor() {
    }

    /**
     * 分析Path节点中的d属性
     * @param {String} pathString 
     * @returns Object
     */
    static parse(pathString) {
        // M = moveto                           : m 10 10
        // L = lineto                           : l 100 20
        // H = horizontal lineto                : h 20
        // V = vertical lineto                  : v 20
        // C = curveto                          : c (x1,y1,x2,y2,x,y)+
        // S = smooth curveto                   : s (x2,y2,x,y)+
        // Q = quadratic Bézier curve           : q (x1,y1,x,y)+
        // T = smooth quadratic Bézier curveto  : t (x,y)+
        // A = elliptical Arc                   : a (rx ry angle large-arc-flag sweep-flag x y)+
        // Z = closepath                        : z

        //let commandList = pathParse(pathString);
        //let commandList = fabricPathParse(pathString);
        let commandList = svgPathParse(pathString);
        let coords = [];
        let commands = [];
        let childGeometrys = [];
        let lastPoint = [0, 0];
        let c_lastControlPoint = [0, 0];   // 三次贝塞尔曲线控制点
        let q_lastControlPoint = [0, 0];   // 二次贝塞尔曲线控制点
        for (let j = 0, jj = commandList.length; j < jj; j += 1) {
            let partArr = commandList[j];
            let cmd = partArr[0];
            let tc = [];

            switch (cmd) {
                case "M":
                case "L":
                    for (let m = 1; m < partArr.length; m += 2) {
                        tc.push([partArr[m], partArr[m + 1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "m":
                case "l":
                    for (let m = 1; m < partArr.length; m += 2) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "H":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([partArr[m], lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "h":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([partArr[m] + lastPoint[0], lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "V":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([lastPoint[0], partArr[m]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "v":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([lastPoint[0], partArr[m] + lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                //-------------------------------------------------------------------------------------------------

                case "C":    // 三次贝塞尔曲线，绝对位置， (x1,y1,x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 6) {
                        tc.push([partArr[m], partArr[m + 1]]);        // 控制点1
                        tc.push([partArr[m + 2], partArr[m + 3]]);    // 控制点2
                        tc.push([partArr[m + 4], partArr[m + 5]]);    // 终止点
                        c_lastControlPoint = [partArr[m + 2], partArr[m + 3]];
                        lastPoint = [partArr[m + 4], partArr[m + 5]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "c":    // 三次贝塞尔曲线，相对位置， (x1,y1,x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 6) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);        // 控制点1
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);    // 控制点2
                        tc.push([lastPoint[0] + partArr[m + 4], lastPoint[1] + partArr[m + 5]]);    // 终止点
                        c_lastControlPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]];
                        lastPoint = [lastPoint[0] + partArr[m + 4], lastPoint[1] + partArr[m + 5]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "S":    // 三次贝塞尔曲线，绝对位置， (x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        if (c_lastControlPoint[0] == 0 && c_lastControlPoint[1] == 0) {
                            c_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            c_lastControlPoint = getSymmetricPointRelative(c_lastControlPoint, lastPoint);        // 控制点1
                            tc.push(c_lastControlPoint);
                        }
                        tc.push([partArr[m], partArr[m + 1]]);                                // 控制点2
                        tc.push([partArr[m + 2], partArr[m + 3]]);                            // 终止点
                        c_lastControlPoint = [partArr[m], partArr[m + 1]];
                        lastPoint = [partArr[m + 2], partArr[m + 3]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "s":    // 三次贝塞尔曲线，绝对位置， (x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        if (c_lastControlPoint[0] == 0 && c_lastControlPoint[1] == 0) {
                            c_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            c_lastControlPoint = getSymmetricPointRelative(c_lastControlPoint, lastPoint);              // 控制点1 
                            tc.push(c_lastControlPoint);
                        }
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);       // 控制点2
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);   // 终止点
                        c_lastControlPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]];
                        lastPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                //-------------------------------------------------------------------------------------------------

                case "Q":   // 二次贝塞尔曲线，绝对位置， (x1,y1,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        tc.push([partArr[m], partArr[m + 1]]);      // 控制点
                        tc.push([partArr[m + 2], partArr[m + 3]]);    // 终止点
                        q_lastControlPoint = [partArr[m], partArr[m + 1]];
                        lastPoint = [partArr[m + 2], partArr[m + 3]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "q":   // 二次贝塞尔曲线，相对位置  (dx1,dy1,dx,dy)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);         // 控制点
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);         // 终止点
                        q_lastControlPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]];
                        lastPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "T": // 二次贝塞尔曲线，绝对位置   (x,y)+
                    for (let m = 1; m < partArr.length; m += 2) {
                        if (q_lastControlPoint[0] == 0 && q_lastControlPoint[1] == 0) {
                            q_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            q_lastControlPoint = getSymmetricPointRelative(q_lastControlPoint, lastPoint);
                            tc.push(q_lastControlPoint);
                        }
                        tc.push([partArr[m], partArr[m + 1]]);
                        lastPoint = [partArr[m], partArr[m + 1]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "t":// 二次贝塞尔曲线，相对位置   (dx,dy)+
                    for (let m = 1; m < partArr.length; m += 2) {
                        if (q_lastControlPoint[0] == 0 && q_lastControlPoint[1] == 0) {
                            q_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            q_lastControlPoint = getSymmetricPointRelative(q_lastControlPoint, lastPoint);
                            tc.push(q_lastControlPoint);
                        }
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);
                        lastPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;

                //-------------------------------------------------------------------------------------------------
                case "a": // 椭圆曲线， 相对位置   (rx ry angle large-arc-flag sweep-flag dx dy)+

                    if (this.drawEllipseArcStyle === 1) {
                        // 通过换算为贝塞尔曲线，绘制椭圆弧
                        for (let m = 1; m < partArr.length; m += 7) {
                            let cArray = fromArcToBeziers(lastPoint[0], lastPoint[1], ["A", partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]]);
                            for (let i = 0; i < cArray.length; i++) {
                                coords.push([[cArray[i][1], cArray[i][2]], [cArray[i][3], cArray[i][4]], [cArray[i][5], cArray[i][6]]]);
                                commands.push("C");
                            }
                            lastPoint = [lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]];
                        }
                        continue;
                    } else {
                        // 通过计算椭圆的中心点、起始角度、终止角度等参数绘制椭圆弧
                        let tc = [];
                        for (let m = 1; m < partArr.length; m += 7) {
                            // 根据svg椭圆曲线参数计算canvas椭圆参数
                            let args = svgArcToCenterParam(lastPoint[0], lastPoint[1], partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]);

                            // Ellipse 椭圆参数
                            let [x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle] =
                                [args.cx, args.cy, partArr[m], partArr[m + 1], partArr[m + 2], args.startAngle, args.endAngle, !args.clockwise, args.deltaAngle];

                            // 添加至子对象，让Path绘制椭圆曲线
                            startAngle = MathUtil.toDegrees(startAngle);
                            endAngle = MathUtil.toDegrees(endAngle);
                            childGeometrys.push(new Ellipse({ x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle }));
                            
                            tc.push([partArr[m + 5], partArr[m + 6]]);   // 终止点
                            lastPoint = [lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]];
                        }
                        coords.push(tc);
                    }
                    break;
                case "A": // 椭圆曲线， 绝对位置   (rx ry angle large-arc-flag sweep-flag x y)+
                    if (this.drawEllipseArcStyle === 1) {
                        // 通过换算为贝塞尔曲线，绘制椭圆弧
                        for (let m = 1; m < partArr.length; m += 7) {
                            let cArray = fromArcToBeziers(lastPoint[0], lastPoint[1], ["A", partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], partArr[m + 5], partArr[m + 6]]);
                            for (let i = 0; i < cArray.length; i++) {
                                coords.push([[cArray[i][1], cArray[i][2]], [cArray[i][3], cArray[i][4]], [cArray[i][5], cArray[i][6]]]);
                                commands.push("C");
                            }
                            lastPoint = [partArr[m + 5], partArr[m + 6]];
                        }
                        continue;
                    } else {
                        // 通过计算椭圆的中心点、起始角度、终止角度等参数绘制椭圆弧
                        let tc = [];
                        for (let m = 1; m < partArr.length; m += 7) {
                            // 根据svg椭圆曲线参数计算canvas椭圆参数
                            let args = svgArcToCenterParam(lastPoint[0], lastPoint[1], partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], partArr[m + 5], partArr[m + 6]);

                            // Ellipse 椭圆参数
                            let [x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle] =
                            [args.cx, args.cy, partArr[m], partArr[m + 1], partArr[m + 2], args.startAngle, args.endAngle, !args.clockwise, args.deltaAngle];

                            // 添加至子对象，让Path绘制椭圆曲线
                            startAngle = MathUtil.toDegrees(startAngle);
                            endAngle = MathUtil.toDegrees(endAngle);
                            childGeometrys.push(new Ellipse({ x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle }));
                            
                            tc.push([partArr[m + 5], partArr[m + 6]]);   // 终止点
                            lastPoint = [partArr[m + 5], partArr[m + 6]];
                        }
                        coords.push(tc);
                    }
                    break;
                case "Z":
                case "z":
                    coords.push(coords[0]);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                default:
                    console.info("unsupport path command: %s", cmd);
                    continue;
            }
            commands.push(cmd);
        }

        // console.info({ commands, coords, childGeometrys });
        return { commands, coords, childGeometrys };
    }

}

// 椭圆弧绘制方式：2椭圆，1贝塞尔曲线
SvgPath.drawEllipseArcStyle = 1;


// 路径数据的语法
// SVG路径数据与以下EBNF语法匹配。
// EBNF grammar是指扩展巴科斯-诺尔范式（Extended Backus-Naur Form），它是一种用于描述上下文无关文法（Context-Free Grammar）的扩展形式。
// svg_path::= wsp* moveto? (moveto drawto_command*)?
/*
drawto_command::=
    moveto
    | closepath
    | lineto
    | horizontal_lineto
    | vertical_lineto
    | curveto
    | smooth_curveto
    | quadratic_bezier_curveto
    | smooth_quadratic_bezier_curveto
    | elliptical_arc

moveto::=
    ( "M" | "m" ) wsp* coordinate_pair_sequence

closepath::=
    ("Z" | "z")

lineto::=
    ("L"|"l") wsp* coordinate_pair_sequence

horizontal_lineto::=
    ("H"|"h") wsp* coordinate_sequence

vertical_lineto::=
    ("V"|"v") wsp* coordinate_sequence

curveto::=
    ("C"|"c") wsp* curveto_coordinate_sequence

curveto_coordinate_sequence::=
    coordinate_pair_triplet
    | (coordinate_pair_triplet comma_wsp? curveto_coordinate_sequence)

smooth_curveto::=
    ("S"|"s") wsp* smooth_curveto_coordinate_sequence

smooth_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? smooth_curveto_coordinate_sequence)

quadratic_bezier_curveto::=
    ("Q"|"q") wsp* quadratic_bezier_curveto_coordinate_sequence

quadratic_bezier_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? quadratic_bezier_curveto_coordinate_sequence)

smooth_quadratic_bezier_curveto::=
    ("T"|"t") wsp* coordinate_pair_sequence

elliptical_arc::=
    ( "A" | "a" ) wsp* elliptical_arc_argument_sequence

elliptical_arc_argument_sequence::=
    elliptical_arc_argument
    | (elliptical_arc_argument comma_wsp? elliptical_arc_argument_sequence)

elliptical_arc_argument::=
    number comma_wsp? number comma_wsp? number comma_wsp
    flag comma_wsp? flag comma_wsp? coordinate_pair

coordinate_pair_double::=
    coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_triplet::=
    coordinate_pair comma_wsp? coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_sequence::=
    coordinate_pair | (coordinate_pair comma_wsp? coordinate_pair_sequence)

coordinate_sequence::=
    coordinate | (coordinate comma_wsp? coordinate_sequence)

coordinate_pair::= coordinate comma_wsp? coordinate

coordinate::= sign? number

sign::= "+"|"-"
number ::= ([0-9])+
flag::=("0"|"1")
comma_wsp::=(wsp+ ","? wsp*) | ("," wsp*)
wsp ::= (#x9 | #x20 | #xA | #xC | #xD)
*/


/**
 * SVG Path节点中d属性语法分析(来源SVG.js，目前为止兼容性最强)
 */
let svgPathParse = (function () {

    const isPathLetter = /[MLHVCSQTAZ]/i;
    const segmentParameters = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

    const pathHandlers = {
        M: function (c, p, p0) {
            p.x = p0.x = c[0];
            p.y = p0.y = c[1];

            return ['M', p.x, p.y]
        },
        L: function (c, p) {
            p.x = c[0];
            p.y = c[1];
            return ['L', c[0], c[1]]
        },
        H: function (c, p) {
            p.x = c[0];
            return ['H', c[0]]
        },
        V: function (c, p) {
            p.y = c[0];
            return ['V', c[0]]
        },
        C: function (c, p) {
            p.x = c[4];
            p.y = c[5];
            return ['C', c[0], c[1], c[2], c[3], c[4], c[5]]
        },
        S: function (c, p) {
            p.x = c[2];
            p.y = c[3];
            return ['S', c[0], c[1], c[2], c[3]]
        },
        Q: function (c, p) {
            p.x = c[2];
            p.y = c[3];
            return ['Q', c[0], c[1], c[2], c[3]]
        },
        T: function (c, p) {
            p.x = c[0];
            p.y = c[1];
            return ['T', c[0], c[1]]
        },
        Z: function (c, p, p0) {
            p.x = p0.x;
            p.y = p0.y;
            return ['Z']
        },
        A: function (c, p) {
            p.x = c[5];
            p.y = c[6];
            return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]]
        }
    };

    const mlhvqtcsaz = 'mlhvqtcsaz'.split('');

    for (let i = 0, il = mlhvqtcsaz.length; i < il; ++i) {
        pathHandlers[mlhvqtcsaz[i]] = (function (i) {
            return function (c, p, p0) {
                if (i === 'H') c[0] = c[0] + p.x;
                else if (i === 'V') c[0] = c[0] + p.y;
                else if (i === 'A') {
                    c[5] = c[5] + p.x;
                    c[6] = c[6] + p.y;
                } else {
                    for (let j = 0, jl = c.length; j < jl; ++j) {
                        c[j] = c[j] + (j % 2 ? p.y : p.x);
                    }
                }

                return pathHandlers[i](c, p, p0)
            }
        })(mlhvqtcsaz[i].toUpperCase());
    }

    function makeAbsolut(parser) {
        const command = parser.segment[0];
        return pathHandlers[command](parser.segment.slice(1), parser.p, parser.p0)
    }

    function segmentComplete(parser) {
        return parser.segment.length && parser.segment.length - 1 === segmentParameters[parser.segment[0].toUpperCase()]
    }

    function startNewSegment(parser, token) {
        parser.inNumber && finalizeNumber(parser, false);
        const pathLetter = isPathLetter.test(token);

        if (pathLetter) {
            parser.segment = [token];
        } else {
            const lastCommand = parser.lastCommand;
            const small = lastCommand.toLowerCase();
            const isSmall = lastCommand === small;
            parser.segment = [small === 'm' ? (isSmall ? 'l' : 'L') : lastCommand];
        }

        parser.inSegment = true;
        parser.lastCommand = parser.segment[0];

        return pathLetter
    }

    function finalizeNumber(parser, inNumber) {
        if (!parser.inNumber) throw new Error('Parser Error')
        parser.number && parser.segment.push(parseFloat(parser.number));
        parser.inNumber = inNumber;
        parser.number = '';
        parser.pointSeen = false;
        parser.hasExponent = false;

        if (segmentComplete(parser)) {
            finalizeSegment(parser);
        }
    }

    function finalizeSegment(parser) {
        parser.inSegment = false;
        if (parser.absolute) {
            parser.segment = makeAbsolut(parser);
        }
        parser.segments.push(parser.segment);
    }

    function isArcFlag(parser) {
        if (!parser.segment.length) return false
        const isArc = parser.segment[0].toUpperCase() === 'A';
        const length = parser.segment.length;

        return isArc && (length === 4 || length === 5)
    }

    function isExponential(parser) {
        return parser.lastToken.toUpperCase() === 'E'
    }

    class Point {  
        constructor(x, y) {  
            const base = { x: 0, y: 0 };
    
            // ensure source as object
            const source = Array.isArray(x) ? { x: x[0], y: x[1] } : typeof x === 'object' ? { x: x.x, y: x.y } : { x: x, y: y };
    
            // merge source
            this.x = source.x == null ? base.x : source.x;
            this.y = source.y == null ? base.y : source.y;
        }  
    }

    return function (d, toAbsolute = true) {

        let index = 0;
        let token = '';
        const parser = {
            segment: [],
            inNumber: false,
            number: '',
            lastToken: '',
            inSegment: false,
            segments: [],
            pointSeen: false,
            hasExponent: false,
            absolute: toAbsolute,
            p0: new Point(),
            p: new Point()
        };

        while ((parser.lastToken = token, token = d.charAt(index++))) {

            // 判断是否存在多余的空字符 2023/9/11
            let reg = /\s/;
            if (reg.exec(token)) {
                if (!parser.inSegment) {
                    continue;
                }
            }

            if (!parser.inSegment) {
                if (startNewSegment(parser, token)) {
                    continue
                }
            }

            if (token === '.') {
                if (parser.pointSeen || parser.hasExponent) {
                    finalizeNumber(parser, false);
                    --index;
                    continue
                }
                parser.inNumber = true;
                parser.pointSeen = true;
                parser.number += token;
                continue
            }

            if (!isNaN(parseInt(token))) {

                if (parser.number === '0' || isArcFlag(parser)) {
                    parser.inNumber = true;
                    parser.number = token;
                    finalizeNumber(parser, true);
                    continue
                }

                parser.inNumber = true;
                parser.number += token;
                continue
            }

            if (token === ' ' || token === ',') {
                if (parser.inNumber) {
                    finalizeNumber(parser, false);
                }
                continue
            }

            if (token === '-') {
                if (parser.inNumber && !isExponential(parser)) {
                    finalizeNumber(parser, false);
                    --index;
                    continue
                }
                parser.number += token;
                parser.inNumber = true;
                continue
            }

            if (token.toUpperCase() === 'E') {
                parser.number += token;
                parser.hasExponent = true;
                continue
            }

            if (isPathLetter.test(token)) {
                if (parser.inNumber) {
                    finalizeNumber(parser, false);
                } else if (!segmentComplete(parser)) {
                    throw new Error('parser Error')
                } else {
                    finalizeSegment(parser);
                }
                --index;
            }
        }

        if (parser.inNumber) {
            finalizeNumber(parser, false);
        }

        if (parser.inSegment && segmentComplete(parser)) {
            finalizeSegment(parser);
        }

        return parser.segments
    }
}());


//let pathString = "M11.908.183a12.012 12.012 0 00-8.044 3.172c-4.882 4.475-5.166 12.08-.692 16.962.204.244.448.447.692.692a.315.315 0 00.408-.04l.53-.61a.32.32 0 000-.448C.53 15.965.243 9.253 4.23 4.982 8.217.711 14.889.427 19.16 4.414c4.271 3.986 4.555 10.655.568 14.927-.203.203-.365.407-.568.57a.32.32 0 000 .447l.53.611a.37.37 0 00.446.04c4.882-4.516 5.166-12.081.692-16.962a11.98 11.98 0 00-8.92-3.864zm.387 3.518A8.607 8.607 0 006.143 6c-3.458 3.213-3.66 8.623-.447 12.08.122.123.243.285.406.407a.319.319 0 00.447 0l.53-.61a.32.32 0 000-.446A7.263 7.263 0 014.8 12.183c0-3.946 3.212-7.16 7.158-7.16s7.16 3.253 7.16 7.199a7.207 7.207 0 01-2.238 5.209.319.319 0 000 .447l.529.61c.122.121.325.162.447.04a8.599 8.599 0 00.408-12.122 8.494 8.494 0 00-5.97-2.705zm-.266 3.316A5.198 5.198 0 008.34 8.48c-2.075 1.993-2.115 5.247-.122 7.322l.121.123a.319.319 0 00.447 0l.53-.611a.32.32 0 000-.448 3.814 3.814 0 01-1.098-2.683 3.732 3.732 0 013.742-3.742 3.732 3.732 0 013.742 3.742c0 1.017-.406 1.951-1.139 2.683a.32.32 0 000 .448l.53.61a.32.32 0 00.447 0c2.034-1.992 2.116-5.246.123-7.321a5.128 5.128 0 00-3.633-1.586zm.006 7.744a.599.599 0 00-.402.146l-.04.041-7.159 8.055a.506.506 0 00.041.69.437.437 0 00.283.124h14.36a.495.495 0 00.489-.488.463.463 0 00-.121-.326l-7.08-8.055a.5.5 0 00-.37-.187z";
//let pathString = "A8.607 8.607 0 006.143 6";
//let pathString = "M11.908.183a12.012 12.012 0 00-8.044 3.172c-4.882 4.475-5.166 12.08-.692 16.962.204.244.448.447.692.692a.315.315 0 00.408-.04l.53-.61a.32.32 0 000 .447";
//let pathString = "M39.502,61.823c-1.235-0.902-3.038-3.605-3.038-3.605s0.702,0.4,3.907,1.203  c3.205,0.8,7.444-0.668,10.114-1.97c2.671-1.302,7.11-1.436,9.448-1.336c2.336,0.101,4.707,0.602,4.373,2.036  c-0.334,1.437-5.742,3.94-5.742,3.94s0.4,0.334,1.236,0.334c0.833,0,6.075-1.403,6.542-4.173s-1.802-8.377-3.272-9.013  c-1.468-0.633-4.172,0-4.172,0c4.039,1.438,4.941,6.176,4.941,6.176c-2.604-1.504-9.279-1.234-12.619,0.501  c-3.337,1.736-8.379,2.67-10.083,2.503c-1.701-0.167-3.571-1.036-3.571-1.036c1.837,0.034,3.239-2.669,3.239-2.669  s-2.068,2.269-5.542,0.434c-3.47-1.837-1.704-8.18-1.704-8.18s-2.937,5.909-1,9.816C34.496,60.688,39.502,61.823,39.502,61.823z   M77.002,40.772c0,0-1.78-5.03-2.804-8.546l-1.557,8.411l1.646,1.602c0,0,0-0.622-0.668-1.691  C72.952,39.48,76.513,40.371,77.002,40.772z M102.989,86.943 M102.396,86.424c0.25,0.22,0.447,0.391,0.594,0.519  C102.796,86.774,102.571,86.578,102.396,86.424z M169.407,119.374c-0.09-5.429-3.917-3.914-3.917-2.402  c0,0-11.396,1.603-13.086-6.677c0,0,3.56-5.43,1.69-12.461c-0.575-2.163-1.691-5.337-3.637-8.605  c11.104,2.121,21.701-5.08,19.038-15.519c-3.34-13.087-19.63-9.481-24.437-9.349c-4.809,0.135-13.486-2.002-8.011-11.618  c5.473-9.613,18.024-5.874,18.024-5.874c-2.136,0.668-4.674,4.807-4.674,4.807c9.748-6.811,22.301,4.541,22.301,4.541  c-3.097-13.678-23.153-14.636-30.041-12.635c-4.286-0.377-5.241-3.391-3.073-6.637c2.314-3.473,10.503-13.976,10.503-13.976  s-2.048,2.046-6.231,4.005c-4.184,1.96-6.321-2.227-4.362-6.854c1.96-4.627,8.191-16.559,8.191-16.559  c-1.96,3.207-24.571,31.247-21.723,26.707c2.85-4.541,5.253-11.93,5.253-11.93c-2.849,6.943-22.434,25.283-30.713,34.274  s-5.786,19.583-4.005,21.987c0.43,0.58,0.601,0.972,0.62,1.232c-4.868-3.052-3.884-13.936-0.264-19.66  c3.829-6.053,18.427-20.207,18.427-20.207v-1.336c0,0,0.444-1.513-0.089-0.444c-0.535,1.068-3.65,1.245-3.384-0.889  c0.268-2.137-0.356-8.549-0.356-8.549s-1.157,5.789-2.758,5.61c-1.603-0.179-2.493-2.672-2.405-5.432  c0.089-2.758-1.157-9.702-1.157-9.702c-0.8,11.75-8.277,8.011-8.277,3.74c0-4.274-4.541-12.82-4.541-12.82  s2.403,14.421-1.336,14.421c-3.737,0-6.944-5.074-9.879-9.882C78.161,5.874,68.279,0,68.279,0  c13.428,16.088,17.656,32.111,18.397,44.512c-1.793,0.422-2.908,2.224-2.908,2.224c0.356-2.847-0.624-7.745-1.245-9.882  c-0.624-2.137-1.159-9.168-1.159-9.168c0,2.67-0.979,5.253-2.048,9.079c-1.068,3.828-0.801,6.054-0.801,6.054  c-1.068-2.227-4.271-2.137-4.271-2.137c1.336,1.783,0.177,2.493,0.177,2.493s0,0-1.424-1.601c-1.424-1.603-3.473-0.981-3.384,0.265  c0.089,1.247,0,1.959-2.849,1.959c-2.846,0-5.874-3.47-9.078-3.116c-3.206,0.356-5.521,2.137-5.698,6.678  c-0.179,4.541,1.869,5.251,1.869,5.251c-0.801-0.443-0.891-1.067-0.891-3.473c0-2.402,2.492-1.423,2.492-1.423  c-0.089,4.54,2.672,4.452,2.672,4.452c-0.98-2.674-0.712-4.187,3.561-4.008c4.273,0.177,5.429,7.123,5.518,9.079  c0.091,1.96-1.157,3.029-2.669,3.917c-1.515,0.892-2.938,2.228-5.432,2.049c-2.492-0.177-1.69-4.986-1.69-4.986  c-3.028,1.96-1.692,5.7-1.692,5.7c-1.869-0.18-2.227-3.028-2.227-3.028c-0.889,1.692-0.8,4.361-0.177,5.429  c0.622,1.069-0.533,3.562-0.533,3.562s1.601-0.445,1.601-1.247s1.068-1.871,1.068-1.871s-0.356,1.604-0.089,2.672  c0.268,1.069-1.512,1.603-1.512,1.603c2.937,0.979,5.342-2.493,6.587-4.185c0.794-1.077,5.074-3.804,8.087-5.65l0.214,0.353  c2.603-0.401,4.941-1.336,4.607,0.601s-0.867,2.67-4.206,4.408c-3.146,1.635-9.545,6.532-11.284,13.681l-0.001-0.061  c-0.12,0.213-0.409,1.153-0.706,2.568c-0.839-0.1-2.799,0.303-5.257,5.02c-3.293,6.321-0.98,9.081,0.179,10.148  c0.496,0.46,1.144,1.167,1.72,1.825c-1.119-0.958-3.014-2.033-6.082-2.358c-5.875-0.622-9.614-0.624-11.306-2.672  c-1.692-2.045-4.184-2.759-5.788-1.423c-1.601,1.336-5.963,3.473-8.011,3.473s-5.342-1.159-7.657-2.226  c-2.313-1.071-3.56,1.512-3.56,1.512s-0.979-0.179-3.205-0.179c-2.225,0-3.472,2.137-3.472,2.137S0,99.169,0,102.016  c0,2.85,2.493,3.027,2.493,3.027s-2.849-3.027,3.026-4.986c0,0,1.603,1.246,3.828,1.246s2.76,0,2.76,0s-1.069,1.336-0.889,2.316  c0.177,0.979-3.205,2.403-1.871,5.696c0,0,1.96-3.65,3.116-3.026c1.157,0.624,2.76,0.09,3.649-0.712  c0.892-0.801,5.164-2.582,8.013-2.493c0.157,0.006,0.293,0.01,0.419,0.016c0.299,0.446,1.721,2.255,5.457,2.565  c4.273,0.357,3.738,2.581,2.314,3.472s-2.76,1.157-2.76,1.157s4.985,0.445,5.698-1.958c0.712-2.402,0.445-7.298-3.294-6.677  c-3.738,0.626-4.273,0.356-4.718-0.445c-0.444-0.798,0-1.067,2.76-1.333c2.76-0.267,5.609-0.355,8.19,2.047  c2.583,2.403,10.862,7.123,15.845,7.123c4.984,0,6.41,0.71,6.41,0.71s-0.158-3.636,0.908-3.586c0.669,0.693,1.409,1.342,2.253,1.918  c2.695,1.785,4.096,2.5,4.824,2.77c-0.926,1.025-1.909,2.373-2.688,4.107c-2.071,4.605-9.415,12.686-10.883,13.755  c-1.468,1.066-3.539,0.466-3.539,0.466s0.2,1.002,0.803,1.069c0.601,0.067-3.738,0.867-5.007,0.067  c-1.269-0.803-3.406-2.004-4.207-3.141c-0.801-1.134-2.537,0.334-2.67,1.269s-0.133,0.935-0.133,0.935s-2.672-1.066-3.606-2.136  s-4.874-1.535-5.941,0.067c-0.475,0.709-0.501,0.935-0.385,0.964c-1.024,0.519-3.22,2.004-3.22,5.177  c0,4.14,2.536,5.145,2.536,5.145s-2.67-3.006,1.937-7.213c0,0,0.268,1.603,2.871,1.67s6.343,1.67,6.343,1.67  s-4.474-0.671-5.542,3.27c-1.068,3.938,2.537,6.876,2.537,6.876s-1.803-5.007,1.203-6.741c0,0,0.867,2.335,5.607,2.335  s6.943-4.673,11.685-4.673c4.74,0,4.003,3.006,7.409,3.006s4.608-2.206,4.608-0.536c0,1.673-0.335,2.136-0.335,2.136  s3.141-1.066,2.539-4.805c-0.601-3.741-4.808-3.606-6.075-2.537c-1.27,1.066-4.409-0.601-3.139-1.737  c1.269-1.134,2.536-0.132,2.536-0.132s0.604-2.604,2.604-3.806c2.004-1.204,11.418-10.617,14.423-12.284  c1.198-0.668,2.121-1.403,2.808-2.054c1.991,0.305,9.088,1.251,11.3-0.352c0,0,7.123,0.179,8.459-2.405c0,0,4.628-0.267,6.053-2.314  c1.256-1.808,4.937-3.402,5.785-3.754c0.129,1.674-0.87,7.07-1.868,9.941c-1.069,3.073,2.804,7.567,4.051,9.926  c1.246,2.358,0.622,3.428-0.624,5.165c-1.245,1.734-5.741,7.21-9.791,7.21c-4.052,0-4.72-4.494-6.143-4.494  c-1.424,0-1.826,2.402-1.826,2.402s-3.027-3.56-5.341-3.56c-2.312,0-2.805,1.022-2.805,1.022  c-7.565,1.737-6.097,10.014-6.097,10.014c0-2.716,3.382-6.363,4.408-6.586c1.022-0.226,1.868-0.401,2.492,0.621  c0.543,0.896,3.8,0.973,4.62,0.981c-0.421,0.041-1.531,0.384-3.151,2.625c-2.093,2.891-0.268,6.143-0.268,6.143  c-0.267-2.891,3.205-3.471,5.432-3.295c2.225,0.178,7.432-0.354,8.144-0.979c0.714-0.621,2.894-0.935,3.738,0.047  c0.847,0.975,6.679,0.442,9.437,1.156c2.76,0.713,1.068,3.871,1.068,3.871s4.362-1.646,4.362-4.45s-3.383-6.275-5.341-5.074  c-1.96,1.201-4.897,1.512-4.897,1.512c0-2.355,8.947-10.904,10.729-11.616c1.78-0.712,2.492-3.205,1.068-4.052  c-1.424-0.844-2.314-2.355-2.314-6.407c0-3.604,4.849-8.324,5.922-10.267c2.562,6.265,8.915,17.922,18.916,17.922  c12.105,0,15.489,3.205,16.111,6.053c0.623,2.848,0.267,6.943-3.561,6.943c-3.828,0-4.807-2.848-8.724-2.848  c-2.049-0.179-2.139,1.336-2.139,1.336s-5.072-0.803-6.141,6.853c0,0,2.671-3.114,5.964-2.669c3.294,0.445,2.227,1.957,6.054,1.957  c0,0-5.163,4.362,0.712,8.37c0,0-1.425-3.742,1.512-3.742c2.938,0,1.069,0.713,4.364,0.713c3.293,0,7.834-5.071,8.101-9.079  c0,0,1.87,3.026,3.115,3.026C174.392,140.918,169.496,126.053,169.407,119.374z M58.93,45.222c-1.156,0-2.134-1.157-0.177-1.336  c2.32-0.211,4.005,2.493,4.005,2.493S60.089,45.222,58.93,45.222z M151.469,68.1c2.537,0,2.804,2.136,2.804,2.136  c3.071-4.673,9.882,0.267,9.08,0.668c-0.801,0.4,0.132,1.871-0.801,1.871c-0.935,0-1.201,1.202-1.201,1.202s2.002-0.134,2.002,0.801  s1.736,0.667,1.736,0.667c-0.135,6.01-3.872,7.078-3.872,7.078s0.267-2.004-0.936-1.869c-1.201,0.132-1.335-2.672-1.335-2.672  c-1.735,0.536-0.135,2.938-1.603,3.073c-1.469,0.132-1.069,2.804-1.069,2.804s-4.138,0-6.141-0.267  c-2.004-0.269-2.405-1.604-2.137-2.271c0.267-0.668-0.802-1.471-0.535-2.139c0.267-0.665,1.603-1.467,1.603-1.467  s2.804,0.131-0.135-0.534c-2.936-0.667-2.936,1.735-4.271,1.867c-1.09,0.11-1.639,1.273-1.808,1.701  c-1.791-1.301-3.844-2.422-6.183-3.274c0.247-1.129-0.703-0.895-0.822-2.432c-0.133-1.736,1.468-2.938,1.468-2.938  c-2.537,0-4.406,2.537-4.406,2.537c-1.17,0-1.767,0.923-2.005,1.421c-2.595-0.352-5.466-0.388-8.63-0.048  c3.038-2.167,6.986-2.485,6.986-2.485s-5.253-0.624-3.384-5.697c1.23-3.337,4.876-5.78,7.234-7.068l0.066,0.39  C135.846,69.436,148.93,68.1,151.469,68.1z M96.691,77.988c0.036,0.436-0.082,0.913-0.485,1.399  C96.432,78.702,96.571,78.262,96.691,77.988z M68.724,51.365c0.623,0.536,1.601-0.624,3.472,0.355  c1.869,0.98,3.917-0.533,3.917-0.533l-3.116-2.851c-2.493,1.603-4.185-2.046-2.849-3.024c1.334-0.98,2.493-2.404,3.738-1.159  c1.247,1.247-0.267,3.562-0.267,3.562l2.761,2.492c-0.268-1.512,1.868-2.404,1.868-2.404s0.303,0.251,0.817,0.778  c-0.442-0.144-0.729-0.245-0.729-0.245s-1.78,0.445-1.068,1.959c0.713,1.515-3.826,3.293-5.073,1.872  c-0.923-1.055-2.626,0.334-3.328-0.56c-0.015-0.018-0.132-0.166-0.297-0.371L68.724,51.365z M68.544,61.196  c0.385-0.237,0.744-0.454,1.08-0.658C69.102,61.035,68.762,61.201,68.544,61.196z M55.283,107.625  c-8.012-0.355-17.005-7.744-17.005-7.744c9.615,6.677,17.983,6.853,17.983,6.853L55.283,107.625z M68.279,89.199  c0,0-2.08,2.858-1.627,8.056c-0.193,6.951,1.627,9.503,1.627,9.503c-1.469-2.07-3.004-2.403-3.004-2.403s1,0.734,2.068,1.804  c0.36,0.359,0.628,1.057,0.828,1.819c-2.052-0.691-7.307-2.997-9.173-8.965c0,0,1.403,3.273,7.345,1.404  c0,0-5.742,0.865-7.478-3.873c0,0,4.875,1.268,7.21,0c0,0-6.81,0.332-8.212-2.539c-1.402-2.869-0.734-3.738-0.734-3.738  s3.072,3.203,7.879,2.669c0,0-7.813-2.201-7.478-6.476c0.059-0.764,0.113-1.345,0.16-1.796c1.162,4.447,7.213,3.656,8.786,3.599  c0,0-10.214,0.267-7.611-8.745c0,0,0.199,3.005,6.41,3.14c0,0-3.004-0.27-4.607-2.739c-1.604-2.47-0.4-4.137,0.869-5.941  c0,0,0.734,3.472,4.538,4.072c0,0-2.735-1.936-3.337-4.072c-0.601-2.138,1.537-2.872,1.537-2.872s1.267,3.206,3.738,3.271  c0,0-3.205-2.402-2.738-4.273c0.467-1.869,2.137-1.535,2.137-1.535s0.533,2.804,2.402,3.07c0,0-2.738-2.738-0.869-4.271  c1.871-1.535,1.67,0.734,3.272,1.134c0,0-2.404-2.871,1-3.806c3.406-0.933,0.601,3.272,0.601,3.272s5.476-2.67,4.942-6.611  c-0.417-3.066-4.626-2.931-7.261-1.938l0.073-0.042c-1.736-0.788-1.934-3.319-1.956-5.001c0.103,0.328,0.174,0.62,0.174,0.819  c0,1.422,1.159,2.936,2.314,3.737c0,0-0.091-1.157,2.492-0.801c2.584,0.357,4.986,1.515,4.897,3.652s-2.227,6.05-6.231,9.437  c-3.74,3.157-7.865,8.798-5.429,16.121c0.308-0.307,0.646-0.582,1.03-0.846c1.075-0.733,2.017-1.396,3.287-1.772  c0.319-0.094,0.647-0.164,0.984-0.227l0.346-0.305l0.004,0.001c0,0,2.035,0.105,4.104,0.441  C71.923,84.294,68.279,89.199,68.279,89.199z M71.288,108.398l-0.023,0.013l0.01-0.009L71.288,108.398z M79.138,111.809  c-0.533,1.781-11.571,13.175-16.201,15.58c-4.629,2.402-5.518,4.717-5.518,4.717s-0.801-2.224,3.826-4.808  c4.63-2.578,15.668-13.529,16.292-16.559c0.624-3.024-1.78-2.76-1.78-2.76s3.472-0.8,4.361-10.235c0,0,0.356,8.1-2.225,10.057  C77.893,107.801,79.674,110.028,79.138,111.809z M78.604,79.672c0,0-2.581-0.179,0.356-3.203c2.938-3.028,4.808-5.697,4.986-4.987  c0.177,0.712,1.512,1.336,2.225,0.445c0,0-2.048-1.422-0.267-4.273c1.78-2.849,5.162-11.751,2.226-15.845  c-2.939-4.095,0.445-4.095,0.445-4.095s-1.67-0.268-2.664,0.222l-0.007-0.044c-0.434-1.406,0.217-2.382,0.796-2.935  c0.039,0.743,0.071,1.476,0.086,2.19c0.226-0.028,0.469-0.043,0.743-0.043c0.618,0,1.11,0.078,1.132,0.081  c0.274,0.045,0.469,0.293,0.445,0.571c-0.021,0.276-0.253,0.489-0.531,0.489c-0.009,0-0.796,0.021-1.031,0.481  c-0.122,0.234-0.266,0.978,1.02,2.771c3.07,4.28-0.287,13.369-2.206,16.439c-0.27,0.432-0.441,0.819-0.54,1.167l1.155,0.996  c0,0,3.205,0.936,3.205,3.338c0,1.229,2.506,2.593,4.961,3.638c-1.497,0.256-5.525,0.502-7.834,0.502  C84.903,77.581,83.389,80.164,78.604,79.672z M88.111,96.574c-0.803-2.489-1.91-5.395-3.557-7.717  c0.703-1.322,1.883-2.758,3.844-3.396c4.095-1.336,5.876,2.758,5.876,2.758s4.984-4.539,7.834-2.048c0,0,1.246-4.184,5.963-3.293  c0,0-0.712-0.801-0.8-2.76c-0.091-1.958,1.155-3.027,4.094-3.114c0,0-3.026-3.206-0.267-4.453c2.759-1.247,5.429-2.49,5.429-2.49  s-2.581-0.535-2.493-2.672c0.09-2.137,2.138-4.986,7.213-6.233c0,0-3.027-0.979-3.027-2.848c0-1.871,3.206-5.162,6.231-6.676  c0,0-4.005,0.179-4.362-1.869c-0.356-2.047,3.65-6.677,6.32-7.834c0,0-2.848-0.98-2.136-3.828c0.693-2.773,6.444-7.991,6.752-8.266  c-0.289,0.259-4.795,4.269-4.795,1.857c0,0,14.868-18.34,16.558-20.12c0,0-5.25,8.367-5.073,13.087  c0.179,4.717,5.073,4.629,7.745,2.492c0,0-5.519,7.745-7.033,9.614c-1.513,1.871-1.601,7.211,2.404,7.388  c0,0-10.95,6.588-7.033,15.045c0,0-8.546,3.56-9.17,9.526c-0.71,3.204,1.603,4.094,1.603,4.094s-5.963,2.225-7.565,5.965  c-1.603,3.738-0.357,7.834-0.357,7.834s-9.079-1.336-9.524,6.852c0,0-8.636-1.156-9.614,3.65  C99.169,97.12,92.877,91.751,88.111,96.574z M113.77,103.084c-1.96,1.514-2.138-1.246-2.138-1.246s-1.246,3.426-2.672,4.852  c-1.424,1.425-2.937-0.046-2.67-1.646c0,0-1.336,2.937-3.381,3.829c-2.048,0.889-3.917,0.089-3.384-1.514  c0,0-1.069,1.868-3.384,3.025c-1.708,0.856-2.783,0.06-3.123-0.738c5.446-1.295,11.852-5.88,15.498-7.096  c2.468-0.82,4.749-3.381,7.181-5.243C115.606,98.801,115.24,101.948,113.77,103.084z M116.427,99.315  c-0.116-1.029-0.301-1.763-0.454-2.219c1.053-0.775,2.136-1.406,3.276-1.694C118.78,97.944,117.2,98.965,116.427,99.315z   M120.178,97.078c0.152-0.521,0.184-1.16,0.146-1.837c0.943-0.05,1.929,0.155,2.969,0.725c0.233,0.125,0.441,0.26,0.656,0.391  C122.583,99.641,119.519,99.317,120.178,97.078z M127.39,100.417c-1.47-1.336-2.806-2.096-2.895-2.982  c-0.018-0.187,0.053-0.402,0.156-0.621c1.67,1.161,2.797,2.467,3.548,3.664c0.16,0.473,0.304,0.916,0.433,1.328  C128.24,101.29,127.817,100.803,127.39,100.417z M166.358,122.916c-0.068-2.136-0.602-1.201-2.271-1.201s-12.352-1.939-16.558-6.876  c-4.205-4.943-8.479-19.097-10.615-24.104c-2.138-5.009-13.688-5.874-13.688-5.874s11.617-0.202,14.755,5.739  c3.138,5.944,5.408,22.033,12.887,25.974c7.478,3.94,13.352,3.539,13.352,3.539s1.937-1.336,2.672,1.134  c0.734,2.47,0.535,5.007,1.068,6.741C167.96,127.987,166.423,125.051,166.358,122.916z";
// let pathString = "M3.5,6  A8.607 8.607 0 006.143 6";

// let rtn = pathParser(pathString);
// for (let j = 0, jj = rtn.length; j < jj; j += 1) {
//     let partArr = rtn[j]
//       console.info(partArr.length + ":" + partArr.join("/"))
// }
// console.info("----------------")

// rtn = pathParser(pathString, false);
// for (let j = 0, jj = rtn.length; j < jj; j += 1) {
//     let partArr = rtn[j]
//       console.info(partArr.length + ":" + partArr.join("/"))
// }

/**
 * 解析ViewBox属性
 * @private
 * @param {String} strViewBox 
 * @returns Array
 */
function parseViewBox(strViewBox) {
    let bbox = [];
    if (strViewBox != null) {
        let seq = strViewBox.split(/\s*,\s*|\s+/);
        if (seq.length === 4) {
            bbox[0] = (getFloatVal(seq[0]));
            bbox[1] = (getFloatVal(seq[1]));
            bbox[2] = (getFloatVal(seq[0]) + getFloatVal(seq[2]));
            bbox[3] = (getFloatVal(seq[1]) + getFloatVal(seq[3]));
        }
    }
    return bbox;
}

/**
 * SVG渐变Element分析
 * @class
 */
const parseGradient = (function () {
    /**
     * Returns {Gradient} 渐变对象
     * @param {SVGGradientElement} element 渐变SVG Element
     * @param {Object} svg document对象， 百分数值转换为像素时会用到
     * @param {String} opacity 透明度
     */
    return function (element, document, opacity) {
        /**
         *  @example:
         *
         *  <linearGradient id="linearGrad1">
         *    <stop offset="0%" stop-color="white"/>
         *    <stop offset="100%" stop-color="black"/>
         *  </linearGradient>
         *
         *  OR
         *
         *  <linearGradient id="linearGrad2">
         *    <stop offset="0" style="stop-color:rgb(255,255,255)"/>
         *    <stop offset="1" style="stop-color:rgb(0,0,0)"/>
         *  </linearGradient>
         *
         *  OR
         *
         *  <radialGradient id="radialGrad1">
         *    <stop offset="0%" stop-color="white" stop-opacity="1" />
         *    <stop offset="50%" stop-color="black" stop-opacity="0.5" />
         *    <stop offset="100%" stop-color="white" stop-opacity="1" />
         *  </radialGradient>
         *
         *  OR
         *
         *  <radialGradient id="radialGrad2">
         *    <stop offset="0" stop-color="rgb(255,255,255)" />
         *    <stop offset="0.5" stop-color="rgb(0,0,0)" />
         *    <stop offset="1" stop-color="rgb(255,255,255)" />
         *  </radialGradient>
         *
         */

        let multiplier = parseFloat(opacity) / (/%$/.test(opacity) ? 100 : 1);
        multiplier = MathUtil.clamp(multiplier, 0, 1);
        if (isNaN(multiplier)) {
            multiplier = 1;
        }

        let colorStopEls = element.getElementsByTagName('stop'),
            colorStops = [],
            type,
            coords,
            gradientUnits = element.getAttribute('gradientUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
            gradientTransform = element.getAttribute('gradientTransform') || '',
            transformData;

        if (element.nodeName === 'linearGradient' || element.nodeName === 'LINEARGRADIENT') {
            type = 'linear';
            coords = _getLinearCoords(element);
        } else {
            type = 'radial';
            coords = _getRadialCoords(element);
        }

        //for (let i = colorStopEls.length; i--;) {
        for (let i = 0, ii = colorStopEls.length; i < ii; i++) {
            colorStops.push(_getColorStop(colorStopEls[i], multiplier));
        }

        transformData = parseTransform(gradientTransform);

        // 计算单位为百分数的值
        _convert2Value(coords, document, gradientUnits);

        // 构造渐变对象
        let gradient = new Gradient({
            id: element.getAttribute('id'),
            type: type,
            coords: coords,
            colorStops: colorStops,
            gradientUnits: gradientUnits,
            gradientTransform: transformData
        });

        return gradient;
    }

    /**
     * @private
     */
    function _convert2Value(coords, document, gradientUnits) {
        let propValue, finalValue;
        Object.keys(coords).forEach(function (prop) {
            propValue = coords[prop];
            if (propValue === 'Infinity') {
                finalValue = 1;
            } else if (propValue === '-Infinity') {
                finalValue = 0;
            } else {
                finalValue = parseFloat(coords[prop]);
                // 分析百分数
                if (typeof propValue === 'string' && /^(\d+\.\d+)%|(\d+)%$/.test(propValue)) {
                    finalValue *= 0.01;
                    if (gradientUnits === 'pixels') {
                        if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
                            finalValue *= document.width;
                        }
                        if (prop === 'y1' || prop === 'y2') {
                            finalValue *= document.height;
                        }
                    }
                }
            }
            coords[prop] = finalValue;
        });
    }

    function _getColorStop(element, multiplier) {
        let style = element.getAttribute('style'),
            offset = element.getAttribute('offset') || 0,
            color, colorAlpha, opacity, i;

        // convert percents to absolute values
        offset = parseFloat(offset) / (/%$/.test(offset) ? 100 : 1);
        offset = offset < 0 ? 0 : offset > 1 ? 1 : offset;
        if (style) {
            let keyValuePairs = style.split(/\s*;\s*/);

            if (keyValuePairs[keyValuePairs.length - 1] === '') {
                keyValuePairs.pop();
            }

            for (i = keyValuePairs.length; i--;) {
                let split = keyValuePairs[i].split(/\s*:\s*/),
                    key = split[0].trim(),
                    value = split[1].trim();

                if (key === 'stop-color') {
                    color = value;
                }
                else if (key === 'stop-opacity') {
                    opacity = value;
                }
            }
        }

        if (!color) {
            color = element.getAttribute('stop-color') || 'rgb(0,0,0)';
        }
        if (!opacity) {
            opacity = element.getAttribute('stop-opacity');
        }

        color = Color.fromString(color);
        colorAlpha = color.getAlpha();
        opacity = isNaN(parseFloat(opacity)) ? 1 : parseFloat(opacity);
        opacity *= colorAlpha * multiplier;

        return {
            offset: offset,
            color: color.toRgb(),
            opacity: opacity
        };
    }

    function _getLinearCoords(element) {
        return {
            x1: element.getAttribute('x1') || 0,
            y1: element.getAttribute('y1') || 0,
            x2: element.getAttribute('x2') || '100%',
            y2: element.getAttribute('y2') || 0
        };
    }

    function _getRadialCoords(element) {
        return {
            x1: element.getAttribute('fx') || element.getAttribute('cx') || '50%',
            y1: element.getAttribute('fy') || element.getAttribute('cy') || '50%',
            r1: element.getAttribute('fr') || 0,
            x2: element.getAttribute('cx') || '50%',
            y2: element.getAttribute('cy') || '50%',
            r2: element.getAttribute('r') || '50%'
        };
    }
}());


/**
 * SVG填充图案Element分析
 * @class
 */
const getPatternObject = (function () {

    function isPercentage(strNum) {
        return strNum.substring(strNum.length - 1) == "%" ? true : false;
    }

    /**
     * Returns {Pattern} 填充图案对象
     * @param {SVGPatternElement} element svg 填充图案Element
     * @param {Object} svg document对象， 百分数值转换为像素时会用到
     * @param {Object.number} width 
     * @param {Object.number} height
     * @param {List} geometryList
     */
    return function (options, geometry) {

        let bbox = geometry.getBBox();
        // 坐标
        let x = isPercentage(options.x) ? getFloatVal(options.x, { "isX": true }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.x);
        let y = isPercentage(options.x) ? getFloatVal(options.y, { "isX": false }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.y);
        let width = isPercentage(options.x) ? getFloatVal(options.width, { "isX": true }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.width);
        let height = isPercentage(options.x) ? getFloatVal(options.height, { "isX": false }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.height);

        // 矩阵
        let transformData = parseTransform(options.patternTransform);
        let transform = transformData.length > 0 ? Transform.createByData(transformData) : null;

        // 构造渐变对象
        let pattern = new Pattern({
            type: "canvas",
            repeat: "repeat",
            x: x,
            y: y,
            width: width,
            height: height,
            viewBox: parseViewBox(options.viewBox),
            patternTransform: transform,
            geomList: options.geomList.slice()
        });

        return pattern;
    }
}());

/**
 * SVG变换属性transform分析
 * @param {String} transformString 
 * @returns Object
 * @private
 */
function parseTransform(transformString) {
    if (transformString == null) return [];
    let prop = [];
    while (transformString.length > 5) {
        let idxBegin = transformString.indexOf("(");
        let idxEnd = transformString.indexOf(")");
        if (idxBegin > 0 && idxEnd > 0) {
            let key = transformString.substring(0, idxBegin).trim();
            let value = transformString.substring(idxBegin + 1, idxEnd);
            if (key == "scale") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length === 1) {
                    value = [parseFloat(segs[0]), parseFloat(segs[0])];
                } else {
                    value = [parseFloat(segs[0]), parseFloat(segs[1])];
                }
                prop.push({ "action": key, "value": value });

            } else if (key == "translate") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length === 1) {
                    value = [parseFloat(segs[0]), 0];
                } else {
                    value = [parseFloat(segs[0]), parseFloat(segs[1])];
                }
                prop.push({ "action": key, "value": value });
            } else if (key == "rotate") {
                let segs = value.split(/\s*,\s*|\s+/);
                let origin = [0, 0];
                if (segs.length >= 3) {
                    origin[0] = parseFloat(segs[1]);
                    origin[1] = parseFloat(segs[2]);
                }
                value = parseFloat(segs[0]);
                prop.push({ "action": key, "value": value, "origin": origin });
            } else if (key == "matrix") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length == 6) {
                    prop.push({
                        "action": key, "value":
                            [parseFloat(segs[0]), parseFloat(segs[1]), parseFloat(segs[2]), parseFloat(segs[3]), parseFloat(segs[4]), parseFloat(segs[5])]
                    });
                }
            }
            transformString = transformString.substring(idxEnd + 1);
        }
    }
    return prop;
}

/**
 * 获取坐标值 或 将一个字符串转换为浮点数，如果该字符串为空则返回0值
 * @param {String} strNum 
 * @param {Boolean} isX 
 * @param {Boolean} zero 当strNum为null时，如果zero=true则返回0，否则返回null
 * @returns Number
 * @private
 */
function getFloatVal(strNum, options = {}, nodeData = {}) {

    let getSize = function (isWidth) {
        while (nodeData != null) {
            if (nodeData.viewBox && nodeData.viewBox.length === 4) {
                break;
            } else {
                nodeData = nodeData.parentNode;
            }
        }
        if (nodeData) {
            let width = Extent.getWidth(nodeData.viewBox) || nodeData.width;
            let height = Extent.getHeight(nodeData.viewBox) || nodeData.height;
            return isWidth ? width : height;
        } else {
            return 0;
        }
    };

    let isX = options.isX == null ? true : options.isX;
    let zero = options.zero == null ? true : options.zero;
    let rtnVal = 0;
    if (strNum == null) {
        rtnVal = zero === true ? 0 : null;
    } else if (typeof (strNum) === "number") {
        rtnVal = strNum;
    } else if (typeof (strNum) === "string") {
        strNum = strNum.trim();
        if (strNum == "") {
            rtnVal = 0;
        } else {
            if (strNum.substring(strNum.length - 1) == "%") {
                strNum = strNum.substring(0, strNum.length - 1);
                rtnVal = parseFloat(strNum) / 100 * getSize(isX);
            } else {
                // path路径中可能存在123e-4格式，为了判断此处的“-”不是分段标识，已将此处的e-4替换成了ee4,因此此处解析时需还原为科学计数法格式
                if (strNum.indexOf("ee") > 0) {
                    let num = strNum.substring(0, strNum.indexOf("ee"));
                    let pow = strNum.substring(strNum.indexOf("ee") + 2);
                    let val = parseFloat(num) * Math.pow(10, -pow);
                    rtnVal = (isNaN(val) ? 0 : val);
                } else {
                    let val = getUnitVal(strNum, nodeData);
                    rtnVal = (isNaN(val) ? 0 : val);
                }
            }
        }
    } else {
        rtnVal = 0;
    }

    return rtnVal;
}

/**
 * 返回一个带单位的字符串数值
 * @private
 */
function getUnitVal(strNum, nodeData) {
    const __DPI = 96;

    let getFontSize = function () {
        while (nodeData != null) {
            if (nodeData.eleAttr && nodeData.eleAttr.fontSize > 0) {
                break;
            } else {
                nodeData = nodeData.parentNode;
            }
        }
        if (nodeData) {
            return nodeData.eleAttr.fontSize;
        } else {
            return 16;
        }
    };

    var reg = /\D{0,2}$/.exec(strNum);
    let num = parseFloat(strNum);
    switch (reg[0]) {
        case "mm":
            return num * __DPI / 25.4;
        case "cm":
            return num * __DPI / 2.54;
        case "in":
            return num * __DPI;
        case "pt":
            return num * __DPI / 72;
        case "pc":
            return num * __DPI / 72 * 12;
        case "em":
            return num * (nodeData == null ? 16 : getFontSize());
        default:
            return num
    }
}

/**
 * SVG Style class
 */
class SvgStyle {
    constructor(document) {

        /**
         * svg document object
         */
        this.document = document;

        /**
         * svg文件中定义的样式集合
         */
        this.styleCollection = {};

        /**
         * 渐变节点缓存集合
         */
        this.gradientNodeList = {};

        /**
         * 填充图案集合
         */
        this.patternList = {};
    }

    /**
     * 解析svg中定义的样式
     * @param {XmlElement} element 
     */
    parseStyleElement(element) {
        let strLine = element.textContent;
        strLine = strLine.replace(/\/\*[\s\S]*?\*\//g, '');
        if (strLine.trim() === '') {
            return
        }

        while (strLine.length > 5) {
            let idxBegin = strLine.indexOf("{");
            let idxEnd = strLine.indexOf("}");
            if (idxBegin > 0 && idxEnd > 0) {
                let obj = {};
                let strName = strLine.substring(0, idxBegin).trim();
                let content = strLine.substring(idxBegin + 1, idxEnd);
                let seqs = content.split(";");
                for (let x = 0, xx = seqs.length; x < xx; x++) {
                    let idx = seqs[x].indexOf(":");
                    let key = seqs[x].substring(0, idx).trim();
                    let value = seqs[x].substring(idx + 1).trim();
                    if (key == "") continue;
                    let name = this._getAttrName(key);
                    if (name != null) obj[name] = this._getAttrValue(name, value);
                }

                if (Object.keys(obj).length > 0) {
                    // 定义样式时，可使用,分隔多个样式名称
                    let nameArray = strName.split(/\s*,\s*|\s+/);
                    for (let x = 0, xx = nameArray.length; x < xx; x++) {
                        let name = nameArray[x];
                        let val = this.styleCollection[name];
                        if (val == null) {
                            this.styleCollection[name] = obj;
                        } else {
                            // 根据样式表规则，样式可分多次定义
                            this.styleCollection[name] = Object.assign({}, val, obj);
                        }
                    }
                }

                strLine = strLine.substring(idxEnd + 1);
            } else {
                break;
            }
        }
    }

    /**
     * 获取对象样式
     * @param {Geometry} geometry 
     * @param {Object} eleAttr 
     * @param {Object} nodeData 
     * @returns Object
     */
    getGeomStyle(geometry, eleAttr, nodeData) {
        let style = {};

        // 1. 以下样式直接复制
        let attr = [
            "visible",
            "fillRule",
            "lineCap",
            "lineJoin",
            "miterLimit",
            "opacity",
        ];
        attr.forEach(name => {
            if (eleAttr[name] != null) {
                style[name] = eleAttr[name];
            }
        });

        // 2. 合并eleStyle的多个属性，组成新的样式名称
        // 颜色
        if (eleAttr.stroke != null) {
            style.color = this._getColor(eleAttr.stroke, eleAttr.strokeOpacity, geometry);
        }
        if (eleAttr.fill != null) {
            style.fillColor = this._getColor(eleAttr.fill, eleAttr.fillOpacity, geometry);
        }
        // 默认为填充，当颜色值为null时用黑色填充，当填充值为none则表示不填充
        style.fillStyle = (style.fillColor == "none" ? 0 : 1);

        // 当存在填充色时，边框如果没有指定颜色则说明不需要渲染边框
        if (style.color == null && style.fillStyle == 1) {
            style.color = "none";
        }

        // 线宽
        if (eleAttr.strokeWidth != null) {
            style.lineWidth = getFloatVal(eleAttr.strokeWidth, {}, nodeData);
        }

        // 虚线
        if (eleAttr.strokeDashArray != null && eleAttr.strokeDashArray.length > 0) {
            style.dash = eleAttr.strokeDashArray;
            if (eleAttr.strokeDashoffset != null) style.dashOffset = parseFloat(eleAttr.strokeDashoffset);
        }

        // 3、特殊节点属性处理
        if (geometry instanceof Text) {
            style = Object.assign({}, style, this.getTextStyle(geometry, eleAttr, nodeData));
        }

        return style;
    }

    /**
     * 获取样式，节点样式信息在节点属性、节点style和class中，优先级 节点属性>节点style>classStyle
     * @param {XmlElement} element 
     * @returns Object
     */
    getElementAttr(element, parentAttr, nodeData) {

        let attrs = [
            "class",
            "fill",
            "fill-opacity",
            "stroke",
            "stroke-opacity",
            "stroke-dasharray",
            "stroke-dashoffset",
            "stroke-width",
            "visibility",
            "display",
            "paint-order",
            "fill-rule",
            "stroke-linecap",
            "stroke-linejoin",
            "stroke-miterlimit",
            "opacity",
            "font",
            "font-family",
            "font-style",
            "font-weight",
            "font-size",
            "letter-spacing",
            "text-decoration",
            "text-anchor",
            "alignment-baseline"
        ];
        let obj = this._getAttribute(element, attrs);

        // 从class中获取样式
        let eleAttr = {};

        // 1. 从className中读取样式，例如<text class=".bigText" />将从className为.bigText的样式定义中读取样式
        if (obj["class"] != null) {
            eleAttr = this._getClassStyleByName(obj["class"], eleAttr);
        }

        // 2. 从element的节点类型class中读取样式， 例如<text />将从className为text的样式定义中读取样式
        eleAttr = this._getClassStyleByName(element.nodeName, eleAttr);

        // 3.读取节点的样式
        for (let i = 0, ii = attrs.length; i < ii; i++) {
            if (obj[attrs[i]] != null) {
                let name = this._getAttrName(attrs[i]);
                eleAttr[name] = this._getAttrValue(name, obj[attrs[i]], nodeData);
            }
        }

        // 4.合并父节点的样式
        // 通常情况下如果子对象与父对象均存在某种样式，需以子对象的样式为准，
        // 但以下样式需特殊处理
        if (typeof (parentAttr) == "object" && Object.keys(parentAttr).length > 0) {
            let skipAttr = ["opacity"];
            for (let i = 0, ii = attrs.length; i < ii; i++) {
                let name = this._getAttrName(attrs[i]);
                if (!skipAttr.includes(name)) {
                    if (parentAttr[name] != null && eleAttr[name] == null) {
                        eleAttr[name] = parentAttr[name];
                    }
                }
            }

            // 透明属性值为当前节点的透明值*父节点透明值
            for (let i = 0, ii = skipAttr.length; i < ii; i++) {
                if (parentAttr[skipAttr[i]] > 0) {
                    if (eleAttr[skipAttr[i]] > 0) {
                        eleAttr[skipAttr[i]] = parentAttr[skipAttr[i]] * eleAttr[skipAttr[i]];
                    } else {
                        eleAttr[skipAttr[i]] = parentAttr[skipAttr[i]];
                    }
                }
            }

            // 如果父对象visible样式为false，则子对象该值也为false
            if (parentAttr.visible === false) {
                eleAttr.visible = false;
            }
        }

        // add space attr
        if(eleAttr.transData == null && parentAttr && parentAttr.transData == null) {
            eleAttr.transData = [];
        }
		
        return Object.assign({}, (parentAttr == null ? {} : JSON.parse(JSON.stringify(parentAttr))), eleAttr);
    }

    _getAttrName(attr) {
        let map = {
            "cx": "left",
            "x": "left",
            "r": "radius",
            "cy": "top",
            "y": "top",
            "display": "visible",
            "visibility": "visible",
            "fill-rule": "fillRule",
            "fill": "fill",
            "fill-opacity": "fillOpacity",
            "stroke": "stroke",
            "stroke-opacity": "strokeOpacity",
            "stroke-linecap": "lineCap",
            "stroke-linejoin": "lineJoin",
            "stroke-miterlimit": "miterLimit",
            "stroke-width": "strokeWidth",
            "stroke-dasharray": "strokeDashArray",
            "stroke-dashoffset": "strokeDashoffset",

            "font": "font",
            "font-family": "fontName",
            "font-size": "fontSize",
            "font-style": "fontStyle",
            "font-weight": "fontWeight",
            "text-decoration": "textDecoration",
            "text-anchor": "textAnchor",
            "alignment-baseline" : "textBaseline",
            "letter-spacing": "charSpacing",
            "paint-order": "paintFirst",

            "opacity": "opacity",
            "clip-path": "clipPath",
            "clip-rule": "clipRule",
            "vector-effect": "strokeUniform",
            "image-rendering": "imageSmoothing",
        };
        return map[attr] == null ? attr : map[attr];
    }

    _getAttrValue(attr, value, nodeData) {
        if (attr === "strokeUniform") {
            return (value === "non-scaling-stroke");
        } else if (attr === "strokeDashArray") {
            if (value === "none") {
                value = null;
            } else {
                value = value.replace(/,/g, " ").split(/\s+/).map(parseFloat);
            }
        } else if (attr === "visible") {
            value = value !== "none" && value !== "hidden";
        } else if (attr === "opacity") {
            value = parseFloat(value);
        } else if (attr === "textAnchor") {
            value = (value === "start" ? "left" : value === "end" ? "right" : value === "middle" ? "center" : "left");
        } else if (attr === "paintFirst") {
            let fillIndex = value.indexOf("fill");
            let strokeIndex = value.indexOf("stroke");
            let value = "fill";
            if (fillIndex > -1 && strokeIndex > -1 && strokeIndex < fillIndex) {
                value = "stroke";
            } else if (fillIndex === -1 && strokeIndex > -1) {
                value = "stroke";
            }
        } else if (attr === "imageSmoothing") {
            value = (value === "optimizeQuality");
        } else if (attr == "" || attr == "class" || attr == "stroke" || attr == "fill" || attr == "fillRule") {
            // 字符串类型
            value = value.replaceAll(/\s+/g, "");
        } else if (attr == "lineCap" || attr == "lineJoin") {    // "miterLimit" 为数字类型
            // 字符串类型
            value = value.trim();
        } else if (attr == "font" || attr == "fontName" || attr == "fontStyle" || attr == "fontWeight" || attr == "textDecoration" || attr == "textAnchor") {
            // 字符串类型
            value = value.trim();
        } else if (attr == "strokeWidth") {    // 线宽可能带单位，此处返回字符串
            // 字符串类型
            value = value.trim();
        } else {
            // 转换为数字类型
            value = Array.isArray(value) ? value.map(function (num) {
                return getFloatVal(num, {}, nodeData)
            }) : getFloatVal(value, {}, nodeData);
        }
        return value;
    }

    /**
     * 获取指定名称的样式
     * @param {String} classNames 样式名称或节点类型名称，引用多个名称时，名称之间使用空格分隔
     * @returns style
     */
    _getClassStyleByName(classNames, parentAttr) {
        let classArr = classNames.trim().split(/\s*,\s*|\s+/);
        let style = {};
        let that = this;
        classArr.forEach(className => {
            let styleDef = that.styleCollection["." + className];
            if (styleDef == null) styleDef = this.styleCollection[className];
            Object.assign(style, parentAttr, styleDef);
        });
        return style;
    }

    /**
     * 获取颜色值
     * @param {String} strColor 
     * @param {Number} opacity 
     * @returns ColorString
     */
    _getColor(strColor, opacity, geometry) {
        if (strColor == null) {
            if (opacity == null) {
                return null;
            } else {
                let color = Color.fromString("#000000");
                color.a = parseFloat(opacity);
                return color.toString();
            }
        } else if (strColor.toLowerCase() == "none") {
            return "none";
        } else if (strColor.indexOf("url") >= 0) {
            // url中的ID有两种写法：url(#name)或url("#name")
            let id = strColor.substring(strColor.indexOf("url") + 5, strColor.lastIndexOf(")"));
            let firstChat = id.substring(0, 1);
            if (firstChat == "#") {
                id = id.substring(1, id.length - 1);
            }

            // 获取渐变参数
            let elem = this.gradientNodeList[id];
            if (elem != null) {
                if (elem.getAttribute("xlink:href")) {
                    this._parseGradientsXlink(elem);
                }
                return parseGradient(elem.cloneNode(true), { "width": this.document.getDocumentWidth(), "height": this.document.getDocumentHeight() }).clone();
            } else if (this.patternList[id] != null) {
                return getPatternObject(this.patternList[id], geometry);
            } else {
                return "#CCCCCC";
            }
        } else {
            if (strColor === "transparent") {
                return "#FFFFFF00";
            } else {
                let color = Color.fromString(strColor);
                if (opacity != null) {
                    let a = color.a == null ? 1 : color.a;
                    color.a = a * parseFloat(opacity);    // 有效的值范围是 0.0（完全透明）到 1.0（完全不透明），默认是 1.0。
                }
                // console.info(strColor, opacity, color, color.toString());
                return color == null ? null : color.toString();
            }
        }
        //return (strColor == parseInt(strColor) ? "#" + strColor : strColor);
    }

    /**
     * 解析填充图案pattern
     * @param {*} element 
     * @param {*} geomList 
     */
    parsePatternElement(element, geomList) {
        //let patternContentUnits = element.getAttribute('patternContentUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
        let patternUnits = element.getAttribute('patternUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
            patternTransform = element.getAttribute('patternTransform') || '',
            viewBox = element.getAttribute('viewBox') || "";

        let x = element.getAttribute('x') || "0",
            y = element.getAttribute('y') || "0",
            width = element.getAttribute('width') || "0",
            height = element.getAttribute('height') || "0";

        // 分析引用
        if (element.getAttribute("xlink:href")) {
            this._parseParrernXlink(element, geomList);
        }

        // 构造渐变对象
        let id = element.getAttribute("id");
        let gradientData = {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            viewBox: viewBox,
            patternUnits: patternUnits,
            patternTransform: patternTransform,
            geomList: geomList
        };
        this.patternList[id] = gradientData;
    }

    /**
     * 解析pattern引用的节点数据
     * @param {*} el 
     */
    _parseParrernXlink(el, geomList) {
        let xlinkAttr = "xlink:href";
        let xLink = el.getAttribute(xlinkAttr).slice(1);
        let refParrern = this.patternList[xLink];

        let patternAttrs = [
            "patternTransform",
            "patternUnits",
            "x", "y", "width", "height"];

        // 递归解析引用关系，暂未处理循环引用
        if (refParrern && refParrern.getAttribute(xlinkAttr)) {
            this._parseParrernXlink(refParrern);
        }

        // 将引用对象的属性添加到当前对象中
        patternAttrs.forEach(function (attr) {
            if (refParrern && !el.hasAttribute(attr) && refParrern.hasAttribute(attr)) {
                el.setAttribute(attr, refParrern.getAttribute(attr));
            }
        });

        // 解析stop子节点
        if (geomList.length == 0 && refParrern && refParrern.geomList && refParrern.geomList.length) {
            refParrern.geomList.forEach(geom => {
                geomList.push(geom.clone());
            });
        }
        el.removeAttribute(xlinkAttr);
    }

    /**
     * 解析渐变样式
     * @param {*} element 
     */
    parseGradients(element) {
        // 解析渐变色定义
        let linearNodes = element.getElementsByTagName("linearGradient");
        for (let x = 0, xx = linearNodes.length; x < xx; x++) {
            let el = linearNodes[x];
            this.gradientNodeList[el.getAttribute("id")] = el;
        }

        // 解析渐变色定义
        let radialNodes = element.getElementsByTagName("radialGradient");
        for (let x = 0, xx = radialNodes.length; x < xx; x++) {
            let el = radialNodes[x];
            this.gradientNodeList[el.getAttribute("id")] = el;
        }
    }

    /**
     * 解析gradient引用的节点数据
     * @param {*} el 
     */
    _parseGradientsXlink(el) {
        let gradientsAttrs = [
            "gradientTransform",
            "x1", "x2", "y1", "y2",
            "gradientUnits",
            "cx", "cy", "r", "fx", "fy"];

        let xlinkAttr = "xlink:href";
        let xLink = el.getAttribute(xlinkAttr).slice(1);
        let refGradient = this.gradientNodeList[xLink];

        // 递归解析引用关系，暂未处理循环引用
        if (refGradient && refGradient.getAttribute(xlinkAttr)) {
            this._parseGradientsXlink(refGradient);
        }

        // 将引用对象的属性添加到当前对象中
        gradientsAttrs.forEach(function (attr) {
            if (refGradient && !el.hasAttribute(attr) && refGradient.hasAttribute(attr)) {
                el.setAttribute(attr, refGradient.getAttribute(attr));
            }
        });

        // 解析stop子节点
        if (refGradient && !el.children.length) {
            let referenceClone = refGradient.cloneNode(true);
            while (referenceClone.firstChild) {
                el.appendChild(referenceClone.firstChild);
            }
        }
        el.removeAttribute(xlinkAttr);
    }

    /**
     * 解析文字风格
     * @param {*} element 
     * @param {*} eleAttr 
     */
    getTextStyle(element, eleAttr, nodeData) {
        let style = {};

        // 综合字体信息,例如: "bold 36px Verdana, Helvetica, Arial, sans-serif"
        let font = eleAttr.font || "";

        // 字体大小
        let fontSize = this._getFontsize(eleAttr.fontSize, font, nodeData);
        style.fontSize = fontSize;

        // 字体名称
        let fontName = eleAttr.fontName;
        if (fontName == null) {
            // 从font属性中取字体信息
            style.fontName = "Verdana, Helvetica, Arial, sans-serif"; // svg default fontName
        } else {
            style.fontName = eleAttr.fontName;
        }

        // 字体粗细
        // let fontWeight = eleAttr.fontWeight;   // normal | bold | bolder | lighter | <number>
        style.fontBold = (font.indexOf("bold") >= 0 ? 1 : 0);

        // 字体风格
        let fontStyle = eleAttr.fontStyle;   // normal | italic | oblique
        if (fontStyle != null) {
            style.fontItalic = eleAttr.fontStyle == "italic" ? 1 : 0;
        } else {
            style.fontItalic = (font.indexOf("italic") >= 0 ? 1 : 0);
        }

        // 水平对齐方式
        let textAnchor = eleAttr.textAnchor;
        style.textAlign = (textAnchor === "start" || textAnchor === "left") ? "left" :
            (textAnchor === "end" || textAnchor === "right") ? "right" : (textAnchor === "middle" || textAnchor === "center" ? "center" : "left");

        // 垂直对齐方式
        let textBaseline = eleAttr.textBaseline;
        if(textBaseline == null) {
            style.textBaseline = "alphabetic";
        } else {
            // auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical | inherit
            switch (textBaseline) {
                case "auto":
                case "baseline":
                case "alphabetic":
                    style.textBaseline = "alphabetic";
                    break;
                case "before-edge":
                case "text-before-edge":
                case "hanging":
                    style.textBaseline = "top";
                    break;
                case "middle":
                case "central":
                    style.textBaseline = "middle";
                    break;
                case "ideographic":
                case "after-edge":
                case "text-after-edge":
                    style.textBaseline = "bottom";
                    break;
            } 
        }
        return style;
    }

    /**
     * @private
     */
    _getFontsize(fontSize, font, nodeData) {
        let size;
        if (fontSize) {
            size = getFloatVal(fontSize, { "zero": false }, nodeData);
        } else if (font) {
            let seg = font.split(/\s+/);
            seg = seg.filter(v => {
                return (getFloatVal(v, {}, nodeData) > 0);
            });
            if (seg.length > 0) {
                size = seg[0];
            }
        }
        return size == null ? 16 : getFloatVal(size, {}, nodeData);
    }

    /**
     * js获取文本显示宽度
     * @param str: 文本
     * @return 文本显示宽度  
     */
    _getTextWidth(str, style) {
        let w = $("body").append($('<span style="' + this._getFontStyle(style) + '" id="textMeasureSvgTextWidth"/>')).find('#textMeasureSvgTextWidth').html(str).width();
        $('#textMeasureSvgTextWidth').remove();
        return w;
    }

    /**
     * @private
     */
    _getFontStyle(style) {
        let fontStyle = "";

        // 1、从样式中获取字体尺寸
        let fontSize = style.fontSize;

        // 2、判断样式中是否包含scale属性
        if (style.scale != null && typeof (style.scale) === "number") {
            fontSize = fontSize * style.scale;
        }
        if (fontSize > 0) {
            fontStyle = "font-size: " + fontSize + "px;";
        }
        if (style.fontName != null) {
            fontStyle += "font-family: " + style.fontName;
        }

        // 如果字体大小等属性没有指定，则查看是否指定了font属性
        if (fontStyle == "" && style.fontStyle != null) {
            fontStyle = style.fontStyle;
        }

        return fontStyle;
    }

    /**
     * 获取节点的一个或多个属性值
     * @private
     * @param {XmlElement} element 
     * @param {Array} attrs 
     * @param {Boolean} isFloat 
     * @returns Object
     */
    _getAttribute(element, attrs) {
        let obj;
        if (Array.isArray(attrs)) {
            obj = {};
            for (let i = 0, ii = attrs.length; i < ii; i++) {
                obj[attrs[i]] = this.getNodeProp(element, attrs[i]);
            }
        } else {
            obj = this.getNodeProp(element, attrs);
        }
        return obj;
    }

    /**
     * 从节点中获取样式，样式信息要么包含在属性中，要么包含在属性Style中，属性优先级>style
     * @private
     * @param {XmlElement} element 
     * @param {String} name 
     * @returns StringValue 
     */
    getNodeProp(element, name) {
        let value;
        try {
            value = element.getAttribute(name);
        } catch (e) {
            return null;
        }
        if (value != null) {
            return value;
        } else {
            let style = element.getAttribute("style");
            if (style == null) {
                return null;
            } else {
                let obj = {};
                let segs = style.split(";");
                for (let i = 0, ii = segs.length; i < ii; i++) {
                    let seg = segs[i].trim();
                    let idx = seg.indexOf(":");
                    if (idx < 1) continue;
                    let key = seg.substring(0, idx);
                    let val = seg.substring(idx + 1);
                    obj[key.trim()] = val.trim();
                }
                return obj[name.trim()];
            }
        }
    }
}

/**
 * SVG符号
 */
class SvgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options={}) {
        super(options);
        this.symbolCollection_ = {};
    }
    
    /**
     * 增加符号对象
     */
    addSymbol(id_, data, bbox) {
        let id = "#" + id_;
        let width = 0;
        let height = 0;
        let stateCount = 1;
        let name = "";
        if (bbox == null || bbox.length == 0) {
            let extent = Extent.createEmpty();
            for (let i = 0; i < data.length; i++) {
                let innerObj = data[i];
                let objBBox = innerObj.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
            }
            width = Extent.getWidth(extent);
            height = Extent.getHeight(extent);
            bbox = extent.slice();   // [0, 0, width, height];  //
        } else {
            width = Extent.getWidth(bbox);
            height = Extent.getHeight(bbox);
        }
        let value = { id, name, data, bbox, width, height, stateCount };
        this.symbolCollection_[id] = value;
    }
    
    /**
     * 获取指定名称的符号
     * @param {String} symbolName 
     * @param {String} objectID 
     * @returns 符号对象
     */
    getSymbol(symbolName, objectID) {
        let symbol = this.symbolCollection_[symbolName];
        if (symbol == null) {
            // console.debug("symbol<" + symbolName + ">不存在");
            return null;
        } else {
            let data = [];
            for (let i = 0, ii = symbol.data.length; i < ii; i++) {
                let innerObj = symbol.data[i].clone();
                innerObj.properties.objectID = objectID;
                data.push(innerObj);
            }
            return Object.assign({}, symbol, { data });
        }
    }
}

/**
 * SVG文件解析 <br>
 * SVG规范参见：https://www.w3.org/TR/SVG2/Overview.html
 */
class SvgDocument {
    constructor(options) {
        // svg文件中定义的符号
        this.symbolManager = options.symbol == null ? new SvgSymbol() : options.symbol;

        // 组对象集合
        this.groupList_ = {};

        // 具有ID属性的geomery集合，该集合中的对象可以被use引用
        this.geometryList_ = {};

        // svg文档属性(svg节点中的信息)
        this.documentInfo_ = {};

        // 画板宽高
        this.canvasWidth_ = options.canvasWidth == null ? 1920 : options.canvasWidth;
        this.canvasHeight_ = options.canvasHeight == null ? 1080 : options.canvasHeight;

        this.maxX_ = -Infinity;
        this.maxY_ = -Infinity;
        this.minX_ = Infinity;
        this.minY_ = Infinity;

        // 计数器
        this.counter = new Counter("SvgFormat");

        // readFeatures执行完毕后的回调
        this.readyCallback_ = options.ready;

        // 样式解析对象
        this.styleParse_ = new SvgStyle(this);

        // 
        this.uidNum_ = 0;
    }

    /**
     * 解析文档
     * @param {Document} xmldoc 
     * @returns ArrayList<Geomertry> list
     */
    parse(xmldoc) {
        // 解析SVG节点信息
        let rootNode = this._parseRootElement(xmldoc);
        this.documentInfo_ = rootNode;

        // 解析样式及符号
        this._parseDefs(xmldoc, rootNode);

        // 解析文档中的样式
        this._parseStyleDef(xmldoc, rootNode);

        // 解析文档中渐变色定义
        this.getStyleParse().parseGradients(xmldoc);

        // 解析填充图案定义
        this._parsePattern(xmldoc);

        // 解析文档中的符号
        this._parseSymbol(xmldoc, rootNode);

        // 逐个解析节点
        let geomList = [];

        // 解析文档内容
        this._parseElements(xmldoc.childNodes, rootNode, geomList);

        // 根据viewBox的范围对图形进行裁切
        if (rootNode.viewBox.length > 0) ;

        // 文档解析后的回调
        if (typeof (this.readyCallback_) === "function") {
            this.readyCallback_({ "document": rootNode, geomList });
        }

        return geomList;
    }

    /**
     * 解析根节点
     * @param {Document} xmldoc 
     * @returns document info
     */
    _parseRootElement(xmldoc) {
        let getSizeVal = function (size) {
            if (size != null) {
                size = size.trim();
                if (size == "" || size.substring(size.length - 1) == "%") ; else {
                    size = getFloatVal(size);
                }
            }
            return size;
        };

        let elements = xmldoc.getElementsByTagName("svg");
        if (elements.length > 0) {
            let width = elements[0].getAttribute("width");
            let height = elements[0].getAttribute("height");
            let bbox = parseViewBox(elements[0].getAttribute("viewBox"));
            return { "nodeType": "root", "viewBox": bbox, "width": getSizeVal(width), "height": getSizeVal(height) };
        } else {
            throw new Error("inValidate svg file");
        }
    }

    /**
     * 解析文档的初始定义节点，该节点包含了全局样式和符号定义等信息
     * @param {*} xmldoc 
     */
    _parseDefs(xmldoc) {
        let elements = xmldoc.getElementsByTagName("defs");
        for (let i = 0, ii = elements.length; i < ii; i++) {
            // 解析样式
            this._parseStyleDef(elements[i]);

            // 解析符号定义
            this._parseSymbol(elements[i]);

            // 解析渐变色定义
            this.getStyleParse().parseGradients(elements[i]);

            // 解析填充图案定义（由于填充对象存在geom子节点，因此需在该对象中将子节点解析完成之后，在访问style的解析功能）
            this._parsePattern(elements[i]);

            // 解析其他节点
            let geomList = [];
            this._parseElements(elements[i].childNodes, { "nodeType": "defs" }, geomList, null, true);
        }
        for (let i = 0, ii = elements.length; i < ii; i++) {
            elements[0].remove();
        }
    }

    /**
     * 解析符号
     * @param {Element} element 
     */
    _parseSymbol(element) {
        let symbolElements = element.getElementsByTagName("symbol");
        for (let x = 0, xx = symbolElements.length; x < xx; x++) {
            let geomList = [];
            let el = symbolElements[x];
            let id = el.getAttribute("id");
            let viewBox = parseViewBox(el.getAttribute("viewBox"));
            this._parseElements(el.childNodes, { "nodeType": "symbol" }, geomList);
            this.symbolManager.addSymbol(id, geomList, viewBox);
        }
    }

    /**
     * 解析样式
     * @param {Element} element 
     */
    _parseStyleDef(element) {
        let styleElements = element.getElementsByTagName("style");
        for (let x = 0, xx = styleElements.length; x < xx; x++) {
            this.getStyleParse().parseStyleElement(styleElements[x]);
        }
    }

    /**
     * 解析填充图案
     * @param {Element} element 
     */
    _parsePattern(element) {
        let patternElements = element.getElementsByTagName("pattern");
        for (let x = 0, xx = patternElements.length; x < xx; x++) {
            let el = patternElements[x];
            let geomList = [];
            this._parseElements(el.childNodes, { "nodeType": "def" }, geomList);
            this.getStyleParse().parsePatternElement(el, geomList);
        }
    }

    /**
     * 解析文档中某个节点的子节点集
     * @param {Array} elements 待解析的节点集
     * @param {Array} geomList 渲染对象集合
     * @param {Array} childList group geom list
     * @param {Object} parentNode 父节点
     * @param {Boolean} isDefNode 当前解析的节点是否为defs中的子节点
     * @private 
     */
    _parseElements(elements, parentNode, geomList, childList, isDefNode = false) {
        for (let i = 0, ii = elements.length; i < ii; i++) {
            let element = elements[i];
            if (ClassUtil.typeof(element) === "DocumentType") continue;

            let nodeData = this._parseElement(element, geomList, childList, parentNode, isDefNode);
            if (nodeData.nodeType === "shape") {
                continue;
            } else if (nodeData.nodeType === "def") {
                continue;
            } else if (nodeData.nodeType === "other") {
                continue;
            } else {
                // group element
                if (element.childNodes.length > 0) {
                    let groupGeomList = [];
                    this._parseElements(element.childNodes, nodeData, geomList, groupGeomList, isDefNode);
                    if (nodeData.id != null && groupGeomList.length > 0) {
                        this._saveGroup(nodeData.id, groupGeomList, nodeData);
                    }
                }
            }
        }
    }

    /**
     * 解析svg中节点
     * @param {XmlElement} element 
     * @param {Array} geomList 
     * @returns Object {nodeType:"shape/g/other"}
     */
    _parseElement(element, geomList, groupGeomList, parentNode, isDefNode) {
        let nodeData = { "nodeType": "other", "parentNode": parentNode };
        if (element == null || element.nodeName == null || element.nodeName == "" || element.nodeName == "desc" ||
            element.nodeName == "#text" || element.nodeName == "#comment" ||
            element.nodeName == "style" || element.nodeName == "radialGradient" || element.nodeName == "linearGradient") {
            return nodeData;
        }

        // 解析样式信息
        let eleAttr = this.getStyleParse().getElementAttr(element, parentNode == null ? null : parentNode.eleAttr, nodeData);
        nodeData.eleAttr = eleAttr;

        // 解析旋转、缩放、平移等信息
        let transData = parseTransform(element.getAttribute("transform"));
        if (transData.length > 0) {
            // 处理从父对象继承到的transData属性, transform的顺序为：先父亲后自己
            if (eleAttr.transData != null && eleAttr.transData.length > 0) {
                eleAttr.transData = eleAttr.transData.concat(transData);
            } else {
                eleAttr.transData = transData;
            }
        }

        // 解析节点中的信息
        let id = element.getAttribute("id");
        let offsetX = parentNode != null && !isNaN(parentNode.x) ? parentNode.x : 0;
        let offsetY = parentNode != null && !isNaN(parentNode.y) ? parentNode.y : 0;
        if (offsetX > 0 || offsetY > 0) {
            eleAttr.transData.unshift({ "action": "translate", "value": [offsetX, offsetY] });
        }

        if (element.nodeName === "g" || element.nodeName === "svg" || element.nodeName == "switch") {
            let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
            let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
            let width = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
            let height = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
            let bbox = parseViewBox(element.getAttribute("viewBox"));
            nodeData = Object.assign(nodeData, { "nodeType": "g", id, eleAttr, x, y, width, height, "viewBox": bbox });
        } else if (element.nodeName === "pattern") {
            nodeData = { "nodeType": "other" };
        } else {
            let geometry;
            let properties = {}; //this.topoService.parseProperties(element);
            let style = {};

            nodeData = Object.assign(nodeData, { "nodeType": "shape", id, eleAttr });

            // 解析几何对象
            if (element.nodeName === "line") {
                // 线段
                let x1 = getFloatVal(element.getAttribute("x1"), { "isX": true }, nodeData);
                let y1 = getFloatVal(element.getAttribute("y1"), { "isX": false }, nodeData);
                let x2 = getFloatVal(element.getAttribute("x2"), { "isX": true }, nodeData);
                let y2 = getFloatVal(element.getAttribute("y2"), { "isX": false }, nodeData);
                let coords = [[x1, y1], [x2, y2]];
                geometry = new Polyline({coords, style, properties});
                this.counter.add("line");
            } else if (element.nodeName === "polyline") {
                // 折线
                let str = element.getAttribute("points");
                if (str != null) {
                    let seq = str.trim().split(/\s*,\s*|\s+/);
                    let coords = [];
                    for (let j = 0, jj = seq.length; j < jj; j += 2) {
                        coords.push([getFloatVal(seq[j], { "isX": true }, nodeData), getFloatVal(seq[j + 1], { "isX": false }, nodeData)]);
                    }
                    geometry = new Polyline({coords, style, properties});
                }
                this.counter.add("polyline");
            } else if (element.nodeName === "path") {

                // 路径
                let str = this.getStyleParse().getNodeProp(element, "d");
                if (str != null) {
                    let path = SvgPath.parse(str);
                    let commands = path.commands;
                    let childGeometrys = path.childGeometrys;
                    let coords = path.coords;
                    geometry = new Path({coords, style, commands, childGeometrys, properties});
                    this.counter.add("path");
                }
            } else if (element.nodeName === "circle") {
                // 圆
                let x = getFloatVal(element.getAttribute("cx"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("cy"), { "isX": false }, nodeData);
                let radius = getFloatVal(element.getAttribute("r"), { "isX": true }, nodeData);
                geometry = new Circle({x, y, radius, style, properties});
                this.counter.add("circle");
            } else if (element.nodeName === "ellipse") {
                let x = getFloatVal(element.getAttribute("cx"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("cy"), { "isX": false }, nodeData);
                let radiusX = getFloatVal(element.getAttribute("rx"), { "isX": true }, nodeData);
                let radiusY = getFloatVal(element.getAttribute("ry"), { "isX": false }, nodeData);
                geometry = new Ellipse({x, y, radiusX, radiusY, style, properties});
                this.counter.add("ellipse");
            } else if (element.nodeName === "polygon") {
                // 多边形
                let str = element.getAttribute("points");
                if (str != null) {
                    let seq = str.trim().split(/\s*,\s*|\s+/);
                    let coords = [];
                    for (let j = 0, jj = seq.length; j < jj; j += 2) {
                        coords.push([getFloatVal(seq[j], { "isX": true }, nodeData), getFloatVal(seq[j + 1], { "isX": false }, nodeData)]);
                    }
                    if (coords.length > 2) {
                        geometry = new Polygon({coords, style, properties});
                        this.counter.add("polygon");
                    }
                }
            } else if (element.nodeName === "rect") {
                // 矩形
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
                // 圆角矩形属性
                let rx = getFloatVal(element.getAttribute("rx"), { "isX": true }, nodeData);
                let ry = getFloatVal(element.getAttribute("ry"), { "isX": false }, nodeData);
                
                geometry = new Rect({ x, y, rx, ry, "width":w, "height":h, style, properties });
                this.counter.add("rect");
            } else if (element.nodeName === "use") {
                // 符号引用
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);

                let name = element.getAttribute("xlink:href");
                if (name == null) {
                    name = element.getAttribute("href");
                }
                let symbol = this.symbolManager.getSymbol(name, properties.objectID);
                if (symbol != null) {
                    if (w == 0 || h == 0) {
                        w = symbol.bbox[2] - symbol.bbox[0];
                        h = symbol.bbox[3] - symbol.bbox[1];
                    }
                    geometry = new Symbol({
						"x": x + w / 2,
                        "y": y + h / 2,
						"symbol": { "symbolName": name, "childGeometrys": symbol.data, "width": symbol.width, "height": symbol.height, "bbox": symbol.bbox }, 
						"width": w, 
						"height": h,
                        "style": Object.assign(style, { "addBorder": false }),
                        "properties": properties});
                } else {
                    let group = this._getGroup(name);
                    if (group != null) {
                        let coords = [[x, y], [group.extent[0], group.extent[1]], [group.extent[2], group.extent[3]]];
                        if (w == 0 || h == 0) {
                            w = Extent.getWidth(group.extent);
                            h = Extent.getHeight(group.extent);
                        }
                        if (eleAttr.transData == null) {
                            eleAttr.transData = [];
                        }
                        eleAttr.transData.push({ "action": "translate", "value": [x, y] });
                        let bbox = group.viewBox;
                        geometry = new Group({coords,
                            "style": Object.assign(style, { "addBorder": false, "width": w, "height": h, "viewBox": bbox }),
                            "childGeometrys": group.geometryList,
                            "extent": group.extent,
                            "properties": {}});
                    } else {
                        let geom = this._getGeometry(name);
                        if (geom != null) {
                            if (eleAttr.transData == null) {
                                eleAttr.transData = [];
                            }
                            eleAttr.transData.push({ "action": "translate", "value": [x, y] });
                            geometry = geom;
                        }
                    }
                }
                this.counter.add("use");
            } else if (element.nodeName === "text") {
                // 文本
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let text = this._getNodeText(element);
                geometry = new Text({x, y, style, text, properties});
                this.counter.add("text");
            } else if (element.nodeName === "image") {
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
                let xlink = element.getAttribute("xlink:href");
                let href = element.getAttribute("href");
                if (xlink == null && href == null) {
                    console.error("image argument error");
                } else {
                    geometry = new Image({
                        "style": style,
                        "properties": properties,
						"src": (href == null ? xlink : href),
                        "uid": (href != null ? href : this.getUID()),
                        "x": x,
                        "y": y,
                        "width": w, 
                        "height": h
                    });
                    this.counter.add("image");
                }
            } else if (element.nodeName === "title" || element.nodeName == "desc") {
                nodeData.nodeType = "other";
            } else {
                nodeData.nodeType = "other";
                console.info("unknow type:", element.nodeName);
            }

            if (geometry != null) {
                // 1. 创建过程附加的style
                let addStyle = geometry.getStyle();

                // 2. element中包含的style
                style = this.getStyleParse().getGeomStyle(geometry, eleAttr, nodeData);

                // 合并至对象样式中
                geometry.setStyle(Object.assign({}, addStyle, style));

                // 数据Load之后进行矩阵变换，然后交由GB进行渲染
                geometry.transform(Transform.createByData(eleAttr.transData));

                // 加入到结果集中
                if (!isDefNode) geomList.push(geometry);
                // 加入到Geomerty中
                if (nodeData.id != null) {
                    this._saveGeometry(nodeData.id, geometry);
                }
                // 加入组对象中
                if (groupGeomList != null) groupGeomList.push(geometry);
            }
        }

        return nodeData;
    }

    /**
     * 添加至组对象集合中
     * @param {*} id 
     * @param {*} list 
     * @param {*} attr 
     */
    _saveGroup(id, list, attr) {
        this.groupList_["#" + id] = { attr, list };
    }

    /**
     * 获取分组对象
     * @param {*} id 
     */
    _getGroup(id) {
        let group = this.groupList_[id];
        if (group == null) {
            return null;
        } else {
            console.info("use group" + id);
            let geometryList = [];
            let extent = Extent.createEmpty();
            for (let i = 0, ii = group.list.length; i < ii; i++) {
                let innerObj = group.list[i].clone();
                let objBBox = innerObj.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
                geometryList.push(innerObj);
            }

            return Object.assign({}, group.attr, { geometryList, extent });
        }
    }

    /**
     * 
     * @param {*} id 
     * @param {*} geometry 
     */
    _saveGeometry(id, geometry) {
        this.geometryList_["#" + id] = geometry;
    }

    _getGeometry(id) {
        let geometry = this.geometryList_[id];
        if (geometry == null) {
            return null;
        } else {
            console.info("use geometry" + id);
            return geometry.clone();
        }
    }

    _getNodeText(node) {
        let text = "";
        if (node.childNodes) {
            for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
                let val = node.childNodes[i].nodeValue;
                val = (val == null ? XmlUtil.getNodeValue(node.childNodes[i]).trim() : val.trim());
                text += val + " ";
            }
        }
        return text.trim();
    }

    getStyleParse() {
        return this.styleParse_;
    }

    /**
     * 文档宽度，viewBox优先，svg中的width其次，两者都为空时取canvas的宽度
     * 该属性可用于计算百分比的宽高
     * @returns width
     */
    getDocumentWidth() {
        let bbox = this.documentInfo_.viewBox;
        if (bbox != null && bbox.length > 0) {
            return bbox[2] - bbox[0];
        } else {
            return this.documentInfo_.width == null ? this.canvasWidth_ : this.documentInfo_.width;
        }
    }

    /**
     * 文档高度，viewBox优先，svg中的height其次，两者都为空时取canvas的高度
     * 该属性可用于计算百分比的宽高
     * @returns height
     */
    getDocumentHeight() {
        let bbox = this.documentInfo_.viewBox;
        if (bbox != null && bbox.length > 0) {
            return bbox[3] - bbox[1];
        } else {
            return this.documentInfo_.height == null ? this.canvasHeight_ : this.documentInfo_.height;
        }
    }

    /**
     * 获取文档信息
     * @returns Object
     */
    getDocumentInfo() {
        return this.documentInfo_;
    }

    getUID(pre = "ID_") {
        this.uidNum_++;
        return pre + this.uidNum_;
    }
}

/**
 * SVG格式数据解析 <br>
 * SVG规范参见：https://www.w3.org/TR/SVG2/Overview.html
 */
class SvgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        this.document_ = new SvgDocument(options);
    }

    /**
     * 读取svg文档中的几何节点
     * @param {Document} xmldoc 
     * @returns featureList
     */
    readFeatures(xmldoc) {
        if (xmldoc == null) {
            throw new Error("SVG文档错误");
        }

        return this.document_.parse(xmldoc);
    }

    getDocument() {
        return this.document_;
    }
}

/**
 * 加载SVG文件
 * @private
 * @param {Object} options
 * @returns {Object} 图形对象{ graph, source, symbol, viewBox }
 */
function loadSVGFile(options) {
    let fileUrl = options.fileUrl;
    let container = options.container;
    let loadCallback = options.success;
    let document = options.document;
    let usePixelCoord = options.usePixelCoord === true ? true : false;
    let allowStyleScale = options.allowStyleScale == null ? true : options.allowStyleScale;
    let viewBox = null;

    // 校验容器参数
    if (container == "") {
        throw new Error("初始化失败，container不能为空.")
    } else {
        let containerObj_ = DomUtil.get(container);
        let wrapObj_ = DomUtil.get(containerObj_.id + "_wrap");
        if (wrapObj_ != null) {
            wrapObj_.parentElement.remove();
        }
    }

    // 建立图形对象
    let graph = new Graph({
        "target": container,
        "layers": [],
        "originAtLeftTop": true,
        "fullView": true,
        "filter": options.filter,
        "filterOptions": options.filterOptions,
        "mouse": (options.mouse == null ? true : options.mouse)
    });
    let size = graph.getSize();
    let symbol = new SvgSymbol();

    // 建立SVG数据源对象
    let source = new VectorSource({
        "dataType": "xml",
        "format": new SvgFormat({
            "canvasWidth": size.width,
            "canvasHeight": size.height,
            "symbol": symbol,
            "ready": function (result) {
                viewBox = result.document.viewBox;
            }
        })
    });

    // 建立SVG渲染数据图层
    let layer = new Layer({
        "source": source,
        "usePixelCoord": usePixelCoord,
        "style": { "minFontSize": 0, "allowStyleScale": allowStyleScale }
    });
    graph.addLayer(layer);

    // 加载文档内容
    if (document == null && fileUrl != null) {
        source.loadFile(fileUrl, function (xmlDocument) {
            if (xmlDocument == null) {
                return false;
            } else {
                if (viewBox != null && viewBox.length > 0) {
                    if (viewBox.length === 4) {
                        graph.showExtent(viewBox);
                    }
                } else {
                    graph.render();
                }
                if (typeof (loadCallback) == "function") {
                    loadCallback(xmlDocument);
                }
            }
        }, loadCallback);
    } else if (document != null) {
        let listData = source.getFormat().readFeatures(document);

        // 加入到数据源中
        source.clearData();
        source.add(listData);
        // 建立空间索引
        source.buildIndex();
        if (viewBox != null && viewBox.length > 0) {
            if (viewBox.length === 4) {
                graph.showExtent(viewBox);
            }
        } else {
            graph.render();
        }
    }

    return { graph, source, symbol, viewBox }
}

/**
 * 加载CIMG文件
 * @private
 * @param {Object} options 
 * @returns {Object} 图形对象{ graph, source, symbol }
 */
function loadCimgFile(options) {
    let fileUrl = options.fileUrl;
    let container = options.container;
    let loadCallback = options.success;
    let usePixelCoord = options.usePixelCoord === true ? true : false;
    let allowStyleScale = options.allowStyleScale == null ? true : options.allowStyleScale;

    // 校验容器参数
    if (container == "") {
        throw new Error("初始化失败，container不能为空.")
    } else {
        let containerObj_ = DomUtil.get(container);
        let wrapObj_ = DomUtil.get(containerObj_.id + "_wrap");
        if (wrapObj_ != null) {
            wrapObj_.remove();
        }
    }
    let source, layer, symbol;
    // 建立图形对象
    let graph = new Graph({
        "target": container,
        "layers": [],
        "originAtLeftTop": true,
        "fullView": true,
        "mouse": (options.mouse == null ? true : options.mouse)
    });

    symbol = new CimgSymbol();

    // 建立SVG数据源对象
    source = new VectorSource({
        "dataType": "json",
        "format": new CimgFormat({
            "symbol": symbol
        })
    });

    // 建立SVG渲染数据图层
    layer = new Layer({
        "source": source,
        "usePixelCoord": usePixelCoord,
        "style": { "minFontSize": 0, "symbolPrior":true, "allowStyleScale": allowStyleScale }
    });
    graph.addLayer(layer);

    // 加载符号
    _getSymbolPromise(symbol).then(function () {
        // 加载文档内容
        if (fileUrl != null) {
            _loadFilePromise(source, fileUrl).then(function (file) {
                if (file == null) {
                    return false;
                } else {
                    if (file != null && file.backgroundColor != null) {
                        graph.setBgColor(Color.fromString(getCimgColor(file.backgroundColor)).toString());
                    } else {
                        graph.setBgColor(null);
                    }
                    graph.setView(null);
                    if (typeof (loadCallback) == "function") {
                        loadCallback(file);
                    }
                }
            });
        }
    });

    return { graph, source, symbol }
}

function _getSymbolPromise(symbol) {
    let p = new Promise(function (resolue, reject) {
        symbol.loadFile(function (file) {
            resolue(file);
        });
    });
    return p;
}
function _loadFilePromise(source, fileUrl) {
    let p = new Promise(function (resolue, reject) {
        source.loadFile(fileUrl, function (file) {
            resolue(file);
        });
    });
    return p;
}

//export {loadSVGFile, loadCimgFile};
/**
 * 快捷方式
 * @class
 */
const Ladder = {
	loadSVGFile,
	loadCimgFile
};

const defaultTileGridOption = {
    minZoom: 0,
    tileSize: 256
};

/*
 * 切片范围，样例[0,0,16,16]
 */
class TileRange {
    /**
     * 构造函数
     */
    constructor(minX, maxX, minY, maxY) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }

    /**
     * 创建切片范围
     */
    static create(minX, maxX, minY, maxY) {
        return new TileRange(minX, maxX, minY, maxY);
    }

    /**
     * 判断是否包含某切片
     */
    contains(tileCoord) {
        return this.containsXY(tileCoord[1], tileCoord[2]);
    }

    /**
     * 判断是否包含某切片范围.
     */
    containsTileRange(tileRange) {
        return this.minX <= tileRange.minX && tileRange.maxX <= this.maxX && this.minY <= tileRange.minY && tileRange.maxY <= this.maxY;
    }

    /**
     * 判断是否包含某切片
     */
    containsXY(x, y) {
        return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY;
    }

    /**
     * 判断是否相等
     */
    equals(tileRange) {
        return this.minX == tileRange.minX && this.minY == tileRange.minY && this.maxX == tileRange.maxX && this.maxY == tileRange.maxY;
    }

    /**
     * 扩展切片范围
     * @param {TileRange} tileRange 切片范围.
     */
    extend(tileRange) {
        if (tileRange.minX < this.minX) {
            this.minX = tileRange.minX;
        }
        if (tileRange.maxX > this.maxX) {
            this.maxX = tileRange.maxX;
        }
        if (tileRange.minY < this.minY) {
            this.minY = tileRange.minY;
        }
        if (tileRange.maxY > this.maxY) {
            this.maxY = tileRange.maxY;
        }
    }

    getWidth() {
        return this.maxX - this.minX + 1;
    }

    getHeight() {
        return this.maxY - this.minY + 1;
    }

    getSize() {
        return {"width": this.getWidth(), "height": this.getHeight()};
    }

    /**
     * 判断是否相交
     */
    intersects(tileRange) {
        return this.minX <= tileRange.maxX && this.maxX >= tileRange.minX && this.minY <= tileRange.maxY && this.maxY >= tileRange.minY;
    }
}

/*
 * 切片块（该切片块包含XYZ三个属性）
 */
class TileCoord {
    /**
     * 构造函数
     */
    constructor() {
        this.coord = [0, 0, 0];
    }

    /**
     * Create Tile coordinate.
     */
    static create(z, x, y) {
        return [z, x, y];
    }

    /**
     * Key.
     */
    getKeyZXY(z, x, y) {
        return z + '/' + x + '/' + y;
    }

    /**
     * Hash.
     */
    hash(tileCoord) {
        return (tileCoord[1] << tileCoord[0]) + tileCoord[2];
    }
}

/**
 * 切片网格类，提供在不同的分辨率下所需使用的Level计算，切片的坐标计算，切片的下一层切片计算等方法
 */
class TileGrid {
    /**
     * 构造函数
     */
    constructor(args) {
        let options = {};
        Object.assign(options, defaultTileGridOption, args);

        this.tileSize = options.tileSize;
        this.minZoom = options.minZoom;

        // 密度（数组，该值不可为空）
        ClassUtil.assert(options.resolutions !== undefined, 1040);
        this.resolutions = options.resolutions;
        this.maxZoom = this.resolutions.length - 1;

        // 范围（该值不可为空）
        ClassUtil.assert(options.extent !== undefined, 1040);
        this.extent = options.extent;
        if (options.origin !== undefined) {
            this.origin = options.origin;
        } else {
            this.origin = Extent.getTopLeft(this.extent);
        }
    }

    /**
     * 返回某一层的分辨率
     */
    getResolution(z) {
        ClassUtil.assert(this.minZoom <= z && z <= this.maxZoom, 'given z is not in allowed range (%s <= %s <= %s)', this.minZoom, z, this.maxZoom);
        return this.resolutions[z];
    }

    /**
     * 返回切片大小
     */
    getTileSize() {
        if(Array.isArray(this.tileSize)) {
            return this.tileSize;
        } else {
            return [this.tileSize, this.tileSize];
        }
    }

    /**
     * 返回原点位置
     */
    getOrigin() {
        return this.origin;
    }

    /**
     * 获取某切片块坐标范围
     */
    getTileCoordExtent(tileCoord) {
        let origin = this.getOrigin(tileCoord[0]);
        let resolution = this.getResolution(tileCoord[0]);
        let tileSize = this.getTileSize();
        let minX = origin[0] + tileCoord[1] * tileSize[0] * resolution;
        let minY = origin[1] + tileCoord[2] * tileSize[1] * resolution;
        let maxX = minX + tileSize[0] * resolution;
        let maxY = minY + tileSize[1] * resolution;
        return Extent.create(minX, minY, maxX, maxY);
    }

    /**
     * 根据坐标范围和分辨率取 切片块范围
     */
    getTileRangeForExtentAndResolution(extent, resolution) {
        let tileCoord = this.getTileCoordForXYAndResolution_(extent[0], extent[1], resolution, false);
        let minX = tileCoord[1];
        let minY = tileCoord[2];
        tileCoord = this.getTileCoordForXYAndResolution_(extent[2], extent[3], resolution, true);
        return TileRange.create(minX, tileCoord[1], minY, tileCoord[2]);
    }

    /**
     * 根据坐标和分辨率取 切片块
     */
    getTileCoordForXYAndResolution_(x, y, resolution, reverseIntersectionPolicy = 0) {
        let z = this.getZForResolution(resolution);
        let scale = resolution / this.getResolution(z);
        let origin = this.origin;
        let tileSize = this.getTileSize();

        let adjustX = reverseIntersectionPolicy ? 0.5 : 0;
        let adjustY = reverseIntersectionPolicy ? 0 : 0.5;

        let xFromOrigin = Math.floor((x - origin[0]) / resolution + adjustX);
        let yFromOrigin = Math.floor((y - origin[1]) / resolution + adjustY);

        let tileCoordX = scale * xFromOrigin / tileSize[0];
        let tileCoordY = scale * yFromOrigin / tileSize[1];

        if (reverseIntersectionPolicy) {
            tileCoordX = Math.ceil(tileCoordX) - 1;
            tileCoordY = Math.ceil(tileCoordY) - 1;
        } else {
            tileCoordX = Math.floor(tileCoordX);
            tileCoordY = Math.floor(tileCoordY);
        }

        return TileCoord.create(z, tileCoordX, tileCoordY);
    }

    /**
     * Get a tile coordinate given a map coordinate and zoom level.
     * @param {Coordinate} coordinate Coordinate.
     * @param {number} z Zoom level.
     * @param {TileCoord=} opt_tileCoord Destination TileCoord object.
     * @return {TileCoord} Tile coordinate.
     * @api
     */
    getTileCoordForCoordAndZ(coordinate, z, opt_tileCoord) {
        let resolution = this.getResolution(z);
        return this.getTileCoordForXYAndResolution_(coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
    }

    /**
     * 根据分辨率resolution寻找最靠近的Level
     */
    getZForResolution(resolution, opt_direction) {
        let z = View.linearFindNearest(this.resolutions, resolution, opt_direction || 0);
        return z;
    }
}

/*
 * @namespace LineUtil
 *
 * Various utility functions for polyline points processing, used by Leaflet internally to make polylines lightning-fast.
 * 多段线点处理的各种实用功能，由Leaflet内部使用，使多段线闪电般快速
 */

// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
// 使用顶点简化和Douglas-Peucker简化来简化多段线。
// Improves rendering performance dramatically by lessening the number of points to draw.
// 通过减少要绘制的点数，显著提高了渲染性能。

// @function simplify(points: Point[], tolerance: Number): Point[]
// Dramatically reduces the number of points in a polyline while retaining its shape and returns a new array of simplified points, 
// 在保持多段线形状的同时显著减少了多段线中的点的数量，并返回简化点的新阵列，
// using the [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
// Used for a huge performance boost when processing/displaying Leaflet polylines for each zoom level and also reducing visual noise. 
// 用于在处理/显示每个缩放级别的传单多段线时大幅提高性能，同时减少视觉噪音
// tolerance affects the amount of simplification (lesser value means higher quality but slower and with more points).
// 公差会影响简化的数量（较小的值意味着较高的质量，但速度较慢且点数较多）
// Also released as a separated micro-library [Simplify.js](https://mourner.github.io/simplify-js/).


/**
 * polyline简化
 * @param {Array} points polyline坐标
 * @param {number} tolerance 公差
 * @returns points
 */
function simplify(points, tolerance) {
    if (!tolerance || !points.length) {
        return points.slice();
    }

    var sqTolerance = tolerance * tolerance;

    // stage 1: vertex reduction  阶段1：根据距离进行简化
    points = _reducePoints(points, sqTolerance);

    // stage 2: Douglas-Peucker simplification   第二阶段：道格拉斯-派克简化
    points = _simplifyDP(points, sqTolerance);

    return points;
}

/**
 * Ramer-Douglas-Peucker simplification
 * 道格拉斯-派克简化是一种用于抽稀曲线的算法，也称为Douglas-Peucker算法。该算法的目的是在保留曲线形状的前提下，尽可能减少曲线上的点数，从而实现对曲线的简化。
 * 算法的基本思想是：
 * 1. 在曲线上选取一个起点和终点，并计算该线段上各点到起点和终点之间的距离，
 * 2. 将距离超过阈值的点作为分割点，然后将这些分割点之间的线段用其两端点的连线代替，从而得到一条更简单的折线。
 * 3. 通过反复应用这个过程，可以将复杂的曲线近似为一条相对简单的折线，从而实现对曲线的简化。
 * see https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
 * @private
 * @param {*} points 
 * @param {*} sqTolerance 
 * @returns Array
 */
function _simplifyDP(points, sqTolerance) {

    var len = points.length,
        ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
        markers = new ArrayConstructor(len);

    markers[0] = markers[len - 1] = 1;

    _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

    var i, newPoints = [];
    for (i = 0; i < len; i++) {
        if (markers[i]) {
            newPoints.push(points[i]);
        }
    }

    return newPoints;
}

function _simplifyDPStep(points, markers, sqTolerance, first, last) {
    var maxSqDist = 0,
        index, i, sqDist;

    for (i = first + 1; i <= last - 1; i++) {
        sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        markers[index] = 1;
        _simplifyDPStep(points, markers, sqTolerance, first, index);
        _simplifyDPStep(points, markers, sqTolerance, index, last);
    }
}

// reduce points that are too close to each other to a single point
function _reducePoints(points, sqTolerance) {
    var reducedPoints = [points[0]];

    for (var i = 1, prev = 0, len = points.length; i < len; i++) {
        if (_sqDist(points[i], points[prev]) > sqTolerance) {
            reducedPoints.push(points[i]);
            prev = i;
        }
    }
    if (prev < len - 1) {
        reducedPoints.push(points[len - 1]);
    }
    return reducedPoints;
}

// square distance (to avoid unnecessary Math.sqrt calls)
function _sqDist(p1, p2) {
    var dx = p2[0] - p1[0],
        dy = p2[1] - p1[1];
    return dx * dx + dy * dy;
}

/**
 * return closest point on segment or distance to that point
 * 返回线段上最近的点或到该点的距离
 * @private
 */
function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
    var x = p1[0],
        y = p1[1],
        dx = p2[0] - x,
        dy = p2[1] - y,
        dot = dx * dx + dy * dy,
        t;

    if (dot > 0) {
        t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot;

        if (t > 1) {
            x = p2[0];
            y = p2[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return sqDist ? dx * dx + dy * dy : new Point(x, y);
}

const LatLngType = {
    GPS: 1,
    GCJ02: 2,
    BD09: 3
};

/**
 * 坐标投影转换类
 */
class Projection {
    constructor() {
    }

    /**
     * 地理坐标转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project([lng, lat]) { return []; }

    /**
     * 平面坐标转地理坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @return {number} 经纬度
     */
    unproject([x, y], original = false) { return []; }

    /**
     * 投影后的平面坐标范围
     */
    get bound() { return null; }
}

/**
 * 球体墨卡托
 */
class WebMercator extends Projection {
    constructor() {
        super();
        /**
         * 地球半径
         */
        GCJ02.R = 6378137;
    }

    /**
     * 投影后的平面坐标范围
     */
    get bound() {
        return new Bound(-Math.PI * GCJ02.R, Math.PI * GCJ02.R, Math.PI * GCJ02.R, -Math.PI * GCJ02.R);
    }

    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project(coords) {
        //from leaflet & wiki
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                let [lng, lat] = coords;
                const d = Math.PI / 180, sin = Math.sin(lat * d);
                return [MathUtil.toFixed(GCJ02.R * lng * d, 2), MathUtil.toFixed(GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2, 2)];
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [lng, lat] = coords[i];
                    const d = Math.PI / 180, sin = Math.sin(lat * d);
                    coordList.push([MathUtil.toFixed(GCJ02.R * lng * d, 2), MathUtil.toFixed(GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2, 2)]);
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }

    /**
     * 平面坐标转经纬度
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @return {number} 经纬度
     */
    unproject(coords) {
        const d = 180 / Math.PI;
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                let [x, y] = coords;
                return [MathUtil.toFixed(x * d / GCJ02.R, 6), MathUtil.toFixed((2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d, 6)];
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [x, y] = coords[i];
                    coordList.push([MathUtil.toFixed(x * d / GCJ02.R, 6), MathUtil.toFixed((2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d, 6)]);
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }
}

/**
 * 带国测局02偏移的球体墨卡托投影
 * @remarks https://github.com/wandergis/coordtransform
 */
class GCJ02 extends Projection {
    /**
     * 创建带国测局02偏移的球体墨卡托投影
     * @remarks 参考经纬度坐标类型，不同类型走不同数据处理流程
     * @param {LatLngType} type - 经纬度坐标类型
     */
    constructor(type = LatLngType.GPS) {
        super();
        this._type = type;
    }
    /**
     * 投影后的平面坐标范围
     */
    get bound() {
        return new Bound(-Math.PI * GCJ02.R, Math.PI * GCJ02.R, Math.PI * GCJ02.R, -Math.PI * GCJ02.R);
    }
    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    _project([lng, lat]) {
        if (this._type == LatLngType.GPS) {
            [lng, lat] = GCJ02.wgs84togcj02(lng, lat);
        }
        //from leaflet & wiki
        const d = Math.PI / 180, sin = Math.sin(lat * d);
        return [GCJ02.R * lng * d, GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2];
    }

    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project(coords) {
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                return this._project(coords)
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    coordList.push(this._project(coords[i]));
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }

    /**
     * 平面坐标转经纬度
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @param {boolean} original - 是否转换回偏移前经纬度坐标
     * @return {number} 经纬度
     */
    unproject([x, y], original = false) {
        const d = 180 / Math.PI;
        let [lng, lat] = [x * d / GCJ02.R, (2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d];
        if (original) {
            if (this._type == LatLngType.GPS) {
                [lng, lat] = GCJ02.gcj02towgs84(lng, lat);
            }
        }
        return [lng, lat];
    }
    /**
     * WGS-84 转 GCJ-02
     * @remarks https://github.com/wandergis/coordtransform
     * @param {number} lng
     * @param {number} lat
     * @returns {number} 经纬度
     */
    static wgs84togcj02(lng, lat) {
        let dlat = this._transformlat(lng - 105.0, lat - 35.0);
        let dlng = this._transformlng(lng - 105.0, lat - 35.0);
        let radlat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radlat);
        magic = 1 - GCJ02.ee * magic * magic;
        let sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((GCJ02.R * (1 - GCJ02.ee)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (GCJ02.R / sqrtmagic * Math.cos(radlat) * Math.PI);
        let mglat = lat + dlat;
        let mglng = lng + dlng;
        return [mglng, mglat];
    }

    /**
     * GCJ-02 转换为 WGS-84
     * @remarks https://github.com/wandergis/coordtransform
     * @param {number} lng
     * @param {number} lat
     * @returns {number} 经纬度
     */
    static gcj02towgs84(lng, lat) {
        let dlat = this._transformlat(lng - 105.0, lat - 35.0);
        let dlng = this._transformlng(lng - 105.0, lat - 35.0);
        let radlat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radlat);
        magic = 1 - GCJ02.ee * magic * magic;
        let sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((GCJ02.R * (1 - GCJ02.ee)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (GCJ02.R / sqrtmagic * Math.cos(radlat) * Math.PI);
        let mglat = lat + dlat;
        let mglng = lng + dlng;
        return [lng * 2 - mglng, lat * 2 - mglat];
    }

    static _transformlat(lng, lat) {
        let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    static _transformlng(lng, lat) {
        let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    }

    /**
     * 判断是否在国内，不在国内则不做偏移
     * @remarks 此判断欠妥，暂不采用！
     * @param {number} lng
     * @param {number} lat
     * @returns {boolean} 是否在中国范围内
     */
    static out_of_china(lng, lat) {
        // 纬度 3.86~53.55, 经度 73.66~135.05
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    }
}

/**
 * 地球半径
 */
GCJ02.R = 6378137.0;

/**
 * 不知含义的常数，用于WGS-84 与 GCJ-02 之间的转换
 */
GCJ02.ee = 0.00669342162296594323;

// console.info(distVincenty({ "lon": 125.3234, "lat": 38.23423 }, { "lon": 125.8234, "lat": 38.33423 }))

/**
 * 线坐标处理类
 */
class LineString {
    constructor() {
        this.points = [];
    }

    addPoint(point) {
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    getLength() {
        let totalLength = 0;
        for (let i = 1; i < this.points.length; i++) {
            let p1 = this.points[i - 1];
            let p2 = this.points[i];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        return totalLength;
    }

    getStart() {
        return this.points[0];
    }

    getEnd() {
        return this.points[this.points.length - 1];
    }

    /**
     * 获取沿线上的点坐标
     */
    static getLinePoint(flatCoords, interval) {
        let list = [];
        for (let i = 0; i < flatCoords.length - 1; i++) {
            this._getLineSegmentPoint(list, flatCoords[i], flatCoords[i + 1], interval);
        }
        return list;
    }

    /**
     * @private
     */
    static _getLineSegmentPoint(list, p1, p2, interval = 5) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        let xStep = (x2 - x1) * interval / dist;
        let yStep = (y2 - y1) * interval / dist;
        let idx = 1;
        let newX = x1 + idx * xStep;
        let newY = y1 + idx * yStep;
        while (newX >= Math.min(x1, x2) && newX <= Math.max(x1, x2) && newY >= Math.min(y1, y2) && newY <= Math.max(y1, y2)) {
            list.push([newX, newY]);
            idx += 1;
            newX = x1 + idx * xStep;
            newY = y1 + idx * yStep;
        }
    }

    /**
     * 计算延伸线
     * @param {*} line 
     * @param {*} length 
     * @returns Array
     */
    static extendLine(line, length) {
        var [x1, y1] = line[0];
        var [x2, y2] = line[1];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy);
        var extendX = dx / len * length;
        var extendY = dy / len * length;
        return [[x1 + extendX, y1 + extendY], [x2 + extendX, y2 + extendY]];
    }

    /**
     * 已知点、线段，求垂足
     * 垂足可能在线段上，也可能在线段延长线上。
     * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
     * @param p 点；[经度,纬度]；例：[116.35,40.08]
     *
     * @return point 返回垂足坐标
     */
    static getFootPoint(line, p) {
        var p1 = line[0];
        var p2 = line[1];
        var dx = p2[0] - p1[0];
        var dy = p2[1] - p1[1];
        var cross = dx * (p[0] - p1[0]) + dy * (p[1] - p1[1]);
        var d2 = dx * dx + dy * dy;
        var u = cross / d2;
        return [(p1[0] + u * dx), (p1[1] + u * dy)]
    }

    /**
     * 读取坐标数组，并转换为LineString对象
     * @param {*} coords 
     * @returns LineString
     */
    static readCoord(coords) {
        let line = new LineString();
        for (let i = 0, ii = coords.length; i < ii; i++) {
            let coord = coords[i];
            let point = new Point(coord[0], coord[1]);
            line.addPoint(point);
        }
        return line;
    }
}

// let val = extendLine([[0, 0], [0, 10]], 10);
// console.info(val[0], val[1]);

/**
 * 点坐标处理类
 */
class PointClass {  
    constructor(x, y) {  
        const base = { x: 0, y: 0 };

        // ensure source as object
        const source = Array.isArray(x) ? { x: x[0], y: x[1] } : typeof x === 'object' ? { x: x.x, y: x.y } : { x: x, y: y };

        // merge source
        this.x = source.x == null ? base.x : source.x;
        this.y = source.y == null ? base.y : source.y;
    }  
      
    getX() {  
        return this.x;  
    }  
      
    getY() {  
        return this.y;  
    }

    toArray() {
        return [this.x, this.y]
    }

    // Clone point
    clone() {
        return new PointClass(this)
    }
}

/**
 * 切片数据图层渲染类
 */
class TileLayerRenderer extends LayerRenderer {
    /**
     * 构造函数
     */
    constructor(tileLayer) {
        super();
        this.layer_ = tileLayer;
        this.zDirection = 0;
        this.tmpExtent = Extent.createEmpty();
        this.tmpTileCoord_ = [0, 0, 0];

        /**
         * 当前图层的渲染状态
         */
        this.state = LayerRenderer.IDLE;
        this.waitRenderTileCount = 0;
    }

    /**
     * 合成Frame
     */
    composeBuffer(frameState) {

        let tilesToDraw = this._getRenderedTiles(frameState);
        if (tilesToDraw.length === 0) {
            return;
        }

        this.state = LayerRenderer.LOADING;
        this.waitRenderTileCount = 0;

        let center = frameState.center;
        let resolution = frameState.resolution;
        let size = frameState.size;
        let offsetX = Math.round(size.width / 2);
        let offsetY = Math.round(size.height / 2);
        let pixelScale = 1 / resolution;
        let layer = this.getLayer();
        let source = layer.getSource();
        let tileGutter = 0;
        let tileGrid = source.getTileGrid();
        let ctx = this._context;

        let alpha = ctx.globalAlpha;
        ctx.save();

        for (let i = 0, ii = tilesToDraw.length; i < ii; ++i) {
            let tile = tilesToDraw[i];
            let tileCoord = tile.getKey();
            let tileExtent = tileGrid.getTileCoordExtent(tileCoord);
            let currentZ = tileCoord[0];
            let origin = Extent.getBottomLeft(tileGrid.getTileCoordExtent(tileGrid.getTileCoordForCoordAndZ(center, currentZ, this.tmpTileCoord_)));
            let w = Math.round(Extent.getWidth(tileExtent) * pixelScale);
            let h = Math.round(Extent.getHeight(tileExtent) * pixelScale);
            let left = Math.round((tileExtent[0] - origin[0]) * pixelScale / w) * w + offsetX + Math.round((origin[0] - center[0]) * pixelScale);
            let top = Math.round((origin[1] - tileExtent[3]) * pixelScale / h) * h + offsetY + Math.round((center[1] - origin[1]) * pixelScale);
            let tilePixelSize = source.getTilePixelSize(currentZ);

            // 渲染切片
            if (tile.getState() == ImageObject.LOADING) {
                this.waitRenderTileCount++;
                tile.draw(ctx, tileGutter, tileGutter, tilePixelSize[0], tilePixelSize[1], left, top, w, h, function () {
                    frameState.getLayer().getGraph().getRenderer().renderFrame(false);
                });
            } else {
                ctx.drawImage(tile.getImage(), tileGutter, tileGutter, tilePixelSize[0], tilePixelSize[1], left, top, w, h);
            }
        }
        ctx.restore();
        ctx.globalAlpha = alpha;

        if (this.waitRenderTileCount === 0) {
            this.state = LayerRenderer.RENDERED;
        }
    }
    
    /**
     * 根据范围计算所需切片位图
     */
    _getRenderedTiles(frameState) {
        let tileLayer = this.getLayer();
        let tileSource = tileLayer.getSource();
        let tileGrid = tileSource.getTileGrid();
        let z = tileGrid.getZForResolution(frameState.resolution, this.zDirection);
        let tileResolution = tileGrid.getResolution(z);
        let extent = frameState.extent;
        if (Extent.isEmpty(extent)) {
            return false;
        }

        // 根据视图确定 切片范围
        let tileRange = tileGrid.getTileRangeForExtentAndResolution(extent, tileResolution);

        let tile, x, y;
        let renderedTiles = [];

        // 预处理切片数据
        for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
            for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
                tile = tileSource.getTile(z, x, y);
                renderedTiles.push(tile);
            }
        }

        return renderedTiles;
    }
}

/**
 * 闪烁类
 */
class Flicker {
    constructor() {
    }

    /**
     * 开始闪烁
     * @param {Graph} graph 
     * @param {Array} data 
     * @param {Object} options 
     */
    static run(graph, data, options = {}) {
        this.end(graph);
        this.times = 0;
        this.beginFlicker = true;
        this._add2Layer(graph, data, options.type);
        this._render(graph, options.duration);
    }

    /**
     * 顺序闪烁
     * @param {Graph} graph 
     * @param {Array} data 
     * @param {Object} options 
     */
    static sequence(graph, data, options = {}) {
        this.end(graph);
        this.times = 0;
        this.beginFlicker = false;
        this._add2Layer(graph, [], options.type);
        this._render(graph, options.duration, data);
    }

    /**
     * 结束闪烁
     * @param {Graph} graph 
     */
    static end(graph) {
        window.cancelAnimationFrame(this.animationKey_);
        graph.removeLayer(this.flickerLayer_);
        graph.render();
    }

    static _add2Layer(graph, data, type = 1) {
        let that = this;
        this.flickerLayer_ = new Layer({
            "source": new VectorSource({
                "data": data
            }),
            "style": {
                "layerPrior": true,
                "lineWidth": 4,
                "pointLineWidth": 4,
                "surfaceLineWidth": 4,
                "dynamic": function (layer, frameState) {
                    if (type === 1) {
                        that._styleFn1(layer, frameState);
                    } else if (type === 2) {
                        that._styleFn2(layer, frameState);
                    } else {
                        that._styleFn(layer, frameState);
                    }
                }
            },
            "zIndex": 1000000
        });
        graph.addLayer(this.flickerLayer_);
    }

    static _render(graph, duration = this.defaultDuration, data = []) {
        let start = Date.now();
        let that = this;
        let idx = 0;
        let loop = function () {
            let speed;
            if(data.length > 120) {
                speed = 1;
            } else if(data.length > 80) {
                speed = 2;
            } else {
                speed = 4;
            }
            if (that.times % speed === 0) {
                if (idx < data.length) {
                    let geom = data[idx];
                    Object.assign(geom.style, {"color":"red", "fillColor":"red", "lineWidth":4});
                    that.flickerLayer_.getSource().add(geom);
                    idx += 1;
                } else {
                    that.beginFlicker = true;
                }
            }
            that.times++;
            if (Date.now() <= start + (duration > 0 ? duration * 1000 : 0)) {
                if (that.times % 2 === 0) {
                    // graph.renderSync();
                    graph.renderLayer(that.flickerLayer_);
                }
                that.animationKey_ = window.requestAnimationFrame(loop);
            } else {
                graph.removeLayer(that.flickerLayer_);
                graph.render();
                return false;
            }
        };
        window.requestAnimationFrame(loop);
    }

    /**
     * 红白闪烁效果，红色的变化范围为：rgb(255, 0, 0) 至 rgb(255, 255, 255)
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn(layer, frameState) {
        if (this.beginFlicker) {
            let delta = Easing.easeOut(this.times % 30 / 30);
            let color = "rgb(255," + Math.floor(255 * delta) + "," + Math.floor(255 * delta) + ")";
            let style = layer.getStyle();
            style.color = color;
            style.fillColor = color;
            layer.setStyle(style);
        }
    }

    /**
     * 通过改变透明色，实现闪烁效果
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn1(layer, frameState) {
        if (this.beginFlicker) {
            let delta = Easing.easeOut(this.times % 30 / 30);
            layer.setOpacity(delta);
        }
    }

    /**
     * 虚线滚动效果
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn2(layer, frameState) {
        if (this.beginFlicker) {
            let style = layer.getStyle();

            // 点和面的颜色变化
            let delta = Easing.easeOut(this.times % 20 / 20);
            let color = "rgb(255," + Math.floor(255 * delta) + "," + Math.floor(255 * delta) + ")";
            style.pointColor = color;
            style.surfaceColor = color;

            // 虚线流动
            delta = Easing.linear(this.times % 20 / 20);
            style.lineColor = "rgb(255,0,0)";
            style.lineType = 10;
            style.dashOffset = delta * 30;
            layer.setStyle(style);
        }
    }
}

Flicker.times = 0;
Flicker.defaultDuration = 3;
Flicker.flickerLayer_ = null;
Flicker.animationKey_ = 0;
Flicker.beginFlicker = false;

/**
 * 切片地图数据源
 */
class TileSource extends BaseSource {
    constructor(options = {}) {
        super(options);

        /**
        * 切片网格
        */
        this.tileGrid = options.tileGrid !== undefined ? options.tileGrid : null;

        /**
         * 切片缓存
         */
        this.tileCache = new ImageCache(IMAGE_CACHE_SIZE);
        this._canCache = true;

        /**
         * 切片地图的Http地址
         */
        this.urlTemplate = options.url;

        /**
         * Y方向是否是地图坐标轴（地图Y方向坐标轴越往北数值越大，而屏幕Y方向坐标轴越是下方数值越大）
         */
        this.isMapAxis = options.isMapAxis == null ? true : options.isMapAxis;
    }

    /**
     * 是否进行切片缓存
     */
    canCache() {
        return this._canCache;
    }

    /**
     * 清除之前的消息
     */
    clearData(id) {
        super.clearData(id);
        this.tileCache.expireCache();
    }

    /**
     * 增加数据
     */
    add(data) {
        super.add(data);
    }

    /**
     * 将图片数据加至缓存中
     * filePath:可为string，或者为array
     */
    add2Cache(filePath) {
        let tileKey = filePath;
        if (tileKey === undefined) return;

        // 缓存数据
        if (!this.tileCache.containsKey(tileKey)) {
            let tile = new TileImage(tileKey);
            tile.load();
            this.tileCache.set(tileKey, tile);
        }
    }

    /**
     * 获取切片
     */
    getTileByUrl(tileKey) {
        let val = this.tileCache.get(tileKey);
        if (val == null) {
            this.add2Cache(tileKey);
            return null;
        } else {
            return val;
        }
    }

    /**
     * 获取切片
     */
    getTile(z, x, y) {
        //let tileCoordKey = this.getKeyZXY(z, x, y);
        let tileCoord = [z, x, y];
        let tileUrl = this.tileUrlFunction(tileCoord);
        let tile = new TileImage(tileUrl, tileCoord);

        if (!this.tileCache.containsKey(tileUrl)) {
            tile = this.createTile_(z, x, y);
            this.tileCache.set(tileUrl, tile);
        } else {
            tile = this.tileCache.get(tileUrl);
        }
        return tile;
    }

    /**
     * 建立切片位图对象
     */
    createTile_(z, x, y) {
        let tileCoord = [z, x, y];
        let tileUrl = this.tileUrlFunction(tileCoord);
        let tile = new TileImage(tileUrl, tileCoord);
        tile.load();
        return tile;
    };

    /**
    * 根据地址模板生成切片URL
    */
    tileUrlFunction(tileCoord) {
        let z = tileCoord[0];
        let x = tileCoord[1];
        let y = this.isMapAxis ? tileCoord[2] : (-tileCoord[2] - 1);
        return this.urlTemplate.replace('{z}', z.toString()).replace('{y}', y.toString()).replace('{x}', x.toString());
    }

    /**
     * @protected
     */
    getKeyZXY(z, x, y) {
        return z + '/' + x + '/' + y;
    }

    /**
     * 取TitleGrid
     */
    getTileGrid() {
        return this.tileGrid;
    }

    /**
     * 取某一层的切片像素尺寸
     */
    getTilePixelSize(z) {
        let tileGrid = this.getTileGrid();
        let tileSize = tileGrid.getTileSize(z);
        return tileSize;
    }
}

/**
 * 异步加载的图形对象
 */
class TileImage {
    constructor(src, imgUid) {
        this.blankTile = new window.Image();
        this.blankTile.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAB9JREFUOE9jZKAQMFKon2HUAIbRMGAYDQNQPhr4vAAAJpgAEX/anFwAAAAASUVORK5CYII=";  // 临时瓦片Image

        // fileUrl
        this.src_ = src;
        // key
        this.imgUid_ = imgUid;
        this.image_ = new window.Image();
        //this.image_.crossOrigin = "anonymous";   // 跨域,不发送用户凭据（即允许对未经过验证的图像进行跨源下载）
        this.state = ImageObject.IDLE;
        this.waitToDraw = false;
        this.drawOption = {};

        // 是否下载切片，当无法下载切片时可将该值设置为false
        this.isLoadImage_ = true;
    }

    getKey() {
        return this.imgUid_;
    }

    /**
     * 返还切片名称
     */
    getName() {
        this.src_;
    }

    /**
     * 返回切片状态
     */
    getState() {
        return this.state;
    }

    /**
     * 获取切片对应的Image
     */
    getImage() {
        if (this.state == ImageObject.LOADED) {  // 已装载完毕
            return this.image_;
        } else {                                     // 没有装载或出现错误
            return this.blankTile;
        }
    };

    /**
     * 装入切片位图
     */
    load() {
        if (this.state == ImageObject.IDLE || this.state == ImageObject.ERROR) {
            this.state = ImageObject.LOADING;
            let that = this;
            this.image_.addEventListener('load', function (e) { return that.onload(); }, { once: true });
            this.image_.addEventListener('error', function (e) { return that.onerror(); }, { once: true });
            this.image_.src = this.isLoadImage_ === true ? this.src_ : "";
        }
    };

    /**
     * 绘制
     */
    draw(renderContext, sx, sy, sw, sh, dx, dy, dw, dh, callback) {
        this.drawOption = { renderContext, sx, sy, sw, sh, dx, dy, dw, dh, callback };

        if (this.state === ImageObject.LOADED) {
            this._drawImage();
        } else {
            this.waitToDraw = true;
        }
    }

    /**
     * 装入成功事件 
     */
    onload() {
        if (this.image_.naturalWidth && this.image_.naturalHeight) {
            this.state = ImageObject.LOADED;
        } else {
            this.state = ImageObject.EMPTY;
        }
        // 当image装载完成后，若已经执行了draw，则需重新draw
        if (this.waitToDraw) {
            this._drawImage();
        }
    }

    /**
     * 将切片在画板中绘制出来
     */
    _drawImage() {
        let arg = this.drawOption;
        if (this.state === ImageObject.EMPTY) {
            arg.renderContext.drawImage(this.blankTile, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);
        } else {
            arg.renderContext.drawImage(this.image_, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);
        }
        arg.callback();
    }

    /**
     * 切片装入失败事件 
     */
    onerror() {
        this.state = ImageObject.ERROR;
    }
}

/**
 * 可拖拽的操作基础类
 * 该对象通过控制鼠标的mouseDown、mouseUp、mouseMove事件实现对图形的拖拽操作
 */
class Draggable extends GraphEvent {
    constructor(options) {
        super(options);

        // 是否开始拖拽
        this.startDrag = false;
        
        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 鼠标形状
        this.cursor = Cursor.POINTER;
        let that = this;

        /**
         * 事件：mouseDown
         * @param {Event} e 
         */
        this.mouseDown = function (e) {
            if (e.button === 0) {
                this.startDrag = true;
                this.startPoint = [e.offsetX, e.offsetY];
                this.onMouseDown(e);
            }
        };

        /**
         * 事件：mouseMove
         * @param {Event} e 
         */
        this.mouseMove = function (e) {
            if (this.startDrag === true) {
                this.movePoint = [e.offsetX, e.offsetY];
                this.endPoint = [e.offsetX, e.offsetY];
                this.onMouseMove(e, true);
            } else {
                this.onMouseMove(e, false);
            }
        };

        /**
         * 事件：mouseUp
         * @param {Event} e 
         */
        this.mouseUp = function (e) {
            if (that.startDrag === true) {
                that.endPoint = [e.offsetX, e.offsetY];
                that.onMouseUp(e);
                that.startDrag = false;
            }
        };
    }

    onMouseDown(e) { }

    onMouseUp(e) { }

    onMouseMove(e) { }

    setCursor(cursorName) {
        this.cursor = cursorName;
    }
}

/**
 * 拖拽矩形框
 */
class DragBox extends Draggable {

    constructor(options = {}) {
        super(options);
        /**
         * 图形对象
         */
        this.graph = options.graph;
        
        /**
         * 拉框结束时的回调函数
         */
        this.callback = options.callback;

        // 
        this.overlayId_ = 211;                   // 覆盖层图层ID （度量尺、空间查询矩形框等）
        this.overlayDesc_ = "覆盖层图层";
        this.defaultStyle = {
            "color": "red",
            "fillColor": "rgba(255, 159, 159, 0.5)",
            "fillStyle": 1,
            "lineWidth": 2,
            "fontBorder": true
        };

        // 拉框geom对象
        this.polygon = null;
    }

    /**
     * 获取浮动图层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.graph.getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                "source": new VectorSource(),
                zIndex: this.overlayId_,
                name: this.overlayDesc_
            });
            this.graph.addLayer(layer);
        }
        return layer;
    }

    onMouseDown(e) {
        if (this.polygon != null) {
            this.getOverLayer().getSource().clearData(this.polygon.getUid());
        }
        this.polygon = this.getOverLayer().getSource().add(new Polygon({ "coords": [[0, 0], [0, 0], [0, 0]], "style": this.defaultStyle }));
    }

    onMouseMove(e, isDrag) {
        if(isDrag === true) {
            let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
            let p2 = this.graph.getCoordinateFromPixel(this.endPoint, true);
            let point1Coords = [p1[0], p1[1]];
            let point2Coords = [p1[0], p2[1]];
            let point3Coords = [p2[0], p2[1]];
            let point4Coords = [p2[0], p1[1]];
            this.polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
            this.polygon.setStyle({ "lineWidth": 1 });
            this.graph.renderLayer(this.getOverLayer());
        }
    }

    onMouseUp(e) {
        this.polygon.setStyle({ "lineWidth": 2, "fillStyle": 0 });
        this.graph.renderLayer(this.getOverLayer());
        if (typeof (this.callback) === "function") {
            let coord = this.polygon.getCoord();
            this.callback([coord[0], coord[2]]);
        }
    }
}

/**
 * 鼠标左键：拖拽漫游
 */
class DragPan extends Draggable {

    constructor(options = {}) {
        super(options);
        /**
         * 图形对象
         */
        this.graph = options.graph;

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 鼠标形状
        this.cursor = Cursor.MOVE;
    }

    onMouseMove(e, isDrag) {
        if(isDrag === true) {
            let dist;
            if (this.lastPoint) {
                let p1 = this.lastPoint; //this.graph.getCoordinateFromPixel(this.lastPoint, true);
                let p2 = this.movePoint; //this.graph.getCoordinateFromPixel(this.movePoint, true);
                dist = [p2[0] - p1[0], p2[1] - p1[1]];
            } else {
                let p1 = this.startPoint; //this.graph.getCoordinateFromPixel(this.startPoint, true);
                let p2 = this.movePoint;  //this.graph.getCoordinateFromPixel(this.movePoint, true);
                dist = [p2[0] - p1[0], p2[1] - p1[1]];
            }
            this.graph.doMove(dist);
            this.lastPoint = this.movePoint.slice();
        }
    }

    onMouseUp(e) {
        this.lastPoint = null;
    }
}

/**
 * 鼠标左键：开窗缩放
 */
class DragZoom extends Draggable {

    constructor(options = {}) {
        super();
        
        /**
         * 
         */
        this.graph = options.graph;

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 鼠标形状
        this.cursor = Cursor.CROSSHAIR;
    }

    onMouseMove(e, isDrag) {
    }

    onMouseUp(e) {
    }
}

/**
 * 新增多边形/折线
 */
class PolygonAdd extends GraphEvent {
    constructor(options = {}) {
        super(options);

        /**
         * 图形管理对象
         */
        this.graph = options.graph;
        this.layer = options.layer;
        this.fillColor = options.fillColor || "none";
        this.style = { "lineWidth": options.lineWidth || 2, "color": options.color || "#999999", "fillStyle": (options.fillColor ? 1 : 0) };
        this.ring = options.ring === false ? false : true;

        // /**
        //  * 回调函数
        //  */
        // this.mouseUpCallback = options.mouseUp;
        // this.mouseDownCallback = options.mouseDown;
        // this.mouseMoveCallback = options.mouseMove;
        // this.keyDownCallback = options.keyDown;

        /**
         * 当前的操作， -1:无操作，1:拖拽连续加点， 2：点击加点
         */
        this.operation = -1;

        /**
         * 当前新增的多边形对象影子
         */
        this.polyline = null;

        this.polygonCoord = [];

        // 是否开始拖拽操作
        this.startDrag = false;

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 上一次移动时的坐标
        this.__lastPoint;

        // 鼠标形状
        this.cursor = Cursor.POINTER;

        /**
         * mouseUp event
         */
        let that = this;
        this.mouseUp = function (e) {
            that.startDrag = false;

            if (that.operation == 1) {
                that.operation = 2;
            }

            if (that.operation == 2) {
                // 鼠标左键加点，或结束操作
                that.endPoint = [e.offsetX, e.offsetY];

                // 与第一个点的距离小于20像素，结束绘制
                if (Measure.dist(that.startPoint, that.endPoint) < 10) {
                    that.polygonCoord.push(that.graph.getCoordinateFromPixel(that.endPoint));
                    if(that.polygonCoord.length > 2) {
                        that.drawPolygon(true);
                        that.end();
                    }
                } else {
                    that.polygonCoord.push(that.graph.getCoordinateFromPixel(that.endPoint));
                    that.drawPolygon(false);
                }
                that.__lastPoint = that.endPoint;
            } else {
                console.info("mouseUp ??");
            }
        };

        this.rclick = function(e) {
            that.operation == -1;
            that.drawPolygon(true);
            that.end();
        };
    }   

    /**
     * mouseDown event
     * @param {Event} e 
     */
    mouseDown(e) {
        if (this.operation == -1) {
            this.operation = 1;
            this.startPoint = [e.offsetX, e.offsetY];
            this.endPoint = [e.offsetX, e.offsetY];
            this.__lastPoint = this.startPoint.slice();
            this.polygonCoord.push(this.graph.getCoordinateFromPixel(this.startPoint));
            this.startDrag = true;
        }
    }

    /**
     * mouseMove event
     * @param {Event} e
     */
    mouseMove(e) {
        this.movePoint = [e.offsetX, e.offsetY];
        // 连续加点
        if (this.operation === 1) {
            // 连续加点模式时，距离超过20个像素自动加点
            if (Measure.dist(this.movePoint, this.__lastPoint) > 40) {
                this.polygonCoord.push(this.graph.getCoordinateFromPixel(this.movePoint));
                this.drawPolygon(false);
                this.__lastPoint = this.movePoint;
            }
        } else if (this.operation === 2) {
            // 橡皮线
            if (Measure.dist(this.movePoint, this.__lastPoint) > 20) {
                let ruleCoords = [this.graph.getCoordinateFromPixel(this.__lastPoint), this.graph.getCoordinateFromPixel(this.movePoint)];
                if (this.ruleLine) {
                    this.ruleLine.setCoord(ruleCoords);
                } else {
                    this.ruleLine = this.layer.getSource().add(new Polyline({ "coords": ruleCoords, "style": Object.assign({ "dash": [6, 6] }, this.style) }));
                }
                this.graph.render();
            }
        }
    }

    drawPolygon(over) {
        if (this.polygonCoord && this.polygonCoord.length > 2) {
            if (over === true) {
                this.graph.removeGeom(this.ruleLine);
                if(this.ring) {
                    this.graph.removeGeom(this.polyline);
                    this.layer.getSource().add(new Polygon({ "coords": this.polygonCoord, "style": Object.assign({ "fillColor": this.fillColor }, this.style) }));    
                } else {
                    this.polyline.setCoord(this.polygonCoord);
                }
            } else {
                if (this.polyline == null) {
                    this.polyline = this.layer.getSource().add(new Polyline({ "coords": this.polygonCoord, "style": this.style }));
                } else {
                    this.polyline.setCoord(this.polygonCoord);
                }
                this.polyline.setFocus(true);
            }
        }
        this.graph.render();
    }

    /**
     * 事件：键盘按键事件
     * @param {Event} e 
     */
    keyDown(e) {
        e.keyCode;
    }
}

// import Coordinate from "../spatial/coordinate.js";

/**
 * 拖拽绘制点
 */
class GeomAdd extends Draggable {

    constructor(options={}) {
        super(options);

        /**
         * 图形对象
         */
        this.graph = options.graph;

        /**
         * 绘制完毕的回调函数
         */
        this.callback = options.callback;

        /**
         * 模板对象
         */
        this.templateGeom = options.template;

        // 绘制的对象
        this.drawObj;

        // 绘图层图层ID
        this.overlayId_ = 211;                   // 覆盖层图层ID （度量尺、空间查询矩形框等）
        
        //  绘图层说明
        this.overlayDesc_ = "绘图层";

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];
    }

    /**
     * 设置绘图时的模板对象
     * @param {Geometry} geom 
     */
    setTemplate(geom) {
        if(geom instanceof Geometry || geom.type != null) {
            this.templateGeom = geom;
        }
    }

    /**
     * 获取浮动图层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.graph.getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                "source": new VectorSource(),
                zIndex: this.overlayId_,
                name: this.overlayDesc_
            });
            this.graph.addLayer(layer);
        }
        return layer;
    }

    onMouseDown(e) {
        if (this.drawObj != null) {
            this.getOverLayer().getSource().clearData(this.drawObj.getUid());
        }
        let p = this.graph.getCoordinateFromPixel(this.startPoint, true);
        let prop = Object.assign(this.templateGeom, { "x": p[0], "y": p[1] });
//        if(prop.getType() === GGeometryType.POINT) {
//            delete prop.coords;
//        }
        this.drawObj = this.getOverLayer().getSource().add(prop);
        this.drawObj.moveTo(p[0], p[1]);
    }

    onMouseMove(e, isDrag) {
        if(isDrag === true) {
            this.graph.getCoordinateFromPixel(this.startPoint, true);
            this.graph.getCoordinateFromPixel(this.endPoint, true);
            if(this.drawObj) ;
            this.graph.renderLayer(this.getOverLayer());    
        }
    }

    onMouseUp(e) {
		let that = this;
        this.graph.renderLayer(this.getOverLayer());
        if (typeof (this.callback) === "function") {
            this.callback(that.drawObj, this.graph.getCoordinateFromPixel(this.endPoint, true));
        }
        if (this.drawObj != null) {
            this.getOverLayer().getSource().clearData(this.drawObj.getUid());
        }
    }
}

/**
 * 几何对象操作（单选、多选、移动、缩放）
 */
class GeomControl extends Draggable {

    /**
     * 构造函数
     * @param {Object} options 
     * multiple：是否可同时选择多个文件，默认为 false
     */
    constructor(options) {
        super(options);

        this.graph = options.graph;

        /**
         * 是否允许多选
         */
        this.multiple = options.multiple === true;

        /**
         * 回调函数
         */
        this.callback = options.callback;
        /**
         * 回调函数
         */
        this.mouseUpCallback = options.mouseUp;
        this.mouseDownCallback = options.mouseDown;
        this.mouseMoveCallback = options.mouseMove;
        this.keyDownCallback = options.keyDown;

        /**
         * 当前的操作， -1:无操作，10:移动， 1~9：控制点pos值， 11:顶点操作
         */
        this.operation = -1;
        this.ringIdx = -1;
        this.coordIdx = -1;

        // 上一次移动时的坐标
        this.__lastPoint;

        // 鼠标形状
        this.cursor = Cursor.DEFAULT;

        // 选择框属性
        this.overlayId_ = 211;
        this.overlayDesc_ = "浮动交互层";
        this.defaultStyle = {
            "color": "red",
            "fillColor": "rgba(255, 159, 159, 0.5)",
            "fillStyle": 1,
            "lineWidth": 2,
            "fontBorder": true
        };

        // 拉框geom对象
        this.polygon = null;

        /**
         * 激活的Geom对象
         */
        this.activeGeomList = null;
    }

    /**
     * 获取浮动交互层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.graph.getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                "source": new VectorSource(),
                zIndex: this.overlayId_,
                name: this.overlayDesc_
            });
            this.graph.addLayer(layer);
        }
        return layer;
    }

    /**
     * 鼠标按下事件
     * @param {Event} e 
     */
    onMouseDown(e) {
        let clickPoint = this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]);
        let isClickGeom = false;
        // 判断是否选中了activeGeomList
        // (1)是：对这些geom进行移动或缩放操作
        // (2)否：清除原activeGeomList焦点框
        if (this.activeGeomList) {
            // (1)选中了多个节点是判断是否要批量移动
            if (this.activeGeomList.length > 1) {
                this.activeGeomList.forEach(geom => {
                    //geom.setFocus(false);
                    if (geom.contain(clickPoint, true)) {
                        isClickGeom = true;
                        return;
                    }
                });
            }

            // (2) 清除原activeGeomList焦点框
            if (!isClickGeom) {
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(false);
                });
            }
        }

        if (isClickGeom === true) {
            this.operation = 100;
        } else {
            // 判断是否选中了geom
            let geomList = this.graph.queryGeomList(clickPoint);

            // 1 如果选中了geom，则激活该geom，判断是否点中了控制点，且不进行多选
            if (geomList.length > 0) {
                this.activeGeomList = [geomList[0]]; //(this.multiple ? geomList : [geomList[0]]);
                let that = this;
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(true);
                    // 判断鼠标位置是否为编辑框控制点
                    let cp = that.getControlPoint([e.offsetX, e.offsetY], [geom]);
                    if (cp == null) {
                        that.operation = 100;
                    } else {
                        that.operation = cp.cmd;
                        that.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                        that.coordIdx = cp.idx;
                    }
                    //console.info("mouseDown1", cp);
                });
            }
            // (1)如果没有点中geom，则根据之前是否选中了geom，要是则判断是否点中了控制点
            // (2)如果没有点中控制点，则开始多选（拉框）
            else {
                // (1)控制点的范围比 activeGeom bbox 大一点，因此即使没有选中设备，也需要判断是否点中了激活设备的控制点
                if (this.activeGeomList && this.activeGeomList.length > 0) {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], [this.activeGeomList[0]]);
                    if (cp) {
                        this.activeGeomList[0].setFocus(true);
                        this.operation = cp.cmd;
                        this.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                        this.coordIdx = cp.idx;
                    } else {
                        this.activeGeomList = [];
                        this.operation = -1;
                    }
                    //console.info("mouseDown2", cp);
                }
                // (2)没有点中控制点，则开始多选（拉框）
                if (!(this.activeGeomList && this.activeGeomList.length > 0)) {
                    // 多选：开始拉框
                    if (this.multiple) {
                        if (this.polygon != null) {
                            this.getOverLayer().getSource().clearData(this.polygon.getUid());
                        }
                        this.polygon = this.getOverLayer().getSource().add(new Polygon({ "coords": [[0, 0], [0, 0], [0, 0]], "style": this.defaultStyle }));
                    }
                }
            }
        }

        if (typeof (this.mouseDownCallback) === "function") {
            this.mouseDownCallback({
                "geomList": this.activeGeomList,
                "coord": clickPoint
            });
        }

        // console.info("mouseDown", this.activeGeomList == null ? "none" : this.activeGeomList[0].getUid(), this.operation, this.activeGeomList);
        this.graph.render();
    }

    /**
     * 鼠标移动事件
     * @param {*} e 
     * @param {*} isDrag 
     */
    onMouseMove(e, isDrag) {

        // 如果是在单击拖拽状态，则根据mouseDown是否选中了设备进行操作
        // (1)选中了设备，则要么变形、要么移动
        // (2)没有选中设备，则开始多选（拉框）
        if (isDrag === true) {

            // (1)选中了设备，则要么变形、要么移动
            if (this.activeGeomList && this.activeGeomList.length > 0) {
                // 计算操作幅度
                let distX, distY;
                if (this.__lastPoint) {
                    let p1 = this.graph.getCoordinateFromPixel(this.__lastPoint, true);
                    let p2 = this.graph.getCoordinateFromPixel(this.movePoint, true);
                    [distX, distY] = [p2[0] - p1[0], p2[1] - p1[1]];
                } else {
                    let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
                    let p2 = this.graph.getCoordinateFromPixel(this.movePoint, true);
                    [distX, distY] = [p2[0] - p1[0], p2[1] - p1[1]];
                }
                this.__lastPoint = this.movePoint.slice();

                // 回调
                if (typeof (this.mouseMoveCallback) === "function") {
                    let rtn = this.mouseMoveCallback({
                        "geomList": this.activeGeomList,
                        "dist": [distX, distY],
                        "operation": this.operation
                    });
                    // 回调函数返回false，则不进行下面的缺省按键操作
                    if (rtn === false) return;
                }

                // 缺省平移或缩放
                let that = this;
                this.activeGeomList.forEach(geom => {
                    if (that.operation == 100 || that.operation == 5) {
                        // 对象平移
                        geom.translate(distX, distY);
                    }
                    // 多边形/折线 顶点移动
                    else if (that.operation == 11) {
                        let coord = geom.getCoord();
                        if(that.ringIdx >= 0) {
                            coord[that.ringIdx][that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                        } else {
                            coord[that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                        }
                        geom.setCoord(coord);
                    }
                    // 对象缩放
                    else {
                        that.scaleGeom(that.operation, geom, distX, distY);
                    }
                });
                this.graph.render();
            }

            // (2)没有选中设备，则开始多选（拉框）
            else {
                if (this.multiple && this.polygon != null) {
                    let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
                    let p2 = this.graph.getCoordinateFromPixel(this.endPoint, true);
                    let point1Coords = [p1[0], p1[1]];
                    let point2Coords = [p1[0], p2[1]];
                    let point3Coords = [p2[0], p2[1]];
                    let point4Coords = [p2[0], p1[1]];
                    this.polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
                    this.polygon.setStyle({ "lineWidth": 1 });
                    this.graph.renderLayer(this.getOverLayer());
                }
            }
        }
        // 非拖拽状态，判断是否移动到了geom中，设置鼠标形状
        else {
            let geomList = this.graph.queryGeomList(this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]));
            // 在当前鼠标位置找到了geom
            if (geomList.length > 0) {
                if (this.activeGeomList && this.activeGeomList.length > 1) {
                    this.cursor = Cursor.MOVE;
                } else {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], geomList);
                    if (cp) {
                        this.cursor = cp.cursor;
                    } else {
                        this.cursor = Cursor.MOVE;
                    }
                }
            }
            // 控制点的范围比 activeGeom bbox 大一点，如果有选中的geom，则需要判断是否移动在激活的geom控制点上
            else {
                if (this.activeGeomList && this.activeGeomList.length > 0) {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], [this.activeGeomList[0]]);
                    if (cp) {
                        this.cursor = cp.cursor;
                    } else {
                        this.cursor = Cursor.DEFAULT;
                    }
                } else {
                    this.cursor = Cursor.DEFAULT;
                }
            }
        }
    }

    /**
     * 鼠标松开按键事件
     * @param {*} e 
     */
    onMouseUp(e) {

        this.__lastPoint = null;
        this.operation = -1;

        // 允许多选时，根据矩形框查询选中的设备
        if (this.multiple) {
            if (this.polygon && Extent.getArea(this.polygon.getBBox(false)) > 100) {
                this.polygon.setStyle({ "lineWidth": 2, "fillStyle": 0 });
                this.graph.renderLayer(this.getOverLayer());
                let coord = this.polygon.getCoord();
                this.activeGeomList = this.graph.queryGeomList([coord[0][0], coord[0][2]]);
                if (this.activeGeomList) {
                    this.activeGeomList.forEach(geom => {
                        geom.setFocus(true);
                    });
                    this.graph.render();
                }
                this.getOverLayer().getSource().clearData(this.polygon.getUid());
            }
            this.polygon = null;
        }

        // 执行回调
        if (this.startDrag === true) {
            if (typeof (this.mouseUpCallback) === "function") {
                this.mouseUpCallback({
                    "geomList": this.activeGeomList,
                    "coord": this.graph.getCoordinateFromPixel(this.endPoint, true)
                });
            }
        }
    }

    /**
     * 事件：键盘按键事件
     * @param {Event} e 
     */
    keyDown(e) {
        let key = e.keyCode;
        let distX, distY;
        let validateKey = false;
        if (this.activeGeomList && this.activeGeomList.length > 0) {
            switch (key) {
                case EventKeyCode.KEY_DELETE:
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_LEFT:
                    [distX, distY] = [-1, 0];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_RIGHT:
                    [distX, distY] = [1, 0];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_UP:
                    [distX, distY] = [0, -1];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_DOWN:
                    validateKey = true;
                    [distX, distY] = [0, 1];
                    break;
            }

            if (validateKey === true) {
                // 回调
                if (typeof (this.keyDownCallback) === "function") {
                    let rtn = this.keyDownCallback({
                        "geomList": this.activeGeomList,
                        "dist": [distX, distY],
                        "keyCode": key
                    });

                    // 回调函数返回false，则不进行下面的缺省按键操作
                    if (rtn === false) return;
                }

                // 缺省按键操作
                let that = this;
                this.activeGeomList.forEach(geom => {
                    if (distX != null && distY != null) {
                        geom.translate(distX, distY);
                    } else {
                        // 单击Delete删除当前激活的geom对象
                        that.graph.removeGeom(geom.getUid());
                    }
                });

                this.graph.render();
            }
        }
    }

    /**
     * 获取鼠标位置的编辑控制点
     * @param {*} coord 
     * @param {*} geomList 
     * @returns {Object} 控制点对象{x, y, width, height, cursor, cmd, idx, ringIdx}
     */
    getControlPoint(coord, geomList) {
        let controlPoint;
        for (let i = 0, len = geomList.length; i < len; i++) {
            controlPoint = geomList[i].getBorder().getControlPoint(coord);
            if (controlPoint) {
                break;
            }
        }
        return controlPoint;
    }

    /**
     * geom对象放大/缩小操作
     * @param {*} operation 
     */
    scaleGeom(operation, geom, distX, distY) {
        // console.info(distX, distY);
        let anchor = [];
        let bbox = geom.getBBox();

        let leftTop = [bbox[0], bbox[1]];
        let rightTop = [bbox[2], bbox[1]];
        let leftBottom = [bbox[0], bbox[3]];
        let rightBottom = [bbox[2], bbox[3]];

        let width = Extent.getWidth(bbox);
        let height = Extent.getHeight(bbox);
        let scaleX, scaleY;

        switch (operation) {
            case 1:     // top left
                anchor = rightBottom;
                scaleX = (width - distX) / width;
                scaleY = (height - distY) / height;
                break;
            case 2:     // middle top
                anchor = leftBottom;
                scaleX = 1;
                scaleY = (height - distY) / height;
                break;
            case 3:     // top right
                scaleX = (width + distX) / width;
                scaleY = (height - distY) / height;
                anchor = leftBottom;
                break;
            case 4:     // middle left
                anchor = rightBottom;
                scaleX = (width - distX) / width;
                scaleY = 1;
                break;
            case 6:     // middle right
                anchor = leftBottom;
                scaleX = (width + distX) / width;
                scaleY = 1;
                break;
            case 7:     // bottom left
                scaleX = (width - distX) / width;
                scaleY = (height + distY) / height;
                anchor = rightTop;
                break;
            case 8:     // middle buttom
                anchor = leftTop;
                scaleX = 1;
                scaleY = (height + distY) / height;
                break;
            case 9:     // bottom right
                scaleX = (width + distX) / width;
                scaleY = (height + distY) / height;
                anchor = leftTop;
                break;
        }
        geom.scale(scaleX, scaleY, anchor);
    }
}

/**
 * 鼠标当前位置控件
 */
class MousePositionControl extends Control {
    constructor(options = {}) {
        super(options);
        this.element;
        this.showRes = options.showRes === true;

        let that = this;
        this.onMouseMove = function (e) {
            that.redraw(e);
        };
    }

    create() {
        // create div
        this.element = DomUtil.create("div", "mouse-position", this.graph.getRenderObject().getWrapObj().parentElement);
        this.element.style.zIndex = 100;
    }

    show() {
        this.graph.getRenderObject().on('mousemove', this.onMouseMove);
    }

    hide() {
        this.graph.getRenderObject().off('mousemove', this.onMouseMove);
        this.element.innerHTML = "";
    }

    redraw(e) {
        let posi = [e.offsetX, e.offsetY];
        let coord = this.graph.getCoordinateFromPixel(posi, true);
        
        if(this.showRes) {
			let res = this.graph.getFrameState().resolution;
            this.element.innerHTML = this.formatOutput(coord) + "," + MathUtil.toFixed(res, 2);			
		} else {
			this.element.innerHTML = this.formatOutput(coord);
		}
    }

    reset() {
    }

    formatOutput(coord) {
        return MathUtil.toFixed(coord[0], 2) + ", " + MathUtil.toFixed(coord[1], 2);
    }
}

/**
 * 图层控制控件
 */
class LayerControl extends Control {
    constructor(options = {}) {
        super(options);
        this.containerId = "div_LayerControl";
    }

    create() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            DomUtil.remove(container);
        }

        // create layer container
        container = DomUtil.create("div", "layerControl", this.graph.getRenderObject().getWrapObj().parentElement);
        container.id = this.containerId;

        // create title
        let title = DomUtil.create("div", "title", container); // document.createElement('div');
        let label = DomUtil.create("label", null, title);
        label.innerHTML = "图层列表";

        // create layer list
        let divlayerList = DomUtil.create("div", "list", container);
        let layerList = DomUtil.create("ul", "layerTree", divlayerList);

        // append layer to list
        let layers = this.graph.getLayers(); //获取地图中所有图层
        for (let i = 0; i < layers.length; i++) {
            //获取每个图层的名称、是否可见属性
            let layer = layers[i];
            let layerName = layer.getName();
            let visible = layer.getVisible();

            //新增li元素，用来承载图层项
            let elementLi = document.createElement('li');
            layerList.appendChild(elementLi); // 添加子节点

            //创建复选框元素
            let checkBox = document.createElement('input');
            checkBox.type = "checkbox";
            checkBox.name = "layers";

            //创建label元素
            let elementLable = document.createElement('label');
            elementLable.className = "layer";
            elementLable.appendChild(checkBox);
            elementLable.append(layerName);
            elementLi.appendChild(elementLable);

            //设置图层默认显示状态
            if (visible) {
                checkBox.checked = true;
            }
            this._addChangeEvent(checkBox, layer);  //为checkbox添加变更事件                                         
        }
    }

    setGraph(graph) {
        super.setGraph(graph);
        let that = this;
        graph.on(EventType.RenderBefore, function (args) {
            that.create();
        });
    }

    /**
     * 为checkbox元素绑定变更事件
     */
    _addChangeEvent(element, layer) {
        let that = this;
        DomUtil.on(element, "click", function (e) {
            if (element.checked) {
                layer.setVisible(true); //显示图层
            } else {
                layer.setVisible(false); //不显示图层
            }
            that.graph.render();
        });
    }

    show() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            container.style.display = "block";
        }
    }

    hide() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            container.style.display = "none";
        }
    }
}

/**
 * 放大/缩小控件
 */
class ZoomControl extends Control {
    constructor(options = {}) {
        super(options);
        this.element;
    }

    create() {
        let that = this;
        // create div
        this.element = DomUtil.create("div", "zoom-buttom", this.graph.getRenderObject().getWrapObj().parentElement);
        // create button
        this.zoomin = DomUtil.create("button", "btn", this.element);
        this.zoomout = DomUtil.create("button", "btn", this.element);
        this.zoomin.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z" fill-rule="evenodd" fill-opacity=".9"/></svg>';
        this.zoomout.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19v2H5v-2z" fill-rule="evenodd" fill-opacity=".9"/></svg>';
        // bind event
        this.zoomin.addEventListener("click", function () {
            that.graph.animailZoom(0.8);
        });
        this.zoomout.addEventListener("click", function () {
            that.graph.animailZoom(1.25);
        });
    }

    show() {
        this.element.style.display = "block";
    }

    hide() {
        this.element.style.display = "none";
    }
}

/**
 * 符号文件名路径
 */
const AXFG_SYMBOL_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_symbol.xml";


/**
 * 由GROW转出的以CIMG格式的符号集合
 */
class AxfgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
        this.originAtLeftTop = true;
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }
    }

    /**
     * 下载符号文件，并装载数据
     * @param {String} fileUrl 
     */
    load(callback, fileUrl = AXFG_SYMBOL_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: fileUrl.indexOf(".awg") > 0 ? "arraybuffer" : "xml",
            async: true,
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getSymbolsFromBuffer(data);
                }
                if (typeof (data) === "string") {
                    data = XmlUtil.loadXML(data);
                }
                let symbols = that.loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(symbols);
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    /**
     * 装载数据
     * @param {Object} data 符号数据
     */
    loadData(xmldoc) {
        // 逐个符号分析其属性和shape
        let symbolNodes = XmlUtil.selectNodes(xmldoc, "//Symbol");
        for (let i = 0, ii = symbolNodes.length; i < ii; i++) {
            let symbol = this._analyzeSymbol(symbolNodes[i]);
            if (this.originAtLeftTop === false) {
                symbol.originAtLeftTop = false;
            }
            if (symbol != null) {
                this.symbolCollection_[symbol.id] = symbol;
            }
        }        return this.symbolCollection_;
    }

    /**
     * 分析符号数据
     * @param {XmlElement} node 
     */
    _analyzeSymbol(node) {
        let name = node.getAttribute("name");
        let width = parseFloat(node.getAttribute("w"));
        let height = parseFloat(node.getAttribute("h"));
        let alignCenter = node.getAttribute("AlignCenter");
        let id = node.getAttribute("id");
        let stateCount = node.getAttribute("state");

        let layerNode = node.getElementsByTagName("Layer");
        let layers = [];
        for (let x = 0, xx = layerNode.length; x < xx; x++) {
            let data = [];
            for (let i = 0, ii = layerNode[x].childNodes.length; i < ii; i++) {
                let geomObj = this._analyzeSymbolShape(layerNode[x].childNodes[i]);
                if (geomObj != null) {
                    data.push(geomObj);
                }
            }
            layers.push(data);
        }
        let bbox = [0, 0, width, height];
        return { id, name, width, height, stateCount, alignCenter, layers, bbox };
    }

    /**
     * adam symbol 符号的宽高通常为[1,1]，其原点为[-0.5, -0.5],坐标范围为-0.5~0.5
     * Symbol渲染该符号时的原点是[0,0]，因此解析几何数据时的坐标均偏移0.5，即：x=x+0.5, y=y+0.5
     */
    _analyzeSymbolShape(node) {
        if (node == null || node.nodeName == null || node.nodeName == "" || node.nodeName == "#text" || node.nodeName == "#comment") return null;
        let geoObj;
        let lineWidth = node.getAttribute("lw") == null ? 1 : parseFloat(node.getAttribute("lw"));
        let lineType = node.getAttribute("ls") == null ? 1 : parseFloat(node.getAttribute("ls"));
        let color = this._getColor(node.getAttribute("lc"));
        let rotate = this._analyzeRotate(node.getAttribute("tfr"));
        let fm = node.getAttribute("fm");
        let fillStyle = (fm == null || fm == "0" ? 0 : 1);
        let fillColor = this._getColor(node.getAttribute("fc"));
        let state = parseInt(node.getAttribute("sta") == null ? "0" : node.getAttribute("sta"));

        // 样式
        let style = (color == null ? { fillStyle, fillColor, lineWidth } : { color, fillStyle, fillColor, lineWidth });
        if (lineType === 2) {
            style = Object.assign({ dash: [5, 3] }, style);
        }
        // 属性
        let properties = { state };

        // 分析几何对象
        if (node.nodeName.toLowerCase() === "line") {
            // <line fm="1" id="0" sta="0" LevelStart="0" x1="0" x2="0" y1="0" y2="-0" d="0,0 0,-0" tfr="rotate(0)" LevelEnd="0" ls="1" lw="1" lc="0,255,0" StartArrowType="0" StartArrowSize="4" EndArrowSize="4" p_ShowModeMask="3" switchapp="1" p_DyColorFlag="0" af2="0" af3="7" EndArrowType="0" af4="0" af="32897" fc="0,255,0" p_AssFlag="128"/>
            let x1 = parseFloat(node.getAttribute("x1")) + 0.5;
            let y1 = parseFloat(node.getAttribute("y1")) + 0.5;
            let x2 = parseFloat(node.getAttribute("x2")) + 0.5;
            let y2 = parseFloat(node.getAttribute("y2")) + 0.5;
            geoObj = new Polyline({ "coords": [[x1, y1], [x2, y2]], "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "polyline") {
            //<polyline fm="0" sta="0" LevelStart="0" tfr="rotate(0)" LevelEnd="0" ls="1" lw="1" id="0" p_AssFlag="128" lc="0,0,255" fc="255,255,255" p_ShowModeMask="3" switchapp="1" p_DyColorFlag="0" af="32897" af2="0" af3="7" af4="0" StartArrowType="0" StartArrowSize="4" EndArrowSize="4" EndArrowType="0" d="0,-0 0,-0 -0,-0 -0,0 0,0 0,0 -0,0 -0,0 0,0 0,0 " />
            // d="0,-0 0,-0 -0,-0 -0,0 0,0 0,0 -0,0 -0,0 0,0 0,0 "
            let d = node.getAttribute("d");
            geoObj = new Polyline({ "coords": this._getCoords(d), "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "rect") {
            let x = parseFloat(node.getAttribute("x")) + 0.5;
            let y = parseFloat(node.getAttribute("y")) + 0.5;
            let width = parseFloat(node.getAttribute("w"));
            let height = parseFloat(node.getAttribute("h"));
            if (this.originAtLeftTop === true) {
                geoObj = new Rect({ x, y, width, height, "rotation": rotate, style, properties });
            } else {
                geoObj = new Rect({ x, y, width, height, "rotation": rotate, style, properties });
            }
            // geoObj = new Rect({ x, y, "width":w, "height":h, style, properties });

        } else if (node.nodeName.toLowerCase() === "circle" || node.nodeName.toLowerCase() == "circlearc") {
            //<circle cx="0.000000" cy="0.000000" ls="1" fm="1" r="0.375000" LevelStart="0" LevelEnd="0"/>
            let x = parseFloat(node.getAttribute("cx")) + 0.5;
            let y = parseFloat(node.getAttribute("cy")) + 0.5;
            let radius = parseFloat(node.getAttribute("r"));
            geoObj = new Circle({ x, y, radius, style, properties });

        } else if (node.nodeName.toLowerCase() === "ellipse") {
            //<ellipse cx="0.000500" cy="-0.100000" ls="1" fm="0" rx="0.121500" ry="0.121000" sta="0" LevelStart="0" LevelEnd="0"/>
            let x = parseFloat(node.getAttribute("cx")) + 0.5;
            let y = parseFloat(node.getAttribute("cy")) + 0.5;
            let radiusX = parseFloat(node.getAttribute("rx"));
            let radiusY = parseFloat(node.getAttribute("ry"));
            geoObj = new Ellipse({ x, y, radiusX, radiusY, "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "polygon") {
            let d = node.getAttribute("d");
            geoObj = new Polygon({ "coords": this._getCoords(d), "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "text") {
            // <Text x="-0.216644" y="0.210152" fs="0.429959" tfr="rotate(0.000000)" ts="切" />
            let x = parseFloat(node.getAttribute("x")) + 0.5;
            let y = parseFloat(node.getAttribute("y")) + 0.5;
            let fontSize = parseFloat(node.getAttribute("fs"));
            let text = node.getAttribute("ts");
            y = this.originAtLeftTop === false ? y - fontSize : y;
            geoObj = new Text({
                text, x, y,
                "rotation": rotate,
                "vectorSize": false,
                "width": text.length * fontSize, "height": fontSize,
                "style": Object.assign(style, { "textBaseline": "top", "fontSize": fontSize, "fillStyle": 1, "fontName": "宋体" }),
                "properties": Object.assign(properties, {})
            });

        } else if (node.nodeName.toLowerCase() === "pin") {
            // <pin cx="0.000000" cy="0.375000" r="1" index="0" fm="0" id="1" LevelStart="0" LevelEnd="0" p_AssFlag="128" lc="255,0,0" p_ShowModeMask="3" sta="0" switchapp="1" p_DyColorFlag="0" af="32897" af2="0" af3="7" af4="0" fc="0,0,0" ls="1" lw="1" />
            {
                let x = parseFloat(node.getAttribute("cx")) + 0.5;
                let y = parseFloat(node.getAttribute("cy")) + 0.5;
                let size = parseFloat(node.getAttribute("r"));
                geoObj = new Point({ x, y, size, style, properties });
            }
        } else {
            console.info("未处理的类型", node.nodeName);
        }
        return geoObj;
    }

    // rotate(0)
    _analyzeRotate(tfr) {
        if (tfr == null) return 0;
        let angle = 0;
        if (tfr.indexOf("(") > 0 && tfr.indexOf(")") > 0) {
            angle = parseFloat(tfr.substring(tfr.indexOf("(") + 1), tfr.indexOf(")") - 1);
        }
        return angle;
    }

    _getCoords(path) {
        let list = [];
        let segs = path.trim().split(" ");
        segs.forEach(element => {
            let q = element.split(",");
            list.push([parseFloat(q[0].trim()) + 0.5, parseFloat(q[1].trim()) + 0.5]);
        });
        return list;
    }

    _getColor(colorString) {
        if (colorString == null) return null;
        if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 4) {
            colorString = "rgba(" + colorString + ")";
        } else if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 3) {
            colorString = "rgb(" + colorString + ")";
        }
        return colorString;
    }

    /**
     * 从Buffer中读取符号数据
     * @param {ArrayBuffer} buffer 
     * @returns SymbolCollection
     */
    _getSymbolsFromBuffer(buffer) {

    }
}

const HIGH_LIGHT_STYLE = { "color": "#FF0000", "fillColor": "#FF0000", "lineWidth": 3 };
const CONNECT_ANLYZED_STYLE = { "color": "blue", "fillColor": "blue", "lineWidth": 3 };

/**
 * AXFG数据管理
 */
class Dataset {
    constructor() {
        /**
         * 块集合，对象格式：
         * {
         *     "3" : [{"blockId":3, "entityId":100, "nodeType":12583430, "properties":{}, geometryObj, markGeometryObjs:[]}]
         * }
         */
        this._dataCollection = {};

        /**
         * 拓扑分析结构
         */
        this.graphTopo = new Graph$1();
    }

    /**
     * 增加图形对象至数据池中
     * @param {Geometry} geometry 
     */
    addGraphNode(geometry, marks) {
        if (geometry instanceof Geometry) {
            let blockId = geometry.properties.blockId;
            let entityId = geometry.properties.entityId;
            let nodeType = geometry.properties.nodeType;

            let blockNodes = this._dataCollection[blockId];
            if (blockNodes == null) {
                blockNodes = [];
                this._dataCollection[blockId] = blockNodes;
            }

            let newEntity = {
                "blockId": blockId,
                "entityId": entityId,
                "nodeType": nodeType,
                "geometryObj": geometry,
                "markGeometryObjs": marks
            };
            blockNodes.push(newEntity);
        }
    }

    /**
     * 移除对象
     * @param {Entity} entity 
     */
    remove(entity) {
        let blockId = entity.blockId;
        let entityId = entity.entityId;
        let blockNodes = this._dataCollection[blockId];
        if (blockNodes == null) {
            return false;
        } else {
            let index = blockNodes.findIndex(obj => obj.entityId === entityId);
            if (index < 0) {
                return false;
            } else {
                blockNodes.splice(index, 1);
                return true;
            }
        }
    }

    /**
     * 获取栈中节点的个数
     */
    size() {
        let count = 0;
        for (let key in this._dataCollection) {
            let blockNodes = this._dataCollection[key];
            count += blockNodes.length;
        }
        return count;
    }
    
    /**
     * 判断坐标是否与数据中的节点相交
     * @param {Array} coord 
     * @param {Object} options {useCoord, includeSurface, pointPrior}
     * @returns Array
     */
    contain(coord, options={}) {
        let useCoord = (options.useCoord == null ? false : options.useCoord === true);
        let includeSurface = (options.includeSurface == null ? false : options.includeSurface === true);
        let pointPrior = (options.pointPrior == null ? true : options.pointPrior === true);
        let nodes = [];
        // 逐个对象判断是否与点相交，存储与entitys数组中
        for (let key in this._dataCollection) {
            let blockNodes = this._dataCollection[key];
            for (let i = 0, ii = blockNodes.length; i < ii; i++) {
                let gobj = blockNodes[i].geometryObj;
                // 是否包含‘面’类型
                if ( ( gobj.getShapeType() === GGShapeType.SURFACE && gobj.getType() != GGeometryType.SYMBOL ) && !includeSurface) {
                    continue;
                }
                // 根据bbox判断是否与coord相交
                if (gobj.contain(coord, useCoord)) {   // gobj.getPixel() != null && 
                    nodes.push(blockNodes[i]);
                } else {
                    // 如果不与该gobj相交，还需判断是否与该gobj的文本相交
                    for (let x = 0, xx = blockNodes[i].markGeometryObjs.length; x < xx; x++) {
                        let markObj = blockNodes[i].markGeometryObjs[x];
                        if (markObj.contain(coord, useCoord)) {   // markObj.getPixel() != null && 
                            nodes.push(blockNodes[i]);
                            break;
                        }
                    }
                }
            }
        }

        // 如果选项为点优先，则如果结果中包含了线，则需要移除线
        if(pointPrior === true && nodes.length > 0) {
            let hasPoint = false;
            nodes.forEach(obj=>{
                if(obj.geometryObj.getShapeType() == GGShapeType.POINT) {
                    hasPoint = true;
                    return;
                }
            });
            if(hasPoint === true) {
                for(let i=nodes.length - 1; i>=0; i--) {
                    let obj = nodes[i];
                    if(obj.geometryObj.getShapeType() == GGShapeType.LINE) {
                        nodes.splice(i, 1);
                    }
                }
            }
        }

        return nodes;
    }

    /**
     * 清空数据
     */
    clear() {
        this._dataCollection = {};
    }

    /**
     * TODO
     */
    addTopo() {
        // 增加顶点
        for (let i = 0, ii = objList.length; i < ii; i++) {
            //console.info("idx=%d, id=%s", i, objList[i].properties.objectID);
            that.graphTopo.addVertex(objList[i].properties.objectID);
        }
        // 增加边
        for (let i = 0, ii = objList.length; i < ii; i++) {
            let link = objList[i].properties.link;
            if (link != null && link.length > 0) {
                link.forEach(element => {
                    that.graphTopo.addEdge(objList[i].properties.objectID, element);
                });
            }
        }
    }

    /**
     * 连通性分析（TODO）
     * @param {*} objId 
     */
    connectAnalyze(objId) {
        let that = this;
        // 广度搜索，并对对象着色
        this.graphTopo.bfs(objId, function (v) {
            let objArray = that.getObj(v);
            let rtn = 0;
            for (let i = 0, ii = objArray.length; i < ii; i++) {
                let obj = objArray[i];
                let symbolName = obj.properties.symbolName;
                obj.setRenderStyle(CONNECT_ANLYZED_STYLE);
                if (symbolName != null) {
                    let state = symbolName.substring(symbolName.lastIndexOf("@") + 1);
                    if (state === "0") {
                        rtn = 1;
                    }
                }
            }
            return rtn;
        });
    }

    /**
     * 从指定块的数据集中获取Node
     * @param {int} blockId 
     * @param {int} entityId 
     * @returns Object
     */
    getNode(blockId, entityId) {
        let blockNodes = this._dataCollection[blockId];
        if (blockNodes != null) {
            let index = blockNodes.findIndex(obj => obj.entityId === entityId);
            if (index >= 0) {
                return blockNodes[index];
            }
        }
        return this.getNodeAux(blockId, entityId);
    }

    /**
     * 遍历所有块，从数据集中获取Node
     * @param {int} blockId 
     * @param {int} entityId 
     * @returns Object
     */
    getNodeAux(blockId, entityId) {
        let blocks = Object.keys(this._dataCollection);       
        for(let x=0, xx=blocks.length; x<xx; x++) {
            let blockNodes = this._dataCollection[blocks[x]];
            for(let i=0, ii=blockNodes.length; i<ii; i++) {
                let obj = blockNodes[i];
                if(obj.geometryObj != null && obj.geometryObj.properties.sourceNode != null) {
                    let index = -1;
                    obj.geometryObj.properties.sourceNode.forEach(source=>{
                        if(source.blockId == blockId && source.entityId == entityId) {
                            index = i;
                            return;
                        }
                    });
                    if (index >= 0) {
                        return blockNodes[index];
                    }  
                }
            }
        }      
        return null;
    }

    /**
     * 设置节点的高亮显示样式
     * @param {Array} nodes 
     */
    setRenderStyle(nodes) {
        for (let i = 0, ii = nodes.length; i < ii; i++) {
            let gobj = nodes[i].geometryObj;
            gobj.setRenderStyle(HIGH_LIGHT_STYLE);
            for (let x = 0, xx = nodes[i].markGeometryObjs.length; x < xx; x++) {
                let markObj = nodes[i].markGeometryObjs[x];
                markObj.setRenderStyle(HIGH_LIGHT_STYLE);
            }
        }
    }

    /**
     * 清除节点的高亮显示样式
     * @param {Array} nodes 
     */
    clearRenderStyle(nodes) {
        for (let i = 0, ii = nodes.length; i < ii; i++) {
            let gobj = nodes[i].geometryObj;
            gobj.setRenderStyle(null);
            for (let x = 0, xx = nodes[i].markGeometryObjs.length; x < xx; x++) {
                let markObj = nodes[i].markGeometryObjs[x];
                markObj.setRenderStyle(null);
            }
        }
    }
}

/**
 * AXFG 数据格式解析
 */
class AxfgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        /**
         * 符号管理对象
         */
        this.symbolManager = options.symbol;

        /**
         * 图层配置管理对象
         * --如果包含了此参数，则对象的style中将会包含图层样式
         * --在loader中加载数据时，此参数为空，因此对象的style中不会包含图层样式
         */
        this.layerConfiguration = options.style;

        /**
         * 计数器，记录加载的各类shapeType数量
         */
        this.counter = new Counter("Format");

        /**
         * 文本动态样式
         */
        this.textDynamicStyle = null;

        /**
         * 面动态样式
         */
        this.surfaceDynamicStyle = null;

        /**
         * 线动态样式
         */
        this.lineDynamicStyle = null;

        /**
         * 点动态样式
         */
        this.pointDynamicStyle = null;

        /**
         * 图层动态样式
         */
        this.layerDynamicStyle = null;

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = false;
    }

    /**
     * 从axfg文件中读取设备节点数据
     * @param {Object} file 
     * @param {Dataset} dataset
     * @returns Array Geomerty设备节点数组
     */
    readFeatures(file, dataset) {
        let listData = [];
        let listMark = [];
        // 逐个对象分析属性、样式和几何形状
        for (let i = 0, ii = file.features.length; i < ii; i++) {
            let feature = file.features[i];
            if (feature.geometry == null || feature.geometry.coordinates == null) continue;

            let shapeType = feature.geometry.type;
            // 属性信息
            let properties = this.getProperties(feature.properties, shapeType, feature.sourcenode);
            // 坐标
            let coords = this.getCoords(feature.geometry.coordinates, shapeType, properties);
            // 样式
            let style = this.getStyle(properties, shapeType);

            // 渲染对象
            let geometryObj;
            if (shapeType == "Point") {
                // axfg格式的纯文本对象也以point方式提供，文本内容包含在mark属性中，其symbolId为空
                if (properties.symbolId != null && properties.symbolId != -1) {
                    let symbol = this.symbolManager.getSymbol(properties.symbolId, properties.symbolProp.symbolState);
                    if (symbol != null) {
                        let scale = properties.symbolProp.symbolScale;
                        geometryObj = (new Symbol({
                            symbol,
                            "x": coords[0],
                            "y": coords[1],
                            "rotation": properties.symbolProp.symbolAngle,
                            "width": symbol.width * scale,
                            "height": symbol.height * scale,
                            "style": Object.assign({ "symbolPrior": true }, style),
                            "properties": Object.assign({}, properties)
                        }));
                    } else {
                        geometryObj = new Point({ "x": coords[0], "y": coords[1], "size": 0, style, properties });
                        console.warn("符号%s-%s不存在", properties.symbolId, properties.symbolState);
                    }
                } else {
                    geometryObj = (new Point({ "x": coords[0], "y": coords[1], "pointType":-1, "size": 0, "style": style, properties }));
                    //console.warn("虚拟点: %s-%s", properties.blockId, properties.entityId);
                }
                this.counter.add("Point");
            } else if (shapeType == "MultiLineString") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polyline({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiLineString");
            } else if (shapeType == "MultiPolygon") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polygon({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiPolygon");
            } else {
                this.counter.add("Other");
                throw new Error("不支持的类型：" + shapeType);
            }

            // 加入集合中
            listData.push(geometryObj);

            // 分析标注
            let marks = this.getMark(feature.mark, properties, this.getStyle(properties, "Mark"));
            marks.forEach(markObj => {
                listMark.push(markObj);
            });

            // 添加至dataset中
            if (file.gwi > 0 && dataset != null) {
                dataset.addGraphNode(geometryObj, marks);
            }
        }
        this.counter.reset();

        return listData.concat(listMark);
    }

    /**
     * 从节点中获取坐标数据
     * @param {Array} coords 
     * @param {String} type 
     * @returns Array
     */
    getCoords(coords, type, properties) {
        let newCoords = (coords == null ? [] : coords);
        return newCoords;
    }

    /**
     * 从图层配置信息中获取Style
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object
     */
    getStyle(properties, type) {
        // 符号指定的颜色，例如站线户变图的联络线路
        let specColor = properties.color == null ? {} : { "color": properties.color, "fillColor": properties.color };
        // 图层样式
        let layerStyle;
        if (this.layerConfiguration != null && this.layerConfiguration.getStatus() === 1) {
            let layerInfo = this.layerConfiguration.getLayerInfo(properties.layerId, properties.layerSid);
            layerStyle = layerInfo != null ? layerInfo.style : null;
        }

        let style;
        if (type == "Point") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.POINT, layerStyle), specColor);
            }
            if (typeof (this.pointDynamicStyle) === "function") {
                style.dynamicFn = this.pointDynamicStyle;
            }
        } else if (type == "MultiLineString") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.LINE, layerStyle), getLineType(layerStyle.lineType), specColor);
            }
            if (typeof (this.lineDynamicStyle) === "function") {
                style.dynamicFn = this.lineDynamicStyle;
            }
        } else if (type == "MultiPolygon") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.SURFACE, layerStyle), specColor);
            }
            if (typeof (this.surfaceDynamicStyle) === "function") {
                style.dynamicFn = this.surfaceDynamicStyle;
            }
        } else if (type == "Mark") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.TEXT, layerStyle), specColor);
            }
            if (typeof (this.textDynamicStyle) === "function") {
                style.dynamicFn = this.textDynamicStyle;
            }
        } else {
            style = {};
        }

        return style;
    }

    /**
     * 获取节点中的Properties属性
     * @param {Object} prop 
     * @param {String} type 
     * @param {Object} sourceNode 
     * @returns Object
     */
    getProperties(prop, type, sourceNode) {
        let nodeType = prop.NODETYPE;
        let blockId = prop.BID;
        let entityId = prop.ID;
        let layerId = prop.LAYER_ID;
        let layerSid = prop.LAYER_SID;
        let color = getColor(prop.SCOLOR);
        sourceNode = sourceNode == null ? null : this._getSourceNode(sourceNode);

        let properties;
        if (type === "Point") {
            let symbolId = prop.SYMBOL_ID;
            let symbolState = prop.SYMBOL_STATE;
            let symbolAngle = MathUtil.toDegrees(-prop.SYMBOL_ANGLE);
            let symbolScale = prop.SYMBOL_SCALE;
            let symbolProp = { symbolState, symbolAngle, symbolScale };
            let redgeNum = prop.REDGE_NUM;
            let edge = [];
            for (let i = 0; i < redgeNum; i++) {
                edge.push({ "block": prop["REDGE" + i + "_BID"], "entityId": prop["REDGE" + i + "_ID"] });
            }
            properties = { blockId, entityId, nodeType, layerId, layerSid, symbolId, symbolProp, redgeNum, edge };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        } else {
            let headNodeBlockId = prop.HEADRNODE_BID;
            let headNodeEntityId = prop.HEADRNODE_ID;
            let headNodeLid = prop.HEADRNODE_LID;
            let head = { "blockId": headNodeBlockId, "entityId": headNodeEntityId, "lid": headNodeLid };
            let tailNodeBlockId = prop.TAILRNODE_BID;
            let tailNodeEntityId = prop.TAILRNODE_ID;
            let tailNodeLid = prop.TAILRNODE_LID;
            let tail = { "blockId": tailNodeBlockId, "entityId": tailNodeEntityId, "lid": tailNodeLid };
            properties = { blockId, entityId, nodeType, layerId, layerSid, head, tail };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        }
        return properties;
    }

    /**
     * @private
     */
    _getSourceNode(source) {
        let sourceNode = [];
        source.forEach(ele => {
            sourceNode.push({ "blockId": ele[0], "entityId": ele[1] });
        });
        return sourceNode;
    }

    /**
     * 解析node中的标注
     * @param {Object} mark 
     * @param {Object} properties 
     * @param {Object} layerStyle 
     * @returns Object
     */
    getMark(mark, properties, layerStyle) {
        let listData = [];
        if (mark != null && mark.length > 0) {
            let textStyle = getTypeStyle(GGShapeType.TEXT, layerStyle);
            for (let i = 0, ii = mark.length; i < ii; i++) {
                let text = mark[i].text;
                let textProp = Object.assign({}, properties);
                let rotation = [MathUtil.toDegrees(-mark[i].angle)];
                let fontSize = mark[i].textheight;
                let coord = this.getCoords(mark[i].coordinates, "Text", textProp);
                let style = Object.assign({ fontSize, "textBaseline": "top", "minFontSize": 0 }, textStyle);
                let color = getColor(mark[i].SCOLOR);
                if (color != null) {
                    style.color = "none";
                    style.fillColor = color;
                }

                if (text != null && coord != null && fontSize > 0) {
                    let x, y, width, height;
                    if (coord.length == 2 && Array.isArray(coord[0])) {
                        x = coord[0][0];
                        y = coord[0][1];
                        width = coord[1][0] - coord[0][0];
                        height = coord[1][1] - coord[0][1];
                    } else if (coord.length == 2 && (typeof (coord[0]) == "number")) {
                        x = coord[0];
                        y = coord[1];
                    }
                    listData.push(new Text({ text, x, y, width, height, rotation, "style": style, "properties": textProp }));
                    this.counter.add("TEXT");
                }
            }
        }
        return listData;
    }
}

const BIN_OBJ_TYPE = {
    "FILE": 1,
    "FEATURE": 2,
    "COORD": 11,
    "PROPERTIES": 12,
    "MARKS": 13,
    "MARK": 14,
    "SOURCE_NODE" : 15,
    "LAYER": 21,
    "SUBLAYER" : 22,
    "NODE_TYPE" : 31,

    "SYMBOL": 41,
    "SYMBOLLAYER": 45,
    "SYMBOLPIN": 51,
    "SYMBOLTEXT": 52,
    "SYMBOLPOINT": 53,
    "SYMBOLLINE": 55,
    "SYMBOLPOLYLINE": 56,
    "SYMBOLPOLYGON": 57,
    "SYMBOLRECT": 58,
    "SYMBOLCIRCLE": 59,
    "SYMBOLCIRCLEARC": 60,
    "SYMBOLELLIPSE": 61,
    
    "KEY": 80,
    "STRING": 81,
    "BOOLEAN": 82,
    "INT": 83,
    "FLOAT": 84,
    "JSONOBJECT": 85,
    "JSONARRAY": 86,
    
    // "NSTRING": 91,
    // "NBOOLEAN": 92,
    // "NINT": 93,
    // "NFLOAT": 94,
    // "NJSONOBJECT": 95,
    // "NJSONARRAY": 96,
    
    "OTHER": 255
};

/**
 * 二进制数据工具类
 */
class Blob {
    constructor() {
    }

    /**
     * 将一个包含Text内容转换为Wstring
     * @param {String} text 
     * @returns {ArrayBuffer} 消息内容
     *     Wstring数据类型定义如下:
     *       DataLen     字节数
     *       Ushort      宽字符1
     *       Ushort      宽字符2
     */
    static getWstringBuffer(text) {
        if (text == null) throw new Error("getWstringBuffer()参数不能为null");
        if (text == "") text = "\0";
        let bfText = this._str2ab(text);
        let bfDataLen = this._getDataLenBuffer(bfText.byteLength);
        let buffer = new ArrayBuffer(bfDataLen.byteLength + bfText.byteLength);
        this._concatBuffer(buffer, bfDataLen, 0);
        this._concatBuffer(buffer, bfText, bfDataLen.byteLength);
        return buffer;
    }

    /**
     * 得到一个含1个Uint8（Uchar）数字的ArrayBuffer
     * @param {int} int8 无符号整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint8Buffer(int8) {
        let buffer = new ArrayBuffer(1);
        let dv = new DataView(buffer);
        dv.setUint8(0, int8, true);
        return buffer;
    }

    /**
     * 得到一个含1个int8（char）数字的ArrayBuffer
     * @param {int} int8 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt8Buffer(int8) {
        let buffer = new ArrayBuffer(1);
        let dv = new DataView(buffer);
        dv.setInt8(0, int8, true);
        return buffer;
    }

    /**
     * 得到一个含1个Uint16数字的ArrayBuffer
     * @param {Array} int16 整数数组
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint16Buffer(int16) {
        let buffer = new ArrayBuffer(2);
        let dv = new DataView(buffer);
        dv.setUint16(0, int16, true);
        return buffer;
    }

    /**
     * 得到一个含1个Int16数字的ArrayBuffer
     * @param {int} int16 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt16Buffer(int16) {
        let buffer = new ArrayBuffer(2);
        let dv = new DataView(buffer);
        dv.setInt16(0, int16, true);
        return buffer;
    }

    /**
     * 得到一个含1个Uint32数字的ArrayBuffer
     * @param {int} int32 无符号整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint32Buffer(int32) {
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setUint32(0, int32, true);
        return buffer;
    }

    /**
     * 得到一个含1个Int32数字的ArrayBuffer
     * @param {int} int32 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt32Buffer(int32) {
        if (typeof (int32) === "string") {
            int32 = parseInt(int32);
        }
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setInt32(0, int32, true);
        return buffer;
    }

    /**
     * 得到一个含1个Float数字的ArrayBuffer
     * @param {int} val 浮点数
     * @returns {ArrayBuffer} 消息内容
     */
    static getFloatBuffer(val) {
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setFloat32(0, val, true);
        return buffer;
    }

    /**
     * 得到一个含Int32数组的ArrayBuffer
     * @param {Array} int32 整数数组
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt32ArrayBuffer(int32) {
        let buffer = new ArrayBuffer(int32.length * 4 + 4);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, int32.length, true);
        pos += 4;
        for (let i = 0; i < int32.length; i++) {
            dv.setInt32(pos, int32[i], true);
            pos += 4;
        }

        return buffer;
    }

    /**
     * 得到一组实体节点的ArrayBuffer
     * @param {Array} entitys 实体数组，其数组内容为{blockId, entityId}， 例如：[{blockId:3, entityId:30038}, {blockId:303, entityId:32330022}]
     * @returns {ArrayBuffer} 消息内容
     */
    static getEntitysBuffer(entitys) {
        let buffer = new ArrayBuffer(entitys.length * 8 + 4);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, entitys.length, true);
        pos += 4;
        for (let i = 0; i < entitys.length; i++) {
            let blockId = entitys[i].blockId;
            let entityId = entitys[i].entityId;
            if(blockId == null || entityId == null) {
                throw new Error("blockId或entityId不能为空值!");
            }
            dv.setInt32(pos, blockId, true);
            pos += 4;
            dv.setInt32(pos, entityId, true);
            pos += 4;
        }
        return buffer;
    }

    /**
     * 得到一组实体节点+状态的ArrayBuffer
     * @param {Array} entitys 实体数组，其数组内容为{blockId, entityId, status}， 例如：[{blockId:3, entityId:30038, status:0}, {blockId:303, entityId:32330022, status:1}]
     * @returns {ArrayBuffer} 消息内容
     */
    static getEntityStatussBuffer(entitys) {
        let buffer = new ArrayBuffer(entitys.length * (8 + 1) + 4);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, entitys.length, true);
        pos += 4;
        for (let i = 0; i < entitys.length; i++) {
            dv.setInt32(pos, entitys[i].blockId, true);
            pos += 4;
            dv.setInt32(pos, entitys[i].entityId, true);
            pos += 4;
            if (entitys[i].status == null) {
                dv.setUint8(pos, 1, true);
            } else {
                dv.setUint8(pos, entitys[i].status, true);
            }
            pos += 1;
        }
        return buffer;
    }

    /**
     * 得到一个范围的ArrayBuffer
     * @param {Array} extent: [x1,y1,x2,y2]
     * @returns {ArrayBuffer} 消息内容
     */
    static getExtentBuffer(extent) {
        if (typeof (extent) === "object" && extent.length === 4) {
            let buffer = new ArrayBuffer(16);
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setFloat32(pos, extent[0], true);
            pos += 4;
            dv.setFloat32(pos, extent[1], true);
            pos += 4;
            dv.setFloat32(pos, extent[2], true);
            pos += 4;
            dv.setFloat32(pos, extent[3], true);
            pos += 4;
            return buffer;
        } else {
            throw new Error("extent参数错误");
        }
    }

    /**
     * 得到多边形范围的ArrayBuffer
     * @param {Array} coords: [[x1,y1], [x2, y2], ……]
     * @returns {ArrayBuffer} 消息内容
     */
    static getPolygonBuffer(coords) {
        if (typeof (coords) === "object" && coords.length > 2) {
            let buffer = new ArrayBuffer(coords.length * 8 + 4);
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setInt32(pos, coords.length, true);
            pos += 4;
            for (let i = 0; i < coords.length; i++) {
                dv.setFloat32(pos, coords[i][0], true);
                pos += 4;
                dv.setFloat32(pos, coords[i][1], true);
                pos += 4;
            }
            return buffer;
        } else {
            throw new Error("coords参数错误");
        }
    }

    /**
     * 得到圆形范围的ArrayBuffer
     * @param {Array} coords: [x1,y1,radius]
     * @returns {ArrayBuffer} 消息内容
     */
    static getRoundBuffer(coords) {
        if (typeof (coords) === "object" && coords.length === 3) {
            let buffer = new ArrayBuffer(12);
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setFloat32(pos, coords[0], true);
            pos += 4;
            dv.setFloat32(pos, coords[1], true);
            pos += 4;
            dv.setFloat32(pos, coords[2], true);
            pos += 4;
            return buffer;
        } else {
            throw new Error("extent参数错误");
        }
    }

    /**
     * 得到节点类型的ArrayBuffer
     * @param {Array} nodetypeArray
     * @returns {ArrayBuffer} 消息内容
     */
    static getNodeType(nodetypeArray) {
        let buffer = new ArrayBuffer(nodetypeArray.length * 4 + 4);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, nodetypeArray.length, true);
        pos += 4;
        for (let i = 0; i < nodetypeArray.length; i++) {
            //dv.setBigInt64(pos, nodetypeArray[i], true);  long类型需chrome67及以上版本方可支持，定义该类型时，需在末尾增加一个n
            dv.setInt32(pos, nodetypeArray[i], true);
            pos += 4;
        }
        return buffer;
    }

    /**
     * 得到窗口ID的ArrayBuffer
     * @returns {ArrayBuffer} 消息内容
     */
    static getWinArrayBuffer(winIdArray) {
        let buffer = new ArrayBuffer(winIdArray.length + 1);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint8(pos, winIdArray.length, true);
        pos += 1;
        for (let i = 0; i < winIdArray.length; i++) {
            dv.setUint8(pos, winIdArray[i], true);
            pos += 1;
        }
        return buffer;
    }

    /**
     * 合并Buffer
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _concatBuffer(targetBuffer, sourceBuffer, pos) {
        let targetArray = new Uint8Array(targetBuffer);
        let sourceArray = new Uint8Array(sourceBuffer);
        targetArray.set(sourceArray, pos);
        return targetBuffer;
    }

    /**
     * 将一个数字转换为长度Buffer
     * @param {int} dataLen
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _getDataLenBuffer(dataLen) {
        let range1 = 252;
        let range2 = (256 * 256 - 1);
        let range3 = (256 * 256 * 256 * 256 - 1);

        let buffer;
        if (dataLen == 0) {
            buffer = null;
        } else if (dataLen > 0 && dataLen <= range1) {
            buffer = new ArrayBuffer(1);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, dataLen, true);
        } else if (dataLen > range1 && dataLen <= range2) {
            buffer = new ArrayBuffer(3);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, 253, true);
            dvBuffer.setUint16(1, dataLen, true);
        } else if (dataLen > range2 && dataLen <= range3) {
            buffer = new ArrayBuffer(5);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, 254, true);
            dvBuffer.setUint32(1, dataLen, true);
        }

        return buffer;
    }

    /**
     * 字符串转为ArrayBuffer对象，参数为字符串
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _str2ab(str) {
        let buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
        let bufView = new Uint16Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    /**
     * ArrayBuffer对象转字符串转，参数为ArrayBuffer
     * @private
     */
    static _ab2Str(array) {
        // 直接使用String.fromCharCode()进行转换的两种写法
        //let str1 = String.fromCharCode(...array);    //ES6支持
        //let str2 = String.fromCharCode.apply(null, array);

        // 说明：直接使用String.fromCharCode()会出现“Maximum call stack size exceeded”异常，因此需分为多段进行处理
        let res = "";
        let chunk = 8 * 1024;
        let i;
        for (i = 0; i < array.length / chunk; i++) {
            res += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
        }
        res += String.fromCharCode.apply(null, array.slice(i * chunk));
        return res;
    }

    /**
     * 读取颜色信息
     * @returns {Color} 颜色
     */
    static getColor(dv, pos) {
        let color = { r: 0, g: 0, b: 0, a: 0 };
        color.r = dv.getUint8(pos);
        color.g = dv.getUint8(pos + 1);
        color.b = dv.getUint8(pos + 2);
        color.a = dv.getUint8(pos + 3);
        //return "rgba(" + color.r + "," + color.g + "," + color.b + "," + (color.a / 100) + ")";
        return (color.a > 0 ? ("rgba(" + color.r + "," + color.g + "," + color.b + "," + ((255 - color.a) / 255) + ")") : ("rgb(" + color.r + "," + color.g + "," + color.b + ")"));
    }

    /**
     * 解析Wstring，为支持多行文本，返还值中包含了pos
     * @param {Buffer} data 
     * @param {DataView} dv 
     * @param {int} pos 
     * @returns {Object} 文本内容，格式为：{ text, pos }
     */
    static getText(data, dv, pos) {
        // 判断是否返还空值
        if (pos > (dv.byteLength - 1)) return { text: "", pos: pos };

        //Wstring     调试信息
        let dataLen = dv.getUint8(pos);
        pos += 1;
        if (dataLen === 253) {
            dataLen = dv.getUint16(pos, true);
            pos += 2;
        } else if (dataLen === 254) {
            dataLen = dv.getUint32(pos, true);
            pos += 4;
        } else if (dataLen === 255) {   // 保留
            return null;
        }
        let buf = data.slice(pos, pos + dataLen);
        pos += dataLen;

        //if(buf.byteLength < 2) {   //齿轮箱返回的字符串均采用了UTF编码，
        //    debugger;
        //} else {
        return { "text": this._ab2Str(new Uint16Array(buf)), "pos": pos, "dataLen":dataLen };
        //}
    }

    /**
     * 解析Bstream
     * @param {Buffer} data 
     * @param {DataView} dv 
     * @param {int} pos 
     * @returns 二进制Image内容
     */
    static getImage(data, dv, pos) {
        let dataLen = dv.getUint8(pos);
        pos += 1;
        if (dataLen === 253) {
            dataLen = dv.getUint16(pos, true);
            pos += 2;
        } else if (dataLen === 254) {
            dataLen = dv.getUint32(pos, true);
            pos += 4;
        } else if (dataLen === 255) {   // 保留
            return null;
        }
        let buf = data.slice(pos, pos + dataLen);
        pos += dataLen;

        return buf;
    }

    static getLength(dv, pos) {
        // 判断是否返还空值
        if (pos > (dv.byteLength - 1)) return { dataLen: -1, pos: pos };

        // get dataLen
        let dataLen = dv.getUint8(pos);
        pos += 1;
        if (dataLen === 253) {
            dataLen = dv.getUint16(pos, true);
            pos += 2;
        } else if (dataLen === 254) {
            dataLen = dv.getUint32(pos, true);
            pos += 4;
        } else if (dataLen === 255) {   // 保留
            return null;
        }      
        return { "dataLen": dataLen, "pos": pos };
    }
}

const GROW_STYLE_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_layer_style.json";

/**
 * 由GROW转出的以CIMG格式的符号集合
 */
class AxfgLayerStyle {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }
        this.layers_ = {};

        this.status = 0;
    }

    getStatus() {
        return this.status;
    }

    /**
    * 下载图层配置文件，并装载数据
    * @param {String} fileUrl 
    */
    load(callback, fileUrl = GROW_STYLE_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: (fileUrl.indexOf(".awb") > 0 || fileUrl.indexOf(".awg") > 0) ? "arraybuffer" : "json",
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getLayerStyleFromBuffer(data);
                }
                // 装载数据
                let obj = that._loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(obj);
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    /**
     * 装载数据
     * @param {Object} data 图层配置数据
     */
    _loadData(data) {
        for (let i = 0, ii = data.groups.length; i < ii; i++) {
            let group = data.groups[i];
            let groupname = group.groupname;
            for (let x = 0, xx = group.layers.length; x < xx; x++) {
                let layer = this._analyzeLayer(group.layers[x], groupname);
                this.layers_[layer.id] = layer;
            }
        }
        this.status = 1;
        return this.layers_;
    }

    _analyzeLayer(layerObj, groupname) {
        return Object.assign(layerObj, { groupname });
    }

    /**
     * 获取图层样式
     * @param {*} layerId 
     * @param {*} layerSid 
     * @returns Object
     */
    getLayerInfo(layerId, layerSid) {
        let layerInfo = {};
        let layerObj = this.layers_[layerId];

        // search sub layer
        if (layerObj != null && layerObj.sublayers != null) {
            if (layerObj.order == null) {
                layerObj.order = 1;
            }

            for (let i = 0, ii = layerObj.sublayers.length; i < ii; i++) {
                let subLayer = layerObj.sublayers[i];
                if (subLayer.sind === layerSid) {
                    layerInfo.groupName = layerObj.groupName || layerObj.groupname;
                    layerInfo.dydj = layerObj.property;                              // 电压等级
                    layerInfo.name = subLayer.name;
                    layerInfo.order = layerObj.order * 256 + subLayer.order;         // 顺序号
                    layerInfo.visible = subLayer.invisible;                          // 是否不可见
                    layerInfo.detail = subLayer.detail;                              // 是否显示明细
                    layerInfo.maxDist = subLayer.max_dist;                           // 是否显示明细
                    layerInfo.minDist = subLayer.min_dist;                           // 是否显示明细

                    layerInfo.style = {
                        "detail": subLayer.detail,                                    // 是否显示明细
                        "pointLineWidth": subLayer.ptlw,                              // 点符号线宽
                        "pointColor": getColor(subLayer.ptcolor),                     // 点符号颜色
                        "pointFillColor": getColor(subLayer.ptauxcolor),              // 点符号填充色

                        "lineWidth": subLayer.lw,                                     // 线宽
                        "lineType": subLayer.linestyle,                               // 线类型
                        "lineColor": getColor(subLayer.linecolor),                    // 线颜色
                        "lineFillColor": getColor(subLayer.fillcolor),                // 线填充色

                        "surfaceLineWidth": subLayer.edgewidth,                       // 面的线宽
                        "surfaceType": subLayer.fs,                                   // 面型
                        "surfaceFillColor": getColor(subLayer.facecolor),             // 面的填充色
                        "surfaceColor": getColor(subLayer.edgecolor),                 // 面的边框颜色

                        "textColor": getColor(subLayer.textcolor),                    // 文本颜色
                        "textShadowColor": getColor(subLayer.textshadowcolor),        // 文本阴影颜色
                        "textFontName": this._getChineseFontName(subLayer.VccFon),    // 中文字体
                        "textFontName2": this._getEnglishFontName(subLayer.AscFont)   // 英文字体
                    };
                    // break;
                }
            }
        }
        return layerInfo;
    }

    // //英文字体
    // typedef	enum	{
    // 	GK_ASC_FONT_LINE		= 0,	// 单线字符
    // 	GK_ASC_FONT_TIMES		= 1,	// Times
    // 	GK_ASC_FONT_COURIER		= 5,	// Courier
    // 	GK_ASC_FONT_PALATINO		= 9,	// Palatino
    // 	GK_ASC_FONT_ITCAVANTGARDEGOTHIC	= 13,	// ITC Avant Garde Gothic
    // 	GK_ASC_FONT_ITCBOOKMAN		= 17,	// ITC Bookman
    // 	GK_ASC_FONT_HELVETICA		= 21,	// Helvetica
    // 	GK_ASC_FONT_NEWCENTURYSCHOOLBOOK= 25,	// New Century Schoolbook
    // 	GK_ASC_FONT_CHARTER		= 29,	// Charter
    // 	GK_ASC_FONT_UTOPIA		= 33,	// Utopia
    // 	GK_ASC_FONT_ITCZAPFCHANCERY	= 37,	// ITC Zapf Chancery
    // 	GK_ASC_FONT_SYMBOL		= 41,	// Symbol
    // 	GK_ASC_FONT_FANGSONG		= 45,	// 简体仿宋
    // 	GK_ASC_FONT_SONGTI		= 49,	// 简体宋体
    // 	GK_ASC_FONT_HEITI		= 53,	// 简体黑体
    // 	GK_ASC_FONT_KAITI		= 57,	// 简体楷体
    // 	GK_ASC_FONT_SIMPLEX		= 62	// Simplex
    // }	GkAscFontType;

    _getEnglishFontName(ascfont) {
        let fontName = "Courier";
        if (ascfont === 1) {
            fontName = "Times";
        } else if (ascfont === 5) {
            fontName = "Courier";
        } else if (ascfont === 9) {
            fontName = "Palatino";
        } else if (ascfont === 29) {
            fontName = "Charter";
        } else if (ascfont === 33) {
            fontName = "Utopia";
        } else if (ascfont === 41) {
            fontName = "Symbol";
        }
        return fontName;
    }

    _getChineseFontName(vccfont) {
        let fontName = "宋体, simsun";
        if (vccfont === 2) {
            fontName = "黑体, 微软雅黑";
        } else if (vccfont === 3) {
            fontName = "行楷";
        } else if (vccfont === 4) {
            fontName = "黑体, 微软雅黑";
        } else if (vccfont === 5) {
            fontName = "录书";
        } else if (vccfont === 10) {
            fontName = "仿宋";
        } else if (vccfont === 11) {
            fontName = "幼圆";
        }
        return fontName;

        //         //中文字体
        // typedef	enum	{
        // 	GK_VCC_FONT_JTDX		= 0,	// 简体单线
        // 	GK_VCC_FONT_JTST,			// 简体宋体
        // 	GK_VCC_FONT_JTHT,			// 简体黑体
        // 	GK_VCC_FONT_JTXK,		= 3	// 简体行楷
        // 	GK_VCC_FONT_JTMH,			// 简体美黑
        // 	GK_VCC_FONT_JTLS,		= 5	// 简体隶书
        // 	GK_VCC_FONT_JTWB,			// 简体魏碑
        // 	GK_VCC_FONT_JTBS,			// 简体标宋
        // 	GK_VCC_FONT_JTBK,			// 简体标楷
        // 	GK_VCC_FONT_DXFS,			// 单线仿宋
        // 	GK_VCC_FONT_JTFS,		= 10// 简体仿宋
        // 	GK_VCC_FONT_YY,				// 幼圆
        // 	GK_VCC_FONT_FTBS		= 21,	// 繁体标宋
        // 	GK_VCC_FONT_FTFS,			// 繁体仿宋
        // 	GK_VCC_FONT_FTKT,			// 繁体楷体
        // 	GK_VCC_FONT_FTXY,			// 繁体细圆
        // 	GK_VCC_FONT_FTZY			// 繁体准圆
        // }	GkVccFontType;
        // //英文字体
        // typedef	enum	{
        // 	GK_ASC_FONT_LINE		= 0,	// 单线字符
        // 	GK_ASC_FONT_TIMES		= 1,	// Times
        // 	GK_ASC_FONT_COURIER		= 5,	// Courier
        // 	GK_ASC_FONT_PALATINO		= 9,	// Palatino
        // 	GK_ASC_FONT_ITCAVANTGARDEGOTHIC	= 13,	// ITC Avant Garde Gothic
        // 	GK_ASC_FONT_ITCBOOKMAN		= 17,	// ITC Bookman
        // 	GK_ASC_FONT_HELVETICA		= 21,	// Helvetica
        // 	GK_ASC_FONT_NEWCENTURYSCHOOLBOOK= 25,	// New Century Schoolbook
        // 	GK_ASC_FONT_CHARTER		= 29,	// Charter
        // 	GK_ASC_FONT_UTOPIA		= 33,	// Utopia
        // 	GK_ASC_FONT_ITCZAPFCHANCERY	= 37,	// ITC Zapf Chancery
        // 	GK_ASC_FONT_SYMBOL		= 41,	// Symbol
        // 	GK_ASC_FONT_FANGSONG		= 45,	// 简体仿宋
        // 	GK_ASC_FONT_SONGTI		= 49,	// 简体宋体
        // 	GK_ASC_FONT_HEITI		= 53,	// 简体黑体
        // 	GK_ASC_FONT_KAITI		= 57,	// 简体楷体
        // 	GK_ASC_FONT_SIMPLEX		= 62	// Simplex
        // }	GkAscFontType;

    }

    /**
     * 从Buffer中读取图层样式信息
     * @param {ArrayBuffer} buffer 
     * @returns layerStyleCollection
     */
    _getLayerStyleFromBuffer(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let layerStyle = {"groups":[]};

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;

            let buf = buffer.slice(pos, pos + dataLen);
            if(objType == BIN_OBJ_TYPE.LAYER) {
                this._getLayerFromBuffer(buf, layerStyle);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return layerStyle;
    }

    _getLayerFromBuffer(buffer, layerStyle) {
        let dv = new DataView(buffer);
        let pos = 0;

        // get layer property
        let groupId = dv.getUint8(pos);
        pos += 1;
        let id = dv.getUint8(pos);
        pos += 1;
        let group = dv.getUint8(pos);
        pos += 1;
        let property = dv.getInt16(pos, true);
        pos += 2;
        let nstatus = dv.getUint8(pos);
        pos += 1;
        let order = dv.getInt16(pos, true);
        pos += 2;
        let groupNameObj = Blob.getText(buffer, dv, pos);
        let groupName = groupNameObj.text;
        pos = groupNameObj.pos;

        // add to group
        let groupObj = this._getGroupObj(layerStyle, groupId, groupName);
        let layerObj = {id, group, property, nstatus, order, "sublayers":[]};
        groupObj.layers.push(layerObj);

        // generate sub layer
        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;
            let buf = buffer.slice(pos, pos + dataLen);
            if(objType == BIN_OBJ_TYPE.SUBLAYER) {
                this._getSubLayerFromBuffer(buf, layerObj);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return layerStyle;
    }

    _getGroupObj(layerStyle, groupid, groupname) {
        let group;
        for(let i=0, ii=layerStyle.groups.length; i<ii; i++) {
            if(layerStyle.groups[i].groupid === groupid) {
                group = layerStyle.groups[i];
                break;
            }
        }
        // 当不存在该组时，自动创建组
        if(group == null) {
            group = {groupid, groupname, "layers":[]};
            layerStyle.groups.push(group);
        }
        return group;
    }

    _getSubLayerFromBuffer(buffer, layerStyle) {
        let dv = new DataView(buffer);
        let pos = 0;
        // 基本信息
        let sind = dv.getUint8(pos);
        pos += 1;
        let invisible = dv.getUint8(pos);
        pos += 1;
        let detail = dv.getUint8(pos);
        pos += 1;
        let order = dv.getInt16(pos, true);
        pos += 2;
        // 点样式
        let ptlw = dv.getUint8(pos);
        pos += 1;
        let ptcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let ptauxcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 线样式
        let lw = dv.getUint8(pos);
        pos += 1;
        let linestyle = dv.getUint8(pos);
        pos += 1;
        let linecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let fillcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 面样式
        let edgewidth = dv.getUint8(pos);
        pos += 1;
        let fs = dv.getUint8(pos);
        pos += 1;
        let facecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let edgecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let textcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let textshadowcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 字体
        let VccFon = dv.getUint8(pos);
        pos += 1;
        let AscFont = dv.getUint8(pos);
        pos += 1;
        // 子图层名称
        let nameObj = Blob.getText(buffer, dv, pos);
        let name = nameObj.text;
        pos = nameObj.pos;

        // 子图层对象
        let sublayer = {sind, name, invisible, detail, order, ptlw, ptcolor, ptauxcolor, lw, linestyle, linecolor, fillcolor, edgewidth, fs, facecolor, edgecolor,textcolor,textshadowcolor, VccFon, AscFont};
  
         // add to layer
        if(layerStyle.sublayers == null) {
            layerStyle.sublayers = [];
        }
        layerStyle.sublayers.push(sublayer);
    }

    _getColorByBuffer(dv, pos) {
        let strColor = [dv.getUint8(pos), dv.getUint8(pos+1), dv.getUint8(pos+2), dv.getUint8(pos+3)];
        return strColor.join(",")
    }

    /**
     * 显示图层信息
     */
    printLayers() {
        for (let layerId in this.layers_) {
            let layer = this.layers_[layerId];
            for (let x = 0, xx = layer.sublayers.length; x < xx; x++) {
                let layerObj = layer.sublayers[x];
                console.info("group:%d, id:%d, sid:%d, name:%s, status:%d", layer.group, layer.id, layerObj.sind, layerObj.name, layer.nstatus);
            }
        }
    }
}

/**
 * 节点类型文件名路径
 */
const AXFG_NODETYPE_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_nodetype.awg";

/**
 * 节点类型
 */
class NodeType {
    /**
     * 构造函数
     * @param {Object} options {fileName} 
     */
    constructor(options = {}) {
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }

        //nodetypeGroup: {groupName, list:[nodeType, nodeType]}
        //nodeType:{id, name, symbolList}
        this.groups_ = [];
    }
    
    /**
     * 下载符号文件，并装载数据
     * @param {String} fileUrl 
     */
    load(callback, fileUrl = AXFG_NODETYPE_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: (fileUrl.indexOf(".awb") > 0 || fileUrl.indexOf(".awg") > 0) ? "arraybuffer" : "json",
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getNodetypeFromBuffer(data);
                }

                // 装载数据
                let rtn = that.loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(rtn);
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    /**
     * 装载数据
     * @param {Object} data 图层配置数据
     */
    loadData(data) {
        this.groups_ = []; //data.allnodetypelist;
        for(let i=0, ii=data.allnodetypelist.length; i<ii; i++) {
            let group = data.allnodetypelist[i];
            let groupName = group.type;
            let list = [];
            group.nodetypelist.forEach(element => {
                let id=element.nodetype;
                let name = element.nodetypename;
                let symbolList = element.symlist;
                list.push({id, name, symbolList});
            });
            this.groups_.push({groupName, list});
        }
        return this.groups_;
    }

    /**
     * 根据ID获取nodetype信息
     * @param {int} id 
     * @returns Object
     */
    get(id) {
        let nodeType = null;
        for(let i=0, ii=this.groups_.length; i<ii; i++) {
            this.groups_[i].list.forEach(node => {
                if(node.id === id) {
                    nodeType = node;
                    return;
                }
            });
            if(nodeType != null) {
                nodeType.groupName = this.groups_[i].groupName;
                break;
            }
        }
        return nodeType;
    }

    /**
     * 从Buffer中读取节点集信息
     * @param {ArrayBuffer} buffer 
     * @returns nodetypeCollection
     */
    _getNodetypeFromBuffer(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let metaObj = {"allnodetypelist":[]};

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;
            if(objType == BIN_OBJ_TYPE.NODE_TYPE) {
                let buf = buffer.slice(pos, pos + dataLen);
                this._getNodetypeBuffer(buf, metaObj);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return metaObj;
    }

    _getNodetypeBuffer(buffer, metaObj) {
        let dv = new DataView(buffer);
        let pos = 0;

        // get layer property
        let nodetype = dv.getInt32(pos, true);
        pos += 4;
        let nodetypenameObj = Blob.getText(buffer, dv, pos);
        let nodetypename = nodetypenameObj.text;
        pos = nodetypenameObj.pos;
        let groupNameObj = Blob.getText(buffer, dv, pos);
        let type = groupNameObj.text;
        pos = groupNameObj.pos;
        
        // add to group
        let groupObj = this._getGroupObj(metaObj, type);
        let layerObj = {nodetype, nodetypename};

        // symlist
        if(pos < buffer.byteLength - 1) {
            let num = dv.getUint8(pos);
            pos += 1;
            let symlist = [];
            for(let i=0; i<num; i++) {
                symlist.push(dv.getInt16(pos, true));
                pos += 2;
            }
            layerObj.symlist = symlist;
        }

        groupObj.nodetypelist.push(layerObj);
    }

    _getGroupObj(metaObj, type) {
        let group;
        for(let i=0, ii=metaObj.allnodetypelist.length; i<ii; i++) {
            if(metaObj.allnodetypelist[i].type === type) {
                group = metaObj.allnodetypelist[i];
                break;
            }
        }
        // 当不存在该组时，自动创建组
        if(group == null) {
            group = {type, "nodetypelist":[]};
            metaObj.allnodetypelist.push(group);
        }
        return group;
    }
}

/**
 * AWG 二进制数据格式解析 <br>
 * Adam Web GeoJSON：一直非常精简的二进制格式 <br>
 * info + feature + feature + ……
 */
class AWG {
    constructor() {
    }

    /**
     * 从axfb文件中读取设备节点数据
     * @param {Arraybuffer} content 
     * @returns Array Geomerty设备节点数组
     */
    static convert(blobContent) {
        // console.info("file length:%d", blobContent.byteLength);
        let dv = new DataView(blobContent);
        let pos = 0;
        let awgObj = {};

        while (true) {
            let header = this._getHead(dv, pos);
            pos = header.pos;
            // console.info(header);

            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.FILE) {
                this._getFileInbfo(buffer, awgObj);
            } else if (header.objType === BIN_OBJ_TYPE.FEATURE) {
                this._getFeature(buffer, awgObj);
            }

            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }

        awgObj.toJSON = function() {
            return "hello world";
        };
        return awgObj;
    }

    static _getHead(dv, pos) {
        let objType = dv.getUint8(pos);
        pos += 1;
        let dataLen = dv.getInt32(pos, true);
        pos += 4;
        return { objType, dataLen, pos };
    }

    static _getFileInbfo(buffer, awgObj) {
        let dv = new DataView(buffer);
        let pos = 0;
        let gwi = dv.getInt32(pos, true);
        pos += 4;
        let blockId = dv.getInt32(pos, true);
        pos += 4;
        let entityId = dv.getInt32(pos, true);
        pos += 4;
        let txtObj = Blob.getText(buffer, dv, pos);
        pos += txtObj.pos;
        let title = txtObj.text;
        Object.assign(awgObj, { gwi, blockId, entityId, title });
    }

    static _getFeature(buffer, awgObj) {
        let feature = {};
        let dv = new DataView(buffer);
        let pos = 0;

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLength = dv.getInt32(pos, true);
            pos += 4;

            if(dataLength > 0) {
                let buf = buffer.slice(pos, pos + dataLength);
                if (objType === BIN_OBJ_TYPE.COORD) {
                    this._getGeomery(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.PROPERTIES) {
                    this._getProperties(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.MARKS) {
                    this._getMarks(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.SOURCE_NODE) {
                    this._getSourceNode(buf, feature);
                } else {
                    console.warn("unSupport object type! objType:%d", objType);
                }
                pos += dataLength;
            }

            if (pos >= buffer.byteLength) break;
        }
        if (awgObj.features == null) {
            awgObj.features = [];
        }
        awgObj.features.push(feature);
    }

    static _getGeomery(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let geometry = {};
        let coordType = dv.getUint8(pos);
        pos += 1;
        if (coordType == 1) {
            geometry.type = "Point";
            geometry.coordinates = this._getCoords(dv, pos, coordType);
            feature.geometry = geometry;
        } else {
            geometry.type = (coordType == 4 ? "MultiLineString" : "MultiPolygon");
            geometry.coordinates = this._getCoords(dv, pos, coordType);
            feature.geometry = geometry;
        }
        return pos;
    }

    static _getCoords(dv, pos, type) {
        if (type === 1) {
            let x = dv.getFloat32(pos, true);
            pos += 4;
            let y = dv.getFloat32(pos, true);
            pos += 4;
            return [x, y]
        } else if (type === 2 || type === 3) {
            let num = dv.getInt32(pos, true);
            pos += 4;
            let coords = [];
            for (let i = 0; i < num; i++) {
                let x = dv.getFloat32(pos, true);
                pos += 4;
                let y = dv.getFloat32(pos, true);
                pos += 4;
                coords.push([x, y]);
            }
            return coords;
        } else {
            let groupNum = dv.getInt32(pos, true);
            pos += 4;
            let groupCoord = [];
            for (let j = 0; j < groupNum; j++) {
                let num = dv.getInt32(pos, true);
                pos += 4;
                let coords = [];
                for (let i = 0; i < num; i++) {
                    let x = dv.getFloat32(pos, true);
                    pos += 4;
                    let y = dv.getFloat32(pos, true);
                    pos += 4;
                    coords.push([x, y]);
                }
                groupCoord.push(coords);
            }
            return groupCoord;
        }
    }

    static _getProperties(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let coordType = dv.getUint8(pos);
        pos += 1;
        // read properties
        let BID = dv.getInt32(pos, true);
        pos += 4;
        let ID = dv.getInt32(pos, true);
        pos += 4;
        let NODETYPE = dv.getInt32(pos, true);
        pos += 4;
        let LAYER_ID = dv.getInt32(pos, true);
        pos += 4;
        let LAYER_SID = dv.getInt32(pos, true);
        pos += 4;

        let properties;
        if (coordType == 1) {
            let SYMBOL_ID = dv.getInt32(pos, true);
            pos += 4;
            let SYMBOL_STATE = dv.getInt32(pos, true);
            pos += 4;
            let SYMBOL_ANGLE = dv.getFloat32(pos, true);
            pos += 4;
            let SYMBOL_SCALE = dv.getFloat32(pos, true);
            pos += 4;
            properties = { BID, ID, NODETYPE, LAYER_ID, LAYER_SID, SYMBOL_ID, SYMBOL_STATE, SYMBOL_ANGLE, SYMBOL_SCALE };
        } else {
            properties = { BID, ID, NODETYPE, LAYER_ID, LAYER_SID };
        }

        // SCOLOR
        let scolorObj = Blob.getText(buffer, dv, pos);
        pos = scolorObj.pos;
        let SCOLOR = scolorObj.text;
        if(SCOLOR != null && SCOLOR != "") {
            properties.SCOLOR = SCOLOR;
        }

        feature.properties = properties;
        return pos;
    }

    static _getMarks(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let markArray = [];

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLength = dv.getInt32(pos, true);
            pos += 4;
            if (objType === BIN_OBJ_TYPE.MARK && dataLength > 0) {
                markArray.push(this._getMark(buffer.slice(pos, pos + dataLength)));
            }
            pos += dataLength;
            if (pos >= buffer.byteLength) break;
        }
        feature.mark = markArray;
    }

    static _getMark(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let angle = dv.getFloat32(pos, true);
        pos += 4;
        let textheight = dv.getFloat32(pos, true);
        pos += 4;

        // text
        let txtObj = Blob.getText(buffer, dv, pos);
        pos = txtObj.pos;
        let text = txtObj.text;

        // 坐标对象
        let objT = dv.getUint8(pos);
        pos += 1;
        let objLen = dv.getInt32(pos, true);
        pos += 4;
        let coordinates;
        if(objT === BIN_OBJ_TYPE.COORD) {
            // mark的坐标为线坐标类型
            let shapeType = dv.getUint8(pos);
            //pos += 1;
            coordinates = this._getCoords(dv, pos + 1, shapeType);
            pos += objLen;   
        }

        // SCOLOR
        let scolorObj = Blob.getText(buffer, dv, pos);
        pos = scolorObj.pos;
        let SCOLOR = scolorObj.text;

        // mark对象
        let objMark = { angle, textheight, coordinates, text };
        if(SCOLOR != null && SCOLOR != "") {
            objMark.SCOLOR = SCOLOR;
        }
        return objMark;
    }

    static _getSourceNode(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let sourcenode = [];
        let count = dv.getUint8(pos);
        pos += 1;
        for(let i=0; i<count; i++) {
            let blockId = dv.getInt32(pos, true);
            pos += 4;
            let entityId = dv.getInt32(pos, true);
            pos += 4;
            sourcenode.push([blockId, entityId]);
        }
        feature.sourcenode = sourcenode;
    }
}

/**
 * AWB 二进制数据格式解析 <br>
 * Adam Web Binary：二进制格式  <br>
 * objType + Dlength + value + objType + Dlength + value + ……
 */
class AWB {
    constructor() {
    }  

    /**
     * 从axfb文件中读取数据
     * @param {Arraybuffer} content 
     * @returns 内容
     */
    static convert(blobContent) {
        return this._getJSONObjectValue(blobContent);
    }


    static _getJSONObjectValue(blobContent) {
        let dv = new DataView(blobContent);
        let pos = 0;
        let key, val;    
        let awbObj = {};
        while (true) {
            let isKey = false;
            let header = this._getHead(dv, pos);
            pos = header.pos;

            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.KEY) {
                key = this._getStringValue(buffer);
                isKey = true;
            } else if (header.objType === BIN_OBJ_TYPE.STRING) {
                val = this._getStringValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.BOOLEAN) {
                val = this._getBooleanValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.INT) {
                val = this._getIntValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.FLOAT) {
                val = this._getFloatValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONOBJECT) {
                val = this._getJSONObjectValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONARRAY) {
                val = this._getJSONArrayValue(buffer);
            } else {
                console.log("unknow objtype, %d", header.objType);
            }
            if(isKey === false) {
                if(key == null) {
                    awbObj = val;
                } else {
                    awbObj[key] = val;
                    key = null;
                }
            }

            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }

        if(typeof(awbObj) === "object") {
            awbObj.toJSON = function() {
                return "hello world";
            };
        }

        return awbObj;
    }
    
    static _getJSONArrayValue(blobContent) {

        let dv = new DataView(blobContent);
        let pos = 0;
        let array = [];

        while (true) {
            let header = this._getHead(dv, pos);
            pos = header.pos;
            let val;
            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.STRING) {
                val = this._getStringValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.BOOLEAN) {
                val = this._getBooleanValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.INT) {
                val = this._getIntValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.FLOAT) {
                val = this._getFloatValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONOBJECT) {
                val = this._getJSONObjectValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONARRAY) {
                val = this._getJSONArrayValue(buffer);
            } else {
                console.warn("unknow objtype, %d", header.objType);
            }

            array.push(val);
            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }
        
        return array;
    }

    static _getStringValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let pvalue = Blob.getText(buffer, dv, pos);
        let value = pvalue.text;
        return value;
    }

    static _getBooleanValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getUint8(pos);
        return (value == 1 ? true : false);
    }

    static _getIntValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getInt32(pos, true);
        return value;
    }

    static _getFloatValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getFloat32(pos, true);
        return value;
    }

    static _getHead(dv, pos) {
        let objType = dv.getUint8(pos);
        pos += 1;
        
        // get dataLen
        let dataLen = dv.getUint8(pos);
        pos += 1;
        if (dataLen === 253) {
            dataLen = dv.getUint16(pos, true);
            pos += 2;
        } else if (dataLen === 254) {
            dataLen = dv.getUint32(pos, true);
            pos += 4;
        } else if (dataLen === 255) {   // 保留
            return null;
        }

        return { objType, dataLen, pos };
    }
}

/**
 * AXFGS 简化数据格式解析
 */
class AxfgsFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        /**
         * 符号管理对象
         */
        this.symbolManager = options.symbol;

        /**
         * 图层配置管理对象
         * --如果包含了此参数，则对象的style中将会包含图层样式
         * --在loader中加载数据时，此参数为空，因此对象的style中不会包含图层样式
         */
        this.layerConfiguration = options.style;

        /**
         * 计数器，记录加载的各类shapeType数量
         */
        this.counter = new Counter("Format");

        /**
         * 文本动态样式
         */
        this.textDynamicStyle = null;

        /**
         * 面动态样式
         */
        this.surfaceDynamicStyle = null;

        /**
         * 线动态样式
         */
        this.lineDynamicStyle = null;

        /**
         * 点动态样式
         */
        this.pointDynamicStyle = null;

        /**
         * 图层动态样式
         */
        this.layerDynamicStyle = null;

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = false;
    }

    /**
     * 从axfg文件中读取设备节点数据
     * @param {Object} file 
     * @param {Dataset} dataset
     * @returns Array Geomerty设备节点数组
     */
    readFeatures(file, dataset) {
        let listData = [];
        let listMark = [];
        // 逐个对象分析属性、样式和几何形状
        for (let i = 0, ii = file.features.length; i < ii; i++) {
            let feature = file.features[i];
            if (feature.g == null || feature.g.c == null) continue;

            let shapeType = feature.g.t == "p" ? "Point" : (feature.g.t == "l" ? "MultiLineString" : "MultiPolygon");
            // 属性信息
            let properties = this.getProperties(feature.p, shapeType, feature.s);
            // 坐标
            let coords = this.getCoords(feature.g.c, shapeType, properties);
            // 样式
            let style = this.getStyle(properties, shapeType);

            // 渲染对象
            let geometryObj;
            if (shapeType == "Point") {
                // axfg格式的纯文本对象也以point方式提供，文本内容包含在mark属性中，其symbolId为空
                if (properties.symbolId != null) {
                    let symbol = this.symbolManager.getSymbol(properties.symbolId, properties.symbolProp.symbolState);
                    if (symbol != null) {
                        let scale = properties.symbolProp.symbolScale;
                        geometryObj = (new Symbol({
                            symbol,
                            "x": coords[0],
                            "y": coords[1],
                            "rotation": properties.symbolProp.symbolAngle,
                            "width": symbol.width * scale,
                            "height": symbol.height * scale,
                            "style": Object.assign({ "symbolPrior": true }, style),
                            "properties": Object.assign({}, properties)
                        }));
                    } else {
                        geometryObj = (new Point({ "x": coords[0], "y": coords[1], "size": 0, style, properties }));
                        console.warn("符号%s-%s不存在", properties.symbolId, properties.symbolState);
                    }
                } else {
                    geometryObj = (new Point({ "x": coords[0], "y": coords[1], "size": 0, "style": style, properties }));
                    //console.warn("虚拟点: %s-%s", properties.blockId, properties.entityId);
                }
                this.counter.add("Point");
            } else if (shapeType == "MultiLineString") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polyline({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiLineString");
            } else if (shapeType == "MultiPolygon") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polygon({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiPolygon");
            } else {
                this.counter.add("Other");
                throw new Error("不支持的类型：" + shapeType);
            }

            // 加入集合中
            listData.push(geometryObj);

            // 分析标注
            let marks = this.getMark(feature.m, properties, this.getStyle(properties, "Mark"));
            marks.forEach(markObj => {
                listMark.push(markObj);
            });

            // 添加至dataset中
            if (file.gwi > 0 && dataset != null) {
                dataset.addGraphNode(geometryObj, marks);
            }
        }
        this.counter.reset();

        return listData.concat(listMark);
    }

    /**
     * 从节点中获取坐标数据
     * @param {Array} coords 
     * @param {String} type 
     * @returns Array
     */
    getCoords(coords, type, properties) {
        let newCoords = (coords == null ? [] : coords);
        return newCoords;
    }

    /**
     * 从图层配置信息中获取Style
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object 
     */
    getStyle(properties, type) {
        // 符号指定的颜色，例如站线户变图的联络线路
        let specColor = properties.color == null ? {} : { "color": properties.color, "fillColor": properties.color };
        // 图层样式
        let layerStyle;
        if (this.layerConfiguration != null && this.layerConfiguration.getStatus() === 1) {
            let layerInfo = this.layerConfiguration.getLayerInfo(properties.layerId, properties.layerSid);
            layerStyle = layerInfo != null ? layerInfo.style : null;
        }

        let style;
        if (type == "Point") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.POINT, layerStyle), specColor);
            }
            if (typeof (this.pointDynamicStyle) === "function") {
                style.dynamicFn = this.pointDynamicStyle;
            }
        } else if (type == "MultiLineString") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.LINE, layerStyle), getLineType(layerStyle.lineType), specColor);
            }
            if (typeof (this.lineDynamicStyle) === "function") {
                style.dynamicFn = this.lineDynamicStyle;
            }
        } else if (type == "MultiPolygon") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.SURFACE, layerStyle), specColor);
            }
            if (typeof (this.surfaceDynamicStyle) === "function") {
                style.dynamicFn = this.surfaceDynamicStyle;
            }
        } else if (type == "Mark") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.TEXT, layerStyle), specColor);
            }
            if (typeof (this.textDynamicStyle) === "function") {
                style.dynamicFn = this.textDynamicStyle;
            }
        } else {
            style = {};
        }

        return style;
    }

    /**
     * 获取节点中的Properties属性
     * @param {Object} feature 
     * @param {String} type 
     * @returns Object
     */
    getProperties(prop, type, sourceNode) {
        let nodeType = prop.nt;
        let blockId = prop.bid;
        let entityId = prop.id;
        let layerId = prop.lid;
        let layerSid = prop.lsid;
        let color = getColor(prop.scc);
        sourceNode = sourceNode == null ? null : this._getSourceNode(sourceNode);

        let properties;
        if (type === "Point") {
            let symbolId = prop.sid;
            let symbolState = prop.ss;
            let symbolAngle = MathUtil.toDegrees(-prop.sa);
            let symbolScale = prop.sc;
            let symbolProp = { symbolState, symbolAngle, symbolScale };
            let redgeNum = prop.rn == null ? 0 : prop.rn;
            let edge = [];
            for (let i = 0; i < redgeNum; i++) {
                edge.push({ "block": prop["REDGE" + i + "_BID"], "entityId": prop["REDGE" + i + "_ID"] });
            }
            properties = { blockId, entityId, nodeType, layerId, layerSid, symbolId, symbolProp, redgeNum, edge };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        } else {
            let headNodeBlockId = prop.HEADRNODE_BID;
            let headNodeEntityId = prop.HEADRNODE_ID;
            let headNodeLid = prop.HEADRNODE_LID;
            let head = { "blockId": headNodeBlockId, "entityId": headNodeEntityId, "lid": headNodeLid };
            let tailNodeBlockId = prop.TAILRNODE_BID;
            let tailNodeEntityId = prop.TAILRNODE_ID;
            let tailNodeLid = prop.TAILRNODE_LID;
            let tail = { "blockId": tailNodeBlockId, "entityId": tailNodeEntityId, "lid": tailNodeLid };
            properties = { blockId, entityId, nodeType, layerId, layerSid, head, tail };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        }
        return properties;
    }

    /**
     * @private
     * @param {Array} source 
     * @returns Array
     */
    _getSourceNode(source) {
        let sourceNode = [];
        source.forEach(ele => {
            sourceNode.push({ "blockId": ele[0], "entityId": ele[1] });
        });
        return sourceNode;
    }

    /**
     * 解析node中的标注
     * @param {Object} mark 
     * @param {Object} properties 
     * @param {Object} layerStyle 
     * @returns Object
     */
    getMark(mark, properties, layerStyle) {
        let listData = [];
        if (mark != null && mark.length > 0) {
            let textStyle = getTypeStyle(GGShapeType.TEXT, layerStyle);
            for (let i = 0, ii = mark.length; i < ii; i++) {
                let text = mark[i].t;
                let textProp = Object.assign({}, properties);
                let rotation = [MathUtil.toDegrees(-mark[i].a)];
                let fontSize = mark[i].h;
                let coord = this.getCoords(mark[i].c, "Text", textProp);
                let style = Object.assign({ fontSize, "textBaseline": "top", "minFontSize": 0 }, textStyle);
                let color = getColor(mark[i].scc);
                if (color != null) {
                    style.color = color;
                    style.fillColor = color;
                }

                if (text != null && coord != null && fontSize > 0) {
                    let x, y, width, height;
                    if (coord.length == 2 && Array.isArray(coord[0])) {
                        x = coord[0][0];
                        y = coord[0][1];
                        width = coord[1][0] - coord[0][0];
                        height = coord[1][1] - coord[0][1];
                    } else if (coord.length == 2 && (typeof (coord[0]) == "number")) {
                        x = coord[0];
                        y = coord[1];
                    }
                    listData.push(new Text({ text, x, y, width, height, rotation, "style": style, "properties": textProp }));
                    this.counter.add("TEXT");
                }
            }
        }
        return listData;
    }
}

/**
 * 精准拓扑电系图格式化
 */
class AxfgMainTopoFormat extends AxfgFormat {
    constructor(options = {}) {
        super(options);

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = true;

        /**
         * 图层动态样式，5万米以上的高度，不显示文本
         * @param {Layer} layer 
         * @param {Object} frameState 
         * @returns Boolean
         */
        this.layerDynamicStyle = function(layer, frameState) {
            if(frameState.dist > 50000 && layer.getName().indexOf("/mark") > 0) {
                return false;
            } else {
                return true;
            }
        };
    }

    /**
     * 获取样式，对变电站概貌进行特殊处理
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object 样式对象
     */
    getStyle(properties, type) {
        let style = super.getStyle(properties, type);

        // 当notetype为变电站时，符号将以概貌形式呈现
        let overView = properties.nodeType === 12583430 ? true : false;
        let overViewMaxDist = 20000;
        let overViewSize = 6;
        if (overView === true) {
            Object.assign(style, { overView, overViewMaxDist, overViewSize });
        }
        return style;
    }
}

/**
 * 精准拓扑电系图格式化
 */
class AxfgsMainTopoFormat extends AxfgsFormat {
    constructor(options = {}) {
        super(options);

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = true;

        /**
         * 图层动态样式，5万米以上的高度，不显示文本
         * @param {Layer} layer 
         * @param {Object} frameState 
         * @returns Boolean
         */
        this.layerDynamicStyle = function(layer, frameState) {
            if(frameState.dist > 50000 && layer.getName().indexOf("/mark") > 0) {
                return false;
            } else {
                return true;
            }
        };
    }

    /**
     * 获取样式，对变电站概貌进行特殊处理
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object 样式对象
     */
    getStyle(properties, type) {
        let style = super.getStyle(properties, type);

        // 当notetype为变电站时，符号将以概貌形式呈现
        let overView = properties.nodeType === 12583430 ? true : false;
        if (overView === true) {
            let overViewMaxDist = 20000;
            let overViewSize = 6;
                Object.assign(style, { overView, overViewMaxDist, overViewSize });
        }
        return style;
    }
}

/**
 * 背景地图数据格式化
 */
class AxfgBackgroundFormat extends AxfgFormat {
    constructor(options = {}) {
        super(options);

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = true;

        /**
         * 网格的字体大小改为屏幕相关
         */
        this.textDynamicStyle = function (obj, style, frameState) {
            if (frameState.dist > 10000) {
                if (style.fontSize > 16) {
                    style.fontSize = 16;
                }
            } else if (frameState.dist > 5000) {
                if (style.fontSize > 20) {
                    style.fontSize = 20;
                }
            } else {
                if (style.fontSize > 24) {
                    style.fontSize = 24;
                }
            }
            return true;
        };
    }

    /**
     * 获取样式，对背景地图中的多边形和多线进行简化处理
     * @param {Array} coords 
     * @param {String} type 
     * @returns Array 坐标值
     */
    getCoords(coords, type, properties) {
        let newCoords = (coords == null ? [] : coords);
        let tolerance = 1;
        if (type == "MultiLineString") {
            for (let i = 0, ii = coords.length; i < ii; i++) {
                if (coords[i].length > 2) {
                    // 对线和面进行简化
                    newCoords[i] = simplify(coords[i], tolerance);
                }
            }
        } else if (type == "MultiPolygon") {
            for (let i = 0, ii = coords.length; i < ii; i++) {
                if (coords[i].length > 2) {
                    // 对线和面进行简化
                    let newCoord = simplify(coords[i], tolerance);
                    while (newCoord.length < 3) {
                        tolerance = tolerance / 2;
                        newCoord = simplify(coords[i], tolerance);
                    }
                    newCoords[i] = newCoord;
                }
            }
        } 
        return newCoords;
    }
}

/**
 * 数据加载对象
 */
class AxfgLoader {
    constructor(graph, options={}) {
        this._layerConfiguration = new AxfgLayerStyle();
        this._symbolManager = new AxfgSymbol();
        this._nodeTypeManager = new NodeType();
        this._dataType = "json";
        this._dataset = new Dataset();
        this.graph = graph;

        /**
         * 元数据文件
         */
        this.symbolFileUrl = options.symbolFileUrl;
        this.nodeTypeFileUrl = options.nodeTypeFileUrl;
        this.layerStyleUrl = options.layerStyleUrl;
    }

    /**
     * 获取数据管理对象
     * @returns 数据管理对象
     */
    getDataset() {
        return this._dataset;
    }

    /**
     * 获取图层样式配置对象
     * @returns 图层样式配置对象
     */
    getStyleManager() {
        return this._layerConfiguration;
    }

    /**
     * 获取符号管理对象
     * @returns 符号管理对象
     */
    getSymbolManager() {
        return this._symbolManager;
    }

    /**
     * 获取节点类型管理对象
     * @returns 符号管理对象
     */
    getNodeTypeManager() {
        return this._nodeTypeManager;
    }

    /**
     * 加载元数据
     */
    async loadMetaData(callback) {
        let beginTime = Date.now();
        const listData = await Promise.all([this._getLayerStylePromise(), this._getSymbolPromise(), this._getNodeTypePromise()]).then(function (result) {
            {
                console.log("元数据初始化完成, load time:%dms", (Date.now() - beginTime));
            }
        });
        if (typeof (callback) === "function") {
            callback(listData);
        }
    }

    _getLayerStylePromise() {
        let that = this;
        let p1 = new Promise(function (resolue, reject) {
            that._layerConfiguration.load(function (file) {
                resolue(file);
            }, that.layerStyleUrl);
        });
        return p1;
    }

    _getSymbolPromise() {
        let that = this;
        let p2 = new Promise(function (resolue, reject) {
            that._symbolManager.load(function (file) {
                resolue(file);
            }, that.symbolFileUrl);
        });
        return p2;
    }

    _getNodeTypePromise() {
        let that = this;
        let p3 = new Promise(function (resolue, reject) {
            that._nodeTypeManager.load(function (file) {
                resolue(file);
            }, that.nodeTypeFileUrl);
        });
        return p3;
    }

    /**
     * 根据GWI获取对应的格式解析对象，从而为AXFG文件实现定制渲染效果
     * @param {Object} axfgfile AXFG数据文件对象
     * @returns FeatureFormat对象
     */
    getFeatureFormat(axfgfile) {
        let format;
        if (axfgfile.simplify === true) {
            if (axfgfile.gwi === 1 || axfgfile.gwi === 2 || axfgfile.gwi === 3) {
                format = new AxfgsMainTopoFormat({
                    "symbol": this._symbolManager
                });
            } else {
                format = new AxfgsFormat({
                    "symbol": this._symbolManager
                });
            }
        } else {
            if (axfgfile.gwi === 1 || axfgfile.gwi === 2 || axfgfile.gwi === 3) {
                format = new AxfgMainTopoFormat({
                    "symbol": this._symbolManager
                });
            } else if (axfgfile.gwi == null) {
                format = new AxfgBackgroundFormat({
                    "symbol": this._symbolManager
                });
            } else {
                format = new AxfgFormat({
                    "symbol": this._symbolManager
                });
            }
        }
        return format;
    }

    /**
     * 装入AXFG数据，并将数据装载至graph中
     * @param {Object} axfgfile AXFG数据文件对象
     * @param {Function} callback 数据装载完成之后的回调函数
     */
    loadData(axfgfile, isBuildIdx = false) {
        if (ClassUtil.typeof(axfgfile) === "ArrayBuffer") {
            let buffer = axfgfile;
            axfgfile = AWG.convert(buffer);

            // 转换后如果未能包含features属性，则怀疑是数据格式异常，使用awb格式重新转换
            if (axfgfile.features == null) {
                axfgfile = AWB.convert(buffer);
            }
            buffer = null;
        } else if (typeof (axfgfile) === "string") {
            axfgfile = JSON.parse(axfgfile);
        }
        let format = this.getFeatureFormat(axfgfile);
        let listData = format.readFeatures(axfgfile, this._dataset);

        // 增加至渲染数据源中
        this._loadGeomeryData(listData, { "mergeLine": format.mergeLine, "dynamic": format.layerDynamicStyle });

        // 是否建立索引
        if (isBuildIdx === true) {
            this.rebuildIndex();
        }
        return listData;
    }

    /**
     * 下载AXFG数据文件，并将数据装载至graph中
     * @param {Array} fileUrlArray 文件数组
     * @param {View} view 视图，指定该参数后，在加载每个文件之后将会执行一次图形渲染
     * @param {Function} callback 数据装载完成之后的回调函数
     */
    async loadFiles(fileUrlArray, view, callback) {
        if(fileUrlArray == null || fileUrlArray.length == null || fileUrlArray.length == 0) {
            return null;
        }
        let that = this;
        let ps = [];
        if (Array.isArray(fileUrlArray)) {
            for (let i = 0, ii = fileUrlArray.length; i < ii; i++) {
                ps.push(this._getLoadFilePromise(fileUrlArray[i]));
            }
        } else {
            ps.push(this._getLoadFilePromise(fileUrlArray));
        }

        try {
            const listData = await Promise.all(ps);
            that.rebuildIndex();
            that.graph.setView(view);
            that.graph.render();

            if (typeof (callback) === "function") {
                callback(listData);
            }
        } catch (err) {
            console.error(err);
            if (typeof (callback) === "function") {
                callback(err);
            }
        }
    }

    /**
     * 生成下载单个AXFG数据文件并将数据装载至graph中的异步对象
     * @param {*} fileUrl 
     * @returns 异步文件下载装入对象
     */
    _getLoadFilePromise(fileUrl) {
        let that = this;
        let p = new Promise(function (resolue, reject) {
            let ext = fileUrl.substring(fileUrl.lastIndexOf("."));
            let dataType = (ext == ".awg" || ext == ".awb" || ext == ".bin" > 0) ? "arraybuffer" : that._dataType;
            AjaxUtil.get({
                url: fileUrl,
                dataType: dataType,
                success: function (axfgfile) {

                    // 将数据加载至图形中
                    let listData = that.loadData(axfgfile, false);

                    // execute finish.
                    resolue(listData);
                },
                error: function (res) {
                    reject(res);
                }
            });
        });
        return p;
    }

    /**
     * 将Geomery数据加入graph的各个图层中
     * @param {Array} listData Geomery数组
     * @param {Object} addLayerStyle 附加样式
     */
    _loadGeomeryData(listData, addLayerStyle) {
        for (let i = 0, ii = listData.length; i < ii; i++) {
            let obj = listData[i];
            let source = this.getSource(obj.properties, addLayerStyle);
            source.loadData([obj]);
        }
    }

    /**
     * 从graph中获取图层，如果图层不存在，则新建该图层
     * 附加说明：
     *     axfg数据中mark和shape作为一个对象，为了mark渲染在shape之上，强制将mark和shape分在不同的图层，
     *     且所有mark均在所有shape层之上(即mark层的order=对应shape层的order+100000)
     * @param {Object} layerArg 
     * @param {Object} addLayerStyle 附加的图层样式
     * @returns Source
     */
    getSource(layerArg, addLayerStyle) {
        // 获取图层配置参数
        let layerId = layerArg.layerId;
        let subLayerId = layerArg.layerSid;
        let isTextObj = layerArg.text == null ? false : true;
        let strLayerId = layerId + "-" + subLayerId;
        if (isTextObj === true) {
            strLayerId = strLayerId + "-text";
        }
        let layerInfo = this._layerConfiguration.getLayerInfo(layerId, subLayerId);

        // 获取图层
        let layer = this.graph.getLayer(strLayerId);
        if (layer == null) {
            layer = new Layer({
                source: new VectorSource(),
                id: strLayerId,
                name: (layerInfo != null ? layerInfo.groupName + "/" + layerInfo.name + (isTextObj === true ? "/mark" : "") : strLayerId),
                zIndex: (layerInfo != null && layerInfo.order != null ? layerInfo.order + (isTextObj === true ? getLayerId() : 0) : 200),
                style: (layerInfo != null ? Object.assign({}, layerInfo.style, addLayerStyle) : addLayerStyle),
                maxDistinct: (layerInfo != null ? layerInfo.maxDist : null),
                minDistinct: (layerInfo != null ? layerInfo.minDist : null),
                visible: true
            });
            this.graph.addLayer(layer);
        }
        return layer.getSource();
    }

    /**
     * 重建索引
     */
    rebuildIndex() {
        let layers = this.graph.getLayers();
        for (let i = 0, ii = layers.length; i < ii; i++) {
            let source = layers[i].getSource();
            if (source instanceof VectorSource && !layers[i].isUsePixelCoord()) {
                source.buildIndex();
            }
        }
    }
}

export { AjaxUtil, Animation, Arrow, AxfgFormat, AxfgLoader, BgUtil, BrowserUtil, CimgFormat, CimgSymbol, Circle, ClassUtil, Clip, Collide, Color, Coordinate, DomUtil, DragBox, DragPan, DragZoom, Easing, Ellipse, EventType, Extent, FeatureFormat, Filter, Flicker, GGShapeType, GGeometryType, GeoJSONFormat, GeomAdd, GeomControl, Geometry, Gradient, Graph, GraphRenderer, Group, Image, ImageLoader, ImageObject, ImageState, Ladder, Layer, LayerControl, LayerRenderer, LayerRendererState, LineString, Mark, MathUtil, Measure, MousePositionControl, MultiPolyline, Path, Pattern, Point, PointClass, PointSharp, Polygon, PolygonAdd, Polyline, Ratio, Rect, RendererBase, SvgFormat, SvgSymbol, Symbol, Text, TileCoord, TileGrid, TileLayerRenderer, TileRange, TileSource, Transform, Triangle, Tween, TweenEasing, UrlUtil, VectorRenderer, VectorSource, View, WebMercator, XNGeoJsonData, XmlUtil, ZoomControl, circle2LineRing, clipPolygon, clipSegments, getCimgColor, getStarLineRing, rect2LineRing, simplify };
