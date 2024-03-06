import { GGeometryType, Geometry, Point, Circle, Polyline, Polygon, Ellipse, Rect, Path, Triangle, Mark, Image, Text, Symbol } from "../geom/index.js";
import ClassUtil from "../util/class.js";

/**
 * 矢量数据源解析格式抽象类
 */
class FeatureFormat {
    readFeatures(source, options) {
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
    readFeatures(features) {
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
				if ( features[i] instanceof Geometry) {
              listData.push(features[i]);
            } else {
            	let geomObj = createGeom(features[i]);           
            	listData.push(geomObj);
            }
        }
        return listData;
	}
}

/**
 * 根据Geom数据创建Geometry对象
 * @param {Object} obj 
 * @returns GeometryObject
 */
function createGeom(obj) {
    let geomObj;
    if (obj.type === GGeometryType.POINT) {
        geomObj = new Point(obj);
    } else if (obj.type === GGeometryType.CIRCLE) {
        geomObj = new Circle(obj);
    } else if (obj.type === GGeometryType.ELLIPSE) {
        geomObj = new Ellipse(obj);
    } else if (obj.type === GGeometryType.POLYLINE) {
        geomObj = new Polyline(obj);
    } else if (obj.type === GGeometryType.POLYGON) {
        geomObj = new Polygon(obj);
    } else if (obj.type === GGeometryType.RECT) {
        geomObj = new Rect(obj);
    } else if (obj.type === GGeometryType.TRIANGLE) {
        geomObj = new Triangle(obj);
    } else if (obj.type === GGeometryType.MARK) {
        geomObj = new Mark(obj);
    } else if (obj.type === GGeometryType.SYMBOL) {
        geomObj = new Symbol(obj);
    } else if (obj.type === GGeometryType.TEXT) {
        geomObj = new Text(obj);
    } else if (obj.type === GGeometryType.IMAGE) {
        geomObj = new Image(obj);
    } else if (obj.type === GGeometryType.PATH) {
        geomObj = new Path(obj);
    } else {
        console.info("unsupport object", geomObj);
    }
    return geomObj;
}

export { GeometryFormat, createGeom };
export default FeatureFormat;
