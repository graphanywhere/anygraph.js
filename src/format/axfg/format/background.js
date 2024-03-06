import AxfgFormat from "../format.js";
import simplify from "../../../spatial/simplify.js";

/**
 * 背景地图数据格式化
 */
class AxfgBackgroundFormat extends AxfgFormat {
    constructor(options = {}) {
        super(options);

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = true;

        /**
         * 网格的字体大小改为屏幕相关
         */
        this.textDynamicStyle = function (obj, style, frameState) {
            if (frameState.dist > 10000) {
                if (style.fontSize > 16) {
                    style.fontSize = 16;
                }
            } else if (frameState.dist > 5000) {
                if (style.fontSize > 20) {
                    style.fontSize = 20;
                }
            } else {
                if (style.fontSize > 24) {
                    style.fontSize = 24;
                }
            }
            return true;
        }
    }

    /**
     * 获取样式，对背景地图中的多边形和多线进行简化处理
     * @param {Array} coords 
     * @param {String} type 
     * @returns Array 坐标值
     */
    getCoords(coords, type, properties) {
        let newCoords = (coords == null ? [] : coords);
        let tolerance = 1;
        if (type == "MultiLineString") {
            for (let i = 0, ii = coords.length; i < ii; i++) {
                if (coords[i].length > 2) {
                    // 对线和面进行简化
                    newCoords[i] = simplify(coords[i], tolerance);
                }
            }
        } else if (type == "MultiPolygon") {
            for (let i = 0, ii = coords.length; i < ii; i++) {
                if (coords[i].length > 2) {
                    // 对线和面进行简化
                    let newCoord = simplify(coords[i], tolerance);
                    while (newCoord.length < 3) {
                        tolerance = tolerance / 2;
                        newCoord = simplify(coords[i], tolerance);
                    }
                    newCoords[i] = newCoord;
                }
            }
        } 
        return newCoords;
    }
}

export default AxfgBackgroundFormat;
