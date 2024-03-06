import {GGeometryType} from "../geom/index.js";
import VectorSource from "../source/vector.js";
import Layer from "../layer.js";
import Extent  from "../spatial/extent.js";
import {UrlUtil} from "../util/index.js";

/**
 * 图形交互操作
 */
class Draw {
    /**
     * 构造函数
     * @param {Graph} graph 
     */
    constructor(graph) {
        this.graph_ = graph;
        this.overlayId_ = 211;                   // 覆盖层图层ID （度量尺、空间查询矩形框等）
        this.overlayDesc_ = "覆盖层图层";
        this.defaultStyle = {
            "color": "red",
            "fillColor": "rgba(255, 159, 159, 0.5)",
            "lineWidth": 2,
            "imagePath": UrlUtil.getContextPath() + "/adam.lib/images/marker/marker.png",
            "smallImagePath": UrlUtil.getContextPath() + "/adam.lib/images/marker/marker_s.png",
            "fontBorder": true
        }
    }

    /**
     * 获取图形对象
     * @returns Graph
     */
    getGraph() {
        return this.graph_;
    }

    /**
     * 获取浮动图层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.getGraph().getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                source: new VectorSource(),
                zIndex: this.overlayId_, 
                name: this.overlayDesc_
            });
            this.getGraph().addLayer(layer);
        }
        return layer;
    }

    /**
     * 清除缓冲区
     * @param {Object} options: {id} 如果该值为空，则清除整个缓冲区
     */
    clear(options) {
        options = Object.assign({}, this.defaultStyle, options);
        let layer = this.getOverLayer();
        if (layer != null) {
            if (options.id == null) {
                layer.getSource().clearData();
            } else {
                layer.getSource().clearData(options.id);
            }
            this.getGraph().renderLayer(layer, false);
        }
    }

