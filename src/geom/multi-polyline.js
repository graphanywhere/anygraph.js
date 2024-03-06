import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Extent from "../spatial/extent.js";

/**
 * 折线对象-数据类型
 * @extends Geometry
 */
class MultiPolyline extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords       // 坐标, 其格式为[[[x,y],[x,y],……],[[x,y],[x,y],……]]
     * @param {Object} style 
     * @param {Object} properties 
     */
    //constructor(coords = [], style, properties = {}) {
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.POLYLINE;

        // 几何类型
        this.shapeType = GGShapeType.LINE;

        // 初始化
        this.initialize(options);
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.MULTI_LINE;
    }

    addLine(line, style) {
        this.coords.push(line.getCoord());
        this.pixel.push(line.pixel);

        let lineStyle = Object.assign({}, style);
        for (let k in lineStyle) {
            if (lineStyle[k] == null) {
                delete lineStyle[k];
            }
        }
        Object.assign(this.style, lineStyle);
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let x = 0, xx = coords.length; x < xx; x++) {
            for (let i = 0, ii = coords[x].length; i < ii; ++i) {
                if (coords[x][i][0] < extent[0]) { extent[0] = coords[x][i][0]; }
                if (coords[x][i][1] < extent[1]) { extent[1] = coords[x][i][1]; }
                if (coords[x][i][0] > extent[2]) { extent[2] = coords[x][i][0]; }
                if (coords[x][i][1] > extent[3]) { extent[3] = coords[x][i][1]; }
            }
        }

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
  * 返回对象边界
  * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
  * @returns {Extent} extent
  */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let x = 0, xx = coords.length; x < xx; x++) {
            for (let i = 0, ii = coords[x].length; i < ii; ++i) {
                if (coords[x][i][0] < extent[0]) { extent[0] = coords[x][i][0]; }
                if (coords[x][i][1] < extent[1]) { extent[1] = coords[x][i][1]; }
                if (coords[x][i][0] > extent[2]) { extent[2] = coords[x][i][0]; }
                if (coords[x][i][1] > extent[3]) { extent[3] = coords[x][i][1]; }
            }
        }
        return extent;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Point} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        let bool = false;
        for (let x = 0, xx = coords.length; x < xx; x++) {
            let objCoords = coords[x];
            for (let i = 0, ii = objCoords.length; i < ii - 1; i++) {
                if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[i][0], "y1": objCoords[i][1], "x2": objCoords[i + 1][0], "y2": objCoords[i + 1][1] }, (useCoord ? 0.5 : 2))) {
                    bool = true;
                    break;
                }
            }
            if (bool === true) break;
        }
        return bool;
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new MultiPolyline(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth, dash, dashOffset, startArrowSize, endArrowSize}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();
        let pixels = this.getPixel();

        if (pixels != null && pixels.length > 0) {
            // 画板变换
            this.renderTransform(ctx, style.transData);
            // 绘制
            this.drawMultiPolyline(ctx, pixels, style);

            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);
        }

        ctx.restore();
    }

    drawMultiPolyline(ctx, pixels, style) {
        ctx.beginPath();
        for (let x = 0, xx = pixels.length; x < xx; x++) {
            let cpixels = pixels[x];
            if (cpixels == null) { continue; }
            for (let i = 0, ii = cpixels.length; i < ii; i++) {
                let pixel = cpixels[i];
                if (pixel == null) {
                    continue;
                }
                if (i == 0) {
                    ctx.moveTo(pixel[0], pixel[1]);
                } else {
                    ctx.lineTo(pixel[0], pixel[1]);
                }
            }
        }
    }
}

export default MultiPolyline;
