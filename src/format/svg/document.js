import { Text, Circle, Ellipse, Polyline, Rect, Polygon, Symbol, Image, Path, Clip, Group } from "../../geom/index.js";
import Counter from "../../util/counter.js";
import Extent from "../../spatial/extent.js";
import Transform from "../../spatial/transform.js";
import { XmlUtil, ClassUtil } from "../../util/index.js";
import SvgPath from "./path.js";
import SvgStyle from "./style.js";
import SvgSymbol from "./symbol.js";
import { parseViewBox, parseTransform, getFloatVal } from "./parse.js"

/**
 * SVG文件解析 <br>
 * SVG规范参见：https://www.w3.org/TR/SVG2/Overview.html
 */
class SvgDocument {
    constructor(options) {
        // svg文件中定义的符号
        this.symbolManager = options.symbol == null ? new SvgSymbol() : options.symbol;

        // 组对象集合
        this.groupList_ = {};

        // 具有ID属性的geomery集合，该集合中的对象可以被use引用
        this.geometryList_ = {};

        // svg文档属性(svg节点中的信息)
        this.documentInfo_ = {};

        // 画板宽高
        this.canvasWidth_ = options.canvasWidth == null ? 1920 : options.canvasWidth;
        this.canvasHeight_ = options.canvasHeight == null ? 1080 : options.canvasHeight;

        this.maxX_ = -Infinity;
        this.maxY_ = -Infinity;
        this.minX_ = Infinity;
        this.minY_ = Infinity;

        // 计数器
        this.counter = new Counter("SvgFormat");

        // readFeatures执行完毕后的回调
        this.readyCallback_ = options.ready;

        // 样式解析对象
        this.styleParse_ = new SvgStyle(this);

        // 
        this.uidNum_ = 0;
    }

    /**
     * 解析文档
     * @param {Document} xmldoc 
     * @returns ArrayList<Geomertry> list
     */
    parse(xmldoc) {
        // 解析SVG节点信息
        let rootNode = this._parseRootElement(xmldoc);
        this.documentInfo_ = rootNode;

        // 解析样式及符号
        this._parseDefs(xmldoc, rootNode);

        // 解析文档中的样式
        this._parseStyleDef(xmldoc, rootNode);

        // 解析文档中渐变色定义
        this.getStyleParse().parseGradients(xmldoc)

        // 解析填充图案定义
        this._parsePattern(xmldoc);

        // 解析文档中的符号
        this._parseSymbol(xmldoc, rootNode);

        // 逐个解析节点
        let geomList = [];

        // 解析文档内容
        this._parseElements(xmldoc.childNodes, rootNode, geomList);

        // 根据viewBox的范围对图形进行裁切
        if (rootNode.viewBox.length > 0) {
            //let coords = []
            //coords.push([rootNode.viewBox[0], rootNode.viewBox[1]]);
            //coords.push([rootNode.viewBox[2], rootNode.viewBox[3]]);
            //geomList.unshift(new Clip(coords));
        }

        // 文档解析后的回调
        if (typeof (this.readyCallback_) === "function") {
            this.readyCallback_({ "document": rootNode, geomList });
        }

        return geomList;
    }

    /**
     * 解析根节点
     * @param {Document} xmldoc 
     * @returns document info
     */
    _parseRootElement(xmldoc) {
        let getSizeVal = function (size) {
            if (size != null) {
                size = size.trim();
                if (size == "" || size.substring(size.length - 1) == "%") {
                    size == null;
                } else {
                    size = getFloatVal(size);
                }
            }
            return size;
        }

        let elements = xmldoc.getElementsByTagName("svg");
        if (elements.length > 0) {
            let width = elements[0].getAttribute("width");
            let height = elements[0].getAttribute("height");
            let bbox = parseViewBox(elements[0].getAttribute("viewBox"));
            return { "nodeType": "root", "viewBox": bbox, "width": getSizeVal(width), "height": getSizeVal(height) };
        } else {
            throw new Error("inValidate svg file");
        }
    }

