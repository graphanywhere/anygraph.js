import Cursor from "../util/cursor.js";
import GraphEvent from "./graph.event.js";

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
            let rtn;
            if (e.button === 0) {
                that.startDrag = true;
                that.startPoint = [e.offsetX, e.offsetY];
                rtn = that.onMouseDown(e);
            }
            return rtn;
        }

        /**
         * 事件：mouseMove
         * @param {Event} e 
         */
        this.mouseMove = function (e) {
            let rtn;
            if (that.startDrag === true) {
                that.movePoint = [e.offsetX, e.offsetY];
                that.endPoint = [e.offsetX, e.offsetY];
                rtn = that.onMouseMove(e, true);
            } else {
                rtn = that.onMouseMove(e, false);
            }
            return rtn;
        }

        /**
         * 事件：mouseUp
         * @param {Event} e 
         */
        this.mouseUp = function (e) {
            let rtn;
            if (that.startDrag === true) {
                that.endPoint = [e.offsetX, e.offsetY];
                rtn = that.onMouseUp(e);
                that.startDrag = false;
            }
            return rtn;
        }

        this.rclick = function(e) {
            that.endPoint = [e.offsetX, e.offsetY];
            return that.onRightClick(e);
        }

        /**
         * 事件: dblclick
         * @param {Event} e 
         */
        this.dblclick = function (e) {
            return that.onDblclick(e);
        }
    }

    onMouseDown(e) {
        return null;
    }

    onMouseUp(e) {
        return null;
    }

    onMouseMove(e, isDrag) {
        return null;
    }

    onDblclick(e) {
        return null;
    }

    onRightClick(e) {
        return null;
    }

    setCursor(cursorName) {
        this.cursor = cursorName
    }
}

export default Draggable;
