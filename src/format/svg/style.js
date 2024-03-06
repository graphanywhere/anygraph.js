import { parseGradient, getFloatVal, getPatternObject } from "./parse.js";
import Color from "../../style/color.js";
import { Geometry, Text } from "../../geom/index.js";

/**
 * SVG Style class
 */
class SvgStyle {
    constructor(document) {

        /**
         * svg document object
         */
        this.document = document;

        /**
         * svg文件中定义的样式集合
         */
        this.styleCollection = {};

        /**
         * 渐变节点缓存集合
         */
        this.gradientNodeList = {};

        /**
         * 填充图案集合
         */
        this.patternList = {}
    }

    /**
     * 解析svg中定义的样式
     * @param {XmlElement} element 
     */
    parseStyleElement(element) {
        let strLine = element.textContent;
        strLine = strLine.replace(/\/\*[\s\S]*?\*\//g, '');
        if (strLine.trim() === '') {
            return
        }

        while (strLine.length > 5) {
            let idxBegin = strLine.indexOf("{");
            let idxEnd = strLine.indexOf("}");
            if (idxBegin > 0 && idxEnd > 0) {
                let obj = {};
                let strName = strLine.substring(0, idxBegin).trim();
                let content = strLine.substring(idxBegin + 1, idxEnd);
                let seqs = content.split(";");
                for (let x = 0, xx = seqs.length; x < xx; x++) {
                    let idx = seqs[x].indexOf(":");
                    let key = seqs[x].substring(0, idx).trim();
                    let value = seqs[x].substring(idx + 1).trim();
                    if (key == "") continue;
                    let name = this._getAttrName(key);
                    if (name != null) obj[name] = this._getAttrValue(name, value);
                }

                if (Object.keys(obj).length > 0) {
                    // 定义样式时，可使用,分隔多个样式名称
                    let nameArray = strName.split(/\s*,\s*|\s+/);
                    for (let x = 0, xx = nameArray.length; x < xx; x++) {
                        let name = nameArray[x];
                        let val = this.styleCollection[name];
                        if (val == null) {
                            this.styleCollection[name] = obj;
                        } else {
                            // 根据样式表规则，样式可分多次定义
                            this.styleCollection[name] = Object.assign({}, val, obj);
                        }
                    }
                }

                strLine = strLine.substring(idxEnd + 1);
            } else {
                break;
            }
        }
    }

    /**
     * 获取对象样式
     * @param {Geometry} geometry 
     * @param {Object} eleAttr 
     * @param {Object} nodeData 
     * @returns Object
     */
    getGeomStyle(geometry, eleAttr, nodeData) {
        let style = {};

        // 1. 以下样式直接复制
        let attr = [
            "visible",
            "fillRule",
            "lineCap",
            "lineJoin",
            "miterLimit",
            "opacity",
        ]
        attr.forEach(name => {
            if (eleAttr[name] != null) {
                style[name] = eleAttr[name];
            }
        })

        // 2. 合并eleStyle的多个属性，组成新的样式名称
        // 颜色
        if (eleAttr.stroke != null) {
            style.color = this._getColor(eleAttr.stroke, eleAttr.strokeOpacity, geometry);
        }
        if (eleAttr.fill != null) {
            style.fillColor = this._getColor(eleAttr.fill, eleAttr.fillOpacity, geometry);
        }
        // 默认为填充，当颜色值为null时用黑色填充，当填充值为none则表示不填充
        style.fillStyle = (style.fillColor == "none" ? 0 : 1);

        // 当存在填充色时，边框如果没有指定颜色则说明不需要渲染边框
        if (style.color == null && style.fillStyle == 1) {
            style.color = "none";
        }

        // 线宽
        if (eleAttr.strokeWidth != null) {
            style.lineWidth = getFloatVal(eleAttr.strokeWidth, {}, nodeData);
        }

        // 虚线
        if (eleAttr.strokeDashArray != null && eleAttr.strokeDashArray.length > 0) {
            style.dash = eleAttr.strokeDashArray;
            if (eleAttr.strokeDashoffset != null) style.dashOffset = parseFloat(eleAttr.strokeDashoffset);
        }

        // 3、特殊节点属性处理
        if (geometry instanceof Text) {
            style = Object.assign({}, style, this.getTextStyle(geometry, eleAttr, nodeData));
        }

        return style;
    }

    /**
     * 获取样式，节点样式信息在节点属性、节点style和class中，优先级 节点属性>节点style>classStyle
     * @param {XmlElement} element 
     * @returns Object
     */
    getElementAttr(element, parentAttr, nodeData) {

        let attrs = [
            "class",
            "fill",
            "fill-opacity",
            "stroke",
            "stroke-opacity",
            "stroke-dasharray",
            "stroke-dashoffset",
            "stroke-width",
            "visibility",
            "display",
            "paint-order",
            "fill-rule",
            "stroke-linecap",
            "stroke-linejoin",
            "stroke-miterlimit",
            "opacity",
            "font",
            "font-family",
            "font-style",
            "font-weight",
            "font-size",
            "letter-spacing",
            "text-decoration",
            "text-anchor",
            "alignment-baseline"
        ];
        let obj = this._getAttribute(element, attrs);

        // 从class中获取样式
        let eleAttr = {};

        // 1. 从className中读取样式，例如<text class=".bigText" />将从className为.bigText的样式定义中读取样式
        if (obj["class"] != null) {
            eleAttr = this._getClassStyleByName(obj["class"], eleAttr);
        }

        // 2. 从element的节点类型class中读取样式， 例如<text />将从className为text的样式定义中读取样式
        eleAttr = this._getClassStyleByName(element.nodeName, eleAttr);

        // 3.读取节点的样式
        for (let i = 0, ii = attrs.length; i < ii; i++) {
            if (obj[attrs[i]] != null) {
                let name = this._getAttrName(attrs[i]);
                eleAttr[name] = this._getAttrValue(name, obj[attrs[i]], nodeData);
            }
        }

        // 4.合并父节点的样式
        // 通常情况下如果子对象与父对象均存在某种样式，需以子对象的样式为准，
        // 但以下样式需特殊处理
        if (typeof (parentAttr) == "object" && Object.keys(parentAttr).length > 0) {
            let skipAttr = ["opacity"];
            for (let i = 0, ii = attrs.length; i < ii; i++) {
                let name = this._getAttrName(attrs[i]);
                if (!skipAttr.includes(name)) {
                    if (parentAttr[name] != null && eleAttr[name] == null) {
                        eleAttr[name] = parentAttr[name];
                    }
                }
            }

            // 透明属性值为当前节点的透明值*父节点透明值
            for (let i = 0, ii = skipAttr.length; i < ii; i++) {
                if (parentAttr[skipAttr[i]] > 0) {
                    if (eleAttr[skipAttr[i]] > 0) {
                        eleAttr[skipAttr[i]] = parentAttr[skipAttr[i]] * eleAttr[skipAttr[i]];
                    } else {
                        eleAttr[skipAttr[i]] = parentAttr[skipAttr[i]];
                    }
                }
            }

            // 如果父对象visible样式为false，则子对象该值也为false
            if (parentAttr.visible === false) {
                eleAttr.visible = false;
            }
        }

        // add space attr
        if(eleAttr.transData == null && parentAttr && parentAttr.transData == null) {
            eleAttr.transData = [];
        }
		
        return Object.assign({}, (parentAttr == null ? {} : JSON.parse(JSON.stringify(parentAttr))), eleAttr);
    }

    _getAttrName(attr) {
        let map = {
            "cx": "left",
            "x": "left",
            "r": "radius",
            "cy": "top",
            "y": "top",
            "display": "visible",
            "visibility": "visible",
            "fill-rule": "fillRule",
            "fill": "fill",
            "fill-opacity": "fillOpacity",
            "stroke": "stroke",
            "stroke-opacity": "strokeOpacity",
            "stroke-linecap": "lineCap",
            "stroke-linejoin": "lineJoin",
            "stroke-miterlimit": "miterLimit",
            "stroke-width": "strokeWidth",
            "stroke-dasharray": "strokeDashArray",
            "stroke-dashoffset": "strokeDashoffset",

            "font": "font",
            "font-family": "fontName",
            "font-size": "fontSize",
            "font-style": "fontStyle",
            "font-weight": "fontWeight",
            "text-decoration": "textDecoration",
            "text-anchor": "textAnchor",
            "alignment-baseline" : "textBaseline",
            "letter-spacing": "charSpacing",
            "paint-order": "paintFirst",

            "opacity": "opacity",
            "clip-path": "clipPath",
            "clip-rule": "clipRule",
            "vector-effect": "strokeUniform",
            "image-rendering": "imageSmoothing",
        }
        return map[attr] == null ? attr : map[attr];
    }

    _getAttrValue(attr, value, nodeData) {
        if (attr === "strokeUniform") {
            return (value === "non-scaling-stroke");
        } else if (attr === "strokeDashArray") {
            if (value === "none") {
                value = null;
            } else {
                value = value.replace(/,/g, " ").split(/\s+/).map(parseFloat);
            }
        } else if (attr === "visible") {
            value = value !== "none" && value !== "hidden";
        } else if (attr === "opacity") {
            value = parseFloat(value);
        } else if (attr === "textAnchor") {
            value = (value === "start" ? "left" : value === "end" ? "right" : value === "middle" ? "center" : "left");
        } else if (attr === "paintFirst") {
            let fillIndex = value.indexOf("fill");
            let strokeIndex = value.indexOf("stroke");
            let value = "fill";
            if (fillIndex > -1 && strokeIndex > -1 && strokeIndex < fillIndex) {
                value = "stroke";
            } else if (fillIndex === -1 && strokeIndex > -1) {
                value = "stroke";
            }
        } else if (attr === "imageSmoothing") {
            value = (value === "optimizeQuality");
        } else if (attr == "" || attr == "class" || attr == "stroke" || attr == "fill" || attr == "fillRule") {
            // 字符串类型
            value = value.replaceAll(/\s+/g, "");
        } else if (attr == "lineCap" || attr == "lineJoin") {    // "miterLimit" 为数字类型
            // 字符串类型
            value = value.trim();
        } else if (attr == "font" || attr == "fontName" || attr == "fontStyle" || attr == "fontWeight" || attr == "textDecoration" || attr == "textAnchor") {
            // 字符串类型
            value = value.trim();
        } else if (attr == "strokeWidth") {    // 线宽可能带单位，此处返回字符串
            // 字符串类型
            value = value.trim();
        } else {
            // 转换为数字类型
            value = Array.isArray(value) ? value.map(function (num) {
                return getFloatVal(num, {}, nodeData)
            }) : getFloatVal(value, {}, nodeData);
        }
        return value;
    }

    /**
     * 获取指定名称的样式
     * @param {String} classNames 样式名称或节点类型名称，引用多个名称时，名称之间使用空格分隔
     * @returns style
     */
    _getClassStyleByName(classNames, parentAttr) {
        let classArr = classNames.trim().split(/\s*,\s*|\s+/);
        let style = {};
        let that = this;
        classArr.forEach(className => {
            let styleDef = that.styleCollection["." + className];
            if (styleDef == null) styleDef = this.styleCollection[className];
            Object.assign(style, parentAttr, styleDef);
        })
        return style;
    }

    /**
     * 获取颜色值
     * @param {String} strColor 
     * @param {Number} opacity 
     * @returns ColorString
     */
    _getColor(strColor, opacity, geometry) {
        if (strColor == null) {
            if (opacity == null) {
                return null;
            } else {
                let color = Color.fromString("#000000");
                color.a = parseFloat(opacity);
                return color.toString();
            }
        } else if (strColor.toLowerCase() == "none") {
            return "none";
        } else if (strColor.indexOf("url") >= 0) {
            // url中的ID有两种写法：url(#name)或url("#name")
            let id = strColor.substring(strColor.indexOf("url") + 5, strColor.lastIndexOf(")"));
            let firstChat = id.substring(0, 1);
            if (firstChat == "#") {
                id = id.substring(1, id.length - 1);
            }

            // 获取渐变参数
            let elem = this.gradientNodeList[id];
            if (elem != null) {
                if (elem.getAttribute("xlink:href")) {
                    this._parseGradientsXlink(elem);
                }
                return parseGradient(elem.cloneNode(true), { "width": this.document.getDocumentWidth(), "height": this.document.getDocumentHeight() }).clone();
            } else if (this.patternList[id] != null) {
                return getPatternObject(this.patternList[id], geometry);
            } else {
                return "#CCCCCC";
            }
        } else {
            if (strColor === "transparent") {
                return "#FFFFFF00";
            } else {
                let color = Color.fromString(strColor);
                if (opacity != null) {
                    let a = color.a == null ? 1 : color.a;
                    color.a = a * parseFloat(opacity);    // 有效的值范围是 0.0（完全透明）到 1.0（完全不透明），默认是 1.0。
                }
                // console.info(strColor, opacity, color, color.toString());
                return color == null ? null : color.toString();
            }
        }
        //return (strColor == parseInt(strColor) ? "#" + strColor : strColor);
    }

    /**
     * 解析填充图案pattern
     * @param {*} element 
     * @param {*} geomList 
     */
    parsePatternElement(element, geomList) {
        //let patternContentUnits = element.getAttribute('patternContentUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
        let patternUnits = element.getAttribute('patternUnits') === 'userSpaceOnUse' ? 'pixels' : 'percentage',
            patternTransform = element.getAttribute('patternTransform') || '',
            viewBox = element.getAttribute('viewBox') || "";

        let x = element.getAttribute('x') || "0",
            y = element.getAttribute('y') || "0",
            width = element.getAttribute('width') || "0",
            height = element.getAttribute('height') || "0";

        // 分析引用
        if (element.getAttribute("xlink:href")) {
            this._parseParrernXlink(element, geomList);
        }

        // 构造渐变对象
        let id = element.getAttribute("id");
        let gradientData = {
            id: id,
            x: x,
            y: y,
            width: width,
            height: height,
            viewBox: viewBox,
            patternUnits: patternUnits,
            patternTransform: patternTransform,
            geomList: geomList
        };
        this.patternList[id] = gradientData;
    }

    /**
     * 解析pattern引用的节点数据
     * @param {*} el 
     */
    _parseParrernXlink(el, geomList) {
        let xlinkAttr = "xlink:href";
        let xLink = el.getAttribute(xlinkAttr).slice(1);
        let refParrern = this.patternList[xLink];

        let patternAttrs = [
            "patternTransform",
            "patternUnits",
            "x", "y", "width", "height"];

        // 递归解析引用关系，暂未处理循环引用
        if (refParrern && refParrern.getAttribute(xlinkAttr)) {
            this._parseParrernXlink(refParrern);
        }

        // 将引用对象的属性添加到当前对象中
        patternAttrs.forEach(function (attr) {
            if (refParrern && !el.hasAttribute(attr) && refParrern.hasAttribute(attr)) {
                el.setAttribute(attr, refParrern.getAttribute(attr));
            }
        });

        // 解析stop子节点
        if (geomList.length == 0 && refParrern && refParrern.geomList && refParrern.geomList.length) {
            refParrern.geomList.forEach(geom => {
                geomList.push(geom.clone());
            })
        }
        el.removeAttribute(xlinkAttr);
    }

    /**
     * 解析渐变样式
     * @param {*} element 
     */
    parseGradients(element) {
        // 解析渐变色定义
        let linearNodes = element.getElementsByTagName("linearGradient");
        for (let x = 0, xx = linearNodes.length; x < xx; x++) {
            let el = linearNodes[x];
            this.gradientNodeList[el.getAttribute("id")] = el;
        }

        // 解析渐变色定义
        let radialNodes = element.getElementsByTagName("radialGradient");
        for (let x = 0, xx = radialNodes.length; x < xx; x++) {
            let el = radialNodes[x];
            this.gradientNodeList[el.getAttribute("id")] = el;
        }
    }

    /**
     * 解析gradient引用的节点数据
     * @param {*} el 
     */
    _parseGradientsXlink(el) {
        let gradientsAttrs = [
            "gradientTransform",
            "x1", "x2", "y1", "y2",
            "gradientUnits",
            "cx", "cy", "r", "fx", "fy"];

        let xlinkAttr = "xlink:href";
        let xLink = el.getAttribute(xlinkAttr).slice(1);
        let refGradient = this.gradientNodeList[xLink];

        // 递归解析引用关系，暂未处理循环引用
        if (refGradient && refGradient.getAttribute(xlinkAttr)) {
            this._parseGradientsXlink(refGradient);
        }

        // 将引用对象的属性添加到当前对象中
        gradientsAttrs.forEach(function (attr) {
            if (refGradient && !el.hasAttribute(attr) && refGradient.hasAttribute(attr)) {
                el.setAttribute(attr, refGradient.getAttribute(attr));
            }
        });

        // 解析stop子节点
        if (refGradient && !el.children.length) {
            let referenceClone = refGradient.cloneNode(true);
            while (referenceClone.firstChild) {
                el.appendChild(referenceClone.firstChild);
            }
        }
        el.removeAttribute(xlinkAttr);
    }

    /**
     * 解析文字风格
     * @param {*} element 
     * @param {*} eleAttr 
     */
    getTextStyle(element, eleAttr, nodeData) {
        let style = {};

        // 综合字体信息,例如: "bold 36px Verdana, Helvetica, Arial, sans-serif"
        let font = eleAttr.font || "";

        // 字体大小
        let fontSize = this._getFontsize(eleAttr.fontSize, font, nodeData);
        style.fontSize = fontSize;

        // 字体名称
        let fontName = eleAttr.fontName;
        if (fontName == null) {
            // 从font属性中取字体信息
            style.fontName = "Verdana, Helvetica, Arial, sans-serif"; // svg default fontName
        } else {
            style.fontName = eleAttr.fontName;
        }

        // 字体粗细
        // let fontWeight = eleAttr.fontWeight;   // normal | bold | bolder | lighter | <number>
        style.fontBold = (font.indexOf("bold") >= 0 ? 1 : 0);

        // 字体风格
        let fontStyle = eleAttr.fontStyle;   // normal | italic | oblique
        if (fontStyle != null) {
            style.fontItalic = eleAttr.fontStyle == "italic" ? 1 : 0;
        } else {
            style.fontItalic = (font.indexOf("italic") >= 0 ? 1 : 0);
        }

        // 水平对齐方式
        let textAnchor = eleAttr.textAnchor;
        style.textAlign = (textAnchor === "start" || textAnchor === "left") ? "left" :
            (textAnchor === "end" || textAnchor === "right") ? "right" : (textAnchor === "middle" || textAnchor === "center" ? "center" : "left");

        // 垂直对齐方式
        let textBaseline = eleAttr.textBaseline;
        if(textBaseline == null) {
            style.textBaseline = "alphabetic";
        } else {
            // auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical | inherit
            switch (textBaseline) {
                case "auto":
                case "baseline":
                case "alphabetic":
                    style.textBaseline = "alphabetic";
                    break;
                case "before-edge":
                case "text-before-edge":
                case "hanging":
                    style.textBaseline = "top";
                    break;
                case "middle":
                case "central":
                    style.textBaseline = "middle";
                    break;
                case "ideographic":
                case "after-edge":
                case "text-after-edge":
                    style.textBaseline = "bottom";
                    break;
            } 
        }
        return style;
    }

    /**
     * @private
     */
    _getFontsize(fontSize, font, nodeData) {
        let size
        if (fontSize) {
            size = getFloatVal(fontSize, { "zero": false }, nodeData);
        } else if (font) {
            let seg = font.split(/\s+/);
            seg = seg.filter(v => {
                return (getFloatVal(v, {}, nodeData) > 0);
            });
            if (seg.length > 0) {
                size = seg[0];
            }
        }
        return size == null ? 16 : getFloatVal(size, {}, nodeData);
    }

    /**
     * js获取文本显示宽度
     * @param str: 文本
     * @return 文本显示宽度  
     */
    _getTextWidth(str, style) {
        let w = $("body").append($('<span style="' + this._getFontStyle(style) + '" id="textMeasureSvgTextWidth"/>')).find('#textMeasureSvgTextWidth').html(str).width();
        $('#textMeasureSvgTextWidth').remove();
        return w;
    }

    /**
     * @private
     */
    _getFontStyle(style) {
        let fontStyle = "";

        // 1、从样式中获取字体尺寸
        let fontSize = style.fontSize;

        // 2、判断样式中是否包含scale属性
        if (style.scale != null && typeof (style.scale) === "number") {
            fontSize = fontSize * style.scale;
        }
        if (fontSize > 0) {
            fontStyle = "font-size: " + fontSize + "px;";
        }
        if (style.fontName != null) {
            fontStyle += "font-family: " + style.fontName;
        }

        // 如果字体大小等属性没有指定，则查看是否指定了font属性
        if (fontStyle == "" && style.fontStyle != null) {
            fontStyle = style.fontStyle;
        }

        return fontStyle;
    }

    /**
     * 获取节点的一个或多个属性值
     * @private
     * @param {XmlElement} element 
     * @param {Array} attrs 
     * @param {Boolean} isFloat 
     * @returns Object
     */
    _getAttribute(element, attrs) {
        let obj;
        if (Array.isArray(attrs)) {
            obj = {}
            for (let i = 0, ii = attrs.length; i < ii; i++) {
                obj[attrs[i]] = this.getNodeProp(element, attrs[i]);
            }
        } else {
            obj = this.getNodeProp(element, attrs);
        }
        return obj;
    }

    /**
     * 从节点中获取样式，样式信息要么包含在属性中，要么包含在属性Style中，属性优先级>style
     * @private
     * @param {XmlElement} element 
     * @param {String} name 
     * @returns StringValue 
     */
    getNodeProp(element, name) {
        let value;
        try {
            value = element.getAttribute(name);
        } catch (e) {
            return null;
        }
        if (value != null) {
            return value;
        } else {
            let style = element.getAttribute("style");
            if (style == null) {
                return null;
            } else {
                let obj = {};
                let segs = style.split(";");
                for (let i = 0, ii = segs.length; i < ii; i++) {
                    let seg = segs[i].trim();
                    let idx = seg.indexOf(":");
                    if (idx < 1) continue;
                    let key = seg.substring(0, idx);
                    let val = seg.substring(idx + 1);
                    obj[key.trim()] = val.trim();
                }
                return obj[name.trim()];
            }
        }
    }
}

export default SvgStyle;

