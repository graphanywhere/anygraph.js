import Extent from "../spatial/extent.js";
import { EventKeyCode } from "../basetype/event.type.js";
import Cursor from "../util/cursor.js";
import GraphEvent from "./graph.event.js";

/**
 * 编辑几何对象
 */
class GeomEdit extends GraphEvent {
    constructor(options = {}) {
        super(options);

        /**
         * 图形管理对象
         */
        this.graph = options.graph;

        /**
         * 回调函数
         */
        this.mouseUpCallback = options.mouseUp;
        this.mouseDownCallback = options.mouseDown;
        this.mouseMoveCallback = options.mouseMove;
        this.keyDownCallback = options.keyDown;

        /**
         * 当前的操作， -1:无操作，10:移动， 1~9：控制点pos值
         */
        this.operation = -1;

        /**
         * 激活的Geom对象
         */
        this.activeGeom = null;

        // 是否开始拖拽操作
        this.startDrag = false;

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];

        // 上一次移动时的坐标
        this.__lastPoint;

        // 鼠标形状
        this.cursor = Cursor.DEFAULT;

        /**
         * mouseUp event
         */
        let that = this;
        this.mouseUp = function (e) {
            that.__lastPoint = null;
            that.operation = -1;
            if (that.startDrag === true) {
                that.endPoint = [e.offsetX, e.offsetY];
                that.startDrag = false;
                if (typeof (that.mouseUpCallback) === "function") {
                    that.mouseUpCallback(that.activeGeom, that.graph.getCoordinateFromPixel(that.endPoint, true));
                }
            }
        }
    }

    /**
     * mouseDown event
     * @param {Event} e 
     */
    mouseDown(e) {
        let clickPoint = this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]);
        if (e.button === 0) {
            this.startDrag = true;
            this.startPoint = [e.offsetX, e.offsetY];

            // 清除原有激活Geom的焦点
            if (this.activeGeom) this.activeGeom.setFocus(false);

            // 判断是否选中了geom
            let geomList = this.graph.queryGeomList(clickPoint);
            if (geomList.length > 0) {
                this.activeGeom = geomList[0];
                this.activeGeom.setFocus(true);
                // 判断鼠标位置是否为编辑框控制点
                let cp = this.getControlPoint([e.offsetX, e.offsetY], geomList);
                if (cp == null) {
                    this.operation = 10;
                } else {
                    this.operation = cp.cmd;
                }
            } else {
                // 控制点的范围比 activeGeom bbox 大一点点，因此即使没有选中设备，也需要判断是否点中了激活设备的控制点
                if (this.activeGeom) {
                    let cp = this.getControlPoint(clickPoint, [this.activeGeom]);
                    if (cp) {
                        this.activeGeom.setFocus(true);
                        this.operation = cp.cmd;
                    } else {
                        this.operation = -1;
                        this.activeGeom = null;
                    }
                }
            }
            this.graph.render();
            console.info(this.activeGeom == null ? "none" : this.activeGeom.getUid(), this.operation, this.activeGeom);
        }
    }

    /**
     * mouseMove event
     * @param {Event} e
     */
    mouseMove(e) {
        // 拖拽平移或缩放
        if (this.startDrag === true && this.activeGeom) {
            this.movePoint = [e.offsetX, e.offsetY];
            this.endPoint = [e.offsetX, e.offsetY];

            let distX, distY;
            if (this.__lastPoint) {
                let p1 = this.graph.getCoordinateFromPixel(this.__lastPoint, true);
                let p2 = this.graph.getCoordinateFromPixel(this.movePoint, true);
                [distX, distY] = [p2[0] - p1[0], p2[1] - p1[1]];
            } else {
                let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
                let p2 = this.graph.getCoordinateFromPixel(this.movePoint, true);
                [distX, distY] = [p2[0] - p1[0], p2[1] - p1[1]];
            }
            this.__lastPoint = this.movePoint.slice();

            // 回调
            if (typeof (this.mouseMoveCallback) === "function") {
                let rtn = this.mouseMoveCallback({
                    "geom": this.activeGeom,
                    "dist": [distX, distY],
                    "operation": this.operation
                });
                if (rtn === false) return;
            }

            // 对象平移
            if (this.operation == 10 || this.operation == 5) {
                this.activeGeom.translate(distX, distY);
            } else {
                // 对象缩放 
                this.scaleGeom(this.operation, this.activeGeom, distX, distY);
            }
            this.graph.render();
        }
        // 跟踪鼠标移动
        else {
            let geomList = this.graph.queryGeomList(this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]));
            // 在当前鼠标位置找到了geom
            if (geomList.length > 0) {
                let cp = this.getControlPoint([e.offsetX, e.offsetY], geomList);
                if (cp) {
                    this.cursor = cp.cursor;
                } else {
                    this.cursor = Cursor.MOVE;
                }
            } else {
                // 控制点的范围比 activeGeom bbox 大一点点，因此即使没有选中设备，也需要判断是否点中了激活设备的控制点
                if (this.activeGeom) {
                    let cp = this.getControlPoint(this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]), [this.activeGeom]);
                    if (cp) {
                        this.cursor = cp.cursor;
                    } else {
                        this.cursor = Cursor.DEFAULT;
                    }
                } else {
                    this.cursor = Cursor.DEFAULT;
                }
            }
        }
    }

    /**
     * 事件：键盘按键事件
     * @param {Event} e 
     */
    keyDown(e) {
        let key = e.keyCode;
        let distX, distY;
        if (this.activeGeom) {
            switch (key) {
                case EventKeyCode.KEY_DELETE:
                    // 单击Delete删除当前激活的geom对象
                    this.graph.removeGeom(this.activeGeom.getUid());
                    break;
                case EventKeyCode.KEY_LEFT:
                    [distX, distY] = [-1, 0];
                    break;
                case EventKeyCode.KEY_RIGHT:
                    [distX, distY] = [1, 0];
                    break;
                case EventKeyCode.KEY_UP:
                    [distX, distY] = [0, -1];
                    break;
                case EventKeyCode.KEY_DOWN:
                    [distX, distY] = [0, 1];
                    break;
            }

            if (distX != null && distY != null) {
                // 回调
                if (typeof (this.keyDownCallback) === "function") {
                    let rtn = this.keyDownCallback({
                        "geom": this.activeGeom,
                        "dist": [distX, distY],
                    });
                    if (rtn === false) return;
                }
                this.activeGeom.translate(distX, distY);
            }
            this.graph.render();
        }
    }

    /**
     * 获取鼠标位置的编辑控制点
     * @param {Coord} coord 
     * @param {Array} geomList 
     * @returns {Object} 控制点对象{x, y, width, height, cursor, cmd, idx, ringIdx}
     */
    getControlPoint(coord, geomList) {
        let controlPoint;
        for (let i = 0, len = geomList.length; i < len; i++) {
            controlPoint = geomList[i].getBorder().getControlPoint(coord);
            if (controlPoint) {
                break;
            }
        }
        return controlPoint;
    }

    /**
     * geom对象放大/缩小操作
     * @param {int} operation 
     * @param {Geometry} geom 
     * @param {int} distX 
     * @param {int} distY 
     */
    scaleGeom(operation, geom, distX, distY) {
        // console.info(distX, distY);
        let anchor = [];
        let bbox = geom.getBBox();

        let leftTop = [bbox[0], bbox[1]];
        let rightTop = [bbox[2], bbox[1]];
        let leftBottom = [bbox[0], bbox[3]];
        let rightBottom = [bbox[2], bbox[3]];

        let width = Extent.getWidth(bbox);
        let height = Extent.getHeight(bbox);
        let scaleX, scaleY;

        switch (operation) {
            case 1:     // top left
                anchor = rightBottom;
                scaleX = (width - distX) / width;
                scaleY = (height - distY) / height;
                break;
            case 2:     // middle top
                anchor = leftBottom;
                scaleX = 1;
                scaleY = (height - distY) / height;
                break;
            case 3:     // top right
                scaleX = (width + distX) / width;
                scaleY = (height - distY) / height;
                anchor = leftBottom;
                break;
            case 4:     // middle left
                anchor = rightBottom;
                scaleX = (width - distX) / width;
                scaleY = 1;
                break;
            case 6:     // middle right
                anchor = leftBottom;
                scaleX = (width + distX) / width;
                scaleY = 1;
                break;
            case 7:     // bottom left
                scaleX = (width - distX) / width;
                scaleY = (height + distY) / height;
                anchor = rightTop;
                break;
            case 8:     // middle buttom
                anchor = leftTop;
                scaleX = 1;
                scaleY = (height + distY) / height;
                break;
            case 9:     // bottom right
                scaleX = (width + distX) / width;
                scaleY = (height + distY) / height;
                anchor = leftTop;
                break;
            default:
                break;
        }

        this.activeGeom.scale(scaleX, scaleY, anchor);
    }
}

export default GeomEdit;
