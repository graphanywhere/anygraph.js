import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Arrow from "../renderer/arrow.js";
import MathUtil from "../util/math.js";
import Cursor from "../util/cursor.js";
import Measure from "../spatial/measure.js";
import clipSegments from "../spatial/clip.js";
import Coordinate from "../spatial/coordinate.js";
import Extent from "../spatial/extent.js";

/**
 * 折线对象类型
 * @extends Geometry
 */
class Polyline extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x,y],[x,y],……]
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["startArrowType", "startArrowSize", "endArrowType", "endArrowSize"]);

        // 类型
        this.type = GGeometryType.POLYLINE;

        // 几何类型
        this.shapeType = GGShapeType.LINE;

        // 初始化
        this.initialize(options);

        // 旋转角度(°)        
        this.rotation = this.rotation || 0;

        // 箭头样式
        this.startArrowType = this.startArrowType || 0;
        this.startArrowSize;
        this.endArrowType = this.endArrowType || 0;
        this.endArrowSize = this.endArrowSize || this.startArrowSize;
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool);
        let idx = 0;
        let that = this;
        this.ctrlBorderProp = {};
        this.pixel.forEach(point => {
            that.ctrlBorderProp[idx] = { "cmd": 11, "idx": idx, "cursor": Cursor.POINTER, "coord": point.slice() };
            idx++;
        });
    }

    /**
     *  获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return GGGeoJsonType.LINE;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return coord;
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bool = false;

        // 粗略检测：判定点与Bounding Box的碰撞
        let bbox = this.getBBox(useCoord);
        let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
        let num = objCoords.length;
        if (num == 2) { //两点的水平或垂直线段，pointRect会失败。
            if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[0][0], "y1": objCoords[0][1], "x2": objCoords[1][0], "y2": objCoords[1][1] }, (useCoord ? 0.5 : 2)))
                return true;
            else
                return false;
        }
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            for (let i = 0; i < num - 1; i++) {
                if (objCoords[i] == null) {
                    continue;
                }
                if (Collide.pointLine({ "x": point[0], "y": point[1] }, { "x1": objCoords[i][0], "y1": objCoords[i][1], "x2": objCoords[i + 1][0], "y2": objCoords[i + 1][1] }, (useCoord ? 0.5 : 2))) {
                    bool = true;
                    break;
                }
            }
        }
        return bool;
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Polyline(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth, dash, dashOffset}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center, size}
     */
    draw(ctx, style, frameState) {
        ctx.save();
        let pixels = this.getPixel();

        // 画板变换
        this.renderTransform(ctx, style.transData);
        // 旋转，通过旋转画板的来实现对象的旋转
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                let bbox = this.getBBox();
                let anchor = Extent.getCenter(bbox);
                this.renderRotate(ctx, [this.rotation, anchor[0], anchor[1]]);
            }
        }

        // 绘制折线
        if (!(style.lineWidth < 0)) {
            ctx.beginPath()
            this.drawPolyline(ctx, pixels);

            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);

            // 绘制箭头
            if (this.startArrowType > 0) {
                this.drawArrow(ctx, [pixels[pixels.length - 2], pixels[pixels.length - 1]], this.startArrowType, this.startArrowSize);
            }
            if (this.endArrowType > 0) {
                this.drawArrow(ctx, [pixels[1], pixels[0]], this.endArrowType, this.endArrowSize);
            }
        }

        // 绘制动态路名
        if (style.labelStyle != null && this.properties.name != null && this.properties.name.length > 0) {
            _drawDynamicRoadName(ctx, this, style.labelStyle, frameState);
        }
        ctx.restore();
    }

    /**
     * 绘制箭头
     * @param {*} ctx 
     * @param {*} segment 
     * @param {*} arrawType 
     * @param {*} arraySize 
     */
    drawArrow(ctx, segment, arrawType, arraySize) {
        let [x0, y0] = [segment[0][0], segment[0][1]];
        let [x1, y1] = [segment[1][0], segment[1][1]];
        let [w, h] = [x1 - x0, y1 - y0]
        let arrow = new Arrow({ "arrowSize": arraySize });

        // 计算直线与X轴正方形的夹角角度
        let angle;
        if (w >= 0 && h >= 0) {
            angle = MathUtil.toDegrees(Math.atan(h / w));
        } else if (w < 0 && h >= 0) {
            angle = 180 - MathUtil.toDegrees(Math.atan(h / -w));
        } else if (w < 0 && h < 0) {
            angle = MathUtil.toDegrees(Math.atan(h / w)) + 180;
        } else {
            angle = 360 - MathUtil.toDegrees(Math.atan(-h / w));
        }

        switch (arrawType) {
            case 1:   // 实心三角箭头
                arrow.triangleSolid(ctx, { "x": x1, "y": y1, angle });
                break;
            case 2:   // 实心菱形箭头
                arrow.diamondSolid(ctx, { "x": x1, "y": y1, angle });
                break;
            case 9:   // 距离标识
                arrow.lineEnd(ctx, { "x": x1, "y": y1, angle });
                break;
            default:   // 单线箭头
                arrow.line(ctx, { "x": x1, "y": y1, angle });
                break;
        }
    }
}

