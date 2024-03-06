import { Polyline, Text, Circle, Point } from "../geom/index.js";
import VectorSource from "../source/vector.js";
import Layer from "../layer.js";
import { WATER_LAYER_ZINDEX } from "../global.js";
import Graph from "../graph.js";

/**
 * 绘制调试信息，例如水印层、网格层
 */

/**
 * 背景工具类
 * @class
 */
const BgUtil = {};

(function () {

    /**
     * 按间隔生成网格
     * @param {Object} options {width, height, interval, color}
     */
    BgUtil.generateGrid = function (options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval || 10;
        let style = Object.assign(options.style || {}, { "color": options.color || "#FFCCCC", "lineWidth": options.lineWidth || 0.5 });

        for (let i = 0; i <= width; i += interval) {
            if (i % 100 == 0) {
                bgData.push(new Polyline({ "coords": [[i, 0], [i, height]], "style": Object.assign({}, style, { "lineWidth": 2 * style.lineWidth }) }));
            } else {
                bgData.push(new Polyline({ "coords": [[i, 0], [i, height]], style }));
            }
        }
        for (let j = 0; j <= height; j += interval) {
            if (j % 100 == 0) {
                bgData.push(new Polyline({ "coords": [[0, j], [width, j]], "style": Object.assign({}, style, { "lineWidth": 2 * style.lineWidth }) }));
            } else {
                bgData.push(new Polyline({ "coords": [[0, j], [width, j]], style }));
            }
        }

        // 绘制坐标值
        if (options.coord) {
            style = { "fillStyle": 1, "color": "none" };
            for (let x = 0; x <= width; x += 100) {
                for (let y = 0; y <= height; y += 100) {
                    if (x % 200 == 0 && y % 200 == 0) {
                        style.fillColor = "red";
                        style.font = "16px Arial, sans-serif";
                    } else {
                        style.fillColor = "blue";
                        style.font = "14px Arial, sans-serif";
                    }
                    bgData.push(new Text({ "x": x, "y": y + 10, "text": "(" + x + "," + y + ")", style }));
                    bgData.push(new Circle({ "x": x, "y": y, "radius": 4, style }));
                }
            }
        }

        // 绘制logo
        if (options.logo || true) {
            bgData.push(new Text({
                "x": width - 10, "y": 6, "text": "图形开发学院",
                "style": { "textBaseline": "top", "textAlign": "right", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
            bgData.push(new Text({
                "x": 10, "y": height - 6, "text": "www.graphAnywhere.com",
                "style": { "textBaseline": "bottom", "textAlign": "left", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
        }

        // 是否建立独立的网格层
        if (options.graph instanceof Graph) {
            let layer = new Layer({
                source: new VectorSource({ "data": bgData }),
                zIndex: WATER_LAYER_ZINDEX + 1,
                name: "网格层",
                type: "aux",
                usePixelCoord: true
            });
            options.graph.addLayer(layer);
            return layer;
        } else {
            return bgData;
        }
    }

    /**
     * 生成刻度尺
     * @param {Object} options {width, height, interval, style, size, coord, color}
     */
    BgUtil.generateScaleline = function (options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval == null ? 10 : options.interval;
        let style = Object.assign({ "color": options.color || "#b0250f", "fontSize": "12px", "lineWidth": 0.5 }, options.style);
        let size = options.size == null ? 10 : options.size;

        // 网格点
        if (options.coord != false) {
            for (let j = 2 * interval; j < height; j += interval) {
                for (let i = 2 * interval; i < width; i += interval) {
                    if (i % 100 === 0 && j % 100 === 0) {
                        bgData.push(new Point({ "x": i, "y": j, "size": 2, "style": Object.assign({}, style, { "color": "blue", "fillColor": "blue" }) }));
                    } else {
                        bgData.push(new Point({ "x": i, "y": j, "size": 1, style }));
                    }
                }
            }
        }

        // X轴(水平)
        for (let i = 1 * interval; i < width; i += interval) {
            let len, addStyle;
            if (i % 100 === 0) {
                addStyle = { "lineWidth": 2 };
                len = size * 1.5;
                bgData.push(new Text({ "x": i, "y": (len + 2), "text": i, "style": Object.assign({ "textAlign": "center" }, style) }));
            } else {
                len = size;
            }
            bgData.push(new Polyline({ "coords": [[i, 0], [i, len]], "style": Object.assign({}, style, addStyle) }));
        }

        // Y轴(垂直)
        for (let j = 1 * interval; j < height; j += interval) {
            let len, addStyle;
            if (j % 100 === 0) {
                addStyle = { "lineWidth": 2 };
                len = size * 1.5;
                bgData.push(new Text({ "x": (len + 2), "y": j, "text": j, "style": Object.assign({ "textBaseline": "middle" }, style) }));
            } else {
                len = size;
            }
            bgData.push(new Polyline({ "coords": [[0, j], [len, j]], "style": Object.assign({}, style, addStyle) }));
        }

        // 绘制logo
        if (options.logo || true) {
            bgData.push(new Text({
                "x": width - 10, "y": height - 6, "text": "图形开发学院",
                "style": { "textBaseline": "bottom", "textAlign": "right", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
            bgData.push(new Text({
                "x": 10, "y": height - 6, "text": "www.graphAnywhere.com",
                "style": { "textBaseline": "bottom", "textAlign": "left", "fontName": "仿宋", "fontSize": 16, "fontBold": true, "fillColor": "#A2A2A2" }
            }));
        }

        // 建立图层
        if (options.graph instanceof Graph) {
            let layer = new Layer({
                source: new VectorSource({ "data": bgData }),
                zIndex: WATER_LAYER_ZINDEX + 2,
                name: "刻度层",
                type: "aux",
                usePixelCoord: true
            });
            options.graph.addLayer(layer);
            return layer;
        } else {
            return bgData;
        }
    }

    /**
     * 生成水印图层
     * @param {Object} options 选项{text, rotation, style} 
     * @returns {Layer} layer
     */
    BgUtil.generateWaterMarkLayer = function (options = {}) {
        let bgData = __generateTextData({
            "text": options.text == null ? "ADAM" : options.text,
            "rotation": options.rotation || -30,
            "vectorSize": false,
            "style": options.style == null ? {} : options.style
        });

        let layer = new Layer({
            source: new VectorSource({ "data": bgData }),
            zIndex: WATER_LAYER_ZINDEX,
            name: "水印层",
            type: "aux",
            style: { "color": "rgb(220, 220, 220)", "fillColor": "rgb(220, 220, 220)", "fontSize": 30, "fontName": "宋体", "textAlign": "center" },
            usePixelCoord: true,
            visible: true
        });

        return layer;
    }

    /**
     * 按间隔生成文字
     * @param {Object} options {width, height, interval, text, rotation, color, fontSize, style}
     */
    function __generateTextData(options = {}) {
        let bgData = [];
        let width = options.width == null ? 4000 : options.width;
        let height = options.height == null ? 2000 : options.height;
        let interval = options.interval == null ? 300 : options.interval;
        let style = options.style;
        let text = options.text == null ? "ADAM" : options.text;
        let rotation = options.rotation || 0;
        let vectorSize = options.vectorSize == null ? false : options.vectorSize === true;
        for (let i = 0; i < width; i += interval) {
            for (let j = 0; j < height; j += interval) {
                bgData.push(new Text({ "x": i, "y": j, "text": text, "vectorSize": vectorSize, "style": style, "rotation": rotation }));
            }
        }
        return bgData;
    }

})();
export default BgUtil;
