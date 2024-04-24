import Draggable from "./draggable.js";
import Cursor from "../util/cursor.js";

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

export default DragZoom;
