import Graph from "./graph.js";
import Layer from "./layer.js";
import VectorSource from "./source/vector.js";
import Color from "./style/color.js"; 
import { SvgFormat, SvgSymbol, CimgFormat, CimgSymbol, getCimgColor } from "./format/index.js";
import DomUtil from "./util/dom.js";
import { LOG_LEVEL } from "./global.js";

/**
 * 加载SVG文件
 * @private
 * @param {Object} options
 * @returns {Object} 图形对象{ graph, source, symbol, viewBox }
 */
function loadSVGFile(options) {
    let fileUrl = options.fileUrl;
    let container = options.container;
    let loadCallback = options.success;
    let document = options.document;
    let usePixelCoord = options.usePixelCoord === true ? true : false;
    let allowStyleScale = options.allowStyleScale == null ? true : options.allowStyleScale;
    let viewBox = null;

    // 校验容器参数
    if (container == "") {
        throw new Error("初始化失败，container不能为空.")
    } else {
        let containerObj_ = DomUtil.get(container);
        let wrapObj_ = DomUtil.get(containerObj_.id + "_wrap");
        if (wrapObj_ != null) {
            wrapObj_.parentElement.remove();
        }
    }

    // 建立图形对象
    let graph = new Graph({
        "target": container,
        "layers": [],
        "originAtLeftTop": true,
        "fullView": true,
        "filter": options.filter,
        "filterOptions": options.filterOptions,
        "mouse": (options.mouse == null ? true : options.mouse)
    });
    let size = graph.getSize()
    let symbol = new SvgSymbol();

    // 建立SVG数据源对象
    let source = new VectorSource({
        "dataType": "xml",
        "format": new SvgFormat({
            "canvasWidth": size.width,
            "canvasHeight": size.height,
            "symbol": symbol,
            "ready": function (result) {
                viewBox = result.document.viewBox;
            }
        })
    });

    // 建立SVG渲染数据图层
    let layer = new Layer({
        "source": source,
        "usePixelCoord": usePixelCoord,
        "style": { "minFontSize": 0, "allowStyleScale": allowStyleScale }
    });
    graph.addLayer(layer);

    // 加载文档内容
    if (document == null && fileUrl != null) {
        source.loadFile(fileUrl, function (xmlDocument) {
            if (xmlDocument == null) {
                return false;
            } else {
                if (viewBox != null && viewBox.length > 0) {
                    if (viewBox.length === 4) {
                        graph.showExtent(viewBox);
                    }
                } else {
                    graph.render();
                }
                if (typeof (loadCallback) == "function") {
                    loadCallback(xmlDocument);
                }
            }
        }, loadCallback)
    } else if (document != null) {
        let listData = source.getFormat().readData(document);

        // 加入到数据源中
        source.clearData();
        source.add(listData);
        // 建立空间索引
        source.buildIndex();
        if (viewBox != null && viewBox.length > 0) {
            if (viewBox.length === 4) {
                graph.showExtent(viewBox);
            }
        } else {
            graph.render();
        }
    }

    return { graph, source, symbol, viewBox }
}

/**
 * 加载CIMG文件
 * @private
 * @param {Object} options 
 * @returns {Object} 图形对象{ graph, source, symbol }
 */
function loadCimgFile(options) {
    let fileUrl = options.fileUrl;
    let container = options.container;
    let loadCallback = options.success;
    let usePixelCoord = options.usePixelCoord === true ? true : false;
    let allowStyleScale = options.allowStyleScale == null ? true : options.allowStyleScale;

    // 校验容器参数
    if (container == "") {
        throw new Error("初始化失败，container不能为空.")
    } else {
        let containerObj_ = DomUtil.get(container);
        let wrapObj_ = DomUtil.get(containerObj_.id + "_wrap");
        if (wrapObj_ != null) {
            wrapObj_.remove();
        }
    }
    let source, layer, symbol;
    // 建立图形对象
    let graph = new Graph({
        "target": container,
        "layers": [],
        "originAtLeftTop": true,
        "fullView": true,
        "mouse": (options.mouse == null ? true : options.mouse)
    });

    symbol = new CimgSymbol();

    // 建立SVG数据源对象
    source = new VectorSource({
        "dataType": "json",
        "format": new CimgFormat({
            "symbol": symbol
        })
    });

    // 建立SVG渲染数据图层
    layer = new Layer({
        "source": source,
        "usePixelCoord": usePixelCoord,
        "style": { "minFontSize": 0, "symbolPrior":true, "allowStyleScale": allowStyleScale }
    });
    graph.addLayer(layer);

    // 加载符号
    _getSymbolPromise(symbol).then(function () {
        // 加载文档内容
        if (fileUrl != null) {
            _loadFilePromise(source, fileUrl).then(function (file) {
                if (file == null) {
                    return false;
                } else {
                    if (file != null && file.backgroundColor != null) {
                        graph.setBgColor(Color.fromString(getCimgColor(file.backgroundColor)).toString());
                    } else {
                        graph.setBgColor(null);
                    }
                    graph.setView(null);
                    if (typeof (loadCallback) == "function") {
                        loadCallback(file);
                    }
                }
            })
        }
    })

    return { graph, source, symbol }
}

function _getSymbolPromise(symbol) {
    let p = new Promise(function (resolue, reject) {
        symbol.loadFile(function (file) {
            if (LOG_LEVEL > 3) {
                console.log("符号数据初始化完成");
            }
            resolue(file);
        });
    });
    return p;
}
function _loadFilePromise(source, fileUrl) {
    let p = new Promise(function (resolue, reject) {
        source.loadFile(fileUrl, function (file) {
            if (LOG_LEVEL > 3) {
                console.log("数据加载完成");
            }
            resolue(file);
        });
    });
    return p;
}

//export {loadSVGFile, loadCimgFile};
/**
 * 快捷方式
 * @class
 */
const Ladder = {
	loadSVGFile,
	loadCimgFile
};

export default Ladder;
