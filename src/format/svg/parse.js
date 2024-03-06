import MathUtil from "../../util/math.js";
import Gradient from "../../style/gradient.js";
import Color from "../../style/color.js";
import Transform from "../../spatial/transform.js";
import Extent from "../../spatial/extent.js";
import Pattern from "../../style/pattern.js";

/**
 * 解析ViewBox属性
 * @private
 * @param {String} strViewBox 
 * @returns Array
 */
function parseViewBox(strViewBox) {
    let bbox = [];
    if (strViewBox != null) {
        let seq = strViewBox.split(/\s*,\s*|\s+/);
        if (seq.length === 4) {
            bbox[0] = (getFloatVal(seq[0]));
            bbox[1] = (getFloatVal(seq[1]));
            bbox[2] = (getFloatVal(seq[0]) + getFloatVal(seq[2]));
            bbox[3] = (getFloatVal(seq[1]) + getFloatVal(seq[3]));
        }
    }
    return bbox;
}

/**
 * SVG渐变Element分析
 * @class
 */
const parseGradient = (function () {
    /**
     * Returns {Gradient} 渐变对象
     * @param {SVGGradientElement} element 渐变SVG Element
     * @param {Object} svg document对象， 百分数值转换为像素时会用到
     * @param {String} opacity 透明度
     */
    return function (element, document, opacity) {
        /**
         *  @example:
         *
         *  <linearGradient id="linearGrad1">
         *    <stop offset="0%" stop-color="white"/>
         *    <stop offset="100%" stop-color="black"/>
         *  </linearGradient>
         *
         *  OR
         *
         *  <linearGradient id="linearGrad2">
         *    <stop offset="0" style="stop-color:rgb(255,255,255)"/>
         *    <stop offset="1" style="stop-color:rgb(0,0,0)"/>
         *  </linearGradient>
         *
         *  OR
         *
         *  <radialGradient id="radialGrad1">
         *    <stop offset="0%" stop-color="white" stop-opacity="1" />
         *    <stop offset="50%" stop-color="black" stop-opacity="0.5" />
         *    <stop offset="100%" stop-color="white" stop-opacity="1" />
         *  </radialGradient>
         *
         *  OR
         *
         *  <radialGradient id="radialGrad2">
         *    <stop offset="0" stop-color="rgb(255,255,255)" />
         *    <stop offset="0.5" stop-color="rgb(0,0,0)" />
         *    <stop offset="1" stop-color="rgb(255,255,255)" />
         *  </radialGradient>
         *
         */

        let multiplier = parseFloat(opacity) / (/%$/.test(opacity) ? 100 : 1);
        multiplier = MathUtil.clamp(multiplier, 0, 1);
        if (isNaN(multiplier)) {
            multiplier = 1;
        }

        let colorStopEls = element.getElementsByTagName('stop'),
            colorStops = [],
            type,
            coords,
            gradientUnits = element.getAttribute('gradientUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
            gradientTransform = element.getAttribute('gradientTransform') || '',
            transformData;

        if (element.nodeName === 'linearGradient' || element.nodeName === 'LINEARGRADIENT') {
            type = 'linear';
            coords = _getLinearCoords(element);
        } else {
            type = 'radial';
            coords = _getRadialCoords(element);
        }

        //for (let i = colorStopEls.length; i--;) {
        for (let i = 0, ii = colorStopEls.length; i < ii; i++) {
            colorStops.push(_getColorStop(colorStopEls[i], multiplier));
        }

        transformData = parseTransform(gradientTransform);

        // 计算单位为百分数的值
        _convert2Value(coords, document, gradientUnits);

        // 构造渐变对象
        let gradient = new Gradient({
            id: element.getAttribute('id'),
            type: type,
            coords: coords,
            colorStops: colorStops,
            gradientUnits: gradientUnits,
            gradientTransform: transformData
        });

        return gradient;
    }

    /**
     * @private
     */
    function _convert2Value(coords, document, gradientUnits) {
        let propValue, finalValue;
        Object.keys(coords).forEach(function (prop) {
            propValue = coords[prop];
            if (propValue === 'Infinity') {
                finalValue = 1;
            } else if (propValue === '-Infinity') {
                finalValue = 0;
            } else {
                finalValue = parseFloat(coords[prop]);
                // 分析百分数
                if (typeof propValue === 'string' && /^(\d+\.\d+)%|(\d+)%$/.test(propValue)) {
                    finalValue *= 0.01;
                    if (gradientUnits === 'pixels') {
                        if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
                            finalValue *= document.width;
                        }
                        if (prop === 'y1' || prop === 'y2') {
                            finalValue *= document.height;
                        }
                    }
                }
            }
            coords[prop] = finalValue;
        });
    }

    function _getColorStop(element, multiplier) {
        let style = element.getAttribute('style'),
            offset = element.getAttribute('offset') || 0,
            color, colorAlpha, opacity, i;

        // convert percents to absolute values
        offset = parseFloat(offset) / (/%$/.test(offset) ? 100 : 1);
        offset = offset < 0 ? 0 : offset > 1 ? 1 : offset;
        if (style) {
            let keyValuePairs = style.split(/\s*;\s*/);

            if (keyValuePairs[keyValuePairs.length - 1] === '') {
                keyValuePairs.pop();
            }

            for (i = keyValuePairs.length; i--;) {
                let split = keyValuePairs[i].split(/\s*:\s*/),
                    key = split[0].trim(),
                    value = split[1].trim();

                if (key === 'stop-color') {
                    color = value;
                }
                else if (key === 'stop-opacity') {
                    opacity = value;
                }
            }
        }

        if (!color) {
            color = element.getAttribute('stop-color') || 'rgb(0,0,0)';
        }
        if (!opacity) {
            opacity = element.getAttribute('stop-opacity');
        }

        color = Color.fromString(color);
        colorAlpha = color.getAlpha();
        opacity = isNaN(parseFloat(opacity)) ? 1 : parseFloat(opacity);
        opacity *= colorAlpha * multiplier;

        return {
            offset: offset,
            color: color.toRgb(),
            opacity: opacity
        };
    }

    function _getLinearCoords(element) {
        return {
            x1: element.getAttribute('x1') || 0,
            y1: element.getAttribute('y1') || 0,
            x2: element.getAttribute('x2') || '100%',
            y2: element.getAttribute('y2') || 0
        };
    }

    function _getRadialCoords(element) {
        return {
            x1: element.getAttribute('fx') || element.getAttribute('cx') || '50%',
            y1: element.getAttribute('fy') || element.getAttribute('cy') || '50%',
            r1: element.getAttribute('fr') || 0,
            x2: element.getAttribute('cx') || '50%',
            y2: element.getAttribute('cy') || '50%',
            r2: element.getAttribute('r') || '50%'
        };
    }
}())


