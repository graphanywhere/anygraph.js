import EventTarget from "../basetype/event.target.js";
import Transform from "../spatial/transform.js";
import Ratio from "../spatial/ratio.js";
import Collide from "../spatial/collide.js";
import Extent from "../spatial/extent.js";
import Coordinate from "../spatial/coordinate.js";
import Gradient from "../style/gradient.js";
import MathUtil from "../util/math.js";
import Pattern from "../style/pattern.js";
import { LOG_LEVEL } from "../global.js";
import ClassUtil from "../util/class.js";
import { getUniqueID } from "../global.js";
import { default as GeomBorder, defaultCtrlBorderProp } from "../control/border.js";
import { PointStyle, LineStyle, SurfaceStyle, SymbolStyle, TextStyle, ImageStyle } from "../style/style.js";

/**
 * 几何类型名称
 */
export const GGeometryType = {
    POINT: "Point",
    CIRCLE: "Circle",
    ELLIPSE: "Ellipse",
    POLYLINE: "Polyline",
    POLYGON: "Polygon",
    RECT: "Rect",
    CLIP: "Clip",
    TRIANGLE: "Triangle",
    MARK: "Mark",
    IMAGE: "Image",
    SYMBOL: "Symbol",
    PATH: "Path",
    GROUP: "Group",
    TEXT: "Text"
};

/**
 * 几何名称
 */
export const GGShapeType = {
    POINT: 1,
    TEXT: 2,
    LINE: 3,
    SURFACE: 4,
    IMAGE: 5,
    SYMBOL: 6,
    OTHER: 9
}

/**
 * GeoJSON对象类型
 */
export const GGGeoJsonType = {
    POINT: "Point",
    MULTI_POINT: "MultiPoint",
    POLYGON: "Polygon",
    MULTI_POLYGON: "MultiPolygon",
    LINE: "LineString",
    MULTI_LINE: "MultiLineString",
}

Object.freeze(GGeometryType);
Object.freeze(GGShapeType);

/**
 * 几何对象类型基础类
 * @abstract
 */
class Geometry extends EventTarget {
    /**
     * 构造函数
     * @param {GGeometryType} type 
     */
    constructor(options = {}, attrNames) {
        super();
        /**
         * GGeometryType
         */
        this.type;

        /**
         * 对象ID
         */
        this.uid;

        /**
         * GGShapeType
         */
        this.shapeType;

        /**
         * 坐标
         */
        this.coords = [];
        this.pixel = [];

        /**
         * 旋转属性
         */
        this.rotation = 0;
        this.origin;
        this.originPixel;

        /**
         * 样式
         */
        this.style = {};
        this._styleScale = 1;

        /**
         * 附加样式
         */
        this.addStyle = null;

        /**
         * 属性
         */
        this.properties = null;

        /**
         * 边框对象（在getBorder()时构造该对象)
         */
        this.ctrlBorder;

        /**
         * 控制外框属性，缺省控制外框包含了9个点，对于某些几何对象可能不需要这么多控制点，可通过该属性控制
         */
        this.ctrlBorderProp = Object.assign({}, defaultCtrlBorderProp);

        /**
         * 是否激活状态
         */
        this._focus = false;

        // 初始化
        this.attrNames = attrNames || [];
        // this.initialize(options, attrNames);
    }

    /**
     * 初始化, 通过options赋值给属性
     */
    initialize(options={}) {
        let attrs = ["coords", "rotation", "origin", "properties", "style", "innerSeqId", "uid", "labelStyle"];
        this.attrNames = this.attrNames.concat(attrs);

        // 将options赋值给对象属性
        let that = this;
        this.attrNames.forEach(attr => {
            if (attr == "coords") {
                that.setCoord(options[attr])
            } else if (attr == "style" && options[attr] != null) {
                that.setStyle(Object.assign({}, options[attr]))
            } else if (attr == "properties" && options[attr] != null) {
                that.properties = Object.assign({}, options[attr]);
            } else if (options[attr] != null) {
                that[attr] = options[attr];
            }
        });

        if (this.uid == null) {
            this.uid = getUniqueID();
        }
    }

    /**
     * 获取对象ID
     */
    getUid() {
        return this.uid;
    }

    /**
     * 获取对象类型
     * @returns GGeometryType类型
     */
    getType() {
        return this.type;
    }

