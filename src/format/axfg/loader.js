import Layer from "../../layer.js";
import VectorSource from "../../source/vector.js";
import { getLayerId } from "../../global.js";
import { LOG_LEVEL } from "../../global.js";
import {AjaxUtil, ClassUtil} from "../../util/index.js";
import AxfgSymbol from "./symbol.js";
import AxfgLayerStyle from "./layer.style.js";
import NodeType from "./nodetype.js";
import Dataset from "./dataset.js";
import AxfgFormat from "./format.js";
import AWG from "./awg.js";
import AWB from "./awb.js";
import AxfgsFormat from "./format_s.js";
import AxfgMainTopoFormat from "./format/maintopo.js";
import AxfgsMainTopoFormat from "./format/maintopo_s.js";
import AxfgBackgroundFormat from "./format/background.js";

/**
 * 数据加载对象
 */
class AxfgLoader {
    constructor(graph, options={}) {
        this._layerConfiguration = new AxfgLayerStyle();
        this._symbolManager = new AxfgSymbol();
        this._nodeTypeManager = new NodeType();
        this._dataType = "json";
        this._dataset = new Dataset();
        this.graph = graph;

        /**
         * 元数据文件
         */
        this.symbolFileUrl = options.symbolFileUrl;
        this.nodeTypeFileUrl = options.nodeTypeFileUrl;
        this.layerStyleUrl = options.layerStyleUrl;
    }

    /**
     * 获取数据管理对象
     * @returns 数据管理对象
     */
    getDataset() {
        return this._dataset;
    }

    /**
     * 获取图层样式配置对象
     * @returns 图层样式配置对象
     */
    getStyleManager() {
        return this._layerConfiguration;
    }

    /**
     * 获取符号管理对象
     * @returns 符号管理对象
     */
    getSymbolManager() {
        return this._symbolManager;
    }

    /**
     * 获取节点类型管理对象
     * @returns 符号管理对象
     */
    getNodeTypeManager() {
        return this._nodeTypeManager;
    }

    /**
     * 加载元数据
     */
    async loadMetaData(callback) {
        let beginTime = Date.now();
        const listData = await Promise.all([this._getLayerStylePromise(), this._getSymbolPromise(), this._getNodeTypePromise()]).then(function (result) {
            if (LOG_LEVEL > 1) {
                console.log("元数据初始化完成, load time:%dms", (Date.now() - beginTime));
            }
        });
        if (typeof (callback) === "function") {
            callback(listData);
        }
    }

    _getLayerStylePromise() {
        let that = this;
        let p1 = new Promise(function (resolue, reject) {
            that._layerConfiguration.load(function (file) {
                if (LOG_LEVEL > 3) {
                    console.log("样式数据初始化完成");
                }
                resolue(file);
            }, that.layerStyleUrl);
        });
        return p1;
    }

    _getSymbolPromise() {
        let that = this;
        let p2 = new Promise(function (resolue, reject) {
            that._symbolManager.load(function (file) {
                if (LOG_LEVEL > 3) {
                    console.log("符号数据初始化完成");
                }
                resolue(file);
            }, that.symbolFileUrl);
        });
        return p2;
    }

    _getNodeTypePromise() {
        let that = this;
        let p3 = new Promise(function (resolue, reject) {
            that._nodeTypeManager.load(function (file) {
                if (LOG_LEVEL > 3) {
                    console.log("节点类型数据初始化完成");
                }
                resolue(file);
            }, that.nodeTypeFileUrl);
        });
        return p3;
    }

    /**
     * 根据GWI获取对应的格式解析对象，从而为AXFG文件实现定制渲染效果
     * @param {Object} axfgfile AXFG数据文件对象
     * @returns FeatureFormat对象
     */
    getFeatureFormat(axfgfile) {
        let format;
        if (axfgfile.simplify === true) {
            if (axfgfile.gwi === 1 || axfgfile.gwi === 2 || axfgfile.gwi === 3) {
                format = new AxfgsMainTopoFormat({
                    "symbol": this._symbolManager
                });
            } else {
                format = new AxfgsFormat({
                    "symbol": this._symbolManager
                });
            }
        } else {
            if (axfgfile.gwi === 1 || axfgfile.gwi === 2 || axfgfile.gwi === 3) {
                format = new AxfgMainTopoFormat({
                    "symbol": this._symbolManager
                });
            } else if (axfgfile.gwi == null) {
                format = new AxfgBackgroundFormat({
                    "symbol": this._symbolManager
                });
            } else {
                format = new AxfgFormat({
                    "symbol": this._symbolManager
                });
            }
        }
        return format;
    }

    /**
     * 装入AXFG数据，并将数据装载至graph中
     * @param {Object} axfgfile AXFG数据文件对象
     * @param {Function} callback 数据装载完成之后的回调函数
     */
    loadData(axfgfile, isBuildIdx = false) {
        if (ClassUtil.typeof(axfgfile) === "ArrayBuffer") {
            let buffer = axfgfile;
            axfgfile = AWG.convert(buffer);

            // 转换后如果未能包含features属性，则怀疑是数据格式异常，使用awb格式重新转换
            if (axfgfile.features == null) {
                axfgfile = AWB.convert(buffer);
            }
            buffer = null;
        } else if (typeof (axfgfile) === "string") {
            axfgfile = JSON.parse(axfgfile);
        }
        let format = this.getFeatureFormat(axfgfile);
        let listData = format.readFeatures(axfgfile, this._dataset);

        // 增加至渲染数据源中
        this._loadGeomeryData(listData, { "mergeLine": format.mergeLine, "dynamic": format.layerDynamicStyle });

        // 是否建立索引
        if (isBuildIdx === true) {
            this.rebuildIndex();
        }
        return listData;
    }

