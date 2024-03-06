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
            if (e.button === 0) {
                this.startDrag = true;
                this.startPoint = [e.offsetX, e.offsetY];
                this.onMouseDown(e);
            }
        }

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
        }

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
        }
    }

    onMouseDown(e) { }

    onMouseUp(e) { }

    onMouseMove(e) { }

    setCursor(cursorName) {
        this.cursor = cursorName
    }
}

export default Draggable;