    /**
     * 获取几何类型（点、线、面）
     * @returns String
     */
    getShapeType() {
        return this.shapeType;
    }

    /**
     * 获取对象样式
     * @returns style
     */
    getStyle() {
        return this.style;
    }

    /**
     * 设置对象样式
     * @param {Object} style 
     */
    setStyle(style) {
        if (style instanceof Object) {
            if (style.override === true) {
                this.style = null;
            }
            let keys = [];
            let shapeType = this.getShapeType();
            switch (shapeType) {
                case GGShapeType.POINT:
                    keys = Object.keys(PointStyle);
                    break;
                case GGShapeType.LINE:
                    keys = Object.keys(LineStyle);
                    break;
                case GGShapeType.SURFACE:
                        keys = Object.keys(SurfaceStyle);
                        break;
                case GGShapeType.SYMBOL:
                    keys = Object.keys(SymbolStyle);
                    break;
                case GGShapeType.TEXT:
                    keys = Object.keys(TextStyle);
                    break;
                case GGShapeType.IMAGE:
                    keys = Object.keys(ImageStyle);
                    break;
            }
            Object.keys(style).forEach(prop => {
                if (keys.indexOf(prop) >= 0) {
                    this.style[prop] = style[prop];
                }
            })
        }
    }

    /**
     * 对象是否具有焦点
     * 具有焦点的对象将会绘制外框，通常在编辑的时候需激活对象，然后进行编辑
     * @returns boolean
     */
    isFocus() {
        return this._focus;
    }

    /**
     * 设置对象焦点
     * @param {Boolean} bool 
     */
    setFocus(bool) {
        this._focus = (bool === true);
    }

    /**
     * 获取对象坐标
     * @returns 坐标数组
     */
    getCoord() {
        return this.coords.slice();
    }

    /**
     * 设置对象坐标位置
     * @param {Coord} coord 
     */
    setCoord(coords) {
        if (coords == null) {
            // throw new Error("坐标值不能为空");
        } else {
            this.coords = coords;
            this.pixel = coords.slice();
        }
    }

    /**
     * 屏幕像素坐标
     * @returns 屏幕像素坐标数组
     */
    getPixel() {
        return this.pixel.length === 0 ? [] : this.pixel.slice();
    }

