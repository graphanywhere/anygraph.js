import Cursor from "../util/cursor.js";

/**
 * 图形事件对象类型 <br>
 * canvas事件分发过程如下： <br>
 * 1) 构造RenderObject时通过_bindEvent()方法将事件绑定至 render.wrapObj_ 对象上；<br>
 * 2) 各个事件均通过 RenderObject的handleEvent()分发；<br>
 * 3) RenderObject对象中 通过 graphMouseOp 类处理所有分发的事件；<br>
 * 4）graphMouseOp 可处理一些常规事件，例如滚轮缩放、漫游等；<br>
 * 5) graphMouseOp 中包含了 eventObj 事件对象，可处理自定义的 mouseUp、mouseDown 等事件；<br>
 * 6) 自定义事件（eventObj事件对象）类型需为GraphEvent的子类型；<br>
 * 7) eventObj事件对象各方法的返回值定义： true执行了该事件，false执行了该事件，并禁止冒泡，null未执行事件
 * 8) RenderObject对象提供了addEvent()和endEvent() 管理自定义事件类型；
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

        // callback
        this.mouseHoverCallback = options.mouseHover;
        this.mouseHoverEndCallback = options.mouseHoverEnd;
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

    mouseUp(e) {
        return null;
    }
    mouseDown(e) {
        return null;
    }
    mouseMove(e) {
        return null;
    }
    rclick(e) {
        return null;
    }
    dblclick(e) {
        return null;
    }
    mouseHover(e) {
        if (typeof (this.mouseHoverCallback) === "function") {
            return this.mouseHoverCallback(e);
        } else {
            return null;
        }
    }
    mouseHoverEnd(e) {
        if (typeof (this.mouseHoverEndCallback) === "function") {
            return this.mouseHoverEndCallback(e);
        } else {
            return null;
        }
    }
    keyDown(e) {
        return null;
    }

    // /**
    //  * 事件：键盘按键
    //  * @param {Event} e 
    //  */
    // keyDown(e) {
    //     let key = e.keyCode;
    //     if (key === EventKeyCode.KEY_ESC) {
    //         // this.end();
    //     }
    // }
}

export default GraphEvent;
