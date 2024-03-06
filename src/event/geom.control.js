import Cursor from "../util/cursor.js";
import Layer from "../layer.js";
import VectorSource from "../source/vector.js";
import Draggable from "./draggable.js";
import { Polygon } from "../geom/index.js";
import { EventKeyCode } from "../basetype/event.type.js";
import Extent from "../spatial/extent.js";

/**
 * 几何对象操作（单选、多选、移动、缩放）
 */
class GeomControl extends Draggable {

    /**
     * 构造函数
     * @param {Object} options 
     * multiple：是否可同时选择多个文件，默认为 false
     */
    constructor(options) {
        super(options);

        this.graph = options.graph;

        /**
         * 是否允许多选
         */
        this.multiple = options.multiple === true;

        /**
         * 回调函数
         */
        this.callback = options.callback;
        /**
         * 回调函数
         */
        this.mouseUpCallback = options.mouseUp;
        this.mouseDownCallback = options.mouseDown;
        this.mouseMoveCallback = options.mouseMove;
        this.keyDownCallback = options.keyDown;

        /**
         * 当前的操作， -1:无操作，10:移动， 1~9：控制点pos值， 11:顶点操作
         */
        this.operation = -1;
        this.ringIdx = -1;
        this.coordIdx = -1;

        // 上一次移动时的坐标
        this.__lastPoint;

        // 鼠标形状
        this.cursor = Cursor.DEFAULT;

        // 选择框属性
        this.overlayId_ = 211;
        this.overlayDesc_ = "浮动交互层";
        this.defaultStyle = {
            "color": "red",
            "fillColor": "rgba(255, 159, 159, 0.5)",
            "fillStyle": 1,
            "lineWidth": 2,
            "fontBorder": true
        }

        // 拉框geom对象
        this.polygon = null;

        /**
         * 激活的Geom对象
         */
        this.activeGeomList = null;
    }

