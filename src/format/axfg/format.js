import { Point, Polyline, Polygon, Symbol, GGShapeType, Text } from "../../geom/index.js";
import FeatureFormat from "../feature.js";
import MathUtil from "../../util/math.js";
import Counter from "../../util/counter.js";
import { getColor, getLineType, getTypeStyle } from "./style.js"
import Dataset from "./dataset.js";
import { LOG_LEVEL } from "../../global.js";

/**
 * AXFG 数据格式解析
 */
class AxfgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        /**
         * 符号管理对象
         */
        this.symbolManager = options.symbol;

        /**
         * 图层配置管理对象
         * --如果包含了此参数，则对象的style中将会包含图层样式
         * --在loader中加载数据时，此参数为空，因此对象的style中不会包含图层样式
         */
        this.layerConfiguration = options.style;

        /**
         * 计数器，记录加载的各类shapeType数量
         */
        this.counter = new Counter("Format");

        /**
         * 文本动态样式
         */
        this.textDynamicStyle = null;

        /**
         * 面动态样式
         */
        this.surfaceDynamicStyle = null;

        /**
         * 线动态样式
         */
        this.lineDynamicStyle = null;

        /**
         * 点动态样式
         */
        this.pointDynamicStyle = null;

        /**
         * 图层动态样式
         */
        this.layerDynamicStyle = null;

        /**
         * 在渲染polyline时，是否合并为multiPolyline
         */
        this.mergeLine = false;
    }

    /**
     * 从axfg文件中读取设备节点数据
     * @param {Object} file 
     * @param {Dataset} dataset
     * @returns Array Geomerty设备节点数组
     */
    readFeatures(file, dataset) {
        let listData = [];
        let listMark = [];
        // 逐个对象分析属性、样式和几何形状
        for (let i = 0, ii = file.features.length; i < ii; i++) {
            let feature = file.features[i];
            if (feature.geometry == null || feature.geometry.coordinates == null) continue;

            let shapeType = feature.geometry.type;
            // 属性信息
            let properties = this.getProperties(feature.properties, shapeType, feature.sourcenode);
            // 坐标
            let coords = this.getCoords(feature.geometry.coordinates, shapeType, properties);
            // 样式
            let style = this.getStyle(properties, shapeType);

            // 渲染对象
            let geometryObj;
            if (shapeType == "Point") {
                // axfg格式的纯文本对象也以point方式提供，文本内容包含在mark属性中，其symbolId为空
                if (properties.symbolId != null && properties.symbolId != -1) {
                    let symbol = this.symbolManager.getSymbol(properties.symbolId, properties.symbolProp.symbolState);
                    if (symbol != null) {
                        let scale = properties.symbolProp.symbolScale;
                        geometryObj = (new Symbol({
                            symbol,
                            "x": coords[0],
                            "y": coords[1],
                            "rotation": properties.symbolProp.symbolAngle,
                            "width": symbol.width * scale,
                            "height": symbol.height * scale,
                            "style": Object.assign({ "symbolPrior": true }, style),
                            "properties": Object.assign({}, properties)
                        }));
                    } else {
                        geometryObj = new Point({ "x": coords[0], "y": coords[1], "size": 0, style, properties });
                        console.warn("符号%s-%s不存在", properties.symbolId, properties.symbolState);
                    }
                } else {
                    geometryObj = (new Point({ "x": coords[0], "y": coords[1], "pointType":-1, "size": 0, "style": style, properties }));
                    //console.warn("虚拟点: %s-%s", properties.blockId, properties.entityId);
                }
                this.counter.add("Point");
            } else if (shapeType == "MultiLineString") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polyline({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiLineString");
            } else if (shapeType == "MultiPolygon") {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    geometryObj = (new Polygon({ "coords": coords[i], style, properties }));
                }
                this.counter.add("MultiPolygon");
            } else {
                this.counter.add("Other");
                throw new Error("不支持的类型：" + shapeType);
            }

            // 加入集合中
            listData.push(geometryObj);

            // 分析标注
            let marks = this.getMark(feature.mark, properties, this.getStyle(properties, "Mark"))
            marks.forEach(markObj => {
                listMark.push(markObj);
            })

            // 添加至dataset中
            if (file.gwi > 0 && dataset != null) {
                dataset.addGraphNode(geometryObj, marks);
            }
        }

        if (LOG_LEVEL > 3) {
            this.counter.print();
        }
        this.counter.reset();

        return listData.concat(listMark);
    }

    /**
     * 从节点中获取坐标数据
     * @param {Array} coords 
     * @param {String} type 
     * @returns Array
     */
    getCoords(coords, type, properties) {
        let newCoords = (coords == null ? [] : coords);
        return newCoords;
    }

    /**
     * 从图层配置信息中获取Style
     * @param {Object} properties 
     * @param {String} type 
     * @returns Object
     */
    getStyle(properties, type) {
        // 符号指定的颜色，例如站线户变图的联络线路
        let specColor = properties.color == null ? {} : { "color": properties.color, "fillColor": properties.color };
        // 图层样式
        let layerStyle;
        if (this.layerConfiguration != null && this.layerConfiguration.getStatus() === 1) {
            let layerInfo = this.layerConfiguration.getLayerInfo(properties.layerId, properties.layerSid);
            layerStyle = layerInfo != null ? layerInfo.style : null;
        }

        let style;
        if (type == "Point") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.POINT, layerStyle), specColor);
            }
            if (typeof (this.pointDynamicStyle) === "function") {
                style.dynamicFn = this.pointDynamicStyle;
            }
        } else if (type == "MultiLineString") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.LINE, layerStyle), getLineType(layerStyle.lineType), specColor);
            }
            if (typeof (this.lineDynamicStyle) === "function") {
                style.dynamicFn = this.lineDynamicStyle;
            }
        } else if (type == "MultiPolygon") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.SURFACE, layerStyle), specColor);
            }
            if (typeof (this.surfaceDynamicStyle) === "function") {
                style.dynamicFn = this.surfaceDynamicStyle;
            }
        } else if (type == "Mark") {
            if (layerStyle == null) {
                style = specColor;
            } else {
                style = Object.assign(getTypeStyle(GGShapeType.TEXT, layerStyle), specColor);
            }
            if (typeof (this.textDynamicStyle) === "function") {
                style.dynamicFn = this.textDynamicStyle;
            }
        } else {
            style = {};
        }

        return style;
    }

    /**
     * 获取节点中的Properties属性
     * @param {Object} prop 
     * @param {String} type 
     * @param {Object} sourceNode 
     * @returns Object
     */
    getProperties(prop, type, sourceNode) {
        let nodeType = prop.NODETYPE;
        let blockId = prop.BID;
        let entityId = prop.ID;
        let layerId = prop.LAYER_ID;
        let layerSid = prop.LAYER_SID;
        let color = getColor(prop.SCOLOR);
        sourceNode = sourceNode == null ? null : this._getSourceNode(sourceNode);

        let properties;
        if (type === "Point") {
            let symbolId = prop.SYMBOL_ID;
            let symbolState = prop.SYMBOL_STATE;
            let symbolAngle = MathUtil.toDegrees(-prop.SYMBOL_ANGLE);
            let symbolScale = prop.SYMBOL_SCALE;
            let symbolProp = { symbolState, symbolAngle, symbolScale };
            let redgeNum = prop.REDGE_NUM;
            let edge = []
            for (let i = 0; i < redgeNum; i++) {
                edge.push({ "block": prop["REDGE" + i + "_BID"], "entityId": prop["REDGE" + i + "_ID"] });
            }
            properties = { blockId, entityId, nodeType, layerId, layerSid, symbolId, symbolProp, redgeNum, edge };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        } else {
            let headNodeBlockId = prop.HEADRNODE_BID;
            let headNodeEntityId = prop.HEADRNODE_ID;
            let headNodeLid = prop.HEADRNODE_LID;
            let head = { "blockId": headNodeBlockId, "entityId": headNodeEntityId, "lid": headNodeLid };
            let tailNodeBlockId = prop.TAILRNODE_BID;
            let tailNodeEntityId = prop.TAILRNODE_ID;
            let tailNodeLid = prop.TAILRNODE_LID;
            let tail = { "blockId": tailNodeBlockId, "entityId": tailNodeEntityId, "lid": tailNodeLid };
            properties = { blockId, entityId, nodeType, layerId, layerSid, head, tail };
            if (sourceNode != null) properties.sourceNode = sourceNode;
            if (color != null) properties.color = color;
        }
        return properties;
    }

    /**
     * @private
     */
    _getSourceNode(source) {
        let sourceNode = [];
        source.forEach(ele => {
            sourceNode.push({ "blockId": ele[0], "entityId": ele[1] });
        })
        return sourceNode;
    }

    /**
     * 解析node中的标注
     * @param {Object} mark 
     * @param {Object} properties 
     * @param {Object} layerStyle 
     * @returns Object
     */
    getMark(mark, properties, layerStyle) {
        let listData = [];
        if (mark != null && mark.length > 0) {
            let textStyle = getTypeStyle(GGShapeType.TEXT, layerStyle);
            for (let i = 0, ii = mark.length; i < ii; i++) {
                let text = mark[i].text;
                let textProp = Object.assign({}, properties)
                let rotation = [MathUtil.toDegrees(-mark[i].angle)];
                let fontSize = mark[i].textheight;
                let coord = this.getCoords(mark[i].coordinates, "Text", textProp);
                let style = Object.assign({ fontSize, "textBaseline": "top", "minFontSize": 0 }, textStyle);
                let color = getColor(mark[i].SCOLOR);
                if (color != null) {
                    style.color = "none";
                    style.fillColor = color;
                }

                if (text != null && coord != null && fontSize > 0) {
                    let x, y, width, height;
                    if (coord.length == 2 && Array.isArray(coord[0])) {
                        x = coord[0][0];
                        y = coord[0][1];
                        width = coord[1][0] - coord[0][0];
                        height = coord[1][1] - coord[0][1];
                    } else if (coord.length == 2 && (typeof (coord[0]) == "number")) {
                        x = coord[0];
                        y = coord[1];
                    }
                    listData.push(new Text({ text, x, y, width, height, rotation, "style": style, "properties": textProp }));
                    this.counter.add("TEXT");
                }
            }
        }
        return listData;
    }
}

export default AxfgFormat;