    /**
     * 解析文档的初始定义节点，该节点包含了全局样式和符号定义等信息
     * @param {*} xmldoc 
     */
    _parseDefs(xmldoc) {
        let elements = xmldoc.getElementsByTagName("defs");
        for (let i = 0, ii = elements.length; i < ii; i++) {
            // 解析样式
            this._parseStyleDef(elements[i]);

            // 解析符号定义
            this._parseSymbol(elements[i]);

            // 解析渐变色定义
            this.getStyleParse().parseGradients(elements[i]);

            // 解析填充图案定义（由于填充对象存在geom子节点，因此需在该对象中将子节点解析完成之后，在访问style的解析功能）
            this._parsePattern(elements[i]);

            // 解析其他节点
            let geomList = [];
            this._parseElements(elements[i].childNodes, { "nodeType": "defs" }, geomList, null, true);
        }
        for (let i = 0, ii = elements.length; i < ii; i++) {
            elements[0].remove();
        }
    }

    /**
     * 解析符号
     * @param {Element} element 
     */
    _parseSymbol(element) {
        let symbolElements = element.getElementsByTagName("symbol");
        for (let x = 0, xx = symbolElements.length; x < xx; x++) {
            let geomList = [];
            let el = symbolElements[x];
            let id = el.getAttribute("id");
            let viewBox = parseViewBox(el.getAttribute("viewBox"));
            this._parseElements(el.childNodes, { "nodeType": "symbol" }, geomList);
            this.symbolManager.addSymbol(id, geomList, viewBox)
        }
    }

    /**
     * 解析样式
     * @param {Element} element 
     */
    _parseStyleDef(element) {
        let styleElements = element.getElementsByTagName("style");
        for (let x = 0, xx = styleElements.length; x < xx; x++) {
            this.getStyleParse().parseStyleElement(styleElements[x]);
        }
    }

    /**
     * 解析填充图案
     * @param {Element} element 
     */
    _parsePattern(element) {
        let patternElements = element.getElementsByTagName("pattern");
        for (let x = 0, xx = patternElements.length; x < xx; x++) {
            let el = patternElements[x];
            let geomList = [];
            this._parseElements(el.childNodes, { "nodeType": "def" }, geomList);
            this.getStyleParse().parsePatternElement(el, geomList);
        }
    }

    /**
     * 解析文档中某个节点的子节点集
     * @param {Array} elements 待解析的节点集
     * @param {Array} geomList 渲染对象集合
     * @param {Array} childList group geom list
     * @param {Object} parentNode 父节点
     * @param {Boolean} isDefNode 当前解析的节点是否为defs中的子节点
     * @private 
     */
    _parseElements(elements, parentNode, geomList, childList, isDefNode = false) {
        for (let i = 0, ii = elements.length; i < ii; i++) {
            let element = elements[i];
            if (ClassUtil.typeof(element) === "DocumentType") continue;

            let nodeData = this._parseElement(element, geomList, childList, parentNode, isDefNode);
            if (nodeData.nodeType === "shape") {
                continue;
            } else if (nodeData.nodeType === "def") {
                continue;
            } else if (nodeData.nodeType === "other") {
                continue;
            } else {
                // group element
                if (element.childNodes.length > 0) {
                    let groupGeomList = [];
                    this._parseElements(element.childNodes, nodeData, geomList, groupGeomList, isDefNode);
                    if (nodeData.id != null && groupGeomList.length > 0) {
                        this._saveGroup(nodeData.id, groupGeomList, nodeData);
                    }
                }
            }
        }
    }

