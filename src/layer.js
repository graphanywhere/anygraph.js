import LayerRenderer from "./renderer/layer.js";
import VectorRenderer from "./renderer/vector.js";
import VectorSource from "./source/vector.js";
import Extent from "./spatial/extent.js";
import EventTarget from "./basetype/event.target.js";
import ClassUtil from "./util/class.js";
import { getLayerId } from "./global.js";

/**
 * 齿轮箱图层基类Layer类
 * @description 说明：zIndex越大越在上层
 */
class Layer extends EventTarget {
    /**
     * 构造函数
     * @param {Object} options 图层选项{source, renderer, zIndex, name, visible, style, maxResolution, minResolution, opacity, usePixelCoord, useTransform}
     */
    constructor(options = {}) {
        super();
        ClassUtil.assert(options.source != null, "source 不能为空");
        /**
         * 数据源，负责存储接收GearBox传过来的点线面等数据
         */
        this.source = options.source;
        this.source.setLayer(this);

        // ClassUtil.assert(options.renderer != null, "renderer 不能为空");
        /**
         * 渲染对象，负责将source中的点线面等数据在Canvas中渲染出来
         */
        this.renderer = (options.renderer == null ? (options.source instanceof VectorSource ? new VectorRenderer() : new LayerRenderer()) : options.renderer);
        this.renderer.setLayer(this);

        /**
         * 缺省图层渲染样式
         * 通常情况下对象的样式优先于图层的样式，如果图层的样式中包含了prior属性，则图层的样式优先于对象的样式
         * 图层样式包含的属性比较多，参见 style.js 文件中的说明
         * @private
         */
        this.style_ = Object.assign({ "layerPrior": false }, options.style);  // fillColor: "none", 

        // 渲染顺序，越小越早渲染
        this.zIndex_ = (options.zIndex == undefined || options.zIndex == null ? getLayerId() : options.zIndex);

        // 图层ID
        this.layerId_ = (options.id == undefined || options.id == null ? this.zIndex_ : options.id);

        // 图层名称
        this.layerName_ = (options.name == undefined || options.name == null ? "<空>" : options.name);

        // 是否显示该图层
        this.visible_ = (options.visible === false ? false : true);

        // 最大分辨率
        this.maxResolution_ = (options.maxResolution == undefined || options.maxResolution == null ? Infinity : options.maxResolution);

        // 最小分辨率
        this.minResolution_ = (options.minResolution == undefined || options.minResolution == null ? 0 : options.minResolution);

        // 最大高程
        this.maxDistinct_ = (options.maxDistinct == undefined || options.maxDistinct == null ? Infinity : options.maxDistinct);

        // 最小高程
        this.minDistinct_ = (options.minDistinct == undefined || options.minDistinct == null ? 0 : options.minDistinct);

        // 透明度
        this.opacity_ = (options.opacity == undefined || options.opacity == null ? 1 : options.opacity);

        // 是否使用矩阵变换坐标
        this.useTransform_ = (options.useTransform == undefined || options.useTransform == null ? false : options.useTransform);

        // 是否使用像素坐标
        this.usePixelCoord_ = (options.usePixelCoord == undefined || options.usePixelCoord == null ? false : options.usePixelCoord);

        // 图层属性
        this.type = options.type || "data";

        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;

        // 图层状态，包括 图层名称、zIndex、最大分辨率，最小分辨率，透明度、是否可见等属性
        this.state_ = {
            layer: (this)
        };
    }

    /**
     * 是否使用矩阵变换实现交互操作
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
     * 是否使用像素作为坐标
     * @returns Boolean
     */
    isUsePixelCoord() {
        return this.usePixelCoord_;
    }

    /**
     * 获取图层数据源
     */
    getSource() {
        return this.source;
    }

    /**
     * 获取取图层渲染器
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * 设置图形对象
     */
    setGraph(graph) {
        this.graph = graph;
    }

    /**
     * 取图形对象
     */
    getGraph() {
        return this.graph;
    }

    /**
     * 取图层ID
     * @returns 图层名称
     */
    getId() {
        return this.layerId_;
    }

    /**
     * 取图层名称
     * @returns 图层名称
     */
    getName() {
        return this.layerName_;
    }

    getFullName() {
        return this.layerId_ + "-" + this.layerName_;
    }

    /**
     * 设置渲染次序
     */
    getZIndex() {
        return this.zIndex_;
    }

    /**
     * 获取图层渲染样式
     * @returns style
     */
    getStyle() {
        return this.style_;
    }

    /**
     * 设置图层渲染样式
     * @param {Object} style {color, fillColor, lineWidth, dynamic}
     */
    setStyle(style) {
        this.style_ = style;
    }

    /**
     * 是否显示该图层
     * @returns boolean
     */
    isVisible() {
        return this.visible_;
    }

    /**
     * 设置是否显示
     * @param {Boolean} visible
     */
    setVisible(visible) {
        this.visible_ = visible
    }

    /**
     * 获取图层透明度 (between 0 and 1).
     */
    getOpacity() {
        return (this.opacity_);
    }

    /**
     * 设置透明度, 0 to 1.
     */
    setOpacity(opacity) {
        this.opacity_ = opacity;
    }

    /**
     * 获取最大分辨率值
     */
    getMaxResolution() {
        return (this.maxResolution_);
    }

    /**
     * 获取最小分辨率值
     */
    getMinResolution() {
        return (this.minResolution_);
    }

    /**
     * 设置渲染该图层的最大分辨率值
     */
    setMaxResolution(maxResolution) {
        this.maxResolution_ = maxResolution;
    }

    /**
     * 设置渲染该图层的最小分辨率值
     */
    setMinResolution(minResolution) {
        this.minResolution_ = minResolution;
    }

    /**
     * 获取最大高程值
     */
    getMaxDistinct() {
        return (this.maxDistinct_);
    }

    /**
     * 获取最小高程值
     */
    getMinDistinct() {
        return (this.minDistinct_);
    }

    /**
     * 根据resolution判断图层是否可见
     */
    visibleAtResolution() {
        let resolution = this.getGraph().getView().getResolution();
        return this.visible_ && resolution >= this.minResolution_ && resolution < this.maxResolution_;
    }

    /**
     * 根据distinct判断图层是否可见
     */
    visibleAtDistinct() {
        let width = Extent.getWidth(this.getGraph().getExtent()) * Math.sqrt(3);
        return this.visible_ && width >= this.minDistinct_ && width < this.maxDistinct_;
    }

    getOffset() {
        return { "x": this.offsetX, "y": this.offsetY };
    }

    setOffset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
    }

    /**
     * 是否为辅助层
     */
    isAuxLayer() {
        return this.type === "aux" ? true : false;
    }

    /**
     * 获取图层属性
     * @returns Object
     */
    getLayerState() {
        this.state_.opacity = this.getOpacity();
        this.state_.visible = this.isVisible();
        this.state_.zIndex = this.getZIndex();
        this.state_.maxResolution = this.getMaxResolution();
        this.state_.minResolution = Math.max(this.getMinResolution(), 0);
        this.state_.maxDistinct = this.getMaxDistinct()
        this.state_.minDistinct = Math.max(this.getMinDistinct(), 0);
        return this.state_;
    };
}

export default Layer;