    /**
     * 获取浮动交互层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.graph.getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                "source": new VectorSource(),
                zIndex: this.overlayId_,
                name: this.overlayDesc_
            });
            this.graph.addLayer(layer);
        }
        return layer;
    }

    /**
     * 鼠标按下事件
     * @param {Event} e 
     */
    onMouseDown(e) {
        let clickPoint = this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]);
        let isClickGeom = false;
        // 判断是否选中了activeGeomList
        // (1)是：对这些geom进行移动或缩放操作
        // (2)否：清除原activeGeomList焦点框
        if (this.activeGeomList) {
            // (1)选中了多个节点是判断是否要批量移动
            if (this.activeGeomList.length > 1) {
                this.activeGeomList.forEach(geom => {
                    //geom.setFocus(false);
                    if (geom.contain(clickPoint, true)) {
                        isClickGeom = true;
                        return;
                    }
                });
            }

            // (2) 清除原activeGeomList焦点框
            if (!isClickGeom) {
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(false);
                });
            }
        }

        if (isClickGeom === true) {
            this.operation = 100;
        } else {
            // 判断是否选中了geom
            let geomList = this.graph.queryGeomList(clickPoint);

            // 1 如果选中了geom，则激活该geom，判断是否点中了控制点，且不进行多选
            if (geomList.length > 0) {
                this.activeGeomList = [geomList[0]]; //(this.multiple ? geomList : [geomList[0]]);
                let that = this;
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(true);
                    // 判断鼠标位置是否为编辑框控制点
                    let cp = that.getControlPoint([e.offsetX, e.offsetY], [geom]);
                    if (cp == null) {
                        that.operation = 100;
                    } else {
                        that.operation = cp.cmd;
                        that.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                        that.coordIdx = cp.idx;
                    }
                    //console.info("mouseDown1", cp);
                })
            }
            // (1)如果没有点中geom，则根据之前是否选中了geom，要是则判断是否点中了控制点
            // (2)如果没有点中控制点，则开始多选（拉框）
            else {
                // (1)控制点的范围比 activeGeom bbox 大一点，因此即使没有选中设备，也需要判断是否点中了激活设备的控制点
                if (this.activeGeomList && this.activeGeomList.length > 0) {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], [this.activeGeomList[0]]);
                    if (cp) {
                        this.activeGeomList[0].setFocus(true);
                        this.operation = cp.cmd;
                        this.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                        this.coordIdx = cp.idx;
                    } else {
                        this.activeGeomList = [];
                        this.operation = -1;
                    }
                    //console.info("mouseDown2", cp);
                }
                // (2)没有点中控制点，则开始多选（拉框）
                if (!(this.activeGeomList && this.activeGeomList.length > 0)) {
                    // 多选：开始拉框
                    if (this.multiple) {
                        if (this.polygon != null) {
                            this.getOverLayer().getSource().clearData(this.polygon.getUid());
                        }
                        this.polygon = this.getOverLayer().getSource().add(new Polygon({ "coords": [[0, 0], [0, 0], [0, 0]], "style": this.defaultStyle }));
                    }
                }
            }
        }

        if (typeof (this.mouseDownCallback) === "function") {
            this.mouseDownCallback({
                "geomList": this.activeGeomList,
                "coord": clickPoint
            });
        }

        // console.info("mouseDown", this.activeGeomList == null ? "none" : this.activeGeomList[0].getUid(), this.operation, this.activeGeomList);
        this.graph.render();
    }

    /**
     * 鼠标移动事件
     * @param {*} e 
     * @param {*} isDrag 
     */
    onMouseMove(e, isDrag) {

        // 如果是在单击拖拽状态，则根据mouseDown是否选中了设备进行操作
        // (1)选中了设备，则要么变形、要么移动
        // (2)没有选中设备，则开始多选（拉框）
        if (isDrag === true) {

            // (1)选中了设备，则要么变形、要么移动
            if (this.activeGeomList && this.activeGeomList.length > 0) {
                // 计算操作幅度
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
                        "geomList": this.activeGeomList,
                        "dist": [distX, distY],
                        "operation": this.operation
                    });
                    // 回调函数返回false，则不进行下面的缺省按键操作
                    if (rtn === false) return;
                }

                // 缺省平移或缩放
                let that = this;
                this.activeGeomList.forEach(geom => {
                    if (that.operation == 100 || that.operation == 5) {
                        // 对象平移
                        geom.translate(distX, distY);
                    }
                    // 多边形/折线 顶点移动
                    else if (that.operation == 11) {
                        let coord = geom.getCoord();
                        if(that.ringIdx >= 0) {
                            coord[that.ringIdx][that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                        } else {
                            coord[that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                        }
                        geom.setCoord(coord);
                    }
                    // 对象缩放
                    else {
                        that.scaleGeom(that.operation, geom, distX, distY);
                    }
                })
                this.graph.render();
            }

            // (2)没有选中设备，则开始多选（拉框）
            else {
                if (this.multiple && this.polygon != null) {
                    let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
                    let p2 = this.graph.getCoordinateFromPixel(this.endPoint, true);
                    let point1Coords = [p1[0], p1[1]];
                    let point2Coords = [p1[0], p2[1]];
                    let point3Coords = [p2[0], p2[1]];
                    let point4Coords = [p2[0], p1[1]];
                    this.polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
                    this.polygon.setStyle({ "lineWidth": 1 });
                    this.graph.renderLayer(this.getOverLayer());
                }
            }
        }
        // 非拖拽状态，判断是否移动到了geom中，设置鼠标形状
        else {
            let geomList = this.graph.queryGeomList(this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]));
            // 在当前鼠标位置找到了geom
            if (geomList.length > 0) {
                if (this.activeGeomList && this.activeGeomList.length > 1) {
                    this.cursor = Cursor.MOVE;
                } else {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], geomList);
                    if (cp) {
                        this.cursor = cp.cursor;
                    } else {
                        this.cursor = Cursor.MOVE;
                    }
                }
            }
            // 控制点的范围比 activeGeom bbox 大一点，如果有选中的geom，则需要判断是否移动在激活的geom控制点上
            else {
                if (this.activeGeomList && this.activeGeomList.length > 0) {
                    let cp = this.getControlPoint([e.offsetX, e.offsetY], [this.activeGeomList[0]]);
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
     * 鼠标松开按键事件
     * @param {*} e 
     */
    onMouseUp(e) {

        this.__lastPoint = null;
        this.operation = -1;

        // 允许多选时，根据矩形框查询选中的设备
        if (this.multiple) {
            if (this.polygon && Extent.getArea(this.polygon.getBBox(false)) > 100) {
                this.polygon.setStyle({ "lineWidth": 2, "fillStyle": 0 });
                this.graph.renderLayer(this.getOverLayer());
                let coord = this.polygon.getCoord();
                this.activeGeomList = this.graph.queryGeomList([coord[0][0], coord[0][2]]);
                if (this.activeGeomList) {
                    this.activeGeomList.forEach(geom => {
                        geom.setFocus(true);
                    });
                    this.graph.render();
                }
                this.getOverLayer().getSource().clearData(this.polygon.getUid());
            }
            this.polygon = null;
        }

        // 执行回调
        if (this.startDrag === true) {
            if (typeof (this.mouseUpCallback) === "function") {
                this.mouseUpCallback({
                    "geomList": this.activeGeomList,
                    "coord": this.graph.getCoordinateFromPixel(this.endPoint, true)
                });
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
        let validateKey = false;
        if (this.activeGeomList && this.activeGeomList.length > 0) {
            switch (key) {
                case EventKeyCode.KEY_DELETE:
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_LEFT:
                    [distX, distY] = [-1, 0];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_RIGHT:
                    [distX, distY] = [1, 0];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_UP:
                    [distX, distY] = [0, -1];
                    validateKey = true;
                    break;
                case EventKeyCode.KEY_DOWN:
                    validateKey = true;
                    [distX, distY] = [0, 1];
                    break;
            }

            if (validateKey === true) {
                // 回调
                if (typeof (this.keyDownCallback) === "function") {
                    let rtn = this.keyDownCallback({
                        "geomList": this.activeGeomList,
                        "dist": [distX, distY],
                        "keyCode": key
                    });

                    // 回调函数返回false，则不进行下面的缺省按键操作
                    if (rtn === false) return;
                }

                // 缺省按键操作
                let that = this;
                this.activeGeomList.forEach(geom => {
                    if (distX != null && distY != null) {
                        geom.translate(distX, distY);
                    } else {
                        // 单击Delete删除当前激活的geom对象
                        that.graph.removeGeom(geom.getUid());
                    }
                });

                this.graph.render();
            }
        }
    }

    /**
     * 获取鼠标位置的编辑控制点
     * @param {*} coord 
     * @param {*} geomList 
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
     * @param {*} operation 
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
        geom.scale(scaleX, scaleY, anchor);
    }
}

export default GeomControl;