/**
 * SVG填充图案Element分析
 * @class
 */
const getPatternObject = (function () {

    function isPercentage(strNum) {
        return strNum.substring(strNum.length - 1) == "%" ? true : false;
    }

    /**
     * Returns {Pattern} 填充图案对象
     * @param {SVGPatternElement} element svg 填充图案Element
     * @param {Object} svg document对象， 百分数值转换为像素时会用到
     * @param {Object.number} width 
     * @param {Object.number} height
     * @param {List} geometryList
     */
    return function (options, geometry) {

        let bbox = geometry.getBBox();
        // 坐标
        let x = isPercentage(options.x) ? getFloatVal(options.x, { "isX": true }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.x);
        let y = isPercentage(options.x) ? getFloatVal(options.y, { "isX": false }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.y);
        let width = isPercentage(options.x) ? getFloatVal(options.width, { "isX": true }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.width);
        let height = isPercentage(options.x) ? getFloatVal(options.height, { "isX": false }, { "parentNode": { "viewBox": bbox } }) : parseFloat(options.height);

        // 矩阵
        let transformData = parseTransform(options.patternTransform);
        let transform = transformData.length > 0 ? Transform.createByData(transformData) : null

        // 构造渐变对象
        let pattern = new Pattern({
            type: "canvas",
            repeat: "repeat",
            x: x,
            y: y,
            width: width,
            height: height,
            viewBox: parseViewBox(options.viewBox),
            patternTransform: transform,
            geomList: options.geomList.slice()
        });

        return pattern;
    }
}())

/**
 * https://www.w3.org/TR/filter-effects-1/
 * css滤镜参考：https://developer.mozilla.org/zh-CN/docs/Web/CSS/filter 
 * Supported Filter Functions:
 *     <filter-function> = <blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <sepia()> | <saturate()>
 */
const parseFilter = (function(){

}())

/**
 * SVG变换属性transform分析
 * @param {String} transformString 
 * @returns Object
 * @private
 */