    /**
     * 下载AXFG数据文件，并将数据装载至graph中
     * @param {Array} fileUrlArray 文件数组
     * @param {View} view 视图，指定该参数后，在加载每个文件之后将会执行一次图形渲染
     * @param {Function} callback 数据装载完成之后的回调函数
     */
    async loadFiles(fileUrlArray, view, callback) {
        if(fileUrlArray == null || fileUrlArray.length == null || fileUrlArray.length == 0) {
            return null;
        }
        let that = this;
        let ps = [];
        if (Array.isArray(fileUrlArray)) {
            for (let i = 0, ii = fileUrlArray.length; i < ii; i++) {
                ps.push(this._getLoadFilePromise(fileUrlArray[i]));
            }
        } else {
            ps.push(this._getLoadFilePromise(fileUrlArray));
        }

        try {
            const listData = await Promise.all(ps);
            that.rebuildIndex();
            that.graph.setView(view);
            that.graph.render();

            if (typeof (callback) === "function") {
                callback(listData);
            }
        } catch (err) {
            console.error(err);
            if (typeof (callback) === "function") {
                callback(err);
            }
        }
    }

    /**
     * 生成下载单个AXFG数据文件并将数据装载至graph中的异步对象
     * @param {*} fileUrl 
     * @returns 异步文件下载装入对象
     */
    _getLoadFilePromise(fileUrl) {
        let that = this;
        let p = new Promise(function (resolue, reject) {
            let beginTime = Date.now();
            let ext = fileUrl.substring(fileUrl.lastIndexOf("."));
            let dataType = (ext == ".awg" || ext == ".awb" || ext == ".bin" > 0) ? "arraybuffer" : that._dataType;
            AjaxUtil.get({
                url: fileUrl,
                dataType: dataType,
                success: function (axfgfile) {
                    let downloadTime = (Date.now() - beginTime);

                    // 将数据加载至图形中
                    let listData = that.loadData(axfgfile, false);

                    // show anlyze time
                    if (LOG_LEVEL > 2) {
                        console.log("load %s file finish. time:%dms, download time:%dms", fileUrl, (Date.now() - beginTime), downloadTime);
                    }

                    // execute finish.
                    resolue(listData);
                },
                error: function (res) {
                    reject(res);
                }
            });
        });
        return p;
    }

    /**
     * 将Geomery数据加入graph的各个图层中
     * @param {Array} listData Geomery数组
     * @param {Object} addLayerStyle 附加样式
     */
    _loadGeomeryData(listData, addLayerStyle) {
        for (let i = 0, ii = listData.length; i < ii; i++) {
            let obj = listData[i];
            let source = this.getSource(obj.properties, addLayerStyle);
            source.loadData([obj]);
        }
    }

    /**
     * 从graph中获取图层，如果图层不存在，则新建该图层
     * 附加说明：
     *     axfg数据中mark和shape作为一个对象，为了mark渲染在shape之上，强制将mark和shape分在不同的图层，
     *     且所有mark均在所有shape层之上(即mark层的order=对应shape层的order+100000)
     * @param {Object} layerArg 
     * @param {Object} addLayerStyle 附加的图层样式
     * @returns Source
     */
    getSource(layerArg, addLayerStyle) {
        // 获取图层配置参数
        let layerId = layerArg.layerId;
        let subLayerId = layerArg.layerSid;
        let isTextObj = layerArg.text == null ? false : true;
        let strLayerId = layerId + "-" + subLayerId;
        if (isTextObj === true) {
            strLayerId = strLayerId + "-text";
        }
        let layerInfo = this._layerConfiguration.getLayerInfo(layerId, subLayerId);

        // 获取图层
        let layer = this.graph.getLayer(strLayerId);
        if (layer == null) {
            layer = new Layer({
                source: new VectorSource(),
                id: strLayerId,
                name: (layerInfo != null ? layerInfo.groupName + "/" + layerInfo.name + (isTextObj === true ? "/mark" : "") : strLayerId),
                zIndex: (layerInfo != null && layerInfo.order != null ? layerInfo.order + (isTextObj === true ? getLayerId() : 0) : 200),
                style: (layerInfo != null ? Object.assign({}, layerInfo.style, addLayerStyle) : addLayerStyle),
                maxDistinct: (layerInfo != null ? layerInfo.maxDist : null),
                minDistinct: (layerInfo != null ? layerInfo.minDist : null),
                visible: true
            });
            this.graph.addLayer(layer);
        }
        return layer.getSource();
    }

    /**
     * 重建索引
     */
    rebuildIndex() {
        let layers = this.graph.getLayers();
        for (let i = 0, ii = layers.length; i < ii; i++) {
            let source = layers[i].getSource();
            if (source instanceof VectorSource && !layers[i].isUsePixelCoord()) {
                source.buildIndex();
            }
        }
    }
}

export default AxfgLoader;
