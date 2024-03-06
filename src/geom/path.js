import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Extent from "../spatial/extent.js";
import Coordinate from "../spatial/coordinate.js";
import Transform from "../spatial/transform.js";
import { LOG_LEVEL } from "../global.js";

/**
 * 路径对象类型
 * @extends Geometry
 */
class Path extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[[x,y],[x,y],……]
     * @param {Object} style 
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["commands", "childGeometrys"]);

        // 类型
        this.type = GGeometryType.PATH;

        // 几何类型
        this.shapeType = GGShapeType.SURFACE;

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

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        let coord = this.getCoord();
        return coord;
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; i++) {
            if (Array.isArray(coord[i][0])) {
                for (let j = 0, jj = coord[i].length; j < jj; j++) {
                    if (coord[i][j][0] < extent[0]) { extent[0] = coord[i][j][0]; }
                    if (coord[i][j][1] < extent[1]) { extent[1] = coord[i][j][1]; }
                    if (coord[i][j][0] > extent[2]) { extent[2] = coord[i][j][0]; }
                    if (coord[i][j][1] > extent[3]) { extent[3] = coord[i][j][1]; }
                }
            } else {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let childCoord = useCoord === false ? this.childGeometrys[i].getPixel() : this.childGeometrys[i].getCoord();
                let rx = Math.abs(childCoord[0][0] - childCoord[1][0]), ry = Math.abs(childCoord[0][1] - childCoord[1][1]);
                let childExtent = [childCoord[0][0] - rx, childCoord[0][1] - ry, childCoord[0][0] + rx, childCoord[0][1] + ry];
                extent = Extent.merge(childExtent, extent);
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
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; i++) {
            if (Array.isArray(coord[i][0])) {
                for (let j = 0, jj = coord[i].length; j < jj; j++) {
                    if (coord[i][j][0] < extent[0]) { extent[0] = coord[i][j][0]; }
                    if (coord[i][j][1] < extent[1]) { extent[1] = coord[i][j][1]; }
                    if (coord[i][j][0] > extent[2]) { extent[2] = coord[i][j][0]; }
                    if (coord[i][j][1] > extent[3]) { extent[3] = coord[i][j][1]; }
                }
            } else {
                if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
                if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
                if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
                if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
            }
        }
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let childCoord = useCoord === false ? this.childGeometrys[i].getPixel() : this.childGeometrys[i].getCoord();
                let rx = Math.abs(childCoord[0][0] - childCoord[1][0]), ry = Math.abs(childCoord[0][1] - childCoord[1][1]);
                let childExtent = [childCoord[0][0] - rx, childCoord[0][1] - ry, childCoord[0][0] + rx, childCoord[0][1] + ry];
                extent = Extent.merge(childExtent, extent);
            }
        }
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
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] });
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
        this.setPixel(Coordinate.transform2D(tool, this.coords, false));
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                this.childGeometrys[i].toPixel(tool);
            }
        }
    }

    /**
     * 对象平移
     * @param {*} deltaX 
     * @param {*} deltaY 
     */
    translate(deltaX, deltaY) {
        let coords = this.getCoord();
        let dests = [];
        for (let i = 0, len = coords.length; i < len; i++) {
            let dest = Coordinate.translate(coords[i], deltaX, deltaY);
            dests.push(dest);
        }
        this.setCoord(dests);
    }

    /**
     * 对象缩放
     * @param {*} sx 
     * @param {*} opt_sy 
     * @param {*} opt_anchor 
     */
    scale(sx, sy, opt_anchor) {
        let coords = this.getCoord();
        let dests = [];
        for (let i = 0, len = coords.length; i < len; i++) {
            let dest = Coordinate.scaleByAnchor(coords[i], sx, sy, opt_anchor);
            dests.push(dest);
        }
        this.setCoord(dests);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Path(this);
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {fillStyle, color, fillColor, lineWidth, dash, dashOffset, startArrowSize, endArrowSize}
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        style = Object.assign({}, Path.defaultStyle, style);
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 绘制路径
        this.drawPath(ctx, this.getPixel(), style);

        // 设置样式并渲染出来
        this.setContextStyle(ctx, style);
        this.strokeAndFill(ctx, style);

        // // 绘制外框
        // let pixels = this.getBBox(false);
        // ctx.strokeRect(pixels[0], pixels[1], pixels[2] - pixels[0], pixels[3] - pixels[1]);

        ctx.restore();
    }

    drawPath(ctx, pixels, style) {
        if (LOG_LEVEL > 5) console.info("// drawPath()");
        if (pixels == null) {
            return;
        }

        let num = pixels.length;
        if (LOG_LEVEL > 5) console.info("ctx.beginPath()");
        ctx.beginPath();
        let ellIdx = 0;
        for (let i = 0; i < num; i++) {
            let pixel = pixels[i];
            let cmd = this.commands[i].toUpperCase();
            if (cmd == "M") {
                ctx.moveTo(pixel[0][0], pixel[0][1]);
                if (LOG_LEVEL > 5) console.info("ctx.moveTo(%d, %d)", pixel[0][0], pixel[0][1]);
                for (let m = 1; m < pixel.length; m += 1) {
                    ctx.lineTo(pixel[m][0], pixel[m][1]);
                    if (LOG_LEVEL > 5) console.info("ctx.lineTo(%d, %d)", pixel[m][0], pixel[m][1]);
                }
            } else if (cmd == "L" || cmd == "H" || cmd == "V") {
                for (let m = 0; m < pixel.length; m += 1) {
                    ctx.lineTo(pixel[m][0], pixel[m][1]);
                    if (LOG_LEVEL > 5) console.info("ctx.lineTo(%d, %d)", pixel[m][0], pixel[m][1]);
                }
            } else if ((cmd == "Z")) {
                ctx.closePath();
                if (LOG_LEVEL > 5) console.info("ctx.closePath()");
            } else if (cmd == "C" || cmd == "S") {
                for (let m = 0; m < pixel.length; m += 3) {
                    ctx.bezierCurveTo(pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1], pixel[m + 2][0], pixel[m + 2][1]);
                    if (LOG_LEVEL > 5) console.info("ctx.bezierCurveTo(%d, %d, %d, %d, %d, %d)", pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1], pixel[m + 2][0], pixel[m + 2][1]);
                }
            } else if (cmd == "Q" || cmd == "T") {
                for (let m = 0; m < pixel.length; m += 2) {
                    ctx.quadraticCurveTo(pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1]);
                    if (LOG_LEVEL > 5) console.info("ctx.quadraticCurveTo(%d, %d, %d, %d)", pixel[m][0], pixel[m][1], pixel[m + 1][0], pixel[m + 1][1]);
                }
            } else if (cmd == "A") {
                let idx = 0;
                // 椭圆弧线
                for (let m = ellIdx; m < this.childGeometrys.length; m++) {
                    let obj = this.childGeometrys[m];
                    // let objStyle = obj.getStyle();
                    // let objPixel = obj.getPixel();
                    // let [x, y, rx, ry] = [objPixel[0][0], objPixel[0][1], Math.abs(objPixel[1][0] - objPixel[0][0]), Math.abs(objPixel[1][1] - objPixel[0][1])];
                    // let angle = (objStyle.angle == null ? 0 : objStyle.angle);
                    //  //let rotation = objStyle.rotation == null ? angle * Math.PI / 180 : objStyle.rotation * Math.PI / 180;
                    // let rotation = (Array.isArray(objStyle.rotate) && objStyle.rotate.length > 0) ? MathUtil.toRadians(objStyle.rotate[0] + angle) : MathUtil.toRadians(angle);
                    // let startAngle = objStyle.startAngle == null ? 0 : objStyle.startAngle;
                    // let endAngle = objStyle.endAngle == null ? Math.PI * 2 : objStyle.endAngle;
                    // let clockwise = objStyle.clockwise == null ? true : objStyle.clockwise;
                    // ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle, !clockwise);
                    // if(LOG_LEVEL > 5) console.info("ctx.ellipse(%d, %d, %d, %d, %f, %f, %f, %s)", x, y, rx, ry, rotation, startAngle, endAngle, !clockwise);

                    // 访问椭圆对象绘制椭圆弧 
                    obj.drawEllipse(ctx, obj.getStyle());
                    ellIdx++;
                    idx++;
                    if (idx >= pixel.length) break;
                }
            } else {
                continue;
            }
        }
    }
}

/**
 * 折线的缺省风格
 */
Path.defaultStyle = { "lineWidth": 1 }

export default Path;
