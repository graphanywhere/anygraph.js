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
    }

    /**
     * 根据b的符号返回a/b的模
     * @param {number} a Dividend.
     * @param {number} b Divisor.
     * @return {number} Modulo.
     */
    MathUtil.modulo = function (a, b) {
        const r = a % b;
        return r * b < 0 ? r + b : r;
    }

    /**
     * 计算a和b之间的x的线性插值
     * @param {number} a 开始值
     * @param {number} b 结束值
     * @param {number} x 插值系数.
     * @return {number} 插值.
     */
    MathUtil.lerp = function (a, b, x) {
        return a + x * (b - a);
    }

    /**
     * 获取指定范围内的数字
     * @param {number} value 数值.
     * @param {number} min 范围最小值.
     * @param {number} max 范围最大值.
     * @return {number} 指定范围内的数字，或与范围最接近的数字
     */
    MathUtil.clamp = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

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
    }

    /**
     * 先按小数位四舍五入,然后按四舍五入到整数, 例如 round(10.495, 2)的返回值为11
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The nearest integer.
     */
    MathUtil.round = function (n, decimals = 0) {
        return Math.round(this.toFixed(n, decimals));
    }

    /**
     * 先按小数位四舍五入,然后取整, 例如 round(10.995, 2)的返回值为11
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The next smaller integer.
     */
    MathUtil.floor = function (n, decimals = 0) {
        return Math.floor(this.toFixed(n, decimals));
    }

    /**
     * 只考虑给定的小数位数,将一个数字四舍五入到下一个较大的整数(最后一位四舍五舍五入)。
     * @param {number} n The input number.
     * @param {number} decimals The maximum number of decimal digits.
     * @return {number} The next bigger integer.
     */
    MathUtil.ceil = function (n, decimals = 0) {
        return Math.ceil(this.toFixed(n, decimals));
    }

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
    }

    /**
     * 将弧度转换为度
     * @param {number} angleInRadians 以弧度为单位的角度
     * @return {number} 角度（以度为单位）
     */
    MathUtil.toDegrees = function (angleInRadians) {
        return (angleInRadians * 180) / Math.PI;
    }

    /**
     * 将度数转换为弧度
     * @param {number} angleInDegrees 以度为单位的角度
     * @return {number} 角度（弧度）
     */
    MathUtil.toRadians = function (angleInDegrees) {
        return (angleInDegrees * Math.PI) / 180;
    }

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
    }

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
    }
}());

export default MathUtil;

// console.info(MathUtil.ceil(4.494123, 2));
// console.info(Math.ceil(4.445123));
// console.info(MathUtil.round(4.445123, 2));
