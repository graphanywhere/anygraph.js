import { default as Geometry, GGeometryType, GGShapeType, GGGeoJsonType } from "./geometry.js";
import Collide from "../spatial/collide.js";
import Coordinate from "../spatial/coordinate.js";
import Extent from "../spatial/extent.js";
import Transform from "../spatial/transform.js";
import { LOG_LEVEL } from "../global.js";

/*
 * 文字缺省风格
 */
const __defaultTextStyle = {
    fontItalic: 0, fontBold: 0, fontBorder: false, minFontSize: 4,
    lineWidth: 0,
    // fontSize: "14", textAlign: "left"
};

// fontName: Verdana, Arial, Helvetica, sans-serif;

/**
 * 文本对象类型
 * @extends Geometry
 */
class Text extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 点坐标, 其格式为[[x,y],[x+size]]
     * @param {Object} style 样式 {lineWidth, color, fillColor, fillPrior, fontSize, fontName, fontItalic, fontBold,  textAlign, textBaseline, letterSpacing, fontBorder, borderColor, borderOpacity}
     * @param {Object} properties 
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "text", "vectorSize", "width", "height", "rotation", "maxWidth", "vertical"]);

        // 类型
        this.type = GGeometryType.TEXT;

        // 几何类型
        this.shapeType = GGShapeType.TEXT;

        // 初始化
        this.initialize(options);

        // 文本
        this.text;

        // 是否垂直排列
        this.vertical = this.vertical === true;

        // 坐标
        this.x;
        this.y;

        // 字体宽和高（当vectorSize=true时，按照fontHeight缩放字体，否则才会判断字体宽和高）
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 最大宽度 (对应于：ctx.fillText(text,x,y,maxWidth))，  由于在图形缩放后，该值暂不支持跟随缩放，因此不建议使用该属性
        this.maxWidth = this.maxWidth || -1;

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // 是否缩放字体（优先级最高）
        this.vectorSize = (this.vectorSize === false ? false : true);

        // 字体大小 (缩放时根据此变量计算style.fontSize)
        this._fontHeight = this.style ? this.style.fontSize || 12 : 12;

        // 临时变量
        this._allowMaxWidth = 0;
        this._renderWidth = 0;
        this._renderHeight = 0;

        // 兼容上一个版本的properties构造模式
        if (this.text == null) {
            this.text = this.properties ? this.properties.text : "";
        }

        // 像素坐标初始化
        this.pixel = [[this.x, this.y]];

        // 控制外框属性
        this.ctrlBorderProp = {};
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
                this.coords.push([this.x, this.y]);
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
     * 设置样式
     * @param {*} style 
     */
    setStyle(style) {
        super.setStyle(style);
        // 矢量字体大小，当vectorSize=true时，字体大小随着图形缩放而缩放
        if (style.fontSize > 0) {
            this._fontHeight = style.fontSize;
        }
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();

        // 矢量字体才考虑宽度和高度对BBOX的影响
        let textLength = this.text.length;
        let width, height;

        if (useCoord == true) {
            width = this.width > 0 ? this.width : this._fontHeight * textLength;
            height = this.height > 0 ? this.height : this._fontHeight;
        } else {
            width = this._renderWidth; // this.style.fontSize * textLength;
            height = this._renderHeight; //this.style.fontSize;
        }

        // 根据字体水平对齐方式确定文本的bbox
        let left, top;
        if (this.style.textAlign == "center" || this.style.textAlign == "middle") {
            left = coord[0][0] - width / 2;
        } else if (this.style.textAlign == "right") {
            left = coord[0][0] - width;
        } else {
            left = coord[0][0]
        }
        // 属性值有 top(文本块的顶部), hanging(悬挂基线), middle(文本块的中间), alphabetic(标准的字母基线), ideographic(表意字基线), bottom(文本块的底部)
        if (this.style.textBaseline == "middle") {
            top = coord[0][1] - height / 2;
        } else if (this.style.textBaseline == "bottom" || this.style.textBaseline == "ideographic") {
            top = coord[0][1] - height;
        } else if (this.style.textBaseline == "alphabetic") {
            top = coord[0][1] - height;;
        } else {    // top,  "hanging"
            top = coord[0][1];
        }
        return [left, top, left + width, top + height];
    }
    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        return this.getBBox(useCoord);
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
     *  @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());

        let pixel = Coordinate.transform2D(tool, [this.coords[0][0], this.coords[0][1]], false);
        this.setPixel([[pixel[0], pixel[1]]]);

        // 如果properties中包含了text，且style中vectorSize==true或包含了width和height，则该文本字体大小为矢量大小
        if (this.vectorSize === true && this._fontHeight > 0) {
            let point = Coordinate.transform2D(tool, [this.coords[0][0], this.coords[0][1] + this._fontHeight], false);
            this.style.fontSize = Math.round(Math.abs(point[1] - pixel[1]));  // 使用高度作为字体大小
            this._allowMaxWidth = this.style.fontSize * this.text.length;
        } else if (this.width > 0 && this.height > 0) {
            let point = Coordinate.transform2D(tool, [this.coords[0][0] + this.width, this.coords[0][1] + this.height], false);
            this.style.fontSize = Math.round(Math.abs(point[1] - pixel[1]));  // 使用高度作为字体大小
            this._allowMaxWidth = Math.abs(point[0] - pixel[0]);
        }
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Text(this);
    }

    /**
     * 文本的矩阵变换，除了坐标的变换，还需进行字体大小的缩放
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);

        // x, y
        [this.x, this.y] = this.coords[0];

        // 文字的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;

        // 字体缩放
        this._fontHeight = this._fontHeight * transResult.scale[0];
        if (this.width > 0 && this.height > 0) {
            this.width = this.width * transResult.scale[0];
            this.height = this.height * transResult.scale[0];
        }
    }

    /**
     * 绘制文本
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style
     * @param {Object} frameState 视图信息{resolution, zoom, extent, center}
     */
    draw(ctx, style, frameState) {
        if (this.text == null || this.text.length == 0) return;
        let pixel = this.getPixel();

        style = Object.assign({}, __defaultTextStyle, style);

        // 忽略太小的字体
        if (style.fontSize <= style.minFontSize) return;
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 旋转，文字的旋转需通过画板的旋转来实现(文本旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixel[0][0], pixel[0][1]]);
            }
        }

        // 设置样式
        // 优先使用字体高度为字体大小，如果超过了文本宽度，则需缩小字体大小
        ctx.font = this._getFontStyle(style);

        // 在样式中增加drawWidth和drawHeight属性，便于拾取的时候使用该属性判断是否在范围内
        let textHeight = parseInt(style.fontSize);
        let textWidth = ctx.measureText(this.text).width;
        this._renderWidth = textWidth;
        this._renderHeight = textHeight;

        // 如果样式指定了textWidth，且小于实际宽度，则需要将文字缩小至指定的宽度中
        if (this._allowMaxWidth > 0 && textWidth > this._allowMaxWidth) {
            ctx.font = this._getFontStyle(style, textWidth);
        } else {
            this._allowMaxWidth = textWidth;
        }

        // 垂直对齐方式， 属性值有 top(文本块的顶部), hanging(悬挂基线), middle(文本块的中间), alphabetic(标准的字母基线), ideographic(表意字基线), bottom(文本块的底部)
        ctx.textBaseline = (style.textBaseline == null ? "top" : style.textBaseline);

        // 水平对齐方式， 属性值有 start(文本对齐界线开始的地方)、end(文本对齐界线结束的地方)、left(文本左对齐)、right(文本右对齐)、center(文本居中对齐)
        ctx.textAlign = (style.textAlign == null ? "left" : style.textAlign);

        // letterSpacing
        if (style.letterSpacing != null) {
            ctx.letterSpacing = style.letterSpacing;
        }
        if (style.wordSpacing != null) {
            ctx.wordSpacing = style.wordSpacing;
        }

        // 设置样式
        this.setContextStyle(ctx, style);

        // 是否垂直排列
        if (this.vertical === true) {
            this._drawVerticalText(ctx, this.text, style, pixel[0][0], pixel[0][1]);
        } else {
            this._drawText(ctx, this.text, style, pixel[0][0], pixel[0][1], this._allowMaxWidth, textHeight, frameState);
        }

        ctx.restore();
    }

    _drawText(ctx, text, style, x, y, textWidth, textHeight, frameState) {
        if (textHeight <= 4 && (frameState == null || !frameState.getLayer().isUseTransform())) {
            ctx.lineWidth = 1;
            ctx.fillStyle = (style.fillColor == null || style.fillColor == "none") ? (style.color == null ? "#D0D0D0" : style.color) : style.fillColor;
            ctx.fillStyle = ctx.fillStyle + "50";   // 透明度
            ctx.fillRect(x, y, textWidth, textHeight);
            return;
        }

        // 绘制背景（带边框矩形）
        if (style.fontBorder === true || style.fontBorder === 1 || style.fontBorder === "true") {
            let borderColor = (style.borderColor == null ? "#D0D0D0" : style.borderColor);
            let opacity = (style.borderOpacity == null ? "B4" : style.borderOpacity);    // 透明度，使用16进制表示，B4对应十进制为180，即0.7
            if (opacity < 1) opacity = (256 * opacity).toString(16);                     // 使用#FFFFFF00方式表达颜色

            ctx.fillStyle = borderColor + opacity;
            ctx.fillRect(x - 8, y - 8, textWidth + 16, textHeight + 16);
            ctx.lineWidth = 1;
            ctx.strokeStyle = borderColor;
            ctx.strokeRect(x - 8, y - 8, textWidth + 16, textHeight + 16);
        }

        // 文字背景
        if (style.color != null && style.color != "none") {
            if (style.lineWidth > 0) {
                ctx.strokeStyle = style.color;
                if (this.maxWidth > 0) {
                    ctx.strokeText(text, x, y, this.maxWidth);
                } else {
                    ctx.strokeText(text, x, y);
                }
                if (LOG_LEVEL > 5) console.info("ctx.strokeText(%s, %d, %d, %d)", text, x, y, this.maxWidth);
            } else {
                if (style.fillColor == null || style.fillColor == "none") {
                    style.fillColor = style.color;
                }
            }
        } else {
            if (style.fillColor == null || style.fillColor == "none") {
                style.fillColor = "#000000";
            }
        }

        // 绘制文字
        if (style.fillColor != null && style.fillColor != "none" || style.fillPrior === true) {
            ctx.fillStyle = style.fillColor != null && style.fillColor != "none" ? this.getColor(style.fillColor, ctx) : style.color;
            if (this.maxWidth > 0) {
                ctx.fillText(text, x, y, this.maxWidth);
            } else {
                ctx.fillText(text, x, y);
            }
            if (LOG_LEVEL > 5) console.info("ctx.fillText(%s, %d, %d, %d)", text, x, y, this.maxWidth);
        }
    }

    /**
     * 字体风格
     * @param {Object} style
     * @param {int} textWidth 
     * @returns String
     * format:font-style font-variant font-weight font-size line-height font-family
     *        font-style: none normal italic obliquefont (风格：是否斜体)
     *        font-variant: none normal small-caps  (变体)
     *        font-weight: none normal bold (分量)
     *        font-size: 12px
     *        line-height: 1.2 3
     *        font-family: Arial '宋体'
     */
    _getFontStyle(style, textWidth = 0) {
        let fontStyle = "";

        if (style.fontItalic == 1 || style.fontItalic == true) {
            fontStyle += "italic "
        }
        if (style.fontBold == 1 || style.fontBold == true) {
            fontStyle += "bold "
        } else if (style.fontWeight) {
            fontStyle += style.fontWeight + " ";
        }

        let fontSize = this.getFontHeight(style, textWidth) + "px ";
        fontStyle += fontSize;

        let fontName = style.fontName === undefined || style.fontName.indexOf('\'') > -1 || style.fontName.indexOf(',') > -1 || style.fontName.indexOf('"') > -1
            ? style.fontName : '"' + style.fontName + '"';

        fontStyle += fontName + " ";

        // 更多属性
        // if (style.textDecoration) {
        //     fontStyle += "text-decoration: " + style.textDecoration + "; ";
        // }

        return fontStyle;
    }

    /**
     * 获取字体大小， 计算规则：
     * 1、根据style.fontSize获取字体大小，
     * 2、如果指定了渲染的宽度(width)且keepWidth=true，则字体渲染的宽度优先，根据宽度计算字体大小
     * @param {Object} style 
     * @param {int} textWidth 
     * @returns int
     */
    getFontHeight(style, textWidth) {
        // 1、从样式中获取字体尺寸
        let fontSize = style.fontSize;

        // 2、判断样式中是否包含scale属性
        if (style.scale != null && typeof (style.scale) === "number") {
            // 如果指定了文字宽度，则字体大小在getPixel的时候由height指定
            if (this.width == null && this.height == null) {
                fontSize = fontSize * style.scale;
            }
        }

        // 3、判断样式中是否指定了textWidth属性，如果指定了该属性，则根据该属性调整字体大小
        fontSize = (textWidth > 0 && this._allowMaxWidth != null ? fontSize * (this._allowMaxWidth / textWidth) : fontSize);
        return fontSize;
    }

    /**
     * 绘制垂直文本
     * @param {*} ctx 
     * @param {*} text 
     * @param {*} x 
     * @param {*} y 
     */
    _drawVerticalText(ctx, text, style, x, y) {
        let arrText = text.split('');
        let arrWidth = arrText.map(function (letter) {
            return ctx.measureText(letter).width;
        });

        ctx.save();
        let align = ctx.textAlign;
        let baseline = ctx.textBaseline;

        if (align == 'left' || align == 'start') {
            x = x + Math.max(...arrWidth) / 2;
        } else if (align == 'right') {
            x = x - Math.max(...arrWidth) / 2;
        }
        if (baseline == 'bottom' || baseline == 'alphabetic' || baseline == 'ideographic') {
            y = y - arrWidth[0] / 2;
        } else if (baseline == 'top' || baseline == 'hanging') {
            y = y + arrWidth[0] / 2;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let that = this;
        // 开始逐字绘制
        arrText.forEach(function (letter, index) {
            // 是否需要旋转判断
            let code = letter.charCodeAt(0);
            if (code <= 256) {
                // 英文字符，旋转90°
                ctx.translate(x, y);
                ctx.rotate(90 * Math.PI / 180);
                ctx.translate(-x, -y);
            } else if (index > 0 && text.charCodeAt(index - 1) < 256) {
                // y修正
                y = y + arrWidth[index - 1] / 2;
            }
            //ctx.fillText(letter, x, y);
            that._drawText(ctx, letter, style, x, y);

            if (LOG_LEVEL > 5) console.info("ctx.fillText(%s, %d, %d)", letter, x, y);
            // 旋转坐标系还原成初始态
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            // 确定下一个字符的y坐标位置
            let letterWidth = arrWidth[index];
            y = y + letterWidth;
        });
        ctx.restore();
    };

    /**
     * 绘制拾取颜色块
     */
    drawHitBlock(ctx, style, frameState) {
        style = Object.assign({}, __defaultTextStyle, style);
        // 忽略太小的字体
        if (style.fontSize <= style.minFontSize) return;

        let pixel = this.getPixel();
        ctx.save();
        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 旋转，文字的旋转需通过画板的旋转来实现(文本旋转的原点为左上角)
        if (this.rotation != null && this.rotation != 0) {
            if (this.originPixel != null && Array.isArray(this.originPixel) && this.originPixel.length == 2 && typeof (this.originPixel[0]) == "number" && typeof (this.originPixel[1]) == "number") {
                this.renderRotate(ctx, [this.rotation, this.originPixel[0], this.originPixel[1]]);
            } else {
                this.renderRotate(ctx, [this.rotation, pixel[0][0], pixel[0][1]]);
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

export default Text;


/**
 * @private
 */
//import { lerp } from '../../math.js';
//import { rotate } from './transform.js';
/**
 * @param {Array<number>} flatCoordinates Path to put text on.
 * @param {number} offset Start offset of the `flatCoordinates`.
 * @param {number} end End offset of the `flatCoordinates`.
 * @param {number} stride Stride.
 * @param {string} text Text to place on the path.
 * @param {number} startM m along the path where the text starts.
 * @param {number} maxAngle Max angle between adjacent chars in radians.
 * @param {number} scale The product of the text scale and the device pixel ratio.
 * @param {function(string, string, Object<string, number>):number} measureAndCacheTextWidth Measure and cache text width.
 * @param {string} font The font.
 * @param {Object<string, number>} cache A cache of measured widths.
 * @param {number} rotation Rotation to apply to the flatCoordinates to determine whether text needs to be reversed.
 * @return {Array<Array<*>>} The result array (or null if `maxAngle` was
 * exceeded). Entries of the array are x, y, anchorX, angle, chunk.
 */
function drawTextOnPath(flatCoordinates, offset, end, stride, text, startM, maxAngle, scale, measureAndCacheTextWidth, font, cache, rotation) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    var x1 = 0;
    var y1 = 0;
    var segmentLength = 0;
    var segmentM = 0;
    function advance() {
        x1 = x2;
        y1 = y2;
        offset += stride;
        x2 = flatCoordinates[offset];
        y2 = flatCoordinates[offset + 1];
        segmentM += segmentLength;
        segmentLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
    do {
        advance();
    } while (offset < end - stride && segmentM + segmentLength < startM);
    var interpolate = (startM - segmentM) / segmentLength;
    var beginX = lerp(x1, x2, interpolate);
    var beginY = lerp(y1, y2, interpolate);
    var startOffset = offset - stride;
    var startLength = segmentM;
    var endM = startM + scale * measureAndCacheTextWidth(font, text, cache);
    while (offset < end - stride && segmentM + segmentLength < endM) {
        advance();
    }
    interpolate = (endM - segmentM) / segmentLength;
    var endX = lerp(x1, x2, interpolate);
    var endY = lerp(y1, y2, interpolate);
    // Keep text upright
    var reverse;
    if (rotation) {
        var flat = [beginX, beginY, endX, endY];
        rotate(flat, 0, 4, 2, rotation, flat, flat);
        reverse = flat[0] > flat[2];
    }
    else {
        reverse = beginX > endX;
    }
    var PI = Math.PI;
    var result = [];
    var singleSegment = startOffset + stride === offset;
    offset = startOffset;
    segmentLength = 0;
    segmentM = startLength;
    x2 = flatCoordinates[offset];
    y2 = flatCoordinates[offset + 1];
    // All on the same segment
    if (singleSegment) {
        advance();
        var previousAngle_1 = Math.atan2(y2 - y1, x2 - x1);
        if (reverse) {
            previousAngle_1 += previousAngle_1 > 0 ? -PI : PI;
        }
        var x = (endX + beginX) / 2;
        var y = (endY + beginY) / 2;
        result[0] = [x, y, (endM - startM) / 2, previousAngle_1, text];
        return result;
    }
    var previousAngle;
    for (var i = 0, ii = text.length; i < ii;) {
        advance();
        var angle = Math.atan2(y2 - y1, x2 - x1);
        if (reverse) {
            angle += angle > 0 ? -PI : PI;
        }
        if (previousAngle !== undefined) {
            var delta = angle - previousAngle;
            delta += delta > PI ? -2 * PI : delta < -PI ? 2 * PI : 0;
            if (Math.abs(delta) > maxAngle) {
                return null;
            }
        }
        previousAngle = angle;
        var iStart = i;
        var charLength = 0;
        for (; i < ii; ++i) {
            var index = reverse ? ii - i - 1 : i;
            var len = scale * measureAndCacheTextWidth(font, text[index], cache);
            if (offset + stride < end &&
                segmentM + segmentLength < startM + charLength + len / 2) {
                break;
            }
            charLength += len;
        }
        if (i === iStart) {
            continue;
        }
        var chars = reverse
            ? text.substring(ii - iStart, ii - i)
            : text.substring(iStart, i);
        interpolate = (startM + charLength / 2 - segmentM) / segmentLength;
        var x = lerp(x1, x2, interpolate);
        var y = lerp(y1, y2, interpolate);
        result.push([x, y, charLength / 2, angle, chars]);
        startM += charLength;
    }
    return result;
}
