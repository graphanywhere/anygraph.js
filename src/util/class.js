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
    }

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
    }

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
    }
}());

export default ClassUtil;
