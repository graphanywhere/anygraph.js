import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Transform from "../spatial/transform.js";

/**
 * 矩形对象类型
 * @extends Geometry
 */
class Rect extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rx", "ry", "rotation", "originX", "originY"]);

        // 类型
        this.type = GGeometryType.RECT;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

         // 坐标
        this.x = this.x || 0;
        this.y = this.y || 0;

        // 宽和高
        this.width = this.width || 60;
        this.height = this.height || 30;
        
        // 初始化
        this.initialize(options);


        // 圆角矩形半径
        this.rx = this.rx || 0;
        this.ry = this.ry || this.rx;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height], [this.x + this.rx, this.y + this.ry]];
    }

    /**
     * 转换为屏幕坐标
     * 当对象既包含了x,y属性又包含了coords属性时，x, y, width, height 属性优先于 coords属性
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        if (this.rx > 0 || this.ry > 0) {
            coords.push([this.x + this.rx, this.y + this.ry])
        }
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
                this.coords.push([this.x + this.rx, this.y + this.ry]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0] + this.width, coords[1] + this.height];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else if (coords.length === 3) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1]) && Array.isArray(coords[2])) {
                    this.coords = coords.slice();   // 圆角矩形
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
                // if (coords.length === 4) 
                // this.coords[0] = [coords[0], coords[1]];
                // this.coords[1] = [coords[0] + coords[2], coords[1] + coords[3]];
            }

            // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致矩形变形
            // // setCoord时更新对象几何属性
            // if (Array.isArray(this.coords) && this.coords.length > 1) {
            //     // x, y
            //     [this.x, this.y] = this.coords[0];

            //     // width, height
            //     this.width = this.coords[1][0] - this.coords[0][0];
            //     this.height = this.coords[1][1] - this.coords[0][1];
            //     // rx, ry
            //     this.rx = (this.coords.length === 3 ? this.coords[2][0] - this.coords[0][0] : 0);
            //     this.ry = (this.coords.length === 3 ? this.coords[2][1] - this.coords[0][1] : 0);
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
        let coord = this.getCoord();
        return [[[coord[0][0], coord[0][1]], [coord[0][0], coord[1][1]], [coord[1][0], coord[1][1]], [coord[1][0], coord[0][1]], [coord[0][0], coord[0][1]]]];
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
        let rect = [objCoords[0][0], objCoords[0][1], width, height];
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": rect[0], "y": rect[1], "width": rect[2], "height": rect[3] });
    }

    /**
     * 克隆对象
     * @returns Rect
     */
    clone() {
        return new Rect(this);
    }

    /**
     * 矩形的的矩阵变换，除了坐标的变换，还需对宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 处理圆角矩形
        if (this.rx > 0 || this.ry > 0) {
            this.rx = this.rx * transResult.scale[0];
            this.ry = this.ry * transResult.scale[1];
        }

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制矩形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor, lineWidth, angle}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 计算矩形属性
        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转(矩形旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 不提供自旋转功能（之前的功能会导致渐变功能错误） 2023.9.9
        if (pixels.length > 2) {
            // 圆角矩形
            let rx = pixels[2][0] - pixels[0][0];
            let ry = pixels[2][1] - pixels[0][1];
            this.roundRect(ctx, pixels[0][0], pixels[0][1], width, height, Math.max(rx, ry));
        } else {
            ctx.beginPath()
            this.drawPolyline(ctx, [pixels[0], [pixels[1][0], pixels[0][1]], pixels[1], [pixels[0][0], pixels[1][1]]], true);
        }

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }

    /**
     * 绘制圆角矩形
     * https://blog.csdn.net/weixin_44953227/article/details/111561677
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} w 
     * @param {Number} h 
     * @param {Number} r 
     */
    roundRect(ctx, x, y, w, h, r) {
        if (w < 2 * r) { r = w / 2; }
        if (h < 2 * r) { r = h / 2; }
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

export default Rect;
