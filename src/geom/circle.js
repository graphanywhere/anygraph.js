import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Transform from "../spatial/transform.js";
import MathUtil from "../util/math.js";
import { LOG_LEVEL } from "../global.js";
import { circle2LineRing } from "./polygon.js";
import { defaultCtrlBorderProp } from "../control/border.js";
import Extent from "../spatial/extent.js";

/**
 * 圆对象类型
 * @extends Geometry
 */
class Circle extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        //console.info("x="+ options.x + ",y=" + options.y + ",radius=" + options.radius);
        // 属性初始化
        super(options, ["x", "y", "radius", "rotation", "startAngle", "endAngle", "anticlockwise"]);

        // 类型
        this.type = GGeometryType.CIRCLE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x = this.x || 0;;
        this.y = this.y || 0;;

        // 半径
        this.radius = this.radius || 0;

        // 旋转角度（圆弧的属性）
        this.rotation = this.rotation || 0;

        // 起止角度
        this.startAngle = this.startAngle || 0;
        this.endAngle = this.endAngle || 360;

        // 是否逆时针方向绘制
        this.anticlockwise = (this.anticlockwise == null ? false : this.anticlockwise === true);

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.radius, this.y + this.radius]];

        // 控制外框属性
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp, { "ml": { enabled: false }, "mr": { enabled: false }, "mb": { enabled: false }, "mt": { enabled: false } });
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x - this.radius, this.y - this.radius], [this.x + this.radius, this.y + this.radius]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标, 其格式为[x,y,r] 或 [[x,y], [x+r, y+r]]
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x - this.radius, this.y - this.radius]);
                this.coords.push([this.x + this.radius, this.y + this.radius]);
            }
        } else if (coords.length === 2 && Array.isArray(coords[0]) && Array.isArray(coords[1])) {
            this.coords = coords.slice();
        } else {
            throw new Error("坐标格式错误");
        }

        // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 1) {
        //     // radius
        //     this.radius = Math.max(this.coords[1][0] - this.coords[0][0], this.coords[1][1] - this.coords[0][1]) / 2;
        //     // x, y
        //     this.x = this.coords[0][0] + this.radius;
        //     this.y = this.coords[0][1] + this.radius;
        // }

        this.pixel = this.coords.slice();
    }

    getCenter() {
        return [this.x, this.y];
    }

    getRadius() {
        return this.radius;
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
        return circle2LineRing([this.x, this.y], this.radius, 32);
    }

    // /**
    //  * 返回对象边界
    //  * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
    //  * @returns {Extent} extent
    //  */
    // getBBox(useCoord = true) {
    //     let coords = useCoord === false ? this.getPixel() : this.getCoord();
    //     let r = Math.abs(coords[1][0] - coords[0][0]);
    //     let extent = [coords[0][0] - r, coords[0][1] - r, coords[0][0] + r, coords[0][1] + r];

    //     // 计算线宽对bbox的影响
    //     let style = this.getStyle();
    //     let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth/2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
    //     return Extent.buffer(extent, lineWidth);
    // }
    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = [coords[0][0], coords[0][1], coords[1][0], coords[1][1]];
        return extent;
    }


    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let radius = Math.max((objCoords[1][0] - objCoords[0][0]), (objCoords[1][1] - objCoords[0][1])) / 2;
        return Collide.pointCircle({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] + radius, "y": objCoords[0][1] + radius, "radius": radius });
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Circle(this);
    }

    /**
     * 圆的矩阵变换，除了坐标的变换，还需进行半径大小的缩放 （coords[1]为半径大小，在矩阵变换之后，需重新计算该值）
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // radius, x, y
        this.radius = this.radius * transResult.scale[0];
        this.x = this.coords[0][0] + this.radius;
        this.y = this.coords[0][1] + this.radius;

        // 变换rx, ry        
        this.coords[1][0] = this.coords[0][0] + this.radius * 2;
        this.coords[1][1] = this.coords[0][1] + this.radius * 2;
    }

    /**
     * 绘制圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式{color, fillStyle, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // 画板变换
        this.renderTransform(ctx, style);
        // draw
        ctx.save();
        let pixel = this.getPixel();
        let x = (pixel[0][0] + pixel[1][0]) / 2;
        let y = (pixel[0][1] + pixel[1][1]) / 2;
        let radius = (pixel[1][0] - pixel[0][0]) / 2;
        this.drawRound(ctx, x, y, radius, style);
        ctx.restore();
    }

    /**
     * 绘制圆
     */
    drawRound(ctx, x, y, radius, style) {
        if (radius < 1) return;
        // radius = radius - (style.lineWidth == null ? 1 : style.lineWidth);  // 是否要限制当线宽对半径的影响
        ctx.beginPath();
        if (LOG_LEVEL > 5) console.info("ctx.beginPath()");
        radius = radius > 1 ? radius : 1;
        ctx.arc(x, y, radius, MathUtil.toRadians(this.startAngle), MathUtil.toRadians(this.endAngle), this.anticlockwise);
        if (LOG_LEVEL > 5) console.info("ctx.arc(%d, %d, %d, %f, %f, %s)", x, y, radius, MathUtil.toRadians(this.startAngle), MathUtil.toRadians(this.endAngle), this.anticlockwise);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
    }
}

export default Circle;

