import Draggable from "./draggable.js";
import Cursor from "../util/cursor.js";

/**
 * 鼠标左键：拖拽漫游
 */
class DragPan extends Draggable {

    constructor(options = {}) {
        super(options);
        /**
         * 图形对象
         */
        this.graph = options.graph;

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 鼠标形状
        this.cursor = Cursor.MOVE;
    }

    onMouseMove(e, isDrag) {
        if (isDrag === true) {
            let dist;
            if (this.lastPoint) {
                let p1 = this.lastPoint; //this.graph.getCoordinateFromPixel(this.lastPoint, true);
                let p2 = this.movePoint; //this.graph.getCoordinateFromPixel(this.movePoint, true);
                dist = [p2[0] - p1[0], p2[1] - p1[1]];
            } else {
                let p1 = this.startPoint; //this.graph.getCoordinateFromPixel(this.startPoint, true);
                let p2 = this.movePoint;  //this.graph.getCoordinateFromPixel(this.movePoint, true);
                dist = [p2[0] - p1[0], p2[1] - p1[1]];
            }
            this.graph.doMove(dist);
            this.lastPoint = this.movePoint.slice();
        }
    }

    onMouseUp(e) {
        this.lastPoint = null;
    }
}

export default DragPan;
