import RendererBase from "./base.js";
import DynamicTransform from "../spatial/projectionEx.js"
import Counter from "../util/counter.js";
import Filter from "../style/filter.js";
import { LOG_LEVEL } from "../global.js";
import { Color } from "../style/index.js";

/**
 * 图形对象渲染类
 */
class GraphRenderer extends RendererBase {
    constructor(graph, options) {
        super();

        /**
         * 图形对象
         */
        this.graph_ = graph;

        /**
         * 实际画板，对应界面中显示的画板对象
         */
        this.mainCanvas = null;

        /**
         * 计数器
         */
        this.counter = new Counter("GraphRenderer");

        /**
         * 滤镜名称
         */
        this.filterName = options.filter;
        this.filterOptions = options.filterOptions;
    }

    /**
     * 获取图形对象
     */
    getGraph() {
        return this.graph_;
    }

    /**
     * 获取视图尺寸
     */
    getSize() {
        let width = this.mainCanvas.width;
        let height = this.mainCanvas.height
        return { width, height };
    }

    /**
     * 获取主画板对象
     */
    getMainCanvas() {
        return this.mainCanvas;
    }

    setMainCanvas(canvas) {
        this.mainCanvas = canvas;
    }

    /**
     * 数据渲染前的准备
     */
    prepareFrame() {
        // 初始化图形画板
        this.initCanvas(this.getSize());

        // 初始化各图层画板
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            let layerRenderer = layers[i].getRenderer();
            layerRenderer.initCanvas(this.getSize());
        }
    }

    /**
     * 合成Graph图形
     * @return 执行时间
     */
    composeBuffer(frameState) {
        let beginTime = Date.now();
        let nodeNum = 0;

        // 修订动态投影参数
        if (frameState.dynamicProjection === true) {
            DynamicTransform.resetParaForExtent(frameState.extent);
        }

        // 清空上一次界面中的geomList
        if (frameState.viewGeomList != null && frameState.viewGeomList.size > 0) {
            frameState.viewGeomList.clear(); // = new Map();	
        }

        // 逐个图层合成图形
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].getVisible() && layers[i].visibleAtResolution() && layers[i].visibleAtDistinct()) {
                let goon = true;
                // 动态样式
                let style = layers[i].getStyle();
                if (typeof (style.dynamic) === "function") {
                    goon = style.dynamic(layers[i], frameState);
                }
                if (goon || goon == null) {
                    let layerRenderer = layers[i].getRenderer();
                    let layerBeginTime = Date.now();
                    nodeNum += layerRenderer.composeBuffer(Object.assign({}, frameState, {
                        "getLayer": function () {
                            return layers[i];
                        }
                    }));
                    this.counter.add("name:" + layers[i].getFullName(), (Date.now() - layerBeginTime));
                }
            }
        }

        // 计算执行时间
        let execTime = (Date.now() - beginTime);
        if (LOG_LEVEL > 2 || execTime > 200) {
            console.debug("execute GraphRenderer.composeBuffer(), time:%dms, nodeNum:%d", execTime, nodeNum);
        }
        return execTime;
    }

    /**
     * 合并各图层图形，先将各个图层合成的图形渲染至工作画板，最后将工作画板的内容渲染至主画板
     * @return 执行时间
     */
    renderFrame() {
        let beginTime = Date.now();

        // 工作画板清屏，设置背景颜色
        let size = this.getSize();
        this._context.clearRect(0, 0, size.width, size.height);
        let bgColor = this.getGraph().getBgColor();
        if (bgColor != null) {
            this._context.fillStyle = bgColor;
            this._context.fillRect(0, 0, this._context.canvas.width, this._context.canvas.height);
        }

        // 将各图层已合成的图形合并至工作画板中, 图层渲染顺序：按照数组顺序排序
        let layers = this.getGraph().getLayers();
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].getVisible() && layers[i].visibleAtResolution() && layers[i].visibleAtDistinct()) {
                let layerRenderer = layers[i].getRenderer();
                //layerRenderer.getImage().toDataURL()  可在控制台中预览该图层
                let opacity = layers[i].getOpacity();
                if (opacity > 1) opacity = 1;
                if (opacity >= 0 && opacity <= 1) {
                    this._context.globalAlpha = opacity;
                }
                this._context.drawImage(layerRenderer.getImage(), 0, 0);

                // 点击拾取层
                if (this._hitContext && layerRenderer.getHitImage() && !layers[i].isAuxLayer()) {
                    this._hitContext.drawImage(layerRenderer.getHitImage(), 0, 0);
                }
                // 清除已渲染的图层，释放内存
                // layerRenderer.clearScreen();
            }
        }

        // 将工作画板中的内容，渲染至mainCanvas
        let ctx = this.mainCanvas.getContext("2d");
        ctx.clearRect(0, 0, size.width, size.height);
        ctx.drawImage(this.getImage(), 0, 0);

        // 滤镜处理
        this.filter(ctx);

        // 计算执行时间
        let execTime = (Date.now() - beginTime);
        if (LOG_LEVEL > 3 && execTime > 5) {
            console.debug("execute GraphRenderer.renderFrame(), time:" + execTime + "ms");
        }
        return execTime;
    }

    /**
     * 滤镜处理
     */
    filter(ctx) {
        if (this.filterName != null) {
            let size = this.getSize();
            let imageData = ctx.getImageData(0, 0, size.width, size.height);
            let filter = Filter.getFilter(this.filterName);
            if (filter != null) {
                filter(imageData, this.filterOptions);
                ctx.putImageData(imageData, 0, 0);
            }
        }
    }

    /**
     * 获取图形中指定位置的颜色值
     * @param {Array} point 
     * @returns color
     */
    getColor(point) {
        if (this._hitContext) {
            let imageData = this._hitContext.getImageData(point[0], point[1], 1, 1);
            if (imageData.data[0] === 0 && imageData.data[1] === 0 && imageData.data[2] === 0 && imageData.data[3] === 0) {
                return null;
            } else {
                return new Color(imageData.data[0], imageData.data[1], imageData.data[2], imageData.data[3]).toHex();
            }
        } else {
            return null;
        }
    }
}

export default GraphRenderer;
