import { Point, Circle, Polyline, Rect, Triangle, Polygon, Ellipse, Text } from "../../geom/index.js";
import BaseSymbol from "./base.js";
import CimgFormat from "../cimg.js";
import { AjaxUtil, UrlUtil } from "../../util/index.js";

/**
 * 中心点坐标位置为已宽高的一半为准，而不是符号中的alignCenter属性
 */
const CIMG_SYMBOL_ALIGN_CENTER_SIZE = true;

/**
 * 符号文件名路径
 */
const CIMG_SYMBOL_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/cimg-symbol.json";

/**
 * 是否渲染端子
 */
const CIMG_DRAW_PIN = true;

/**
 * G符号
 */
class CimgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options)
        this.symbolCollection_ = {};

        this.format = new CimgFormat();
    }

    /**
     * 装载SVG数据
     * @param {String} fileUrl 
     */
    loadFile(callback, fileUrl = CIMG_SYMBOL_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: "json",
            async: true,
            success: function (symbolNodes) {
                that.loadData(symbolNodes);
                // 执行回调
                if (typeof (callback) === "function") {
                    callback();
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    loadData(data) {
        // 逐个符号分析其属性和shape
        for (let i = 0, ii = data.length; i < ii; i++) {
            let symbol = this.analyzeSymbol(data[i]);
            if (symbol != null) {
                this.symbolCollection_[symbol.id] = symbol;
            }
        };
    }

    /**
     * 分析符号数据
     * @param {XmlElement} node 
     */
    analyzeSymbol(symbol) {
        // 外框sharp
        let width = symbol.width;
        let height = symbol.height;
        let name = symbol.name;
        let id = symbol.fileName;
        let stateCount = symbol.stateCount;

        // 中心点坐标位置为已宽高的一半为准，而不是符号中的alignCenter属性
        let alignCenter = (CIMG_SYMBOL_ALIGN_CENTER_SIZE ? (width / 2 + "," + height / 2) : symbol.alignCenter);

        let layers = [];
        for (let x = 0, xx = symbol.layers.length; x < xx; x++) {
            let data = [];
            for (let i = 0, ii = symbol.layers[x].length; i < ii; i++) {
                let geomObj = this._analyzeSymbolShape(symbol.layers[x][i], symbol);
                if (geomObj != null) {
                    data.push(geomObj);
                }
            }
            layers.push(data);
        }
        let bbox = [0, 0, width, height];
        return { id, name, width, height, stateCount, alignCenter, bbox, layers };
    }

    _analyzeSymbolShape(obj, symbol) {
        let geoObj;
        let color = (obj.color == null || obj.color == "null" ? null : "rgb(" + obj.color + ")");
        let fillColor = (obj.fillColor == null || obj.fillColor == "none" ? "none" : "rgb(" + obj.fillColor + ")");
        let fillStyle = (fillColor == "none" ? 0 : 1);
        let style = { color, fillColor, fillStyle, "lineWidth": 1 };
        let properties = { "state": obj.state, "type": obj.type };

        if (obj.type == "pin") {  // 锚点
            if (CIMG_DRAW_PIN === true) {
                let coord = this.format.str2Round(obj.coord);
                // 特殊显示锚点颜色
                geoObj = new Point({
                    "x": coord[0],
                    "y": coord[1],
                    "size": coord[2],
                    "style": Object.assign({}, style, { "fillStyle": 1, "fillColor": "#00FFFF", "color": "#00FF00" }),
                    properties
                });
            }
        } else if (obj.type == "line" || obj.type == "polyline") {
            let coords = this.format.str2Line(obj.coord);
            let startArrowType = obj.startArrowType;
            let startArrowSize = obj.startArrowSize;
            let endArrowType = obj.endArrowType;
            let endArrowSize = obj.endArrowSize;
            let lineStyle = Object.assign({}, style, { "fillColor": "none", startArrowType, startArrowSize, endArrowType, endArrowSize });
            geoObj = new Polyline({
                coords,
                "style": lineStyle,
                properties
            });
        } else if (obj.type == "polygon") {
            let coords = this.format.str2Line(obj.coord);
            geoObj = new Polygon({
                coords,
                "style": Object.assign({}, style, { "fillColor": "none" }),
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "triangle") { // 三角形
            let coords = this.format.str2Rect(obj.coord);
            geoObj = new Triangle({
                coords,
                style,
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "rect") {
            let coords = this.format.str2Rect(obj.coord);
            geoObj = new Rect({
                "x": coords[0][0],
                "y": coords[0][1],
                "width" : coords[1][0] - coords[0][0],
                "height" : coords[1][1] - coords[0][1],
                "rotation": obj.rotate,
                "style": Object.assign({}, style, { "fillColor": "none" }),
                properties
            });
        } else if (obj.type == "circle" || obj.type == "circlearc") {
            let coords = this.format.str2Round(obj.coord);
            geoObj = new Circle({
                "x": coords[0],
                "y": coords[1],
                "radius": coords[2],
                style,
                properties
            });
        } else if (obj.type == "ellipse") {
            let coords = this.format.str2Ellipse(obj.coord);
            geoObj = new Ellipse({
                "x": coords[0],
                "y": coords[1],
                "radiusX": coords[2],
                "radiusY": coords[3],
                style,
                "rotation": obj.rotate,
                properties
            });
        } else if (obj.type == "Text") {
            //example: {"type":"Text", "coord":"15.68,14.88,20,15" ,"color":"0,0,255", "fillColor":"0,255,0", "text":"KG"},
            let coord = this.format.str2Line(obj.coord);
            let textObj = new Text({
                "text": obj.text,
                "x": coord[0][0],
                "y": coord[0][1],
                "rotation": obj.rotate,
                "width": Math.abs(coord[1][0] - coord[0][0]),
                "height": Math.abs(coord[1][1] - coord[0][1]),
                "vectorSize": false,
                "style": Object.assign(style, { "fillPrior": true, "fontName":"黑体", "textBaseline":"top" }),
                "properties": properties
            });
            geoObj = textObj;
        } else {
            console.debug("未支持的几何类型: " + obj.type, symbol.id, symbol.fileName)
        }

        return geoObj;
    }
}

export default CimgSymbol;