    /**
     * 绘制折线
     * @param {Object} options 对象格式为：{color, fillColor, drawClear, drawClosure, drawCallback}
     * @param {Function} callback 结束时执行的callback，其参数为：{id, coords, "type": "Line"}
     * @example
     *   options.drawClear 是否在最后一个点旁边绘制‘清除’按钮，缺省值为false
     *   options.drawClosure 是否绘制封闭线段（封闭线路为虚线），缺省值为false
     *   options.drawCallback 鼠标点击或移动时执行callback,
     *     其参数为：(pointArray, options)   
     *         options.layer 图层信息
     *         options.pointCoord 事件触发式的点坐标
     *         options.pointType 0：单击过程中的点， 1：最后一个点， 2:移动中的点
     */
    drawLine(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        // 是否在最后一个点旁边绘制‘清除’按钮
        let drawClear = (options != null && options.drawClear === true ? true : false);
        // 是否绘制封闭线段（封闭线路为虚线）
        let drawClosure = (options != null && options.drawClosure === true ? true : false);

        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        let ruleLine;   // 橡皮线
        let pointArray = [];  // 点坐标

        let _drawLine = function (args, isMovePoint, isLastPoint) {
            let pointCoord = that.getGraph().getCoordinateFromPixel([args.x + 2, args.y + 8], true);
            if (isMovePoint) {
                let lastPoint = pointArray[pointArray.length - 1];
                ruleLine.setCoord([lastPoint, pointCoord]);
            } else {
                layer.getSource().clearData(id);

                // 画点
                if (pointCoord == null) {
                    debugger; return;
                }
                if (!isLastPoint) {  // 忽略最后一个点
                    pointArray.push(pointCoord);
                }

                for (let i = 0; i < pointArray.length; i++) {
                    if (i === 0) {
                        layer.getSource().addPoint(pointArray[i], { "color": options.color, "fillColor": options.color, "size": 10 }, properties); // 起点加大一圈
                        ruleLine = layer.getSource().addLine([[0, 0], [1, 1]], { "color": options.color, "lineWidth": options.lineWidth }, properties);   // 橡皮线
                    } else {
                        layer.getSource().addPoint(pointArray[i], { "color": options.color, "fillColor": options.color, "size": 8 }, properties);  // 普通点

                        // 画线
                        let coords = [pointArray[i], pointArray[i - 1]];
                        layer.getSource().addLine(coords, { "color": options.color, "lineWidth": options.lineWidth }, properties);
                    }
                }
            }

            // 闭合线
            if (drawClosure === true && pointArray.length > 2) {
                let coords = [pointArray[pointArray.length - 1], pointArray[0]];
                layer.getSource().addLine(coords, { "color": options.color, "dash": [10, 6], "lineWidth": options.lineWidth }, properties);
            }

            // 最后一个点
            if (drawClear === true && isLastPoint === true) {
                let coord = pointArray[pointArray.length - 1];
                let imagePath = UrlUtil.getContextPath() + "/adam.lib/images/icon_remove.png";
                let title = "取消";
                layer.getSource().addMark(coord, imagePath, Object.assign({
                    id, title, click: function (e) {
                        layer.getSource().clearData(id);
                        that.getGraph().renderLayer(layer, false);
                        //e.stopPropagation();
                        //e.returnValue = false;
                        //e.cancelBubble = true;
                        return false;
                    }
                }, properties));
            }

            // 绘制过程中的回调（包括各个折点的mouseUp和mouseMove）
            if (typeof (options.drawCallback) === "function") {
                options.drawCallback(pointArray, { id, layer, pointCoord, "pointType": (isLastPoint ? 1 : (isMovePoint === true ? 2 : 0)) });
            }

            // 绘制最后一个点时的回调
            if (isLastPoint === true) {
                if (typeof (callback) === "function") {
                    callback({ id, "coords": pointArray, "type": "Line" });
                } else {
                    console.info("drawLine finish, id:" + id + ", coords:", pointArray);
                }
            }

            // 重绘图形
            that.getGraph().renderLayer(layer);
        }

        // 鼠标操作
        let beginDraw = false;
        render.addEvent({
            mouseDown: function (args) {
                return false;
            },
            mouseMove: function (args) {
                if (beginDraw === true) {
                    _drawLine(args, true, false);
                }
                return false;
            },
            mouseUp: function (args) {
                beginDraw = true;
                _drawLine(args, false, false);
                return false;
            },
            rclick: function (args) {
                if (pointArray.length > 1) {
                    _drawLine(args, false, true);
                } else {
                    layer.getSource().clearData(id);
                    that.getGraph().renderLayer(layer, false);
                }
                return true; // 返回true，则终止鼠标操作
            }
        });

        if (options.cursor != null) {
            render.setPointer(options.cursor);
        }
    }

    /**
     * 绘制矩形
     * @param {Object} options 对象格式为：{color, fillColor}
     * @param {Function} callback 结束时执行的callback，其参数为({id, coords, "type": "Rect"})
     */
    drawRectangle(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);

        // 鼠标操作
        let beginDraw = false;
        let beginPoint = null;
        let endPoint = null;
        let queryReady = false;
        let polygon;

