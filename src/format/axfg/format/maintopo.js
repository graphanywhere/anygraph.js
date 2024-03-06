import AxfgFormat from "../format.js";

/**
 * 精准拓扑电系图格式化
 */
class AxfgMainTopoFormat extends AxfgFormat {
    constructor(options = {}) {
        super(options);

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = true;

        /**
         * 图层动态样式，5万米以上的高度，不显示文本
         * @param {Layer} layer 
         * @param {Object} frameState 
         * @returns Boolean
         */
        this.layerDynamicStyle = function(layer, frameState) {
            if(frameState.dist > 50000 && layer.getName().indexOf("/mark") > 0) {
                return false;
            } else {
                return true;
            }
        }
    }

    /**
     * 获取样式，对变电站概貌进行特殊处理
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object 样式对象
     */
    getStyle(properties, type) {
        let style = super.getStyle(properties, type);

        // 当notetype为变电站时，符号将以概貌形式呈现
        let overView = properties.nodeType === 12583430 ? true : false;
        let overViewMaxDist = 20000;
        let overViewSize = 6;
        if (overView === true) {
            Object.assign(style, { overView, overViewMaxDist, overViewSize });
        }
        return style;
    }
}

export default AxfgMainTopoFormat;
