import RendererBase from "./base.js";
import ClassUtil from "../util/class.js";

/**
 * 图层渲染类
 */
class LayerRenderer extends RendererBase {
    constructor() {
        super();
        this.layer = null;       
    }

    /**
     * 取图层
     */
    getLayer() {
        return this.layer;
    }

    /**
     * 设置图层
     * 初始化Layer对象时，将会调用此方法
     */
    setLayer(layer) {
        this.layer = layer;
    }

    /**
     * 渲染图形，各子类需重写此方法
     */
    composeBuffer(frameState) {
        ClassUtil.abstract();
    }
}

/**
 * 图层渲染状态
 */
export const LayerRendererState = {
    IDLE: 0,
    RENDERING: 1,
    RENDERED: 2,
    ERROR: 3,
    EMPTY: 4,
    ABORT: 5
};

export default LayerRenderer;
