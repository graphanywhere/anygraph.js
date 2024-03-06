import { EventKeyCode } from "../basetype/event.type.js";
import Cursor from "../util/cursor.js";

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
        let key = e.keyCode;
        if (key === EventKeyCode.KEY_ESC) {
            // this.end();
        }
    }
}

export default GraphEvent;
