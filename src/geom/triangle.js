import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Transform from "../spatial/transform.js";

/**
 * 等腰三角形
 * @extends Geometry
 */
class Triangle extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x1,y1],[x2,y2]]   对角两点坐标
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rotation"]);

        // 类型
        this.type = GGeometryType.TRIANGLE;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;
    }

    /**
     * 转换为屏幕坐标
     * 当对象既包含了x,y属性又包含了coords属性时，x, y, width, height 属性优先于 coords属性
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("矩形坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
            }

            // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
            // setCoord时更新对象几何属性
            // if (Array.isArray(this.coords) && this.coords.length > 1) {
            //     // x, y
            //     [this.x, this.y] = this.coords[0];
            //     // width, height
            //     this.width = this.coords[1][0] - this.coords[0][0];
            //     this.height = this.coords[1][1] - this.coords[0][1];
            // }
        }
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
        let pixels = this.getCoord();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);
        let coord1 = [pixels[0][0] + width / 2, pixels[0][1]];
        let coord2 = [pixels[0][0], pixels[0][1] + height];
        let coord3 = [pixels[0][0] + width, pixels[0][1] + height];
        return [[coord1, coord2, coord3, coord1]];
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let width = Math.abs(objCoords[1][0] - objCoords[0][0]);
        let height = Math.abs(objCoords[1][1] - objCoords[0][1]);
        let coord1 = [objCoords[0][0] + width / 2, objCoords[0][1]];
        let coord2 = [objCoords[0][0], objCoords[0][1] + height];
        let coord3 = [objCoords[0][0] + width, objCoords[0][1] + height];
        return Collide.pointPoly({ "x": point[0], "y": point[1] }, [coord1, coord2, coord3, coord1]);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Triangle(this);
    }

    /**
     * 三角形的矩阵变换，除了坐标的变换，还需对Size或宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制三角形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转(旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 绘制三角形
        let coord1 = [pixels[0][0] + width / 2, pixels[0][1]];
        let coord2 = [pixels[0][0], pixels[0][1] + height];
        let coord3 = [pixels[0][0] + width, pixels[0][1] + height];

        ctx.beginPath()
        this.drawPolyline(ctx, [coord1, coord2, coord3, coord1]);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }
}

export default Triangle;
