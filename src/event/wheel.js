
/*
 * 鼠标滚轮事件
 * 说明：每一个画板canvas对应一个滚轮事件
 */
function OpWheel(containerId_, callback_) {
    let containerObj_ = (typeof (containerId_) === "object") ? containerId_ : document.getElementById(containerId_);
    let me = {};

    me.enabled = function (enabled) {
        if (enabled) {
            /* 
             * -滚轮事件只有firefox比较特殊，使用DOMMouseScroll; 其他浏览器使用mousewheel;
             */
            // passive: true
            // 问题控制台警告信息问题，谷歌浏览器在滚轮事件触发时，有不少优化的工作，
            // 而我们使用jquery监听滚轮事件会阻止浏览器的优化工作，
            // 因此浏览器不建议这样的写法，抛出了警告，修改了监听的写法，即可去除警告。
            containerObj_.addEventListener("mousewheel", function (e) {
                let delta = (e.wheelDelta != null) ? e.wheelDelta : e.detail;
                delta = delta > 0 ? 1 : -1;
                let offsetX = e.offsetX;
                let offsetY = e.offsetY;

                if (callback_ != null && (typeof callback_ === 'function')) {
                    return callback_(delta, offsetX, offsetY);
                } else {
                    console.warn("wheel not bind event, " + delta + " " + offsetX + " " + offsetY);
                }
            }, { passive: true });
        } else {
            $(containerObj_).unbind("mousewheel DOMMouseScroll");
        }
    }

    return me;
}
