import View from "./view.js";
import Layer from "./layer.js";
import VectorSource from "./source/vector.js";
import Extent from "./spatial/extent.js";
import Coordinate from "./spatial/coordinate.js";
import GraphRenderer from "./renderer/graph.js";
import RenderObject from "./control/render.js";
import Control from "./control/control.js";
import EventType from "./basetype/event.type.js";
import EventTarget from "./basetype/event.target.js";
import Transform from "./spatial/transform.js";
import Counter from "./util/counter.js";
import Easing from "./util/easing.js";
import { LOG_LEVEL } from "./global.js";
import Geometry from "./geom/geometry.js";
import { getLayerId } from "./global.js";
import Animation from "./util/animal.js";

//  Canvas规范: https://html.spec.whatwg.org/multipage/canvas.html

/**
 * 图形管理类<br>
 * 图形管理类是 AnyGraph 图形开发引擎核心组件之一，是一个创建和管理图形的容器类；图形通常由多个图层组成，一个图层对应一个Source和Renderer。<br>
 * Graph类提供了以下功能：<br>
 * 1 图层管理<br>
 * 2 图形渲染<br>
 * 3 图形交互操作<br>
 * 4 图形数据管理<br>
 * 5 控件和事件管理
 */
class Graph extends EventTarget {
    /**
     * 构造函数
     * @param {Object} options {target, mouse, eventable, layers, view, originAtLeftTop, useTransform, bgColor, useMatrix}  
     */
    constructor(options = {}) {
        super();

        let that = this;

        /**
         * 名称
         */
        this.name = options.name == null ? "graph" : options.name;

        /**
         * 渲染对象，负责将各个图层中的图形Canvas中渲染出来
         * @private
         */
        this.renderer_ = new GraphRenderer(this, { "filter": options.filter, "filterOptions": options.filterOptions });

        /**
         * 当没有指定view时，缺省是否显示全图
         * @private
         */
        this.defaultFullView_ = options.fullView || false;

        /**
         * 是否显示全图
         * @private
         */
        this.showFullView_ = this.defaultFullView_;

        /**
         * 视图对象
         * @private
         */
        this.view_ = options.view == null ? null : options.view;

        /**
         * 背景颜色
         * @private
         */
        this.bgColor_ = options.bgColor;

        /**
         * 是否触发Geom对象事件
         * @private
         */
        this.isEnabledGeomEvent_ = options.enabledGeomEvent == null ? false : options.enabledGeomEvent === true;

        /**
         * 屏幕左上角是否为原点坐标，地理坐标的坐标原点为屏幕左下角，否则为屏幕左上角
         * @private
         */
        this.originAtLeftTop = options.originAtLeftTop === true || options.originAtLeftTop == null;     // true:左下， false:左上（同屏幕坐标）

        /**
         * 是否使用矩阵变换坐标
         * @private
         */
        this.useTransform_ = (options.useTransform == undefined || options.useTransform == null ? false : options.useTransform);

        /**
         * 坐标 转换为 像素
         * @private
         */
        this.coordinateToPixelTransform_ = Transform.create();

        /**
         * 像素 转换为 坐标
         * @private
         */
        this.pixelToCoordinateTransform_ = Transform.create();

        /**
         * 是否为动态投影
         * @private
         */
        this.dynamicProjection_ = (options.dynamicProjection === true);

        /**
         * 是否使用Matrix进行坐标变换，系统提供了两种方式将世界坐标转换为屏幕坐标（Matrix和Transform)，Matrix的运行效率比transform略高，但无法提供旋转和平移等坐标变换
         * @private
         */
        this.useMatrix_ = (options.useMatrix == null || options.useMatrix === true);

        /**
         * 当前视点范围内的Gemo对象列表
         * @private
         */
        this.viewGeomList = options.hitGetColor === true ? new Map() : null;

        /**
         * target大小发生变化时的处理
         */
        //this.resizeObserver_ = new ResizeObserver(() => this._renderGraph());   // 页面初始化时会自动执行一次，导致重复渲染，因此暂时屏蔽 2024/1/12

        /**
         * Render对象，即包含画板和鼠标事件的对象，图形渲染载体
         */
        console.assert(options.target != null, "初始化失败，缺少必要的选项<target>");
        let render = null;
        let target = options.target;
        if (typeof (target) == "string") {
            render = new RenderObject(document.getElementById(options.target), {
                "mouse": options.mouse,
                "eventable": options.eventable,
                "mapZoom": function (args) {
                    let anchor = that.getCoordinateFromPixel([args.x, args.y]);
                    let scale = (args.scale == null ? (args.op > 0 ? 0.8 : 1.25) : args.scale);
                    that.doZoom(scale, anchor);
                    return false;
                },
                "mapMove": function (args) {
                    that.doMove([args.xdist, args.ydist]);
                    return false;
                }
            }, this);
        } else if (typeof (target) == "object" && typeof (target.getCanvas) === "function") {
            render = target;
        } else {
            throw new Error("graph initialize error.")
        }

        if (render != null && render.getCanvas() != null) {
            this.renderObj_ = render;
            this.getRenderer().setMainCanvas(render.getCanvas());
            this.getRenderer().initCanvas(this.getRenderer().getSize());
            // this.resizeObserver_.observe(document.getElementById(options.target));
        }

        /**
         * 图层/背景图层
         */
        this.layers = [];
        if (options.layers != null && options.layers.length > 0) {
            options.layers.forEach(function (layer) {
                that.addLayer(layer);
            })
        }

        /**
         * 计数器
         * @private
         */
        this.counter = new Counter("graph");

        /**
         * render requestAnimalFrame id
         * @private
         */
        this.rafDelayId_;
    }

