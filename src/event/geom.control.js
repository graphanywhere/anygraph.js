import Cursor from "../util/cursor.js";
import Draggable from "./draggable.js";
import { Polygon } from "../geom/index.js";
import { EventKeyCode } from "../basetype/event.type.js";
import Extent from "../spatial/extent.js";
import OperationManager from "../edit/operationManager.js";
import DomUtil from "../util/dom.js";

/**
 * 几何对象操作（单选、多选、移动、修改）
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
        this.dblCallback = options.dblCallback;
        this.rightClickCallback = options.rclick;
        this.mapMove = options.mapMove;

        /**
         * 当前的操作， -1:无操作，1~9：控制点cmd值，10:移动， 11:顶点操作（线/多边形)，  20:漫游, 30:拉框
         */
        this.operation = -1;
        this.ringIdx = -1;
        this.coordIdx = -1;
        this.scaleOp = false;

        // 上一次移动时的坐标
        this.__lastPoint;

        // 鼠标形状
        this.cursor = Cursor.DEFAULT;

        // 选择框属性
        this.overlayObjStyle = {
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
        this.activeGeomList = [];

        this.insideoperation = false;
    }

    /**
     * 获取浮动交互层
     * @returns Layer
     */
    getOverLayer() {
        return this.graph.getOverLayer();
    }

    /**
     * 设置是否为框选操作
     * @param {Boolean} bool 
     */
    setMultiple(bool) {
        this.multiple = bool;
    }

    /**
     * 鼠标按下事件
     * @param {Event} e 
     */
    onMouseDown(e) {
        e.currentTarget.focus();
        let clickPoint = this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]);
        let isClickGeom = false;
        let shiftKey = e.shiftKey || e.ctrlKey;
        let rtn = null;
        let that = this;
        this.scaleOp = false;

        // 处理逻辑：
        // graph TB
        // A[鼠标左键mouseDown] --> B{B判断点击位置是否存在对象}
        // B -->  |存在| D{D判断是否已选中对象}
        // B -->  |不存在| C[开始漫游/拉框]
        // D -->  |已选中对象| M{M是否为当前位置选中的对象}
        // D -->  |未选中对象| N(N激活该对象)
        // M --> |是|K3[开始移动该对象]
        // M --> |否|Q(激活该对象，清除已激活对象)
        // Q --> L{判断控制点}
        // L --> |是|K1[开始编辑]
        // L --> |否|K2[开始移动该对象]
        // N --> L{判断控制点}

        // B判断是否已选中对象和控制点
        // (1)是：后续判断
        // (2)否：开始漫游
        let geomList = this.graph.queryGeomList(clickPoint);
        let cp;
        if (geomList.length > 0) {
            cp = this._getControlPoint([e.offsetX, e.offsetY], geomList);
        }
        // 控制点的范围比 activeGeom bbox 大一点，如果有选中的geom，则需要判断是否移动在激活的geom控制点上
        else if (this.activeGeomList.length > 0) {
            cp = this._getControlPoint([e.offsetX, e.offsetY], this.activeGeomList);
        }

        // C[开始漫游/拉框]
        if (geomList.length == 0) {
            // --既没有点中控制点，之前也没有选中对象，则开始漫游或拉框操作--
            if (cp == null || this.activeGeomList.length == 0) {
                this.activeGeomList = [];
                // 开始拉框操作
                if (this.multiple) {
                    if (this.polygon != null) {
                        this.getOverLayer().getSource().clearData(this.polygon.getUid());
                    }
                    let oldflag = OperationManager.operationIsEnable();
                    OperationManager.operationEnable(false);
                    this.polygon = this.getOverLayer().getSource().add(new Polygon({ "coords": [[0, 0], [0, 0], [0, 0]], "style": this.overlayObjStyle }));
                    OperationManager.operationEnable(oldflag);
                    this.operation = 30;
                }
                // 开始漫游操作
                else {
                    this.operation = 20;
                    this._lastClientX = e.offsetX;
                    this._lastClientY = e.offsetY;
                }
            } else {
                // (1)控制点的范围比 activeGeom bbox 大一点，因此即使没有选中设备，也需要判断是否点中了激活设备的控制点
                if (cp) {
                    this.activeGeomList[0].setFocus(true);
                    this.operation = cp.cmd;
                    this.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                    this.coordIdx = cp.idx;
                    rtn = false;
                } else {
                    this.activeGeomList = [];
                    this.operation = -1;
                }
            }

            // D判断是否已选中对象
        } else {
            // (1)是：对这些geom进行移动或缩放操作
            // (2)否：清除原activeGeomList焦点框
            if (this.activeGeomList.length > 0) {
                // (1)选中了多个节点则判断是否要批量移动
                if (this.activeGeomList.length > 1) {  // 如果已选择多个节点(>1)则无需处理通过控制点修改对象大小
                    this.activeGeomList.forEach(geom => {
                        if (geom.contain(clickPoint, true)) {
                            isClickGeom = true;
                            return false;
                        }
                    });
                }

                // (2) 清除原activeGeomList焦点框
                if (!isClickGeom && !shiftKey) {
                    this.activeGeomList.forEach(geom => {
                        geom.setFocus(false);
                    });
                }
            }

            // M判断是否为当前位置选中的对象
            if (isClickGeom === true) {
                rtn = false;
                if (shiftKey === true) {
                    // --开始选则操作--
                    this.operation = 30;
                } else {
                    // --开始移动操作--
                    this.operation = 10;
                }
            } else {
                // 1 如果选中了geom，则激活该geom，并判断是否点中了控制点

                // 需根据是否按下了shift键判断是否点中了控制点
                if (geomList.length == 1) {
                    if (shiftKey === true) {
                        this.operation = 30;
                    } else {
                        OperationManager.beginOperation( true );
                        this.insideoperation = true;

                        this.activeGeomList = [geomList[0]];
                        this.activeGeomList.forEach(geom => {
                            geom.setFocus(true);
                            OperationManager.saveDropNode(geom);
                            // 判断鼠标位置是否为编辑框控制点
                            if (cp == null) {
                                that.operation = 10;
                            } else {
                                that.operation = cp.cmd;
                                that.ringIdx = cp.ringIdx > -1 ? cp.ringIdx : -1;
                                that.coordIdx = cp.idx;
                            }
                        });
                    }
                    rtn = false;
                } else {
                    if (shiftKey === true) {
                        // --开始选则操作--
                        this.operation = 30;
                    } else {
                        // --开始移动操作--
                        this.operation = 10;
                    }
                }
            }

            if (this.operation != 20 && typeof (this.mouseDownCallback) === "function") {
                this.mouseDownCallback({
                    "geomList": this.activeGeomList,
                    "coord": clickPoint
                });
            }

            this.graph.render();
        }

        return rtn;
    }

    /**
     * 鼠标移动事件
     * @param {*} e 
     * @param {*} isDrag 
     */
    onMouseMove(e, isDrag) {
        let rtn;
        let shiftKey = e.shiftKey || e.ctrlKey;

        // 如果是在单击拖拽状态，则根据mouseDown是否选中了设备进行操作
        // (1)选中了设备，则要么变形、要么移动
        // (2)没有选中设备，则开始漫游或多选（拉框）
        if (isDrag === true) {

            // 开始漫游
            if (this.operation == 20) {
                rtn = this._doMapMove(e.offsetX, e.offsetY);
                this.scaleOp = true;
                // 拉框
            } else if (this.operation == 30) {
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
            // 变形操作
            else {
                // (1)选中了设备，则要么变形、要么移动
                if (!shiftKey && this.activeGeomList.length > 0) {
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
                    if (Math.abs(distX) > 2 || Math.abs(distY) > 2) {
                        this.__lastPoint = this.movePoint.slice();

                        // 回调
                        if (typeof (this.mouseMoveCallback) === "function") {
                            rtn = this.mouseMoveCallback({
                                "geomList": this.activeGeomList,
                                "dist": [distX, distY],
                                "operation": this.operation
                            });
                            // 回调函数返回false，则不进行下面的缺省按键操作
                            if (rtn === false) return false;
                        }

                        // 缺省平移或缩放
                        let that = this;
                        this.activeGeomList.forEach(geom => {
                            if (geom.getLayer() != this.getOverLayer()) {
                                if (!this.insideoperation) {
                                    OperationManager.beginOperation( true );
                                    this.insideoperation = true;
                                }

                                OperationManager.saveDropNode(geom);
                            }
                            if (that.operation == 10 || that.operation == 5) {
                                // 对象平移
                                geom.translate(distX, distY);
                            }
                            // 多边形/折线 顶点移动
                            else if (that.operation == 11) {
                                let coord = geom.getCoord();
                                if (that.ringIdx >= 0) {
                                    coord[that.ringIdx][that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                                } else {
                                    coord[that.coordIdx] = this.graph.getCoordinateFromPixel(this.movePoint, true);
                                }
                                geom.setCoord(coord);
                            }
                            // 对象编辑/缩放
                            else {
                                that._scaleGeom(that.operation, geom, distX, distY);
                            }
                            that.scaleOp = true;
                        })
                        this.graph.render();
                    }
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
                    let cp = this._getControlPoint([e.offsetX, e.offsetY], geomList);
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
                    let cp = this._getControlPoint([e.offsetX, e.offsetY], [this.activeGeomList[0]]);
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
        return rtn;
    }

    /**
     * 鼠标松开按键事件
     * @param {*} e 
     */
    onMouseUp(e) {
        let shiftKey = e.shiftKey || e.ctrlKey;
        this.__lastPoint = null;
        if (this.insideoperation) {
            OperationManager.endOperation(true);
            this.insideoperation = false;
        }

        // 选则
        if ((this.operation == 10 || this.operation == 20 || this.operation == 30) && this.scaleOp === false) {
            // 取消之前选中对象的激活状态
            if (Array.isArray(this.activeGeomList)) {
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(false);
                });
            }

            let selectGeomList = [];
            // 允许多选时，根据矩形框查询选中的设备
            if (this.multiple && this.polygon) {
                // 合并选中的节点
                if (Extent.getArea(this.polygon.getBBox(false)) > 100) {
                    this.polygon.setStyle({ "lineWidth": 2, "fillStyle": 0 });
                    this.graph.renderLayer(this.getOverLayer());
                    let coord = this.polygon.getCoord();
                    selectGeomList = this.graph.queryGeomList([coord[0][0], coord[0][2]]);
                }
                this.getOverLayer().getSource().clearData(this.polygon.getUid());
                this.polygon = null;
            }
            // 否则，查询鼠标点中的设备 
            else {
                let clickPoint = this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]);
                selectGeomList = this.graph.queryGeomList(clickPoint);
            }

            // 合并选中的geom
            if (shiftKey) {
                this.activeGeomList = this._concat(selectGeomList, true, false);
            } else {
                this.activeGeomList = selectGeomList;
            }

            // 设置激活状态
            if (Array.isArray(this.activeGeomList)) {
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(true);
                });
            }
            
            // 执行回调
            //if (this.startDrag === true) {
                if (typeof (this.mouseUpCallback) === "function") {
                    this.mouseUpCallback({
                        "geomList": this.activeGeomList,
                        "coord": this.graph.getCoordinateFromPixel(this.endPoint, true)
                    });
                }
            //}
            this.graph.render();
        } else {
            if (typeof (this.mouseUpCallback) === "function") {
                this.mouseUpCallback({
                    "geomList": this.activeGeomList,
                    "coord": this.graph.getCoordinateFromPixel(this.endPoint, true)
                });
            }
            this.graph.render();
        }
        this.operation = -1;
        this.scaleOp = false;
        return false;
    }

    onRightClick(e) {
        if (typeof (this.rightClickCallback) === "function") {
            let geomList = this.graph.queryGeomList(this.graph.getCoordinateFromPixel([e.offsetX, e.offsetY]));
            this.rightClickCallback({
                "geomList": geomList,
                "e": e
            });
        }
    }

    /**
     * 事件：键盘按键事件
     * @param {Event} e 
     */
    keyDown(e) {
        let shiftKey = e.shiftKey || e.ctrlKey;
        let key = e.keyCode;
        let mouseEnabled = this.graph.getRenderObject().getMouseEnabled();

        if (mouseEnabled && key === EventKeyCode.KEY_A) {
            // 选则
            if (shiftKey === true) {
                this.activeGeomList = this._concat(this.graph.queryGeomList(), false, true);
                DomUtil.stop(e);
            }
        }

        // 回调
        if (typeof (this.keyDownCallback) === "function") {
            let rtn = this.keyDownCallback({
                "geomList": this.activeGeomList,
                "keyCode": key
            });
            // 回调函数返回false，则不进行下面的缺省按键操作
            if (rtn === false) return false;
        }

        if (mouseEnabled && key === EventKeyCode.KEY_A) {
            // 选则
            if (shiftKey === true) {
                this.activeGeomList.forEach(geom => {
                    geom.setFocus(true);
                });
                this.graph.render();
            }
        }

        // 响应按键
        let distX, distY;
        let validateKey = false;
        if (mouseEnabled && this.activeGeomList && this.activeGeomList.length > 0) {
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
                // 缺省按键操作
                let that = this;
                OperationManager.beginOperation( true );
                this.activeGeomList.forEach(geom => {
                    if (geom.getLayer() != this.getOverLayer()) {
                        OperationManager.saveDropNode(geom);
                    }
                    if (distX != null && distY != null) {
                        geom.translate(distX, distY);
                    } else {
                        // 单击Delete删除当前激活的geom对象
                        that.graph.removeGeom(geom.getUid());
                    }
                });
                OperationManager.endOperation(true);
                this.graph.render();
            }
        }
    }

    onDblclick(e) {
        if (typeof (this.dblCallback) === "function") {
            return this.dblCallback({
                "event": e,
                "geomList": this.activeGeomList
            });
        }
    }

    /**
     * 获取鼠标位置的编辑控制点
     * @param {*} coord 
     * @param {*} geomList 
     * @returns {Object} 控制点对象{x, y, width, height, cursor, cmd, idx, ringIdx}
     */
    _getControlPoint(coord, geomList) {
        let controlPoint;
        for (let i = 0, len = geomList.length; i < len; i++) {
            if (!geomList[i].isLocked()) {
                controlPoint = geomList[i].getBorder().getControlPoint(coord);
                if (controlPoint) {
                    break;
                }
            }
        }
        return controlPoint;
    }

    /**
     * 合并选项项
     * @param {Array} geomList 
     * @param {Boolean} xor true:追加  false:异或
     * @param {Boolean} typeOnly 仅合并已有activeGeomList中的类型
     * @returns Array
     * @private
     */
    _concat(geomList, xor = false, typeOnly = false) {
        let list = this.activeGeomList.slice();
        let foundList = [];
        let geomType = null;

        if (this.activeGeomList.length != 1) {
            typeOnly = false;
        } else {
            geomType = typeOnly === true ? this.activeGeomList[0].getType() : null;
        }

        for (let i = 0, len = geomList.length; i < len; i++) {
            if (typeOnly && geomType != null) {
                if (geomList[i].getType() != geomType) {
                    continue;
                }
            }
            let found = false;
            for (let j = this.activeGeomList.length - 1; j >= 0; j--) {
                if (geomList[i] == this.activeGeomList[j]) {
                    found = true;
                    foundList.push(j);
                    break;
                }
            }
            if (found === false) {
                list.push(geomList[i]);
            }
        }

        if (xor === true) {
            for (let j = foundList.length - 1; j >= 0; j--) {
                list.splice(foundList[j], 1);
            }
        }

        return list;
    }

    /**
     * geom对象放大/缩小操作
     * @param {*} operation 
     */
    _scaleGeom(operation, geom, distX, distY) {
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
        if (anchor.length > 0) {
            geom.scale(scaleX, scaleY, anchor);
        }
    }

    /**
     * 漫游
     * @param {int} x 
     * @param {int} y 
     */
    _doMapMove(x, y) {
        let that = this;
        if (typeof (that.mapMove) != "function") {
            return;
        }

        if (this.operation === 20) {
            this.cursor = Cursor.PAN;
            if (this.moveing) {
                return false;
            } else {
                this.moveing = true;
                window.setTimeout(function () {
                    let xdist = x - that._lastClientX;
                    let ydist = y - that._lastClientY;
                    let rtn = -1;
                    if (Math.abs(xdist) > 10 || Math.abs(ydist) > 10) {
                        rtn = that.mapMove(Object.assign({ xdist, ydist }, { x, y, "mouse": that }));
                        that._lastClientX = x;
                        that._lastClientY = y;
                    }
                    that.moveing = false;
                });
                return true;
            }
        }
        return false;
    }
}

export default GeomControl;
