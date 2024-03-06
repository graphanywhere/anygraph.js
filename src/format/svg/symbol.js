import BaseSymbol from "../symbol/base.js";
import Extent from "../../spatial/extent.js";

/**
 * SVG符号
 */
class SvgSymbol extends BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options={}) {
        super(options)
        this.symbolCollection_ = {};
    }
    
    /**
     * 增加符号对象
     */
    addSymbol(id_, data, bbox) {
        let id = "#" + id_;
        let width = 0;
        let height = 0;
        let stateCount = 1;
        let name = "";
        if (bbox == null || bbox.length == 0) {
            let extent = Extent.createEmpty();
            for (let i = 0; i < data.length; i++) {
                let innerObj = data[i];
                let objBBox = innerObj.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
            }
            width = Extent.getWidth(extent);
            height = Extent.getHeight(extent);
            bbox = extent.slice();   // [0, 0, width, height];  //
        } else {
            width = Extent.getWidth(bbox);
            height = Extent.getHeight(bbox);
        }
        let value = { id, name, data, bbox, width, height, stateCount };
        this.symbolCollection_[id] = value;
    }
    
    /**
     * 获取指定名称的符号
     * @param {String} symbolName 
     * @param {String} objectID 
     * @returns 符号对象
     */
    getSymbol(symbolName, objectID) {
        let symbol = this.symbolCollection_[symbolName];
        if (symbol == null) {
            // console.debug("symbol<" + symbolName + ">不存在");
            return null;
        } else {
            let data = [];
            for (let i = 0, ii = symbol.data.length; i < ii; i++) {
                let innerObj = symbol.data[i].clone();
                innerObj.properties.objectID = objectID;
                data.push(innerObj);
            }
            return Object.assign({}, symbol, { data });
        }
    }
}

export default SvgSymbol;