function parseTransform(transformString) {
    if (transformString == null) return [];
    let prop = [];
    while (transformString.length > 5) {
        let idxBegin = transformString.indexOf("(");
        let idxEnd = transformString.indexOf(")");
        if (idxBegin > 0 && idxEnd > 0) {
            let key = transformString.substring(0, idxBegin).trim();
            let value = transformString.substring(idxBegin + 1, idxEnd);
            if (key == "scale") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length === 1) {
                    value = [parseFloat(segs[0]), parseFloat(segs[0])];
                } else {
                    value = [parseFloat(segs[0]), parseFloat(segs[1])];
                }
                prop.push({ "action": key, "value": value });

            } else if (key == "translate") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length === 1) {
                    value = [parseFloat(segs[0]), 0];
                } else {
                    value = [parseFloat(segs[0]), parseFloat(segs[1])];
                }
                prop.push({ "action": key, "value": value });
            } else if (key == "rotate") {
                let segs = value.split(/\s*,\s*|\s+/);
                let origin = [0, 0];
                if (segs.length >= 3) {
                    origin[0] = parseFloat(segs[1]);
                    origin[1] = parseFloat(segs[2]);
                }
                value = parseFloat(segs[0]);
                prop.push({ "action": key, "value": value, "origin": origin });
            } else if (key == "matrix") {
                let segs = value.split(/\s*,\s*|\s+/);
                if (segs.length == 6) {
                    prop.push({
                        "action": key, "value":
                            [parseFloat(segs[0]), parseFloat(segs[1]), parseFloat(segs[2]), parseFloat(segs[3]), parseFloat(segs[4]), parseFloat(segs[5])]
                    });
                }
            }
            transformString = transformString.substring(idxEnd + 1);
        }
    }
    return prop;
}

/**
 * 获取坐标值 或 将一个字符串转换为浮点数，如果该字符串为空则返回0值
 * @param {String} strNum 
 * @param {Boolean} isX 
 * @param {Boolean} zero 当strNum为null时，如果zero=true则返回0，否则返回null
 * @returns Number
 * @private
 */
function getFloatVal(strNum, options = {}, nodeData = {}) {

    let getSize = function (isWidth) {
        while (nodeData != null) {
            if (nodeData.viewBox && nodeData.viewBox.length === 4) {
                break;
            } else {
                nodeData = nodeData.parentNode;
            }
        }
        if (nodeData) {
            let width = Extent.getWidth(nodeData.viewBox) || nodeData.width;
            let height = Extent.getHeight(nodeData.viewBox) || nodeData.height;
            return isWidth ? width : height;
        } else {
            return 0;
        }
    }

    let isX = options.isX == null ? true : options.isX;
    let zero = options.zero == null ? true : options.zero;
    let rtnVal = 0;
    if (strNum == null) {
        rtnVal = zero === true ? 0 : null;
    } else if (typeof (strNum) === "number") {
        rtnVal = strNum;
    } else if (typeof (strNum) === "string") {
        strNum = strNum.trim();
        if (strNum == "") {
            rtnVal = 0;
        } else {
            if (strNum.substring(strNum.length - 1) == "%") {
                strNum = strNum.substring(0, strNum.length - 1);
                rtnVal = parseFloat(strNum) / 100 * getSize(isX);
            } else {
                // path路径中可能存在123e-4格式，为了判断此处的“-”不是分段标识，已将此处的e-4替换成了ee4,因此此处解析时需还原为科学计数法格式
                if (strNum.indexOf("ee") > 0) {
                    let num = strNum.substring(0, strNum.indexOf("ee"));
                    let pow = strNum.substring(strNum.indexOf("ee") + 2);
                    let val = parseFloat(num) * Math.pow(10, -pow);
                    rtnVal = (isNaN(val) ? 0 : val);
                } else {
                    let val = getUnitVal(strNum, nodeData);
                    rtnVal = (isNaN(val) ? 0 : val);
                }
            }
        }
    } else {
        rtnVal = 0;
    }

    return rtnVal;
}

/**
 * 返回一个带单位的字符串数值
 * @private
 */
function getUnitVal(strNum, nodeData) {
    const __DPI = 96;

    let getFontSize = function () {
        while (nodeData != null) {
            if (nodeData.eleAttr && nodeData.eleAttr.fontSize > 0) {
                break;
            } else {
                nodeData = nodeData.parentNode;
            }
        }
        if (nodeData) {
            return nodeData.eleAttr.fontSize;
        } else {
            return 16;
        }
    }

    var reg = /\D{0,2}$/.exec(strNum);
    let num = parseFloat(strNum);
    switch (reg[0]) {
        case "mm":
            return num * __DPI / 25.4;
        case "cm":
            return num * __DPI / 2.54;
        case "in":
            return num * __DPI;
        case "pt":
            return num * __DPI / 72;
        case "pc":
            return num * __DPI / 72 * 12;
        case "em":
            return num * (nodeData == null ? 16 : getFontSize());
        default:
            return num
    }
}

export { parseViewBox, parseGradient, parseTransform, getPatternObject }
export { getFloatVal, getUnitVal };
