import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import { default as PointSharp } from "../renderer/point.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Extent from "../spatial/extent.js";
import Transform from "../spatial/transform.js";
import { defaultCtrlBorderProp } from "../control/border.js";

// 没有指定大小时该点的直径
let __defaultPointSize = 1;

/**
 * 点对象类型
 * @extends Geometry
 */
class Point extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 点坐标, 其格式为[x,y]或[[x,y],[x+size]]
     * @param {Object} style {}
     * @param {Object} properties 
     */
    constructor(options, attrs) {
        // 简单点{size, pointType}
        // 图标点{src, centerAsOrigin, height, width}

        // 属性初始化
        super(options, attrs || ["x", "y", "rotation", "pointType", "size", "src", "centerAsOrigin", "width", "height"]);

        // 类型
        this.type = GGeometryType.POINT;

        // 几何类型
        this.shapeType = GGShapeType.POINT;

        // 初始化
        this.initialize(options);

        // 点类型
        this.pointType;

        // 图标url，当存在该值时，点类型为图标
        this.src;

        // 坐标点是否位于图标的中心，默认:true
        this.centerAsOrigin = this.centerAsOrigin || true;

        // 坐标
        this.x;
        this.y;
        this.size = (this.size == null ? 0 : this.size);
        this.drawsize = 0; //最近画图时的大小

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // width, height
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 像素坐标初始化
        this.pixel = [[this.x, this.y], [this.x + this.width + this.size, this.y + this.height + this.size]];

        // 控制外框属性
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp, { "ml": { enabled: false }, "mr": { enabled: false }, "mb": { enabled: false }, "mt": { enabled: false } });
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
                this.coords.push([this.x + this.size, this.y + this.size]);
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
                this.coords = coords.slice();
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致异常
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     if (this.coords.length > 1) {
        //         // width, height
        //         this.width = this.coords[1][0] - this.coords[0][0];
        //         this.height = this.coords[1][1] - this.coords[0][1];
        //         this.size = Math.max(this.width, this.height);
        //     }
        // }

        this.pixel = this.coords.slice();
    }

    /**
     * 设置点尺寸
     * @param {*} size 
     */
    setSize(size) {
        this.size = size;
        this.width = this.height = Math.abs(size);
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.POINT;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return this.coords.slice();
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        let coords;
        if (this.width > 0 && this.height > 0) {
            coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        } else {
            coords = [[this.x, this.y], [this.x + this.size, this.y + this.size]];
        }
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let size = Math.abs(coords[1][0] - coords[0][0]) / 2;
        let extent = [coords[0][0] - size, coords[0][1] - size, coords[0][0] + size, coords[0][1] + size];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        if (this.src != null) {
            if (this.centerAsOrigin === true) {
                if (this.width <= 0)
                    return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] - this.drawsize / 2, "y": objCoords[0][1] - this.drawsize / 2, "width": this.drawsize, "height": this.drawsize });
                else
                    return Collide.pointRect({ "x": point[0], "y": point[1] },
                        { "x": objCoords[0] - this.width / 2, "y": objCoords[1] - this.height / 2, "width": this.width, "height": this.height });
            } else {
                if (this.width <= 0)
                    return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0] - this.drawsize / 2, "y": objCoords[0][1] - this.drawsize, "width": this.drawsize, "height": this.drawsize });
                else
                    return Collide.pointRect({ "x": point[0], "y": point[1] },
                        { "x": objCoords[0] - this.width / 2, "y": objCoords[1] - this.height, "width": this.width, "height": this.height });
            }
        } else {
            let size = Math.abs(Math.max(objCoords[1][0] - objCoords[0][0], objCoords[1][1] - objCoords[0][1]) / 2);
            if (size <= 0)
                size = this.drawsize;
            return Collide.pointCircle({ "x": point[0], "y": point[1] }, { "x": objCoords[0][0], "y": objCoords[0][1], "radius": size });
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Point(this);
    }

    /**
     * 点的的矩阵变换，除了坐标的变换，还需对Size或宽高进行缩放(coords[1]为宽高，在矩阵变换之后，需重新计算该值)
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];
        this.size = this.size * transResult.scale[0];

        // 矩形的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 绘制点
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 样式
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        // 如果样式中包含了imgFileUrl属性，则该点类型为位图类型
        let imageUrl = this.src != null ? this.src : style.imgUrl;
        if (imageUrl != null) {
            // 第一个回调是当位图已经load完成的时候的回调，
            // 第二个则位图当时还未load完成，异步加载之后的loaded回调；
            // 考虑到还有其他shape渲染在位图之上，因此此处需要重新渲染整个图层
            let that = this;
            frameState.getLayer().getSource().loadImage(imageUrl, function (image) {
                that.drawImage(ctx, style, image, frameState);
            }, function () {
                frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
            });
        } else {
            let pixel = this.getPixel();
            let [x, y] = pixel[0];
            let size = Math.max(pixel[1][0] - x, pixel[1][1] - y);

            // 当从外部数据加载数据时（例如geojson），pointType属性可能从style赋值
            let pointType = this.pointType != null ? this.pointType : style.pointType;

            // 注：size = 0 时取样式中的大小或缺省大小
            if (size == 0) {
                //size = (pointType < 3 || pointType > 16 ? __defaultPointSize : __defaultPointSize);
                size = style.size == null ? __defaultPointSize : style.size;
            } else if (size < 0) {
                // 当size为负值时，其像素大小为其size的绝对值大小
                size = Math.abs(this.size);
            } else if (size > 1200) {
                console.warn("point size is too large")
            }
            style.angle = this.rotation;  // 旋转角度

            //根据样式pointType确定点类型
            if (pointType == 1) {
                PointSharp.drawRegularShape(ctx, x, y, 3, size / 2, size / 6, style);
            } else if (pointType == 2) {
                PointSharp.drawRegularShape(ctx, x, y, 4, size / 2, size / 6, style);
            } else if (pointType == 3) {
                PointSharp.drawTriangle(ctx, x, y, size, style);
            } else if (pointType == 4) {
                PointSharp.drawSquare(ctx, x, y, size, style);
            } else if (pointType == 5) {
                PointSharp.drawStar(ctx, x, y, size, style);
            } else if (pointType >= 6 && pointType <= 10) {
                PointSharp.drawRegularPolygon(ctx, x, y, size, pointType, style);
            } else if (pointType == 11) {
                PointSharp.drawFace(ctx, x, y, size, style);
            } else if (pointType == 12) {
                PointSharp.drawSpade(ctx, x, y, size, style);
            } else if (pointType == 13) {
                PointSharp.drawHeart(ctx, x, y, size, style);
            } else if (pointType == 14) {
                PointSharp.drawClub(ctx, x, y, size, style);
            } else if (pointType == 15) {
                PointSharp.drawDiamond(ctx, x, y, size, style);
            } else if (pointType >= 16 && pointType <= 19) {
                PointSharp.drawFlower(ctx, x, y, size, pointType - 12, style);
            } else if (pointType < 0) {
                return;
            } else {
                ctx.save();
                ctx.beginPath();
                let radius = size / 2;
                ctx.arc(x, y, radius, 0, Math.PI * 2, true);
                // 设置样式并渲染出来
                if (style.fillColor != null) style.fillStyle = 1;
                this.setContextStyle(ctx, style);
                this.strokeAndFill(ctx, style);
                ctx.restore();
            }
            this.drawsize = size;

            // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
            // Object.assign(this.style, { "renderWidth": size, "renderHeight": size });
        }
    }

    /**
     * 在Canvas上绘制Image
     */
    drawImage(ctx, style, image) {
        let height = this.height > 0 ? this.height : this.size > 0 ? this.size : image.height;
        let width = this.width > 0 ? this.width : this.size > 0 ? this.size * (image.width / image.height) : image.width;

        // 图标大小
        if (style.scale > 0) {
            width = width * style.scale;
            height = height * style.scale;
        }

        // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
        // Object.assign(this.style, { "renderWidth": width, "renderHeight": height });

        //Object.assign(style, { width, height });
        let pixels = this.getPixel();
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，矩形的旋转需通过画板的旋转来实现
        if (this.rotation != null && this.rotation != 0) {
            this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
        }

        ctx.translate(pixels[0][0], pixels[0][1]);
        if (this.centerAsOrigin === true) {
            // 坐标位置=位图中心点
            ctx.drawImage(image, - width / 2, - height / 2, width, height);
        } else {
            // 坐标位置=位图下边中间
            ctx.drawImage(image, - width / 2, - height, width, height);
        }
        ctx.restore();
        this.drawsize = width;
    }
}

export default Point;
