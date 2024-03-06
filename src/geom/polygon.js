import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Extent from "../spatial/extent.js";
import Cursor from "../util/cursor.js";

/**
 * 多边形对象类型
 * @extends Geometry
 */
class Polygon extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * options.coords 坐标, 其格式为多个LineRing，例如：[[[x,y],[x,y],……]]
     */
    constructor(options) {
        // 属性初始化
        super(options, []);

        // 类型
        this.type = GGeometryType.POLYGON;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

        // 初始化
        this.initialize(options);
    }

    /**
     * 设置对象坐标位置
     * 多边形坐标格式为LineRing数组，如果传递的多边形是LineRing，而不是LineRing数组，则需将其加入LineRing数组中   2023/12/17
     * @param {Coord} coord 
     */
    setCoord(coords) {
        if (coords == null) {
            // throw new Error("坐标值不能为空");
        } else {
            if (Array.isArray(coords)) {
                if (coords.length >= 2 && !Array.isArray(coords[0][0]) && !Array.isArray(coords[0][1])) {
                    this.coords = [coords];
                    this.pixel = [coords.slice()];
                } else {
                    this.coords = coords;
                    this.pixel = coords.slice();
                }
            }
        }
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool);
        
        let ringIdx = 0;  // 多边形坐标：环索引号
        let idx = 0;      // 多边形坐标：某个环的坐标索引号
        
        let that = this;
        this.ctrlBorderProp = {};

        let pixels = this.getPixel();
        pixels.forEach(pixel => {
            pixel.forEach(point => {
                // cmd == 11 多边形顶点移动编辑
                that.ctrlBorderProp[idx] = { "cmd": 11, "idx": idx, "ringIdx": ringIdx, "cursor": Cursor.POINTER, "coord": point.slice() };
                idx++;
            });
            ringIdx++;
            idx = 0;
        });
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
        return [this.coords.slice()];
    }

    /**
     * 获取对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBox(useCoord = true) {
        let coords = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let m = 0, mm = coords.length; m < mm; m++) {
            let coord = coords[m];
            for (let i = 0, ii = coord.length; i < ii; i++) {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }

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
        // 粗略检测：判定点与Bounding Box的碰撞
        let bbox = this.getBBox(useCoord);
        if (Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] })) {
            // 精细检测：判定点与多边形的碰撞
            let objCoords = (useCoord === false ? this.getPixel() : this.getCoord());
            return Collide.pointPoly({ "x": point[0], "y": point[1] }, objCoords[0]);
        } else {
            return false;
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Polygon(this);
    }

    /**
     * 绘制多边形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ctx.save();

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
                // this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);  // 左上角
            }
        }

        // 绘制多边形(多边形坐标包含了多个LineRing)
        let pixels = this.getPixel();
        ctx.beginPath()
        pixels.forEach(pixel => {
            this.drawPolyline(ctx, pixel, true);
        })

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style, frameState);
        this.strokeAndFill(ctx, style);

        ctx.restore();
    }
}

/**
 * 以多边形方式返回圆的坐标
 * @param {Array} center
 * @param {number} radius 
 * @param {int} sides 
 */
function circle2LineRing(center, radius, sides = 32) {
    let coordinates = [];
    let startAngle = 0;
    for (let i = 0; i <= sides; ++i) {
        let angle = startAngle + i * 2 * Math.PI / sides;
        coordinates[i] = [];
        coordinates[i][0] = center[0] + (radius * Math.cos(angle));
        coordinates[i][1] = center[1] + (radius * Math.sin(angle));
    }
    return coordinates;
}

function arc2LineRing(center, radius, startAngle, endAngle, sides = 32) {
    let coordinates = [];
    // TODO
    return coordinates;
}

/**
 * 以多边形形式返回矩形坐标
 * @param x
 * @param y
 * @param width
 * @param height
 */
function rect2LineRing(x, y, width, height) {
    let coordinates = [];
    coordinates.push([x, y]);
    coordinates.push([x + width, y]);
    coordinates.push([x + width, y + height]);
    coordinates.push([x, y + height]);
    coordinates.push([x, y]);
    return coordinates;
}

/**
 * 获取规则形状坐标，包括五角星、四角星等
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array} center 中心点X坐标
 * @param {int} sides 点数 
 * @param {int} radius 半径 
 * @param {int} radius2 凹半径 
 * @param {Object} style 风格
 */
function getStarLineRing(center, radius = 16, radius2 = 0, sides) {
    let coordinates = [];
    let startAngle = 0;
    sides = sides * 2;
    if (radius2 == null || radius2 == 0) radius2 = radius / 3;
    for (let i = 0; i < sides; i++) {
        let radiusC = (i % 2 === 0 ? radius : radius2);
        let angle = startAngle + i * 2 * Math.PI / sides;
        coordinates[i] = [];
        coordinates[i][0] = center[0] + (radiusC * Math.cos(angle));
        coordinates[i][1] = center[1] + (radiusC * Math.sin(angle));
    }
    return coordinates;
}

export default Polygon;
export { circle2LineRing, arc2LineRing, rect2LineRing, getStarLineRing };
