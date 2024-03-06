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
    }

    /**
     * 停止动画
     * @param {*} timer 
     */
    Animation.stop = function (timer) {
        return stop(timer);
    }

    /**
     * 执行一次 callback
     * @param {Function} callback 
     */
    Animation.frame = function (callback) {
        return frame(callback);
    }
}());

export default Animation;
