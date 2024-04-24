import { GGShapeType } from "../../geom/geometry.js";

/**
 * 对象通用样式：
 * 
 * {
 *     "allowStyleScale" : true/false              // 缩放时对象的线宽等属性是否等比例缩放
 *     "transform"                                 // 对象的变形属性
 *     "angle": 30                                 // 旋转角度
 * 
 *     "lineWidth": 1                              // 线宽
 *     "dash"     : [4 4]                          // 虚线样式
 *     "dashOffset" : int                          // 虚线的Offset属性
 *     "lineCap"  : butt/square/round              // 线的末端样式
 *     "lineJoin" : miter/round/bevel              // 线的连接处样式

 *     "color"      "FFFFFF"                       // 边框颜色
 *     "fillStyle": 1/0                            // 是否填充
 *     "fillColor": "#FFFFFF"                      // 填充颜色
 * }
 */


/**
 * 从图层样式中获取指定类型的样式
 * @param {GGShapeType} shapeType 
 * @param {Object} layerStyle 
 * @example
 * layerStyle的对象格式如下：
 * {
 *     "layerPrior" : false,                      // 公共样式，是否图层样式优先
 *     "dynamic" : function(layer, frameState){}  // 图层动态样式
 * 
 *     "pointLineWidth": 2,                       // 点符号线宽
 *     "pointColor": rgba(0,0,0,255),             // 点符号颜色
 *     "pointFillColor": rgba(255,0,0,255),       // 点符号填充色
 *     
 *     "lineWidth": 1,                            // 线宽
 *     "lineType": 2,                             // 线类型
 *     "lineColor": rgba(0,0,0,255),              // 线颜色
 *     "lineFillColor": rgba(0,0,0,255),          // 线填充色
 *     
 *     "surfaceLineWidth": 1,                     // 面的线宽
 *     "surfaceType": 1,                          // 面型
 *     "surfaceFillColor": rgba(0,0,0,255),       // 面的填充色
 *     "surfaceColor": rgba(0,0,0,255),           // 面的边框颜色
 *     
 *     "textColor": rgba(0,0,0,255),              // 文本颜色
 *     "textShadowColor": rgba(0,0,0,255),        // 文本阴影颜色
 *     "textFontName": "黑体",                    // 中文字体
 *     "textFontName2": "Aribe"                   // 英文字体
 * } 或
 * {
 *     "color"
 *     "fillColor"
 *     "***"
 * }
 * @returns Style
 */
