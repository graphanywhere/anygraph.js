import { Geometry } from "../geom/index.js";
import ClassUtil from "../util/class.js";
import GeomFactory from "../geom/factory.js"
/**
 * 矢量数据源解析格式抽象类
 */
class FeatureFormat {
    readData(source, options) {
        return ClassUtil.abstract(source, options);
    }
}

/**
 * GGeometry列表数据格式解析
 */
class GeometryFormat extends FeatureFormat {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readData(features) {
        let listData = [];

        // 单图层数据
        if (features.length > 0 && features[0].name == null) {
            listData = this._loadData(features);
        }
        // 多图层数据
        else {
            for (let i = 0; i < features.length; i++) {
                listData = listData.concat(this._loadData(features[i].data));
            }
        }
        return listData;
    }

    _loadData(features) {
        let listData = [];
        for (let i = 0, ii = features.length; i < ii; i++) {
            if (features[i] instanceof Geometry) {
                listData.push(features[i]);
            } else {
                let geomObj = GeomFactory.create(features[i]);
                listData.push(geomObj);
            }
        }
        return listData;
    }
}

export { GeometryFormat };
export default FeatureFormat;
