import Cursor from "../util/cursor.js";
import GraphEvent from "./graph.event.js";
import Measure from "../spatial/measure.js";
import Polygon from "../geom/polygon.js";
import Polyline from "../geom/polyline.js";

/**
 * 新增多边形/折线
 */
class PolygonAdd extends GraphEvent {
    constructor(options = {}) {
        super(options);

        /**
         * 图形管理对象
         */
        this.graph = options.graph;
        this.layer = options.layer;
        this.fillColor = options.fillColor || "none";
        this.style = { "lineWidth": options.lineWidth || 2, "color": options.color || "#999999", "fillStyle": (options.fillColor ? 1 : 0) };
        this.ring = options.ring === false ? false : true;

        // /**
        //  * 回调函数
        //  */
        // this.mouseUpCallback = options.mouseUp;
        // this.mouseDownCallback = options.mouseDown;
        // this.mouseMoveCallback = options.mouseMove;
        // this.keyDownCallback = options.keyDown;

        /**
         * 当前的操作， -1:无操作，1:拖拽连续加点， 2：点击加点
         */
        this.operation = -1;

        /**
         * 当前新增的多边形对象影子
         */
        this.polyline = null;

        this.polygonCoord = [];

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
        this.cursor = Cursor.POINTER;

        /**
         * mouseUp event
         */
        let that = this;
        this.mouseUp = function (e) {
            that.startDrag = false;

            if (that.operation == 1) {
                that.operation = 2;
            }

            if (that.operation == 2) {
                // 鼠标左键加点，或结束操作
                that.endPoint = [e.offsetX, e.offsetY];

                // 与第一个点的距离小于20像素，结束绘制
                if (Measure.dist(that.startPoint, that.endPoint) < 10) {
                    that.polygonCoord.push(that.graph.getCoordinateFromPixel(that.endPoint));
                    if (that.polygonCoord.length > 2) {
                        that.drawPolygon(true);
                        that.end();
                    }
                } else {
                    that.polygonCoord.push(that.graph.getCoordinateFromPixel(that.endPoint));
                    that.drawPolygon(false);
                }
                that.__lastPoint = that.endPoint;
            } else {
                console.info("mouseUp ??")
            }
        }

        this.rclick = function (e) {
            that.operation == -1;
            that.drawPolygon(true);
            that.end();
        }
    }

    /**
     * mouseDown event
     * @param {Event} e 
     */
    mouseDown(e) {
        if (this.operation == -1) {
            this.operation = 1;
            this.startPoint = [e.offsetX, e.offsetY];
            this.endPoint = [e.offsetX, e.offsetY];
            this.__lastPoint = this.startPoint.slice();
            this.polygonCoord.push(this.graph.getCoordinateFromPixel(this.startPoint));
            this.startDrag = true;
        }
    }

    /**
     * mouseMove event
     * @param {Event} e
     */
    mouseMove(e) {
        this.movePoint = [e.offsetX, e.offsetY];
        // 连续加点
        if (this.operation === 1) {
            // 连续加点模式时，距离超过20个像素自动加点
            if (Measure.dist(this.movePoint, this.__lastPoint) > 40) {
                this.polygonCoord.push(this.graph.getCoordinateFromPixel(this.movePoint));
                this.drawPolygon(false);
                this.__lastPoint = this.movePoint;
            }
        } else if (this.operation === 2) {
            // 橡皮线
            if (Measure.dist(this.movePoint, this.__lastPoint) > 20) {
                let ruleCoords = [this.graph.getCoordinateFromPixel(this.__lastPoint), this.graph.getCoordinateFromPixel(this.movePoint)];
                if (this.ruleLine) {
                    this.ruleLine.setCoord(ruleCoords)
                } else {
                    this.ruleLine = this.layer.getSource().add(new Polyline({ "coords": ruleCoords, "style": Object.assign({ "dash": [6, 6] }, this.style) }));
                }
                this.graph.render();
            }
        }
    }

    drawPolygon(over) {
        if (this.polygonCoord && this.polygonCoord.length > 2) {
            if (over === true) {
                this.graph.removeGeom(this.ruleLine);
                if (this.ring) {
                    this.graph.removeGeom(this.polyline);
                    this.layer.getSource().add(new Polygon({ "coords": this.polygonCoord, "style": Object.assign({ "fillColor": this.fillColor }, this.style) }));
                } else {
                    this.polyline.setCoord(this.polygonCoord);
                }
            } else {
                if (this.polyline == null) {
                    this.polyline = this.layer.getSource().add(new Polyline({ "coords": this.polygonCoord, "style": this.style }));
                } else {
                    this.polyline.setCoord(this.polygonCoord);
                }
                this.polyline.setFocus(true);
            }
        }
        this.graph.render();
    }

    /**
     * 事件：键盘按键事件
     * @param {Event} e 
     */
    keyDown(e) {
        let key = e.keyCode;
    }
}

export default PolygonAdd;