    /**
     * 设置对象像素位置
     * @param {Coord} pixel 
     */
    setPixel(pixel) {
        this.pixel = pixel;
    }

    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        // 转换为屏幕坐标
        this.setPixel(Coordinate.transform2D(tool, this.coords, false));
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());
    }

    /**
     * 样式中的某些属性转换为屏幕坐标
     * @param {Object} tool
     */
    styleToPixel(tool) {
        // 处理transform属性中“旋转”时的‘基点’坐标
        let transData = this.style.transData;
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let obj = transData[i];
                if (obj.action === "rotate") {
                    obj.originPixel = Coordinate.transform2D(tool, obj.origin, false);
                }
            }
        }

        // 处理“旋转”时的‘基点’坐标
        if (this.origin != null && Array.isArray(this.origin) && this.origin.length == 2 && typeof (this.origin[0]) == "number" && typeof (this.origin[1]) == "number") {
            this.originPixel = Coordinate.transform2D(tool, this.origin, false);
        }

        // 处理渐变对象中的坐标
        let that = this;
        let attrName = ["color", "fillColor"];
        attrName.forEach(attr => {
            if (that.style[attr] != null && typeof (that.style[attr]) === "object") {
                if (that.style[attr] instanceof Gradient) {
                    // 缩放时，渐变对象需要同步缩放
                    that.style[attr].toPixel(tool, that);
                } else if (that.style[attr] instanceof Pattern) {
                    // 缩放时，图案对象根据allowStyleScale进行矢量缩放
                    //if (that.style.allowStyleScale === true) {   // (style.allowStyleScale === true ? that._styleScale : 1)
                    that.style[attr].toPixel(tool);
                    //}
                }
            }
        })
    }

    /**
     * 获取对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; ++i) {
            if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
            if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
            if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
            if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
        }
        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 获取符号内部的对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     * @abstract
     */
    getBBoxInsideSymbol(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let extent = Extent.createEmpty();
        for (let i = 0, ii = coord.length; i < ii; ++i) {
            if (coord[i][0] < extent[0]) { extent[0] = coord[i][0]; }
            if (coord[i][1] < extent[1]) { extent[1] = coord[i][1]; }
            if (coord[i][0] > extent[2]) { extent[2] = coord[i][0]; }
            if (coord[i][1] > extent[3]) { extent[3] = coord[i][1]; }
        }
        return extent;
    }

    /**
     * 判断某点是否在当前对象的边框内，拾取时可根据此返回值判断是否被拾取到
     * @abstract
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否像素坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({ "x": point[0], "y": point[1] }, { "x": bbox[0], "y": bbox[1], "width": bbox[2] - bbox[0], "height": bbox[3] - bbox[1] });
    }


    // TODO 可参考 openLayer 中的定义
    distanceTo(geometry, options) {
        ClassUtil.abstract();
    }

    // TODO 可参考 openLayer 中的定义 
    getCentroid() {
        ClassUtil.abstract();
    }

    /**
     * 修改对象属性值
     * @param {*} propName 
     * @param {*} propValue 
     */
    prop(propName, propValue) {
        if (propValue) {
            this[propName] = propValue;
        } else {
            return this[propName];
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return ClassUtil.abstract();
    }

    /**
     * 绘制对象图形
     * @abstract
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        ClassUtil.abstract();
    }

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        this.draw(ctx, style, frameState);
    }

    /**
     * 绘制控制外框
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style 
     */
    drawBorder(ctx, style) {
        let bbox = this.getBBox(false);
        if (Extent.getWidth(bbox) > 16 || Extent.getHeight(bbox) > 16) {
            this.getBorder().draw(ctx, { "extent": bbox, "prop": this.ctrlBorderProp });
        }
    }

    /**
     * 获取控制外框对象
     * @returns GeomBorder 具有焦点时控制外框对象
     */
    getBorder() {
        if (this.ctrlBorder == null) {
            this.ctrlBorder = new GeomBorder();
        }
        return this.ctrlBorder;
    }

    /**
     * 获取对象的附加样式
     * @returns Object
     */
    getRenderStyle() {
        return this.addStyle;
    }

    /**
     * 设置对象的附加样式
     * @param {Object} style 
     */
    setRenderStyle(style) {
        this.addStyle = (style == null ? null : Object.assign({}, style));
    }

    /**
     * 设置画板样式
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     */
    setContextStyle(ctx, style) {
        // 线宽
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? this._styleScale : 1);
        if (ctx.lineWidth != lineWidth) {
            ctx.lineWidth = lineWidth
        }

        // 线型
        if (style.dash != null && style.dash.length > 1) {
            let dash = style.dash.slice();
            if (style.allowStyleScale === true) {
                for (let i = 0; i < dash.length; i++) {
                    dash[i] = (dash[i] * this._styleScale);
                }
            }
            ctx.setLineDash(dash);
            if (style.dashOffset != null) {
                ctx.lineDashOffset = style.dashOffset;
            }
        }

        // 描边属性，边框终点的形状，stroke-linecap属性的值有三种可能值：
        // butt用直边结束线段，它是常规做法，线段边界 90 度垂直于描边的方向、贯穿它的终点。(default)
        // square的效果差不多，但是会稍微超出实际路径的范围，超出的大小由stroke-width控制
        // round表示边框的终点是圆角，圆角的半径也是由stroke-width控制的。
        if (style.lineCap != null && style.lineCap != ctx.lineCap) {
            ctx.lineCap = style.lineCap;
        }

        // 连接属性，控制两条描边线段之间,它有三个可用的值:
        // miter: 默认值，表示用方形画笔在连接处形成尖角(default)
        // round: 表示用圆角连接，实现平滑效果
        // bevel: 连接处会形成一个斜接
        if (style.lineJoin != null && style.lineJoin != ctx.lineJoin) {
            ctx.lineJoin = style.lineJoin;
        }

        // 斜接长度（斜接的外尖角和内夹角之间的距离）(default：10)
        if (style.miterLimit != null && style.miterLimit != ctx.miterLimit) {
            ctx.miterLimit = style.miterLimit;
        }

        // 滤镜
        if (style.filter != null) {
            ctx.filter = style.filter;
        }

        // 透明度
        if (style.opacity != null) {
            ctx.globalAlpha = style.opacity;
        }

        // 合成操作类型
        if (style.compositeOperation != null) {
            ctx.globalCompositeOperation = style.compositeOperation;
        }

        // 阴影
        // 模糊效果程度
        if (style.shadowBlur > 0) {
            ctx.shadowBlur = style.shadowBlur;
        }
        // 模糊颜色
        if (style.shadowColor != null && style.shadowColor != "none") {
            ctx.shadowColor = style.shadowColor;
        }
        // 阴影**水平**偏移距离
        if (style.shadowOffsetX > 0) {
            ctx.shadowOffsetX = style.shadowOffsetX;
        }
        // 阴影**垂直**偏移距离
        if (style.shadowOffsetY > 0) {
            ctx.shadowOffsetY = style.shadowOffsetY;
        }
    }

    /**
     * 获取填充/描边的颜色值或特殊效果
     * @param {String|Object} param 
     * @param {CanvasRenderingContext2D} ctx 
     * @returns 如果颜色值为字符串则直接返回颜色，如果颜色值为对象则返回创建的渐变对象
     */
    getColor(param, ctx) {
        if (typeof (param) === "object") {
            if (param instanceof Gradient) {
                return param.create(ctx);
            } else if (param instanceof Pattern) {
                return param.create(ctx);
            }
        } else {
            return param;
        }
    }

    /**
     * 描边和填充
     * @param {Object} style 
     */
    strokeAndFill(ctx, style) {
        // paint-order是一个新的属性，可设置是描边和填充的顺序，包含了三个值：markers stroke fill
        // 如果没有指定值，默认顺序将是 fill, stroke, markers
        // 当只指定一个值的时候，这个值将会被首先渲染，然后剩下的两个值将会以默认顺序渲染，当只指定两个值的时候，这两个值会以指定的顺序渲染，接着渲染剩下的未指定的那个。
        if (style.fillStyle == 1 && style.fillColor != "none") {
            ctx.fillStyle = this.getColor(style.fillColor, ctx);
            if (style.fillRule === 'evenodd') {
                // 填充属性：evenodd, nonzero(缺省值)
                ctx.fill('evenodd');
            } else {
                ctx.fill();
            }
        }
        if (style.color != "none") {  // style.color != null && 
            ctx.strokeStyle = this.getColor(style.color, ctx);
            ctx.stroke();
        }
    }

    /**
     * 绘制折线
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} pixels 
     * @param {Boolean} isClosePath 
     */
    drawPolyline(ctx, pixels, isClosePath = false) {
        if (pixels == null) {
            return;
        }
        if (LOG_LEVEL > 5) console.info("// drawPolyline()", pixels.join(","));

        let num = pixels.length;
        // ctx.beginPath();
        if (LOG_LEVEL > 5) console.info("ctx.beginPath()");
        for (let i = 0; i < num; i++) {
            let pixel = pixels[i];
            if (pixel == null) {
                // debugger;
                continue;
            }
            if (i == 0) {
                ctx.moveTo(pixel[0], pixel[1]);
                if (LOG_LEVEL > 5) console.info("ctx.moveTo(%d, %d)", pixel[0], pixel[1]);
            } else {
                ctx.lineTo(pixel[0], pixel[1]);
                if (LOG_LEVEL > 5) console.info("ctx.lineTo(%d, %d)", pixel[0], pixel[1]);
            }
        }
        if (isClosePath === true) {
            ctx.closePath();
            if (LOG_LEVEL > 5) console.info("ctx.closePath()");
        }
    }

    /**
     * 画布矩阵变换
     * 渲染时根据对象的transData属性变换画板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} transData 
     * [{"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *  {"action":"scale", "value":[2, 2]}, 
     *  {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}]
     */
    renderTransform(ctx, transData) {
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let prop = transData[i];
                if (prop.action == "translate") {
                    ctx.translate(prop.value[0], prop.value[1]);
                } else if (prop.action === "scale") {
                    ctx.scale(prop.value[0], prop.value[1]);
                } else if (prop.action === "rotate") {
                    let [originX, originY] = (prop.originPixel == null || prop.originPixel.length == 0 ? prop.origin : prop.originPixel);
                    // 移动到原点
                    ctx.translate(originX, originY);
                    // 旋转
                    ctx.rotate(prop.value * Math.PI / 180);
                    // 恢复初始位置
                    ctx.translate(-originX, -originY);
                }
            }
        }
    }

    /**
     * 旋转画板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} rotateArr  [angle, originX, originY]
     */
    renderRotate(ctx, rotateArr) {
        if (Array.isArray(rotateArr) && rotateArr[0] != 0) {
            let [originX, originY] = [0, 0];
            if (rotateArr.length == 1) {          // 中心点旋转
                let bbox = this.getBBox(false);
                let [w, h] = [Extent.getWidth(bbox), Extent.getHeight(bbox)];
                [originX, originY] = [bbox[0] + w / 2, bbox[1] + h / 2];
            } else if (rotateArr.length == 3) {
                // origin旋转
                if (rotateArr[1] != null && rotateArr[2] != null) {
                    [originX, originY] = [rotateArr[1], rotateArr[2]];
                } else {
                    let bbox = this.getBBox(false);
                    [originX, originY] = [bbox[0], bbox[1]];
                }
            }

            // 移动到原点
            ctx.translate(originX, originY);
            // 旋转
            ctx.rotate(MathUtil.toRadians(rotateArr[0]));
            // 恢复初始位置
            ctx.translate(-originX, -originY);
        }
    }

    /**
     * 对象平移
     * @param {*} dx 
     * @param {*} dy 
     */
    translate(dx, dy) {
        // let coords = this.getCoord();
        // let dest = Coordinate.translate(coords, dx, dy);
        // this.setCoord(dest);
        let trans = Transform.create();
        Transform.translate(trans, dx, dy)
        this.transform(trans);
    }

    /**
     * 对象缩放
     * @param {*} sx 
     * @param {*} opt_sy 
     * @param {*} opt_anchor 
     */
    scale(sx, sy, opt_anchor) {
        // let coords = this.getCoord();
        // let dest;
        // if(opt_anchor == null) {
        //     dest = Coordinate.scale(coords, sx, sy);
        // } else {
        //     dest = Coordinate.scaleByAnchor(coords, sx, sy, opt_anchor);
        // }
        // this.setCoord(dest);

        let trans = Transform.create();
        if (opt_anchor) {
            Transform.translate(trans, opt_anchor[0], opt_anchor[1]);
            Transform.scale(trans, sx, sy);
            Transform.translate(trans, - opt_anchor[0], - opt_anchor[1]);
        } else {
            Transform.scale(trans, sx, sy);
        }
        this.transform(trans);
    }

    /**
     * 对象旋转
     * @param {*} angle 
     * @param {*} opt_anchor
     */
    rotate(angle, opt_anchor) {
        // let coords = this.getCoord();
        // let dest;
        // if(opt_anchor == null) {
        //     dest = Coordinate.rotate(coords, angle);
        // } else {
        //     dest = Coordinate.rotateByAnchor(coords, angle, opt_anchor);
        // }
        // this.setCoord(dest);
        let trans = Transform.create();
        Transform.rotateAtOrigin(trans, angle, opt_anchor);
        this.transform(trans);
    }

    /**
     * 将对象移动至某点
     * @param {number} dx
     * @param {number} dy
     */
    moveTo(dx = 0, dy = 0) {
        let bbox = this.getBBox();
        let center = Extent.getCenter(bbox);
        let offsetX = dx - center[0];
        let offsetY = dy - center[1];
        this.translate(offsetX, offsetY);
    }

    /**
     * 坐标变换，将几何图形的每个坐标从一个坐标参考系转换到另一个坐标参照系
     * 对象实例化之后，访问该方法可变换当前对象的坐标等信息
     * 注意: 缩放操作需同比例缩放宽高、字体大小等信息，因此
     *      1 由于某些子类的坐标信息中描述了长度信息（例如：宽、高、半径等），这类子类需要重写该方法，重新计算描述长度的信息
     *      2 Text对象中的fontSize需进行同比例缩放
     *      3 Image对象中的图形宽高需同比例缩放
     * @param {Transform} matrix 
     */
    transform(matrix) {
        let coords = this.getCoord();

        // coords: 坐标变换
        this.setCoord(Coordinate.transform2D(matrix, coords, true));

        // 缩放倍数可以通过矩阵的行列式（即ad-bc）得到。行列式的值就是缩放倍数的平方。如果你要求解每个轴的缩放倍数，那么x轴的缩放倍数就是a，y轴的缩放倍数就是d。
        // 旋转角度可以通过计算矩阵的反正切（atan2(b, a)）得到。这将给出x轴和y轴之间的角度差，即旋转角度。
        // 注意这里计算的是逆时针旋转的角度，如果你想要顺时针的角度，需要加上180度（或在度数为负时取补数）。

        // 椭圆形、字体需根据transform计算倾斜角度
        let angle = MathUtil.toDegrees(Math.atan2(matrix[1], matrix[0]));

        // 矩形、圆形、椭圆形等对象需根据transform重新计算宽高半径等数据
        Transform.rotate(matrix, MathUtil.toRadians(-angle));
        let scale = [matrix[0], matrix[3]];
        Transform.rotate(matrix, MathUtil.toRadians(angle));
        // console.info(this.type, "angle:" + angle, "scale:" + scale.join(", "));

        // 组、图元、路径等对象需根据transform变换其子对象
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                let child = this.childGeometrys[i];
                child.transform(matrix);
            }
        }

        // 渐变样式需根据transform变换相应坐标数据
        let fillObj = this.style.fillColor;
        if (fillObj instanceof Gradient) {
            fillObj.transform(matrix);
        } else if (fillObj instanceof Pattern) {
            fillObj.transform(matrix);
        }

        // 样式缩放，例如线宽
        if (this.style.lineWidth > 0 && this.style.allowStyleScale === true) {
            this.style.lineWidth = this.style.lineWidth * Transform.getScale(matrix);
        }
        return { angle, scale }
    }

    // /**
    //  * 获取简化的对象
    //  * @param {*} squaredTolerance 
    //  */
    // getSimplifiedGeometry(squaredTolerance) {
    // }

    /**
     * 获取对象GeoJSON类型
     * @returns 类型名称
     */
    getGeoJSONType() {
        return this.type;
    }

    /**
     * 获取对象GeoJSON坐标
     * @returns 坐标数组
     */
    getGeoJSONCoord() {
        return this.coords.slice();
    }

    /**
     * 获取对象GeoJSON属性
     * @returns 属性信息
     */
    getGeoJSONProperties() {
        let prop = Object.assign({}, this.properties);
        if (prop.hasOwnProperty("symbol")) {
            delete prop.symbol;
        }
        if (prop.hasOwnProperty("innerSeqId")) {
            delete prop.innerSeqId;
        }
        return prop;
    }

    /**
     * 转换为GeoJSON格式坐标
     * @returns JS对象
     * @abstract
     */
    toGeoJSON() {
        return {
            "type": "Feature",
            "geometry": {
                "type": this.getGeoJSONType(),
                "coordinates": this.getGeoJSONCoord()
            },
            "properties": this.getGeoJSONProperties()
        }
    }

    /**
     * well-known text
     * https://www.cnblogs.com/duanxingxing/p/5144257.html
     */
    toWKT() {

    }

    /**
     * 获取对象字符串
     * @returns 坐标数组
     */
    toString() {
        return JSON.stringify(this.toData());
    }

    /**
     * 获取当前对象属性
     * @returns Object
     */
    toData(options = {}) {
        let decimals = options.decimals == null ? 2 : options.decimals;
        let more = options.more === true;
        let that = this;
        let obj = {};
        let extract = options.id ? ["innerSeqId"] : ["innerSeqId", "uid"];
        obj.type = this.getType();
        this.attrNames.forEach(attr => {
            if (that[attr] != null && extract.indexOf(attr) < 0) {
                if (attr === "coords") {
                    obj[attr] = Coordinate.toFixed(that[attr], decimals);
                } else if (typeof (that[attr]) == "object") {
                    if (Array.isArray(that[attr])) {
                        if (that[attr].length > 0) {
                            obj[attr] = that[attr];
                        }
                    } else if (Object.keys(that[attr]).length > 0) {
                        obj[attr] = that[attr];
                    }
                } else {
                    if ((typeof (that[attr]) == "number")) {
                        if (that[attr] != 0) {
                            obj[attr] = MathUtil.toFixed(that[attr], decimals)
                        }
                    } else {
                        obj[attr] = that[attr];
                    }
                }
            }
        });

        // 如果对象包含了x和y属性，则无需返回coords属性
        if (obj.x != null && obj.y != null) {
            delete obj.coords;
        }
        if (more === true) {
            obj.pixel = this.getPixel();
        }
        return obj;
    }
}

export default Geometry;