        render.addEvent({
            mouseDown: function (args) {
                if (beginDraw === false && args.button === 0) {
                    layer.getSource().clearData(id);
                    queryReady = false;
                }
            },

            mouseMove: function (args) {
                if (beginDraw === true) {
                    endPoint = [args.x, args.y];
                    let point1Coords = that.getGraph().getCoordinateFromPixel(beginPoint, true);
                    let point2Coords = that.getGraph().getCoordinateFromPixel([endPoint[0], beginPoint[1]], true);
                    let point3Coords = that.getGraph().getCoordinateFromPixel(endPoint, true);
                    let point4Coords = that.getGraph().getCoordinateFromPixel([beginPoint[0], endPoint[1]], true);
                    polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
                    polygon.style = { "color": options.color, "lineWidth": options.lineWidth, "fillColor": "none" };
                    that.getGraph().renderLayer(layer, false);
                }
                return false;
            },

            mouseUp: function (args) {
                if (beginDraw === false) {
                    beginPoint = [args.x, args.y];
                    polygon = layer.getSource().addPolygon([[0, 0], [0, 0], [0, 0]], { "color": options.color, "lineWidth": options.lineWidth }, properties);
                    beginDraw = true;
                } else {
                    endPoint = [args.x, args.y];
                    let point1Coords = that.getGraph().getCoordinateFromPixel(beginPoint, true);
                    let point2Coords = that.getGraph().getCoordinateFromPixel([endPoint[0], beginPoint[1]], true);
                    let point3Coords = that.getGraph().getCoordinateFromPixel(endPoint, true);
                    let point4Coords = that.getGraph().getCoordinateFromPixel([beginPoint[0], endPoint[1]], true);
                    polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
                    polygon.style = { "color": options.color, "lineWidth": options.lineWidth, "fillColor": options.fillColor };
                    that.getGraph().renderLayer(layer, false);
                    beginDraw = false;
                    queryReady = true;
                }
                return false;
            },

            rclick: function (args) {
                if (queryReady === true) {
                    let point1Coords = that.getGraph().getCoordinateFromPixel(beginPoint, true);
                    let point2Coords = that.getGraph().getCoordinateFromPixel(endPoint, true);
                    let coords = [point1Coords[0], point1Coords[1], point2Coords[0], point2Coords[1]];
                    if (typeof (callback) === "function") {
                        callback({ id, coords, "type": "Rectangle" });
                    } else {
                        console.info("drawRectangle() extent:" + coords);
                    }
                } else {
                    layer.getSource().clearData(id);
                    that.getGraph().renderLayer(layer, false);
                }
                return true; // 返回true，则终止鼠标操作
            },

            dblclick: function (args) {
                layer.getSource().clearData(id);
                return false;
            }
        });

