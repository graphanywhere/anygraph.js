import { Point, Polyline, Polygon, Symbol, Text } from "../geom/index.js";
import FeatureFormat from "./feature.js";
import Counter from "../util/counter.js";

/**
 * CIM/G 数据格式解析
 */
class CimgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        this.symbolManager = options.symbol;
        //this.layerConfiguration = options.style;
        this.counter = new Counter("CimgFormat");
    }

    /**
     * 装载图形数据（该数据由Interface2020.jar程序转换CIM/G单线图数据转换而来）
     * @param {*} data 
     * data example:
     * [
     *     {"type":"polygon", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":",1000.642090,599.762939,1000.642090,603.240295,1004.922180,603.240295,1004.922180,599.762939,1000.642090,599.762939,"},
     *     {"type":"zhkg", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"566.608704,474.016632"},
     *     {"type":"ConnectLine", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"null,null"},
     *     {"type":"FeedLine", "lineWidth":1, "lineType":1, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"866.555908,1954.831421,866.117126,1954.333862,864.116577,1952.285156,864.032654,1951.949707,864.260254,1951.554321,868.130127,1948.307495,890.904602,1926.813843,893.152771,1925.015259"},
     *     {"type":"Text", "lineWidth":1, "lineType":1, "text":"国", "fontName":"宋体", "fontSize":0.086581, "scaleX":1.000000, "scaleY":1.000000, "rotate":0.000000, "color":"185,72,66", "fillColor":"185,72,66", "coords":"1562.815186,1058.258057,1562.901733,1058.344604"},
     * ] 
     */
    readData(file) {
        let listData = [];
        let unknow = [];

        // 图形对象
        for (let i = 0, ii = file.nodes.length; i < ii; i++) {
            let obj = file.nodes[i];
            let style = { "color": getCimgColor(obj.color), "fillColor": getCimgColor(obj.fillColor) };
            if (obj.lineWidth >= 0) {
                style.lineWidth = obj.lineWidth;
            }
            let properties = { "tagName": obj.type, "id": obj.id, "name": obj.name };
            if (obj.type == "ConnectLine" || obj.type == "FeedLine" || obj.type == "Bus" || obj.type == "BusDis") {
                let coords = this.str2Line(obj.coords);
                if (obj.lineType === 2) {
                    style = Object.assign({ dash: [5, 3] }, style);
                } else {
                    style = Object.assign({}, style);
                }
                listData.push(new Polyline({ coords, style, properties }));
            } else if (obj.type == "polygon") {
                let coords = this.str2Line(obj.coords);
                style = Object.assign({}, style);
                listData.push(new Polygon({ coords, style, properties }));
            } else if (obj.type == "Text") {
                // obj.coords example: 940.547119,784.570435,944.146362,788.169678
                let coords = this.str2Line(obj.coords);
                listData.push(new Text({
                    "text": obj.text,
                    "vectorSize": true,
                    "x": coords[0][0],
                    "y": coords[0][1],
                    "rotation": obj.rotate,
                    "width": Math.abs(coords[1][0] - coords[0][0]) * obj.text.length,
                    "height": Math.abs(coords[1][1] - coords[0][1]),
                    "style": Object.assign(style, { fontBorder: false, "fontSize": obj.fontSize, "fontName": obj.fontName, "fillPrior": true }),
                    "properties": Object.assign(properties, {})
                }));
            } else {  // 加载符号
                // console.debug("符号<" + obj.type + "> :" + obj.symbolFileName);
                let symbol = this.symbolManager.getSymbol(obj.symbolFileName, 0, 0);
                let coords = this.str2Point(obj.coords);
                style = Object.assign({}, style);
                if (symbol != null) {
                    // CIM/G中符号坐标为未缩放前左上角的坐标
                    // 中心点坐标
                    let centerX = parseFloat(symbol.alignCenter.split(",")[0]);
                    let centerY = parseFloat(symbol.alignCenter.split(",")[1]);
                    listData.push(new Symbol({
                        symbol,
                        "x": coords[0] + centerX,
                        "y": coords[1] + centerY,
                        "rotation": obj.rotate,
                        style,
                        "width": symbol.width * obj.scaleX,
                        "height": symbol.height * obj.scaleY,
                        "properties": Object.assign({}, properties)
                    }));

                    // 调试用：符号外框
                    //listData.push(new Rect({"coords": [leftTopCoord, rightBottomCoord], "style": {color:"#0000FF"}, properties}));
                    // 调试用：符号中心点
                    //listData.push(new Point({"x": coords[0] + centerX, "y": coords[1] + centerY, "style": {color:"#FF0000", fillColor:"#FF0000", size:5}}));
                    // 调试用：cimg中的坐标点
                    //listData.push(new Point({"x": coords[0], "y":coords[1], "style": {color:"#0000FF", fillColor:"#0000FF", size:5}}));    
                } else {
                    listData.push(new Point({
                        "x": coords[0],
                        "y": coords[1],
                        "size": -1,
                        style,
                        properties
                    }));
                    if (unknow.findIndex(val => val == obj.symbolId) < 0) {
                        unknow.push(obj.symbolId);
                    }
                }
            }
        }

        if (unknow.length > 0) {
            console.warn("缺少CIM/G符号:" + unknow.join(","));
        }
        return listData;
    }

    /**
     * 字符串坐标转换为点坐标
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords 
     */
    str2Point(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 1) {
            return [parseFloat(seg[0]), parseFloat(seg[1])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的点坐标");
        }
    }

    /**
     * 字符串坐标转换为多点坐标
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords 
     */
    str2Line(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 1) {
            let flatCoords = [];
            for (let i = 0, ii = seg.length; i < ii; i += 2) {
                flatCoords.push([parseFloat(seg[i]), parseFloat(seg[i + 1])]);
            }
            return flatCoords;
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的线坐标");
        }
    }

    /**
     * 字符串坐标转换为矩形坐标（两点）
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Rect(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length == 4) {
            let p1 = [parseFloat(seg[0]), parseFloat(seg[1])];
            let p2 = [parseFloat(seg[2]), parseFloat(seg[3])];
            return [p1, p2];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的点坐标");
        }
    }

    /**
     * 字符串坐标转换为圆坐标，圆坐标格式为[x,y,r]
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Round(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 2) {
            return [parseFloat(seg[0]), parseFloat(seg[1]), parseFloat(seg[2])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的圆(x,y,r)坐标");
        }
    }

    /**
     * 字符串坐标转换为椭圆坐标，圆坐标格式为[x,y,rx,ry]
     * @param {String} strCoord 
     * @returns {Array<GCoord>} flatCoords
     */
    str2Ellipse(strCoord) {
        let seg = strCoord.split(",");
        if (seg.length > 3) {
            return [parseFloat(seg[0]), parseFloat(seg[1]), parseFloat(seg[2]), parseFloat(seg[3])];
        } else {
            throw new Error("<" + strCoord + ">不是一个有效的椭圆(x,y,rx,ry)坐标");
        }
    }
}

function getCimgColor(colorString) {
    if (colorString == null) return null;
    if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 4) {
        colorString = "rgba(" + colorString + ")";
    } else if (colorString.indexOf("rgb") == -1 && colorString.split(",").length === 3) {
        colorString = "rgb(" + colorString + ")";
    }
    return colorString;
}

export default CimgFormat;
export { getCimgColor };