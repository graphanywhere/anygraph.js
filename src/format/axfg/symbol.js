import { Point, Circle, Polyline, Rect, Polygon, Ellipse, Text } from "../../geom/index.js";
import BaseSymbol from "../symbol/base.js";
import { AjaxUtil, XmlUtil, UrlUtil, ClassUtil } from "../../util/index.js";
import Layer from "../../layer.js";

/**
 * 符号文件名路径
 */
const AXFG_SYMBOL_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_symbol.xml";

/**
 * 是否渲染端子
 */
const AXFG_DRAW_PIN = true;


/**
 * 由GROW转出的以CIMG格式的符号集合
 */
class AxfgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
        this.originAtLeftTop = true;
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }
    }

    /**
     * 下载符号文件，并装载数据
     * @param {String} fileUrl 
     */
    load(callback, fileUrl = AXFG_SYMBOL_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: fileUrl.indexOf(".awg") > 0 ? "arraybuffer" : "xml",
            async: true,
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getSymbolsFromBuffer(data);
                }
                if (typeof (data) === "string") {
                    data = XmlUtil.loadXML(data);
                }
                let symbols = that.loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(symbols);
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    /**
     * 装载数据
     * @param {Object} data 符号数据
     */
    loadData(xmldoc) {
        // 逐个符号分析其属性和shape
        let symbolNodes = XmlUtil.selectNodes(xmldoc, "//Symbol");
        for (let i = 0, ii = symbolNodes.length; i < ii; i++) {
            let symbol = this._analyzeSymbol(symbolNodes[i]);
            if (this.originAtLeftTop === false) {
                symbol.originAtLeftTop = false;
            }
            if (symbol != null) {
                this.symbolCollection_[symbol.id] = symbol;
            }
        };
        return this.symbolCollection_;
    }

    /**
     * 分析符号数据
     * @param {XmlElement} node 
     */
    _analyzeSymbol(node) {
        let name = node.getAttribute("name");
        let width = parseFloat(node.getAttribute("w"));
        let height = parseFloat(node.getAttribute("h"));
        let alignCenter = node.getAttribute("AlignCenter");
        let id = node.getAttribute("id");
        let stateCount = node.getAttribute("state");

        let layerNode = node.getElementsByTagName("Layer");
        let layers = [];
        for (let x = 0, xx = layerNode.length; x < xx; x++) {
            let data = [];
            for (let i = 0, ii = layerNode[x].childNodes.length; i < ii; i++) {
                let geomObj = this._analyzeSymbolShape(layerNode[x].childNodes[i]);
                if (geomObj != null) {
                    data.push(geomObj);
                }
            }
            layers.push(data);
        }
        let bbox = [0, 0, width, height];
        return { id, name, width, height, stateCount, alignCenter, layers, bbox };
    }

    /**
     * adam symbol 符号的宽高通常为[1,1]，其原点为[-0.5, -0.5],坐标范围为-0.5~0.5
     * Symbol渲染该符号时的原点是[0,0]，因此解析几何数据时的坐标均偏移0.5，即：x=x+0.5, y=y+0.5
     */
    _analyzeSymbolShape(node) {
        if (node == null || node.nodeName == null || node.nodeName == "" || node.nodeName == "#text" || node.nodeName == "#comment") return null;
        let geoObj;
        let lineWidth = node.getAttribute("lw") == null ? 1 : parseFloat(node.getAttribute("lw"));
        let lineType = node.getAttribute("ls") == null ? 1 : parseFloat(node.getAttribute("ls"));
        let color = this._getColor(node.getAttribute("lc"));
        let rotate = this._analyzeRotate(node.getAttribute("tfr"));
        let fm = node.getAttribute("fm");
        let fillStyle = (fm == null || fm == "0" ? 0 : 1);
        let fillColor = this._getColor(node.getAttribute("fc"));
        let state = parseInt(node.getAttribute("sta") == null ? "0" : node.getAttribute("sta"));

        // 样式
        let style = (color == null ? { fillStyle, fillColor, lineWidth } : { color, fillStyle, fillColor, lineWidth });
        if (lineType === 2) {
            style = Object.assign({ dash: [5, 3] }, style);
        }
        // 属性
        let properties = { state };

        // 分析几何对象
        if (node.nodeName.toLowerCase() === "line") {
            // <line fm="1" id="0" sta="0" LevelStart="0" x1="0" x2="0" y1="0" y2="-0" d="0,0 0,-0" tfr="rotate(0)" LevelEnd="0" ls="1" lw="1" lc="0,255,0" StartArrowType="0" StartArrowSize="4" EndArrowSize="4" p_ShowModeMask="3" switchapp="1" p_DyColorFlag="0" af2="0" af3="7" EndArrowType="0" af4="0" af="32897" fc="0,255,0" p_AssFlag="128"/>
            let x1 = parseFloat(node.getAttribute("x1")) + 0.5;
            let y1 = parseFloat(node.getAttribute("y1")) + 0.5;
            let x2 = parseFloat(node.getAttribute("x2")) + 0.5;
            let y2 = parseFloat(node.getAttribute("y2")) + 0.5;
            geoObj = new Polyline({ "coords": [[x1, y1], [x2, y2]], "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "polyline") {
            //<polyline fm="0" sta="0" LevelStart="0" tfr="rotate(0)" LevelEnd="0" ls="1" lw="1" id="0" p_AssFlag="128" lc="0,0,255" fc="255,255,255" p_ShowModeMask="3" switchapp="1" p_DyColorFlag="0" af="32897" af2="0" af3="7" af4="0" StartArrowType="0" StartArrowSize="4" EndArrowSize="4" EndArrowType="0" d="0,-0 0,-0 -0,-0 -0,0 0,0 0,0 -0,0 -0,0 0,0 0,0 " />
            // d="0,-0 0,-0 -0,-0 -0,0 0,0 0,0 -0,0 -0,0 0,0 0,0 "
            let d = node.getAttribute("d");
            geoObj = new Polyline({ "coords": this._getCoords(d), "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "rect") {
            let x = parseFloat(node.getAttribute("x")) + 0.5;
            let y = parseFloat(node.getAttribute("y")) + 0.5;
            let width = parseFloat(node.getAttribute("w"));
            let height = parseFloat(node.getAttribute("h"));
            if (this.originAtLeftTop === true) {
                geoObj = new Rect({ x, y, width, height, "rotation": rotate, style, properties })
            } else {
                geoObj = new Rect({ x, y, width, height, "rotation": rotate, style, properties })
            }
            // geoObj = new Rect({ x, y, "width":w, "height":h, style, properties });

        } else if (node.nodeName.toLowerCase() === "circle" || node.nodeName.toLowerCase() == "circlearc") {
            //<circle cx="0.000000" cy="0.000000" ls="1" fm="1" r="0.375000" LevelStart="0" LevelEnd="0"/>
            let x = parseFloat(node.getAttribute("cx")) + 0.5;
            let y = parseFloat(node.getAttribute("cy")) + 0.5;
            let radius = parseFloat(node.getAttribute("r"));
            geoObj = new Circle({ x, y, radius, style, properties });

        } else if (node.nodeName.toLowerCase() === "ellipse") {
            //<ellipse cx="0.000500" cy="-0.100000" ls="1" fm="0" rx="0.121500" ry="0.121000" sta="0" LevelStart="0" LevelEnd="0"/>
            let x = parseFloat(node.getAttribute("cx")) + 0.5;
            let y = parseFloat(node.getAttribute("cy")) + 0.5;
            let radiusX = parseFloat(node.getAttribute("rx"));
            let radiusY = parseFloat(node.getAttribute("ry"));
            geoObj = new Ellipse({ x, y, radiusX, radiusY, "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "polygon") {
            let d = node.getAttribute("d");
            geoObj = new Polygon({ "coords": this._getCoords(d), "rotation": rotate, style, properties });

        } else if (node.nodeName.toLowerCase() === "text") {
            // <Text x="-0.216644" y="0.210152" fs="0.429959" tfr="rotate(0.000000)" ts="切" />
            let x = parseFloat(node.getAttribute("x")) + 0.5;
            let y = parseFloat(node.getAttribute("y")) + 0.5;
            let fontSize = parseFloat(node.getAttribute("fs"));
            let text = node.getAttribute("ts");
            y = this.originAtLeftTop === false ? y - fontSize : y;
            geoObj = new Text({
                text, x, y,
                "rotation": rotate,
                "vectorSize": false,
                "width": text.length * fontSize, "height": fontSize,
                "style": Object.assign(style, { "textBaseline": "top", "fontSize": fontSize, "fillStyle": 1, "fontName": "宋体" }),
                "properties": Object.assign(properties, {})
            });

        } else if (node.nodeName.toLowerCase() === "pin") {
            // <pin cx="0.000000" cy="0.375000" r="1" index="0" fm="0" id="1" LevelStart="0" LevelEnd="0" p_AssFlag="128" lc="255,0,0" p_ShowModeMask="3" sta="0" switchapp="1" p_DyColorFlag="0" af="32897" af2="0" af3="7" af4="0" fc="0,0,0" ls="1" lw="1" />
            if (AXFG_DRAW_PIN === true) {
                let x = parseFloat(node.getAttribute("cx")) + 0.5;
                let y = parseFloat(node.getAttribute("cy")) + 0.5;
                let size = parseFloat(node.getAttribute("r"));
                geoObj = new Point({ x, y, size, style, properties });
            }
        } else {
            console.info("未处理的类型", node.nodeName);
        }
        return geoObj;
    }

    // rotate(0)
    _analyzeRotate(tfr) {
        if (tfr == null) return 0;
        let angle = 0;
        if (tfr.indexOf("(") > 0 && tfr.indexOf(")") > 0) {
            angle = parseFloat(tfr.substring(tfr.indexOf("(") + 1), tfr.indexOf(")") - 1);
        }
        return angle;
    }

    _getCoords(path) {
        let list = [];
        let segs = path.trim().split(" ");
        segs.forEach(element => {
            let q = element.split(",")
            list.push([parseFloat(q[0].trim()) + 0.5, parseFloat(q[1].trim()) + 0.5]);
        });
        return list;
    }

    _getColor(colorString) {
        if (colorString == null) return null;
        if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 4) {
            colorString = "rgba(" + colorString + ")";
        } else if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 3) {
            colorString = "rgb(" + colorString + ")";
        }
        return colorString;
    }

    /**
     * 从Buffer中读取符号数据
     * @param {ArrayBuffer} buffer 
     * @returns SymbolCollection
     */
    _getSymbolsFromBuffer(buffer) {

    }
}

export default AxfgSymbol;