        //render.setPointer("url(" + UrlUtil.getContextPath() + "/adam.lib/images/cursor/scalerule.png)");
    }

    /**
     * 绘制多边形，
     * @param {Object} options 对象格式为：{color, fillColor}
     * @param {Function} callback 结束时执行的callback，其参数为({id, coords, "type": "Polygon"})
     */
    drawPolygon(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let polygon;
        let pointArray = [];  // 点坐标
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);

        let drawPolygon = function (args, isMovePoint, isLastPoint) {
            layer.getSource().clearData(id);

            let movePoint = [];
            let mouseCoord1 = that.getGraph().getCoordinateFromPixel([args.x + 2, args.y + 8], true);
            if (mouseCoord1 == null) {
                debugger; return;
            }
            if (isMovePoint) {  // 移动中的点
                movePoint = mouseCoord1;
            } else {
                if (!isLastPoint) {  // 忽略最后一个点
                    pointArray.push(mouseCoord1);
                }
            }

            // 至少2个点，则绘制多边形，等于2个点，则绘制线
            if (pointArray.length === 0) {
                //let pixel = that.getGraph().getPixelFromCoordinate(pointArray[0]);
                //let coord = that.getGraph().getCoordinateFromPixel([pixel[0] + 15, pixel[1] - 20], true);
                //layer.getSource().addText(coord, {border:true}, properties, "起点");
                return;
            } else if (pointArray.length === 1) {
                layer.getSource().addPoint(pointArray[0], { "color": options.color, "fillColor": options.color, "size": 8 }, properties);  // 起点
                layer.getSource().addLine([pointArray[0], movePoint], { "color": options.color, "lineWidth": 2 }, properties);  // 橡皮线
            } else if (pointArray.length > 1) {
                layer.getSource().addPoint(pointArray[0], { "color": options.color, "fillColor": options.color, "size": 8 }, properties); // 起点
                // 多边形坐标
                let coords = [];
                for (let i = 0; i < pointArray.length; i++) {
                    coords.push(pointArray[i]);
                }
                if (isMovePoint) {  // 移动中的点
                    coords.push(movePoint);
                }
                coords.push(pointArray[0]);
                polygon = layer.getSource().addPolygon(coords, { "color": options.color, "lineWidth": options.lineWidth, "fillColor": options.fillColor }, properties);
            }

            if (isLastPoint === true) {
                polygon.getCoord().pop();
                // 执行回调
                if (typeof (callback) === "function") {
                    callback({ id, "coords": polygon.getCoord(), "type": "Polygon" });
                } else {
                    console.info("drawPolygon() polygonCoord:" + polygon);
                }
                // layer.getSource().clearData(id);  // 清除多边形
            }

            // 重绘图形
            that.getGraph().renderLayer(layer, false);
        }

        // 鼠标操作
        let beginDraw = false;
        render.addEvent({
            mouseDown: function (args) {
                return false;
            },

            mouseMove: function (args) {
                if (beginDraw === true) {
                    drawPolygon(args, true, false);
                }
                return false;
            },

            mouseUp: function (args) {
                beginDraw = true;
                drawPolygon(args, false, false);
                return false;
            },

            rclick: function (args) {
                if (pointArray.length > 2) {
                    drawPolygon(args, false, true);
                } else {
                    layer.getSource().clearData(id);
                    that.getGraph().renderLayer(layer, false);
                }
                return true; // 返回true，则终止鼠标操作
            }
        });
    }

    /**
     * 绘制圆
     * @param {Object} options 对象格式为：{color, fillColor, showRadius} showRadius: 是否显示半径值，缺省值为false
     * @param {Function} callback 结束时执行的callback，其参数为：{id, coords}
     */
    drawRound(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);

        // 鼠标操作
        let beginDraw = false;
        let beginPoint = null;
        let endPoint = null;
        let queryReady = false;
        let round;
        let moveText;

        render.addEvent({
            mouseDown: function (args) {
                if (beginDraw === false && args.button === 0) {
                    layer.getSource().clearData(id);
                    queryReady = false;
                }
            },

            mouseMove: function (args) {
                if (beginDraw === true) {
                    endPoint = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    let radius = Math.round(that.getGraph().measurePixelDistance(beginPoint, endPoint) * 100) / 100;
                    round.setCoord([beginPoint[0], beginPoint[1], radius]);
                    round.style = { "color": options.color, "lineWidth": options.lineWidth, "fillColor": "none" };
                    if (options.showRadius === true) {
                        moveText.text = (radius < 1000 ? radius + "米" : Math.round(radius / 1000 * 100) / 100 + "公里");
                        moveText.setCoord(that.getGraph().getCoordinateFromPixel([args.x + 15, args.y - 20], true));
                    }
                    that.getGraph().renderLayer(layer, false);
                }
                return false;
            },

            mouseUp: function (args) {
                if (beginDraw === false) {
                    beginPoint = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    // 构造圆对象
                    round = layer.getSource().addRound([beginPoint[0], beginPoint[1], 0.1], { "color": options.color, "lineWidth": options.lineWidth }, properties);
                    if (options.showRadius === true) {
                        moveText = layer.getSource().addText(beginPoint, { fontBorder: true }, properties, "");
                        // 圆心
                        layer.getSource().addPoint(beginPoint, { "color": options.color, "fillColor": options.color, "size": 4 }, properties);
                    }
                    beginDraw = true;
                } else {
                    endPoint = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    let radius = Math.round(that.getGraph().measurePixelDistance(beginPoint, endPoint) * 100) / 100;
                    round.setCoord([beginPoint[0], beginPoint[1], radius]);
                    round.style = { "color": options.color, "lineWidth": options.lineWidth, "fillColor": options.fillColor };
                    if (options.showRadius === true) {
                        moveText.text = (radius < 1000 ? radius + "米" : Math.round(radius / 1000 * 100) / 100 + "公里");
                        moveText.setCoord(that.getGraph().getCoordinateFromPixel([args.x + 15, args.y - 20], true));
                    }
                    beginDraw = false;
                    queryReady = true;
                }
                that.getGraph().renderLayer(layer, false);
                return false;
            },

            rclick: function (args) {
                if (queryReady === true) {
                    let radius = Math.round(that.getGraph().measurePixelDistance(beginPoint, endPoint) * 100) / 100;
                    beginPoint.push(radius);
                    if (typeof (callback) === "function") {
                        callback({ id, "coords": beginPoint, "type": "Round" });
                    } else {
                        console.info("drawRound() finish, coord:" + beginPoint);
                    }
                } else {
                    layer.getSource().clearData(id);
                    that.getGraph().renderLayer(layer, false);
                }
                return true; // 返回true，则终止鼠标操作
            },

            dblclick: function (args) {
                // layer.getSource().clearData();
                return false;
            }
        });
    }

    /**
     * 绘制点
     * @param {Object} options 对象格式为：{color, fillColor, radius} options.radius 半径
     * @param {Function} callback 结束时执行的callback，其参数为：{id, coords}
     */
    drawPoint(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let executeBegin = false;
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);
        let buffer = layer.getSource().getExtentData(this.getGraph().getExtent());
        let pointObj = null;
        let radius = options.radius || 8;

        render.addEvent({
            mouseDown: function (args) {
                executeBegin = true;
                if (buffer !== null) {
                    // 拾取对象
                    for (let i = 0; i < buffer.length; i++) {
                        let data = buffer[i];
                        if (data.getType() === GGeometryType.POINT) {
                            if (that.getGraph().measurePixelDistance(that.getGraph().getPixelFromCoordinate(data.getCoord()), [args.x, args.y]) < 10) {
                                pointObj = data;
                                id = data.id;
                            }
                        }
                    }
                }
                let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);

                // 没有拾取到对象，则增加对象
                if (pointObj == null && args.button == 0) {
                    // 新增
                    pointObj = layer.getSource().addPoint(mouseCoord, { "color": options.color, "fillColor": options.color, "size": radius }, properties);
                } else {
                    pointObj.setCoord(mouseCoord);
                }
                that.getGraph().renderLayer(layer, false);
                return true;
            },
            mouseMove: function (args) {
                if (executeBegin && pointObj != null) {
                    let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    pointObj.setCoord(mouseCoord);
                    // 刷新Canvas
                    that.getGraph().renderLayer(layer, false);
                }
            },
            mouseUp: function (args) {
                //that.getGraph().renderLayer(layer, false);
                //let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                if (typeof (drawCallback) === "function") {
                    if (drawCallback(pointObj.getCoord(), { layer }) === false) {
                        render.endEvent();
                    };
                }
                executeBegin = false;
            },
            rclick: function (args) {
                if (pointObj != null) {
                    if (typeof (callback) === "function") {
                        callback({ id, "coords": pointObj.getCoord(), radius, "type": "Point" });
                    } else {
                        console.info("drawMark finish, id:" + id + ", coords:", coords);
                    }
                }
                return true; // 返回true，则终止鼠标操作
            }
        });
    }

    /**
     * 绘制标记
     * @param {Object} options 对象格式为：{title, imagePath, smallImagePath, click, drawCallback}
     * @param {Function} callback 结束时执行的callback，其参数为：{id, coords}
     */
    drawMark(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let executeBegin = false;
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);
        let buffer = layer.getSource().getExtentData(this.getGraph().getExtent());
        let markObj = null;

        render.addEvent({
            mouseDown: function (args) {
                executeBegin = true;
                if (buffer !== null) {
                    // 拾取对象
                    for (let i = 0; i < buffer.length; i++) {
                        let data = buffer[i];
                        if (data.getType() === GGeometryType.MARK) {
                            if (that.getGraph().measurePixelDistance(that.getGraph().getPixelFromCoordinate(data.getCoord()), [args.x, args.y]) < 10) {
                                markObj = data;
                                id = data.id;
                            }
                        }
                    }
                }
                let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);

                // 没有拾取到对象，则增加对象
                if (markObj == null && args.button == 0) {
                    // 新增
                    let title = options.title;
                    let imagePath = options.imagePath;
                    let smallImagePath = options.smallImagePath;
                    let click = options.click;
                    markObj = layer.getSource().addMark(mouseCoord, [imagePath, smallImagePath], Object.assign({ title, click }, properties));
                } else {
                    markObj.setCoord(mouseCoord);
                }
                that.getGraph().renderLayer(layer, false);
                return true;
            },
            mouseMove: function (args) {
                if (executeBegin && markObj != null) {
                    let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    markObj.setCoord(mouseCoord);
                    // 刷新Canvas
                    that.getGraph().renderLayer(layer, false);
                }
            },
            mouseUp: function (args) {
                //that.getGraph().renderLayer(layer, false);
                //let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                if (typeof (drawCallback) === "function") {
                    if (drawCallback(markObj.getCoord(), { layer }) === false) {
                        render.endEvent();
                    };
                }
                executeBegin = false;
            },
            rclick: function (args) {
                if (markObj != null) {
                    let title = options.title;
                    let imagePath = options.imagePath;
                    let smallImagePath = options.smallImagePath;
                    let click = options.click;
                    if (typeof (callback) === "function") {
                        callback({ id, "coords": markObj.getCoord(), title, imagePath, smallImagePath, click, "type": "Marker" });
                    } else {
                        console.info("drawMark finish, id:" + id + ", coords:", coords);
                    }
                }
                return true; // 返回true，则终止鼠标操作
            }
        });
    }

    /**
     * 绘制文本
     * @param {Object} options 对象格式为：{color, fontBorder, fontSize, text} options.fontBorder 是否包含边框，缺省为true
     * @param {Function} callback 结束时执行的callback，其参数为：{id, coords, text}
     */
    drawText(options, callback) {
        options = Object.assign({}, this.defaultStyle, options);
        let that = this;
        let render = this.getGraph().getRenderObject();
        let layer = this.getOverLayer();
        let executeBegin = false;
        let id = Date.now();
        let properties = Object.assign({id}, options.properties);
        layer.getSource().clearData(id);
        let buffer = layer.getSource().getExtentData(this.getGraph().getExtent());
        let textObj = null;
        let text = options.text;
        if (text == null) {
            throw new Error("参数错误, text不能为空!");
        }

        render.addEvent({
            mouseDown: function (args) {
                executeBegin = true;
                if (buffer !== null) {
                    // 拾取对象
                    for (let i = 0; i < buffer.length; i++) {
                        let data = buffer[i];
                        if (data.getType() === GGeometryType.PointObject && data.properties.text != null) {
                            let textWidth = parseInt(data.style.fontSize) * text.length;
                            let textHeight = parseInt(data.style.fontSize);
                            let pixel = that.getGraph().getPixelFromCoordinate(data.getCoord());
                            let textExtent = [pixel[0] - 8, pixel[1] - 8, pixel[0] + textWidth + 16, pixel[1] + textHeight + 16];
                            if (Extent.containsXY(textExtent, [args.x, args.y])) {
                                textObj = data;
                                id = data.id;
                            }
                        }
                    }
                }
                let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);

                // 没有拾取到对象，则增加对象
                if (textObj == null && args.button == 0) {
                    // 新增
                    textObj = layer.getSource().addText(mouseCoord, options, properties, text);
                } else {
                    textObj.setCoord(mouseCoord);
                    textObj.text = text;
                }
                that.getGraph().renderLayer(layer, false);
                return true;
            },
            mouseMove: function (args) {
                if (executeBegin && textObj != null) {
                    let mouseCoord = that.getGraph().getCoordinateFromPixel([args.x, args.y], true);
                    textObj.setCoord(mouseCoord);
                    // 刷新Canvas
                    that.getGraph().renderLayer(layer, false);
                }
            },
            mouseUp: function (args) {
                executeBegin = false;
            },
            rclick: function (args) {
                if (textObj != null) {
                    if (typeof (callback) === "function") {
                        callback({ id, "coords": textObj.getCoord(), text, "type": "Text" });
                    } else {
                        console.info("drawMark finish, id:" + id + ", coords:", coords);
                    }
                }
                return true; // 返回true，则终止鼠标操作
            }
        });
    }

}

export default Draw;