    /**
     * 解析svg中节点
     * @param {XmlElement} element 
     * @param {Array} geomList 
     * @returns Object {nodeType:"shape/g/other"}
     */
    _parseElement(element, geomList, groupGeomList, parentNode, isDefNode) {
        let nodeData = { "nodeType": "other", "parentNode": parentNode };
        if (element == null || element.nodeName == null || element.nodeName == "" || element.nodeName == "desc" ||
            element.nodeName == "#text" || element.nodeName == "#comment" ||
            element.nodeName == "style" || element.nodeName == "radialGradient" || element.nodeName == "linearGradient") {
            return nodeData;
        }

        // 解析样式信息
        let eleAttr = this.getStyleParse().getElementAttr(element, parentNode == null ? null : parentNode.eleAttr, nodeData);
        nodeData.eleAttr = eleAttr;

        // 解析旋转、缩放、平移等信息
        let transData = parseTransform(element.getAttribute("transform"));
        if (transData.length > 0) {
            // 处理从父对象继承到的transData属性, transform的顺序为：先父亲后自己
            if (eleAttr.transData != null && eleAttr.transData.length > 0) {
                eleAttr.transData = eleAttr.transData.concat(transData);
            } else {
                eleAttr.transData = transData;
            }
        }

        // 解析节点中的信息
        let id = element.getAttribute("id");
        let offsetX = parentNode != null && !isNaN(parentNode.x) ? parentNode.x : 0;
        let offsetY = parentNode != null && !isNaN(parentNode.y) ? parentNode.y : 0;
        if (offsetX > 0 || offsetY > 0) {
            eleAttr.transData.unshift({ "action": "translate", "value": [offsetX, offsetY] });
        }

        if (element.nodeName === "g" || element.nodeName === "svg" || element.nodeName == "switch") {
            let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
            let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
            let width = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
            let height = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
            let bbox = parseViewBox(element.getAttribute("viewBox"));
            nodeData = Object.assign(nodeData, { "nodeType": "g", id, eleAttr, x, y, width, height, "viewBox": bbox });
        } else if (element.nodeName === "pattern") {
            nodeData = { "nodeType": "other" };
        } else {
            let geometry;
            let properties = {}; //this.topoService.parseProperties(element);
            let style = {};

            nodeData = Object.assign(nodeData, { "nodeType": "shape", id, eleAttr });

            // 解析几何对象
            if (element.nodeName === "line") {
                // 线段
                let x1 = getFloatVal(element.getAttribute("x1"), { "isX": true }, nodeData);
                let y1 = getFloatVal(element.getAttribute("y1"), { "isX": false }, nodeData);
                let x2 = getFloatVal(element.getAttribute("x2"), { "isX": true }, nodeData);
                let y2 = getFloatVal(element.getAttribute("y2"), { "isX": false }, nodeData);
                let coords = [[x1, y1], [x2, y2]];
                geometry = new Polyline({coords, style, properties});
                this.counter.add("line");
            } else if (element.nodeName === "polyline") {
                // 折线
                let str = element.getAttribute("points");
                if (str != null) {
                    let seq = str.trim().split(/\s*,\s*|\s+/);
                    let coords = [];
                    for (let j = 0, jj = seq.length; j < jj; j += 2) {
                        coords.push([getFloatVal(seq[j], { "isX": true }, nodeData), getFloatVal(seq[j + 1], { "isX": false }, nodeData)]);
                    }
                    geometry = new Polyline({coords, style, properties});
                }
                this.counter.add("polyline");
            } else if (element.nodeName === "path") {

                // 路径
                let str = this.getStyleParse().getNodeProp(element, "d");
                if (str != null) {
                    let path = SvgPath.parse(str);
                    let commands = path.commands;
                    let childGeometrys = path.childGeometrys;
                    let coords = path.coords;
                    geometry = new Path({coords, style, commands, childGeometrys, properties});
                    this.counter.add("path");
                }
            } else if (element.nodeName === "circle") {
                // 圆
                let x = getFloatVal(element.getAttribute("cx"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("cy"), { "isX": false }, nodeData);
                let radius = getFloatVal(element.getAttribute("r"), { "isX": true }, nodeData);
                geometry = new Circle({x, y, radius, style, properties});
                this.counter.add("circle");
            } else if (element.nodeName === "ellipse") {
                let x = getFloatVal(element.getAttribute("cx"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("cy"), { "isX": false }, nodeData);
                let radiusX = getFloatVal(element.getAttribute("rx"), { "isX": true }, nodeData);
                let radiusY = getFloatVal(element.getAttribute("ry"), { "isX": false }, nodeData);
                geometry = new Ellipse({x, y, radiusX, radiusY, style, properties});
                this.counter.add("ellipse");
            } else if (element.nodeName === "polygon") {
                // 多边形
                let str = element.getAttribute("points");
                if (str != null) {
                    let seq = str.trim().split(/\s*,\s*|\s+/);
                    let coords = [];
                    for (let j = 0, jj = seq.length; j < jj; j += 2) {
                        coords.push([getFloatVal(seq[j], { "isX": true }, nodeData), getFloatVal(seq[j + 1], { "isX": false }, nodeData)]);
                    }
                    if (coords.length > 2) {
                        geometry = new Polygon({coords, style, properties});
                        this.counter.add("polygon");
                    }
                }
            } else if (element.nodeName === "rect") {
                // 矩形
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
                // 圆角矩形属性
                let rx = getFloatVal(element.getAttribute("rx"), { "isX": true }, nodeData);
                let ry = getFloatVal(element.getAttribute("ry"), { "isX": false }, nodeData);
                
                geometry = new Rect({ x, y, rx, ry, "width":w, "height":h, style, properties });
                this.counter.add("rect");
            } else if (element.nodeName === "use") {
                // 符号引用
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);

                let name = element.getAttribute("xlink:href");
                if (name == null) {
                    name = element.getAttribute("href");
                }
                let symbol = this.symbolManager.getSymbol(name, properties.objectID);
                if (symbol != null) {
                    if (w == 0 || h == 0) {
                        w = symbol.bbox[2] - symbol.bbox[0];
                        h = symbol.bbox[3] - symbol.bbox[1];
                    }
                    geometry = new Symbol({
						"x": x + w / 2,
                        "y": y + h / 2,
						"symbol": { "symbolName": name, "childGeometrys": symbol.data, "width": symbol.width, "height": symbol.height, "bbox": symbol.bbox }, 
						"width": w, 
						"height": h,
                        "style": Object.assign(style, { "addBorder": false }),
                        "properties": properties});
                } else {
                    let group = this._getGroup(name);
                    if (group != null) {
                        let coords = [[x, y], [group.extent[0], group.extent[1]], [group.extent[2], group.extent[3]]];
                        if (w == 0 || h == 0) {
                            w = Extent.getWidth(group.extent);
                            h = Extent.getHeight(group.extent);
                        }
                        if (eleAttr.transData == null) {
                            eleAttr.transData = [];
                        }
                        eleAttr.transData.push({ "action": "translate", "value": [x, y] });
                        let bbox = group.viewBox;
                        geometry = new Group({coords,
                            "style": Object.assign(style, { "addBorder": false, "width": w, "height": h, "viewBox": bbox }),
                            "childGeometrys": group.geometryList,
                            "extent": group.extent,
                            "properties": {}});
                    } else {
                        let geom = this._getGeometry(name);
                        if (geom != null) {
                            if (eleAttr.transData == null) {
                                eleAttr.transData = [];
                            }
                            eleAttr.transData.push({ "action": "translate", "value": [x, y] });
                            geometry = geom;
                        }
                    }
                }
                this.counter.add("use");
            } else if (element.nodeName === "text") {
                // 文本
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let text = this._getNodeText(element);
                geometry = new Text({x, y, style, text, properties});
                this.counter.add("text");
            } else if (element.nodeName === "image") {
                let x = getFloatVal(element.getAttribute("x"), { "isX": true }, nodeData);
                let y = getFloatVal(element.getAttribute("y"), { "isX": false }, nodeData);
                let w = getFloatVal(element.getAttribute("width"), { "isX": true }, nodeData);
                let h = getFloatVal(element.getAttribute("height"), { "isX": false }, nodeData);
                let xlink = element.getAttribute("xlink:href");
                let href = element.getAttribute("href");
                if (xlink == null && href == null) {
                    console.error("image argument error");
                } else {
                    geometry = new Image({
                        "style": style,
                        "properties": properties,
						"src": (href == null ? xlink : href),
                        "uid": (href != null ? href : this.getUID()),
                        "x": x,
                        "y": y,
                        "width": w, 
                        "height": h
                    });
                    this.counter.add("image");
                }
            } else if (element.nodeName === "title" || element.nodeName == "desc") {
                nodeData.nodeType = "other";
            } else {
                nodeData.nodeType = "other";
                console.info("unknow type:", element.nodeName);
            }

            if (geometry != null) {
                // 1. 创建过程附加的style
                let addStyle = geometry.getStyle();

                // 2. element中包含的style
                style = this.getStyleParse().getGeomStyle(geometry, eleAttr, nodeData);

                // 合并至对象样式中
                geometry.setStyle(Object.assign({}, addStyle, style));

                // 数据Load之后进行矩阵变换，然后交由GB进行渲染
                geometry.transform(Transform.createByData(eleAttr.transData));

                // 加入到结果集中
                if (!isDefNode) geomList.push(geometry);
                // 加入到Geomerty中
                if (nodeData.id != null) {
                    this._saveGeometry(nodeData.id, geometry);
                }
                // 加入组对象中
                if (groupGeomList != null) groupGeomList.push(geometry);
            }
        }

        return nodeData;
    }

    /**
     * 添加至组对象集合中
     * @param {*} id 
     * @param {*} list 
     * @param {*} attr 
     */
    _saveGroup(id, list, attr) {
        this.groupList_["#" + id] = { attr, list };
    }

    /**
     * 获取分组对象
     * @param {*} id 
     */
    _getGroup(id) {
        let group = this.groupList_[id];
        if (group == null) {
            return null;
        } else {
            console.info("use group" + id);
            let geometryList = [];
            let extent = Extent.createEmpty();
            for (let i = 0, ii = group.list.length; i < ii; i++) {
                let innerObj = group.list[i].clone();
                let objBBox = innerObj.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
                geometryList.push(innerObj);
            }

            return Object.assign({}, group.attr, { geometryList, extent });
        }
    }

    /**
     * 
     * @param {*} id 
     * @param {*} geometry 
     */
    _saveGeometry(id, geometry) {
        this.geometryList_["#" + id] = geometry;
    }

    _getGeometry(id) {
        let geometry = this.geometryList_[id];
        if (geometry == null) {
            return null;
        } else {
            console.info("use geometry" + id);
            return geometry.clone();
        }
    }

    _getNodeText(node) {
        let text = "";
        if (node.childNodes) {
            for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
                let val = node.childNodes[i].nodeValue;
                val = (val == null ? XmlUtil.getNodeValue(node.childNodes[i]).trim() : val.trim());
                text += val + " ";
            }
        }
        return text.trim();
    }

    getStyleParse() {
        return this.styleParse_;
    }

    /**
     * 文档宽度，viewBox优先，svg中的width其次，两者都为空时取canvas的宽度
     * 该属性可用于计算百分比的宽高
     * @returns width
     */
    getDocumentWidth() {
        let bbox = this.documentInfo_.viewBox;
        if (bbox != null && bbox.length > 0) {
            return bbox[2] - bbox[0];
        } else {
            return this.documentInfo_.width == null ? this.canvasWidth_ : this.documentInfo_.width;
        }
    }

    /**
     * 文档高度，viewBox优先，svg中的height其次，两者都为空时取canvas的高度
     * 该属性可用于计算百分比的宽高
     * @returns height
     */
    getDocumentHeight() {
        let bbox = this.documentInfo_.viewBox;
        if (bbox != null && bbox.length > 0) {
            return bbox[3] - bbox[1];
        } else {
            return this.documentInfo_.height == null ? this.canvasHeight_ : this.documentInfo_.height;
        }
    }

    /**
     * 获取文档信息
     * @returns Object
     */
    getDocumentInfo() {
        return this.documentInfo_;
    }

    getUID(pre = "ID_") {
        this.uidNum_++;
        return pre + this.uidNum_;
    }
}

export default SvgDocument;
