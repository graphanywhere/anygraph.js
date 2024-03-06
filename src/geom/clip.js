import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";

/**
 * 裁切对象
 * @extends Geometry
 */
class Clip extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.CLIP;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);
    }

    /**
     * 设置样式
     * @param {*} style 
     */
    setStyle(style) {
        this.style = Object.assign({}, style, { "lineWidth": 0, "allowStyleScale": false });
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POLYGON;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return [[[coord[0][0], coord[0][1]], [coord[0][0], coord[1][1]], [coord[1][0], coord[1][1]], [coord[1][0], coord[0][1]], [coord[0][0], coord[0][1]]]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} coord 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(coord, useCoord = true) {
        return false;
    }

    /**
     * 克隆对象
     * @returns Clip
     */
    clone() {
        return new Clip(this);
    }

    /**
     * 绘制矩形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // ctx.save();
        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 设置样式
        // this.setContextStyle(ctx, style);
        // 计算矩形属性
        let pixels = this.getPixel();
        ctx.beginPath();
        ctx.moveTo(pixels[0][0], pixels[0][1]);
        ctx.lineTo(pixels[1][0], pixels[0][1]);
        ctx.lineTo(pixels[1][0], pixels[1][1]);
        ctx.lineTo(pixels[0][0], pixels[1][1]);
        ctx.closePath();
        // ctx.stroke();
        ctx.clip();
        // ctx.restore();
    }
}

export default Clip;
