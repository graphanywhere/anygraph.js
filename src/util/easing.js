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
    }

    /**
     * 启动加速快，结束缓慢(减速曲线)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.270, 0.488, 0.657, 0.784, 0.875, 0.936, 0.973, 0.992, 0.999, 1.0)
     */
    Easing.easeOut = function (t) {
        return 1 - Easing.easeIn(1 - t);
    }

    /**
     * 先缓慢加速后缓慢减速(加速减速曲线)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.028, 0.104, 0.215, 0.352, 0.5,   0.648, 0.784, 0.896, 0.972, 1.0)
     */
    Easing.inAndOut = function (t) {
        return 3 * t * t - 2 * t * t * t;
    }

    /**
     * 随着时间的推移保持恒定的速度(匀速)
     * @param {number} t 输入参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     * @return {number} 返回参数(0至1之间). (0.1,   0.2,   0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0)
     */
    Easing.linear = function (t) {
        return t;
    }

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
    }

    /**
     * easeInSine
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInSine = function (t) {
        return 1 - Math.cos((t * Math.PI) / 2);
    }

    /**
     * easeOutSine
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeOutSine = function (t) {
        return Math.sin((t * Math.PI) / 2);
    }

    /**
     * easeInOutQuint
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInOutQuint = function (t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    /**
     * 二次In
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInQuad = function (t) {
        return t * t;
    }

    /**
     * 二次out
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeOutQuad = function (t) {
        return 1 - (1 - t) * (1 - t);
    }

    /**
     * 二次InOut
     * @param {number} t 输入参数(0至1之间).
     * @returns {number}  返回参数(0至1之间).
     */
    Easing.easeInOutQuad = function (t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}())

export default Easing;

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