    /**
     * 设置图形名称
     */
    setName(name) {
        this.name = name;
    }

    /**
     * 清除当前图形对象的所有信息
     */
    remove() {
        this.layers.clear();
        // this.resizeObserver_.disconnect();
        this.getRenderObject().remove();
        Object.keys(this).forEach(key => {
            delete this[key];
        })
    }

    // /**
    //  * openLayer3
    //  * Clean up.
    //  */
    // disposeInternal() {
    //     this.controls.clear();
    //     this.interactions.clear();
    //     this.overlays_.clear();
    //     this.resizeObserver_.disconnect();
    //     this.setTarget(null);
    //     super.disposeInternal();
    // }

    /**
     * 增加图层
     * @param {Layer} layer 图层对象
     */
    addLayer(layer) {
        if (layer == null || !(layer instanceof Layer)) {
            layer = new Layer(Object.assign({
                "name": "缺省数据层",
                "zIndex": getLayerId(),
                "source": new VectorSource()
            }, layer));
        }
        layer.setGraph(this);
        layer.getRenderer().initCanvas(this.getRenderer().getSize());
        this.layers.push(layer);
        this.layers.sort(function (firstEl, secondEl) {
            return firstEl.getZIndex() - secondEl.getZIndex();
        });
        // 渲染
        this.render();
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "add", "layer": layer });
        return layer;
    }

    /**
     * 移除图层
     * @param {Layer} layer 图层对象
     */
    removeLayer(layer) {
        if (layer == null) return false;
        let bgType = layer.getId();
        for (let i = 0; i < this.layers.length; i++) {
            if (bgType === this.layers[i].getId()) {
                this.layers.splice(i, 1);
                return true;
            }
        }
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "remove", "layer": layer });
        return false;
    }

    /**
     * 移除所有图层
     */
    removeLayers() {
        for (let i = this.layers.length; i >= 0; i--) {
            this.layers.splice(i, 1);
        }
        // 触发事件
        this.triggerEvent(EventType.LayerModified, { "action": "remove", "layer": [] });
    }

    /**
     * 获取指定图层
     * @param {int} bgType 图层ID
     */
    getLayer(id) {
        if (id === undefined) {
            for (let i = this.layers.length - 1; i >= 0; i--) {
                if (!this.layers[i].isAuxLayer()) {
                    return this.layers[i];
                }
            }
            return this.layers.length > 0 ? this.layers[0] : null;
        } else {
            for (let i = 0, len = this.layers.length; i < len; i++) {
                if (id === this.layers[i].getId()) {
                    return this.layers[i];
                }
            }
        }
        return null;
    }

    /**
     * 获取所有图层
     */
    getLayers() {
        return this.layers;
    }

    /**
     * 增加浮动层
     * 浮动层通常在数据层的上层，用于突出显示或绘制橡皮线
     */
    getOverLayer(options = {}) {
        if (this.overlayId == null) {
            this.overlayId = getLayerId() * 2;
        }
        let overLayer = this.getLayer(this.overlayId);
        if (overLayer == null) {
            overLayer = new Layer({
                "source": new VectorSource(),
                "zIndex": this.overlayId,
                "type": "aux",
                "name": options.name ? options.name : "浮动层",
                "style": options.style ? options.style : { "color": "blue", "fillColor": "#FF8080" },
                "visible": true
            });
            this.addLayer(overLayer);
        }
        return overLayer;
    }

    /**
     * 增加控件
     */
    addControl(control) {
        if (control instanceof Control) {
            control.setGraph(this);
            control.show();
        }
    }

    /**
     * 移除控件
     */
    removeControl(control) {
        control.hide();
    }

    /**
     * 是否触发Geom对象事件
     * @returns {Boolean} 是/否
     */
    isEnabledGeomEvent() {
        return this.isEnabledGeomEvent_;
    }

    /**
     * 事件分发至对象中
     * @param {*} name 
     * @param {*} args 
     * @returns Boolean 如果返回false，则阻止事件冒泡
     */
    handleEvent(name, args) {
        // 根据鼠标的当前位置逐个图层，逐个对象判断是否相交，相交的对象添加至selectedGeomList中
        args = args || {};
        args.coord = this.getCoordinateFromPixel([args.x, args.y]);

        // 查询当前位置的GeomList
        let selectedGeomList = this.queryGeomList(args.coord)

        // 逐个触发geom对象事件
        let rtn = true;
        for (let i = 0, len = selectedGeomList.length; i < len; i++) {
            let geom = selectedGeomList[i];
            if (geom.triggerEvent(name, Object.assign(args, { "geometry": geom })) === false) {
                rtn = false;
            }
        }
        return rtn;
    }

    /**
     * 获取渲染器
     */
    getRenderer() {
        return this.renderer_;
    }

    /**
     * 设置图形的背景颜色
     */
    setBgColor(color) {
        this.bgColor_ = color;
    }

    /**
     * 获取背景颜色
     */
    getBgColor() {
        return this.bgColor_;
    }

    /**
     * 是否使用矩阵变换实现图形缩放交互操作
     * @returns Boolean
     */
    isUseTransform() {
        return this.useTransform_;
    }

    /**
     * 设置是否使用矩阵变换实现图形缩放交互操作
     * @param {*} bool 
     */
    setUseTransform(bool) {
        this.useTransform_ = (bool === true);
    }

    /**
     * 返回当前视图
     */
    getView() {
        if (this.view_ == null || !this.view_.isDef()) {
            let size = this.getRenderer().getSize();
            let maxExtent = Extent.createEmpty();
            // 缺省显示全图时，根据data计算viewPort
            if (this.defaultFullView_ === true || this.showFullView_ == true) {   // this.originAtLeftTop !== true || 
                maxExtent = this.getFullExtent();
                if (!Extent.isEmpty(maxExtent)) {
                    if (this.view_ == null) {
                        this.view_ = new View({ "extent": maxExtent, "canvasSize": size });
                        // 缺省视图为maxExtent的1.05倍  
                        this.view_.setResolution(this.view_.getResolution() * 1.01);
                    } else {
                        this.view_.initialize({ "extent": maxExtent, "canvasSize": size });
                    }
                }
            }
            // 否则使用当前画布的viewPort
            else {
                if (this.view_ == null) {
                    this.view_ = new View({ "extent": [0, 0, size.width, size.height], "canvasSize": size });
                } else {
                    this.view_.initialize({ "extent": [0, 0, size.width, size.height], "canvasSize": size });
                }
            }
        }

        return this.view_;
    }

    /**
     * 根据各图层的数据计算当前图形的最大范围
     */
    getFullExtent() {
        let maxExtent = Extent.createEmpty();
        for (let i = 0, ii = this.getLayers().length; i < ii; i++) {
            let layer = this.getLayers()[i];
            if (!layer.isUsePixelCoord()) {
                let source = layer.getSource();
                let gExtent = source.getBBox();
                maxExtent = Extent.merge(gExtent, maxExtent);
            }
        }
        return maxExtent;
    }


    /**
     * 查询图形中“包含”该坐标位置的对象
     * @param {Array} coord 坐标，其格式为[x,y] 或 [[x,y], [x,y]]
     * @returns Array GeomList
     */
    queryGeomList(coord) {
        let selectedGeomList = [];
        let extent = this.getExtent();
        let layers = this.getLayers();

        // 当坐标为空时为查询所有
        if (coord == null) {
            for (let i = 0; i < layers.length; i++) {
                let layer = layers[i];
                // 仅判断可见图层中的对象
                if (layer.isVisible() && layer.visibleAtResolution() && layer.visibleAtDistinct() && !layer.isAuxLayer()) {
                    selectedGeomList = selectedGeomList.concat(layer.getSource().getData());
                }
            }
        }
        // 根据点坐标或矩形坐标进行查询
        else {
            let point = (coord.length == 2 && !Array.isArray(coord[0]));

            for (let i = 0; i < layers.length; i++) {
                let layer = layers[i];
                // 仅判断可见图层中的对象
                if (layer.isVisible() && layer.visibleAtResolution() && layer.visibleAtDistinct() && !layer.isAuxLayer()) {
                    let geomList = layer.getSource().getExtentData(extent);

                    // 逐个对象判断是否相交
                    if (geomList != null && geomList.length > 0) {

                        let minX = Math.min(coord[0][0], coord[1][0]);
                        let minY = Math.min(coord[0][1], coord[1][1]);
                        let maxX = Math.max(coord[0][0], coord[1][0]);
                        let maxY = Math.max(coord[0][1], coord[1][1]);
                        let coordExtent = [minX, minY, maxX, maxY];

                        for (let j = 0, len = geomList.length; j < len; j++) {
                            if (geomList[j].isVisible() == false) continue;
                            // 根据点坐标进行查询
                            if (point) {
                                if (geomList[j].contain(coord, true)) {
                                    selectedGeomList.push(geomList[j]);
                                }
                            }
                            // 判断coord与bbox是否相交
                            else {
                                let bbox = geomList[j].getBBox();
                                if (Extent.intersects(coordExtent, bbox)) {
                                    selectedGeomList.push(geomList[j]);
                                }
                            }
                        }
                    }
                }
            }

            // 按对象类别，与中心点距离等因素对相交的对象进行排序
            selectedGeomList.sort(function (a, b) {
                let extentA = a.getBBox(false);
                let extentB = b.getBBox(false);
                return Extent.getArea(extentA) - Extent.getArea(extentB);
            });
        }

        return selectedGeomList;
    }

    /**
     * 同步图形渲染（立即进行图形渲染）
     */
    renderSync() {
        if (this.rafDelayId_) {
            window.cancelAnimationFrame(this.rafDelayId_);
            this.rafDelayId_ = undefined;
        }
        this._renderGraph();
    }

    /**
     * 异步图形渲染（使用RAF方式，在window下一次刷新时进行渲染）
     */
    render() {
        let that = this;
        if (this.rafDelayId_ === undefined) {
            this.rafDelayId_ = window.requestAnimationFrame(function () {
                that._renderGraph();
                that.rafDelayId_ = undefined;
            });
        }
    }

    /**
     * 重绘指定图层
     * @param {Layer} layer 
     * @returns 执行时间
     */
    renderLayer(layer) {
        let frameState = this.getFrameState();
        frameState.getLayer = function () {
            return layer;
        }
        // 触发事件
        this.triggerEvent(EventType.RenderBefore, { frameState, "graph": this });
        // 改变变换矩阵参数
        this.calculateMatrices2D(frameState);
        // 合成图形
        let style = layer.getStyle();
        if (typeof (style.dynamic) === "function") {
            style.dynamic(layer, frameState);
        }
        let execTime = layer.getRenderer().composeBuffer(frameState);
        execTime += this.getRenderer().renderFrame();
        // 触发事件
        this.triggerEvent(EventType.RenderAfter, { frameState, "graph": this });
        if (LOG_LEVEL > 2) {
            console.debug("execute Graph.renderLayer(), time:" + execTime + "ms");
        }
        return execTime;
    }

    /**
     * 图形渲染
     * @private
     */
    _renderGraph() {
        let beginTime = Date.now();
        // canvas对象大小调整
        this.getRenderObject().updateSize();
        // 各图层大小调整
        this.getRenderer().prepareFrame();

        // 读取视图
        if (this.getView() != null && this.getView().isDef()) {
            let frameState = this.getFrameState();
            // 触发事件
            this.triggerEvent(EventType.RenderBefore, { frameState, "graph": this });
            // 改变变换矩阵参数
            this.calculateMatrices2D(frameState);
            // 各图层合成图形
            this.getRenderer().composeBuffer(frameState);
            // 将各图层的图形合成到主画板中
            this.getRenderer().renderFrame(true);
            // 触发事件
            this.triggerEvent(EventType.RenderAfter, { frameState, "graph": this });
        }
        if (LOG_LEVEL > 2) {
            console.debug("render %s time: %dms", this.name, (Date.now() - beginTime));
        }
        this.counter.add("render " + this.name + " time", (Date.now() - beginTime));
        this.rafDelayId_ = undefined;
    }

    /**
     * 
     * @param {Geometry} geom 
     * @param {String} name 
     * @param {Object} val 
     */
    prop(geom, name, val) {
        geom[name] = val;
        this.render();
    }

    /**
     * 移除某个图层中的Geometry对象
     * @param {Geometry|String} geom 
     */
    removeGeom(geom) {
        let uid = (geom instanceof Geometry ? geom.getUid() : (typeof (geom) === "string" ? geom : (typeof (geom) === "object" ? geom.id : null)));
        if (uid == null) return;
        let layers = this.getLayers();
        for (let i = 0; i < layers.length; i++) {
            let geomList = layers[i].getSource().getData();
            if (geomList && geomList.length > 0) {
                for (let j = 0, len = geomList.length; j < len; j++) {
                    if (geomList[j].getUid() === uid) {
                        let removefirst = geomList[j].getAutoRemoveList();
                        if (removefirst.length > 0) {
                            removefirst.push(geomList[j]);
                            for (let k = 0; k < removefirst.length; k++) {
                                this.removeGeom(removefirst[k]);
                            }
                            return;
                        } else {
                            if (!geomList[j].removeCB()) {
                                return;
                            }
                            geomList.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }
        this.render();
    }

    /**
     * 获取图形信息
     * @returns Object
     */
    getFrameState() {
        let extent = this.getExtent();
        let frameState = Object.assign({
            "extent": extent,
            "size": this.getSize(),
            "dist": Extent.getWidth(extent) * Math.sqrt(3),
            "coordinateToPixelTransform": this.coordinateToPixelTransform_,
            "pixelToCoordinateTransform": this.pixelToCoordinateTransform_,
            "dynamicProjection": this.dynamicProjection_,
            "useMatrix": this.useMatrix_,
            "originAtLeftTop": this.originAtLeftTop,
            "useTransform": this.useTransform_,
            "viewGeomList": this.viewGeomList
        }, this.getView().getState())
        return frameState;
    }

    /**
     * 获取当前渲染范围
     * @returns Extent
     */
    getExtent() {
        let size = this.getSize();
        let viewState = this.getView().getState();
        let extent = [
            viewState.center[0] - viewState.resolution * size.width / 2,
            viewState.center[1] - viewState.resolution * size.height / 2,
            viewState.center[0] + viewState.resolution * size.width / 2,
            viewState.center[1] + viewState.resolution * size.height / 2
        ];
        return extent;
    }

    /**
     * 设置图形的视点范围，并重绘图形
     * @param {Extent} extent
     */
    showExtent(extent) {
        // 计算分辨率
        let canvasSize = this.getSize();
        let widthResolution = Extent.getWidth(extent) / canvasSize.width;
        let heightResolution = Extent.getHeight(extent) / canvasSize.height;
        let res = Math.max(widthResolution, heightResolution);
        // 计算中心点
        let center = Extent.getCenter(extent);
        // 改变视点
        this.getView().setCenter(center);
        this.getView().setResolution(res);
        this.render();
    }

    /**
     * 显示全图
     */
    showFullView() {
        this.showFullView_ = true;
        this.setView();
    }

    /**
     * 居中显示指定位置
     */
    showCenterView(coord) {
        let view = this.getView();
        view.setCenter(coord == null ? Extent.getCenter(this.getFullExtent()) : coord);
        this.render();
    }

    /**
     * 设置当前视图（中心点和密度），并重绘图形
     * @param {View} view
     */
    setView(view) {
        this.view_ = view;
        this.render();
    }

    /**
     * 改变视图位置
     * @param {Array} position 横向像素距离和纵向像素距离
     */
    doMove(position) {
        let state = this.getView().getState();
        let centerX = state.center[0] - position[0] * state.resolution;
        let centerY = state.center[1] + position[1] * state.resolution * (this.originAtLeftTop ? -1 : 1);
        this.getView().setCenter([centerX, centerY]);
        this.render();
    }

    /**
     * 放大/缩小图形
     * @param {Number} scale 缩放倍率 
     * @param {Coord} anchor 锚点坐标 
     */
    doZoom(scale = 1.5, anchor) {
        if (anchor == null) {
            anchor = this.getView().getCenter();
        }
        // 改变分辨率，并更加锚点计算中心点，从而进行缩放
        let resolution = this.getView().getResolution() * scale;
        let center = this.getView().calculateCenterZoom(resolution, anchor);
        if (this.getView().setResolution(resolution)) {
            this.getView().setCenter(center);
        }
        this.render();
    }

    /**
     * 具有动画效果的图形缩放
     * @param {Number} scale 缩放倍率 
     * @param {Coord} anchor 锚点坐标 
     */
    animailZoom(scale = 1.5, anchor, duration = 500) {
        let originalRes = this.getView().getResolution();
        let targetRes = this.getView().getResolution() * scale;
        let start = Date.now();
        let that = this;
        // 缺省锚点为中心点
        if (anchor == null) {
            anchor = Extent.getCenter(this.getExtent());
        }
        // 开始动画
        Animation.start(function () {
            let drawTime = Date.now() - 1;
            let delta = Easing.easeOut((drawTime - start) / duration);
            let res = originalRes + delta * (targetRes - originalRes);
            let center = that.getView().calculateCenterZoom(res, anchor);
            that.getView().setCenter(center);
            that.getView().setResolution(res);
            that.renderSync();
        }, duration);
    }

    /**
     * 具有动画效果的图形移动
     * @param {Coord} coord 中心点坐标
     * @param {Number} resolution 新的分辨率，如果为空则不改变分辨率 
     * @param {int} duration 延时时间
     */
    animailMove(coord, resolution, duration = 500) {
        let start = Date.now();
        let that = this;
        let originalCenter = this.getView().getCenter();
        let originalRes = this.getView().getResolution();

        // 开始动画
        Animation.start(function () {
            let drawTime = Date.now() - 1;
            let delta = Easing.easeOut((drawTime - start) / duration);
            let centerX = originalCenter[0] + delta * (coord[0] - originalCenter[0]);
            let centerY = originalCenter[1] + delta * (coord[1] - originalCenter[1]);
            that.getView().setCenter([centerX, centerY]);
            if (resolution != null && resolution > 0) {
                let res = originalRes + delta * (resolution - originalRes);
                that.getView().setResolution(res);
            }
            that.renderSync();
        }, duration);
    }

    /**
     * 渲染画板对象
     * @returns Render
     */
    getRenderObject() {
        return this.renderObj_;
    }

    /**
     * 获取图形的宽度和高度
     */
    getSize() {
        let width = this.getRenderer().getMainCanvas().width;
        let height = this.getRenderer().getMainCanvas().height;
        return { width, height };
    }

    /**
     * 像素坐标转地理坐标
     */
    getCoordinateFromPixel(pixel, precision = true) {
        //return Transform.apply(this.pixelToCoordinateTransform_, pixel.slice(), precision);
        return Coordinate.transform2D(this.pixelToCoordinateTransform_, pixel, precision);
    }

    /**
     * 地理坐标转像素坐标
     */
    getPixelFromCoordinate(coordinate) {
        return Coordinate.transform2D(this.coordinateToPixelTransform_, coordinate, false);
    }

    /**
     * 屏幕像素转变转地理坐标参数计算
     */
    calculateMatrices2D(frameState) {
        Transform.compose(this.coordinateToPixelTransform_,
            frameState.size.width / 2,
            frameState.size.height / 2,
            1 / frameState.resolution,
            (this.originAtLeftTop === true ? 1 : -1) / frameState.resolution, 0,
            -frameState.center[0],
            -frameState.center[1]);
        Transform.invert(Transform.setFromArray(this.pixelToCoordinateTransform_, this.coordinateToPixelTransform_));
    }

    /**
     * 在控制台显示所有图层信息
     */
    printLayers() {
        let layerCount = 0;
        let nodeCount = 0;
        console.info("current graph name:%s", this.name);
        for (let i = 0, ii = this.layers.length; i < ii; i++) {
            let layer = this.layers[i];
            console.info("id:%s, name:%s, order:%d, nodeNum:%d", layer.getId(), layer.getName(), layer.getZIndex(), layer.getSource().getData().length, layer.getLayerState());
            layerCount += 1;
            nodeCount += layer.getSource().getData().length;
        }
        return Object.assign({ layerCount, nodeCount }, this.getFrameState());
    }
}

export default Graph;
