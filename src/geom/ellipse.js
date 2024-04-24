import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import { circle2LineRing } from "./polygon.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Extent from "../spatial/extent.js";
import Transform from "../spatial/transform.js";
import MathUtil from "../util/math.js";
import { LOG_LEVEL } from "../global.js";

/**
 * 椭圆对象类型
 * @extends Geometry
 */
class Ellipse extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "radiusX", "radiusY", "rotation", "startAngle", "endAngle", "anticlockwise"]);

        // 类型
        this.type = GGeometryType.ELLIPSE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x = this.x || 0;
        this.y = this.y || 0;

        // 半径
        this.radiusX = this.radiusX || 0;
        this.radiusY = this.radiusY || this.radiusX;

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 起止角度
        this.startAngle = this.startAngle || 0;
        this.endAngle = this.endAngle || 360;

        // 是否逆时针方向绘制
        this.anticlockwise = (this.anticlockwise == null ? false : this.anticlockwise === true);

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.radiusX, this.y + this.radiusY]];
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.radiusX, this.y + this.radiusY]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标值
     * @param {Array} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.radiusX, this.y + this.radiusY]);
            }
        } else if (coords.length === 4) {
            this.coords.push([coords[0], coords[1]]);
            this.coords.push([coords[0] + coords[2], coords[1] + coords[3]]);
        } else if (coords.length === 2 && Array.isArray(coords[0]) && Array.isArray(coords[1])) {
            this.coords = coords.slice();
        } else {
            throw new Error("椭圆的坐标格式错误");
        }

        // 以下代码在执行旋转操作后调用本方法时会造成rx和ry的值受到影响，导致变形
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 1) {
        //     // x, y
        //     [this.x, this.y] = this.coords[0];
        //     // rx, ry
        //     this.radiusX = this.coords[1][0] - this.coords[0][0];
        //     this.radiusY = this.coords[1][1] - this.coords[0][1];
        // }

        this.pixel = this.coords.slice();
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
        let coords = this.getCoord();
        return circle2LineRing(coords[0], Math.abs(coords[1][0] - coords[0][0]), 32);
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let rx = Math.abs(coords[1][0] - coords[0][0]),
            ry = Math.abs(coords[1][1] - coords[0][1]);
        let extent = [coords[0][0] - rx, coords[0][1] - ry, coords[0][0] + rx, coords[0][1] + ry];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let rx = Math.abs(coords[1][0] - coords[0][0]),
            ry = Math.abs(coords[1][1] - coords[0][1]);
        let extent = [coords[0][0] - rx, coords[0][1] - ry, coords[0][0] + rx, coords[0][1] + ry];
        return extent;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            return Collide.pointEllipse({ "x": point[0], "y": point[1] },
                { "x": objCoords[0][0], "y": objCoords[0][1], "radiusX": (objCoords[1][0] - objCoords[0][0]), "radiusY": (objCoords[1][1] - objCoords[0][1]) });
        } else {
            return false;
        }
    }
    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Ellipse(this);
    }

    /**
     * 椭圆的矩阵变换，除了坐标的变换，还需进行半径大小的缩放 （coords[1]为半径大小，在矩阵变换之后，需重新计算该值）
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);
        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换rx, ry
        this.radiusX = this.radiusX * transResult.scale[0];
        this.radiusY = this.radiusY * transResult.scale[1];
        this.coords[1][0] = this.coords[0][0] + this.radiusX;
        this.coords[1][1] = this.coords[0][1] + this.radiusY;

        // 渲染时旋转
        this.rotation = this.rotation > 0 ? [this.rotation + transResult.angle] : transResult.angle;
    }

    /**
     * 绘制椭圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式{color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 指定路径
        ctx.beginPath();
        if (LOG_LEVEL > 5) console.info("ctx.beginPath()");
        this.drawEllipse(ctx, style);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
        ctx.restore();
    }

    /**
     * 绘制椭圆
     */
    drawEllipse(ctx, style) {
        let pixel = this.getPixel();
        let [x, y, rx, ry] = [pixel[0][0], pixel[0][1], Math.abs(pixel[1][0] - pixel[0][0]), Math.abs(pixel[1][1] - pixel[0][1])];

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // ellipse
        ctx.ellipse(x, y, rx, ry,
            MathUtil.toRadians(this.rotation),
            MathUtil.toRadians(this.startAngle),
            MathUtil.toRadians(this.endAngle),
            this.anticlockwise);
        if (LOG_LEVEL > 5) console.info("ctx.ellipse(%d, %d, %d, %d, %f, %f, %f, %s)", x, y, rx, ry,
            MathUtil.toRadians(this.rotation),
            MathUtil.toRadians(this.startAngle),
            MathUtil.toRadians(this.endAngle),
            this.anticlockwise);

        // // 使用圆+画板变形的方式绘制椭圆
        //ctx.transform(1, 0, 0, ry / rx, 0, 0);
        //ctx.arc(x, y, rx, startAngle, endAngle, !clockwise);
    }
}

export default Ellipse;