function getTypeStyle(shapeType, layerStyle) {
    let style = {};

    if (layerStyle == null) {
        return style;

    } else if (layerStyle.lineColor != null || layerStyle.textColor != null || layerStyle.surfaceColor != null) {
        if (layerStyle.layerPrior === true) {
            style.layerPrior = true;
        }
        if (shapeType === GGShapeType.SURFACE) {
            // 面的边框颜色
            if (layerStyle.surfaceColor != null) {
                style.color = layerStyle.surfaceColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }

            // 面型
            if (layerStyle.surfaceType != null) {
                style.surfaceType = layerStyle.surfaceType;
                // surfaceType=0不填充，1填充，2……其他面型
                if (layerStyle.surfaceType > 0) {
                    style.fillStyle = 1;
                    // 面的填充色
                    if (layerStyle.surfaceFillColor != null) {
                        style.fillColor = layerStyle.surfaceFillColor;
                    } else if (layerStyle.fillColor != null) {
                        style.fillColor = layerStyle.fillColor;
                    }
                }
            }

            // 面的线宽
            if (layerStyle.surfaceLineWidth != null) {
                style.lineWidth = layerStyle.surfaceLineWidth;
            } else if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else if (shapeType === GGShapeType.TEXT) {
            // 中文字体 + 英文字体
            style.fontName = (layerStyle != null ? layerStyle.textFontName + "," + layerStyle.textFontName2 : null);

            // 文本颜色
            if (layerStyle.textColor != null) {
                style.color = layerStyle.textColor;
                style.fillColor = layerStyle.textColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
                style.fillColor = layerStyle.color;
            }
            // 文本阴影颜色
            if (layerStyle.textShadowColor != null) {
                style.borderColor = layerStyle.textShadowColor;
            }
        } else if (shapeType === GGShapeType.POINT) {
            // 点符号颜色
            if (layerStyle.pointColor != null) {
                style.color = layerStyle.pointColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }
            // 点符号填充色
            if (layerStyle.pointFillColor != null) {
                style.fillStyle = 1;
                style.fillColor = layerStyle.pointFillColor;
            } else if (layerStyle.fillColor != null) {
                style.fillStyle = 1;
                style.fillColor = layerStyle.fillColor;
            }
            // 点符号线宽
            if (layerStyle.pointLineWidth != null) {
                style.lineWidth = layerStyle.pointLineWidth;
            } else if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else if (shapeType === GGShapeType.LINE) {
            // 线颜色
            if (layerStyle.lineColor != null) {
                style.color = layerStyle.lineColor;
            } else if (layerStyle.color != null) {
                style.color = layerStyle.color;
            }
            // 线填充色
            if (layerStyle.lineFillColor != null) {
                style.fillStyle = 0;
                // style.fillColor = layerStyle.lineFillColor;
            }
            // 线类型
            if (layerStyle.lineType != null) {
                Object.assign(style, getLineType(layerStyle.lineType))
            }
            // 虚线偏移位置
            if (layerStyle.dashOffset != null) {
                style.dashOffset = layerStyle.dashOffset;
            }
            // 虚线属性
            if (layerStyle.dash != null) {
                style.dash = layerStyle.dash;
            }
            // 线宽
            if (layerStyle.lineWidth != null) {
                style.lineWidth = layerStyle.lineWidth;
            }
        } else {
            for (let p in layerStyle) {
                style[p] = layerStyle[p];
            }
        }

        // 有些源数据中描述颜色仅仅使用 0,0,0的格式，需转换为 rgb(0,0,0)格式
        if (style.color != null) {
            if (style.color.indexOf("rgb") == -1 && style.color.split(",").length === 4) {
                style.color = "rgba(" + style.color + ")";
            } else if (style.color.indexOf("rgb") == -1 && style.color.split(",").length === 3) {
                style.color = "rgb(" + style.color + ")";
            }
        }
        if (style.fillColor != null) {
            if (style.fillColor.indexOf("rgb") == -1 && style.fillColor.split(",").length === 4) {
                style.fillColor = "rgba(" + style.fillColor + ")";
            } else if (style.fillColor.indexOf("rgb") == -1 && style.fillColor.split(",").length === 3) {
                style.fillColor = "rgb(" + style.fillColor + ")";
            }
        }

        return style;
    } else {
        for (let p in layerStyle) {
            style[p] = layerStyle[p];
        }
        return style;
    }
}

function getColor(strColor) {
    if (strColor == null) {
        return undefined;
    } else {
        let seg = strColor.split(",");
        if (seg.length === 4) {
            seg[3] = 255 - seg[3];
            return "rgba(" + seg.join(",") + ")";
        } else if (seg.length === 3) {
            return "rgb(" + strColor + ")";
        } else {
            return strColor;
        }
    }
}

function getLineType(type) {
    let obj = {};
    if (type == 0) {
    } else if (type == 1) {
        obj = { "dash": [8, 8, 8, 8] };
    } else if (type == 2) {
        obj = { "dash": [4, 4, 4, 4] };
    } else if (type == 3) {
        obj = { "dash": [16, 4, 2, 4] };
    } else {
        obj = { "dash": [12, 16, 12, 16] };
    }
    return obj;
    // typedef	enum	{
    //     GK_LINESTYLE_SOLID	= 0,
    //     GK_LINESTYLE_DASH,
    //     GK_LINESTYLE_DOT,
    //     GK_LINESTYLE_DASHDOT, = 3
    //     GK_LINESTYLE_DASHDOTDOT,
    //     GK_LINESTYLE_PIXEL_FILL,
    //     GK_LINESTYLE_WIDTH_FILL,
    //     GK_LINESTYLE_BACK_DASH,
    //     GK_LINESTYLE_BACK_DOT,
    //     GK_LINESTYLE_BACK_DASHDOT,
    //     GK_LINESTYLE_BACK_DASHDOTDOT,
    //     GK_LINESTYLE_USER_START
    // }	GkLineStyleType;
}

export { getTypeStyle, getLineType, getColor };