/**
 * 绘制动态路名
 * @private
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} pixels 
 * @param {Object} labelStyle 
 * @param {Object} frameState 
 */
function _drawDynamicRoadName(ctx, obj, labelStyle = {}, frameState) {
    let s = obj.properties.name.split("");
    if (s.length > 0) {
        let size = frameState.size;
        let pixels = obj.getPixel();
        let bounds = [0, 0, size.width, size.height]; //屏幕宽高
        let style = Object.assign({
            "font": "16px 黑体",
            "fillColor": "black",
            "color": "#CCCCCC",
            "lineWidth": 1,
            "textAlign": "center",
            "textBaseline": "middle"
        }, labelStyle);

        let inpixelsarray = clipSegments(pixels, bounds);
        for (let i = 0; i < inpixelsarray.length; i++) {
            let inpixels = inpixelsarray[i];
            if (inpixels != null && inpixels.length >= 2) {
                let one_ratio = 1.0 / (s.length + 1);
                let length = Measure.getLength(inpixels);
                let textwidth = parseInt(style.font) * 1.2;
                if (one_ratio * length < textwidth)
                    continue;
                if (Math.abs(inpixels[0][0] - inpixels[inpixels.length - 1][0]) < Math.abs(inpixels[0][1] - inpixels[inpixels.length - 1][1])) {
                    if (inpixels[0][1] - inpixels[inpixels.length - 1][1] > 0) //从下到上
                        inpixels = Coordinate.reverse(inpixels);
                } else {
                    if (inpixels[0][0] - inpixels[inpixels.length - 1][0] > 0) //从右到左
                        inpixels = Coordinate.reverse(inpixels);
                }
                ctx.save();
                ctx.font = style.font;
                ctx.fillStyle = style.fillColor;
                ctx.strokeStyle = style.color;
                ctx.lineWidth = style.lineWidth;
                ctx.textAlign = style.textAlign;
                ctx.textBaseline = style.textBaseline;

                let sratio = 0;
                if (one_ratio * length > textwidth) {
                    sratio = ((length - (s.length - 1) * textwidth) / 2) / length;
                    one_ratio = textwidth / length;
                }
                let ratio = sratio;
                for (let i = 0; i < s.length; i++) {
                    ratio += one_ratio;
                    let val = Measure.solveRatioPointOnPolyline(ratio, inpixels);
                    if (val != null) {
                        ctx.strokeText(s[i], val.out[0], val.out[1]);
                        ctx.fillText(s[i], val.out[0], val.out[1]);
                    }
                }
                ctx.restore();
            }
        }
    }
}

export default Polyline;
