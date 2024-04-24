import FeatureFormat from "./feature.js";
import SvgDocument from "./svg/document.js";

/**
 * SVG格式数据解析 <br>
 * SVG规范参见：https://www.w3.org/TR/SVG2/Overview.html
 */
class SvgFormat extends FeatureFormat {
    constructor(options = {}) {
        super(options);
        this.document_ = new SvgDocument(options);
    }

    /**
     * 读取svg文档中的几何节点
     * @param {Document} xmldoc 
     * @returns featureList
     */
    readData(xmldoc) {
        if (xmldoc == null) {
            throw new Error("SVG文档错误");
        }

        return this.document_.parse(xmldoc);
    }

    getDocument() {
        return this.document_;
    }
}

export default SvgFormat;
