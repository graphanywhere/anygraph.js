import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Transform from "../spatial/transform.js";
import { LOG_LEVEL } from "../global.js";

/**
 * 图形对象类型
 * @extends Geometry
 */
class Image extends Geometry {
    /**
     * 构造函数
     * @param {Coord} coords 
     * @param {Object} style 两角坐标, 其格式为[[x1,y1],[x2,y2]]
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["src", "x", "y", "width", "height", "sx", "sy", "sWidth", "sHeight", "rotation", "originX", "originY", "uid"]);

        // 类型
        this.type = GGeometryType.IMAGE;

        // 几何类型
        this.shapeType = GGShapeType.IMAGE;

        // 初始化
        this.initialize(options);

        // 唯一ID，如果包含了this.uid属性，则该值为唯一ID，否则为this.src
        this.uid = (this.uid == null ? (this.src == null ? (Date.now() + "_" + Math.random() * 10000) : this.src) : this.uid);

        // 图片路径
        this.src;

        // 坐标
        this.x;
        this.y;

        // width, height
        this.width = this.width || 0;
        this.height = this.height || 0;

        // sx, sy, sWidth, sHeight
        this.sx = this.sx || 0;
        this.sy = this.sy || 0;
        this.sWidth = this.sWidth || 0;
        this.sHeight = this.sHeight || 0;

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
    }

    /**
     * 转换为屏幕坐标
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
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                if (this.width > 0 && this.height > 0) {
                    this.coords.push([this.x + this.width, this.y + this.height]);
                }
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                throw new Error("坐标格式错误");
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
        // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     if (this.coords.length > 1) {
        //         // width, height
        //         this.width = this.coords[1][0] - this.coords[0][0];
        //         this.height = this.coords[1][1] - this.coords[0][1];
        //     }
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
        try {
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            let width = Math.abs(objCoords[1][0] - objCoords[0][0]);
            let height = Math.abs(objCoords[1][1] - objCoords[0][1]);
            let rect = [objCoords[0][0], objCoords[0][1], width, height];
            return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": rect[0], "y": rect[1], "width": rect[2], "height": rect[3] });
        } catch (e) {
            return false;
        }
    }

    /**
     * 克隆对象
     * @returns Image
     */
    clone() {
        return new Image(this);
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

        // 渲染时旋转
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
        let that = this;

        // 计算矩形属性
        let pixels = this.getPixel();
        let width = Math.abs(pixels[1][0] - pixels[0][0]);
        let height = Math.abs(pixels[1][1] - pixels[0][1]);
        if (width == null) {
            width = this.width != null ? this.width : 0;
        }
        if (height == null) {
            height = this.height != null ? this.height : 0;
        }

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 设置样式
        this.setContextStyle(ctx, style);

        // 图像专有样式
        // 设置图像平滑度
        if (style.imageSmoothingQuality == "low" || style.imageSmoothingQuality == "medium" || style.imageSmoothingQuality == "high") {
            ctx.imageSmoothingQuality = style.imageSmoothingQuality;
        }
        // 设置图片是否平滑
        if (style.imageSmoothingEnabled === false) {
            ctx.imageSmoothingEnabled = false;
        }

        // 第一个回调是当位图已经load完成的时候的回调，第二个则位图当时还未load完成，异步加载之后的loaded回调；
        // 考虑到还有其他shape渲染在位图之上，因此需要重新渲染整个图层
        frameState.getLayer().getSource().loadImage(this.src, function (obj) {
            if (width > 0 && height > 0) {
                ctx.drawImage(obj, pixels[0][0], pixels[0][1], width, height);
                if (LOG_LEVEL > 5) console.info("ctx.drawImage(image, %d, %d, %d, %d)", pixels[0][0], pixels[0][1], width, height);
            } else {
                ctx.drawImage(obj, pixels[0][0], pixels[0][1]);
                if (LOG_LEVEL > 5) console.info("ctx.drawImage(image, %d, %d)", pixels[0][0], pixels[0][1]);
                that.width = obj.width;
                that.height = obj.height;
                that.setCoord();
            }
        }, function () {
            frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
        });
        ctx.restore();
    }

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        ctx.save();

        // 计算矩形属性
        let pixels = this.getPixel();
        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
            }
        }

        // 绘制着色框
        let bbox = this.getBBox(false);
        if (style.fillColor != null && style.fillColor != "none") {
            style.fillStyle = 1;
        }
        ctx.beginPath();
        ctx.rect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);
        ctx.restore();
    }
}

export default Image;
