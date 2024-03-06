import { Point, Polyline, Polygon } from "../geom/index.js";
import FeatureFormat from "./feature.js";

/**
 * GeoJSON 数据格式解析
 */
class GeoJSONFormat extends FeatureFormat {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        super(options);
        this.style = options.style;
        // 填充颜色集
        this.fillColorSet = options.fillColorSet;
        // 描边颜色集
        this.colorSet = options.colorSet;
        // idx
        this.fillColorIdx = 0;
        this.colorIdx = 0
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readFeatures(data, proj) {
        let that = this;
        let listData = [];
        for (let i = 0, ii = data.features.length; i < ii; i++) {
            let obj = data.features[i];
            let style = this.getStyle(obj);
            let properties = this.getProperties(obj);
            if (obj.geometry == null || obj.geometry.coordinates == null) continue;
            let coords = obj.geometry.coordinates;
            if (obj.geometry.type == "Point") {
                let coord = that._project(coords, proj);
                listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, properties }));
            } else if (obj.geometry.type == "MultiPoint") {
                for (let x = 0; x < coords.length; x++) {
                    let coord = that._project(coords[x], proj);
                    listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, properties }));
                }
            } else if (obj.geometry.type == "LineString") {
                listData.push(new Polyline({ "coords": that._project(coords, proj), style, properties }));
            } else if (obj.geometry.type == "MultiLineString") {
                for (let x = 0; x < coords.length; x++) {
                    listData.push(new Polyline({ "coords": that._project(coords[x], proj), style, properties }));
                }
            } else if (obj.geometry.type == "Polygon") {
                for (let x = 0; x < coords.length; x++) {
                    listData.push(new Polygon({ "coords": that._project(coords[x], proj), style, properties }));
                }
            } else if (obj.geometry.type == "MultiPolygon") {
                for (let x = 0; x < coords.length; x++) {
                    for (let j = 0; j < coords[x].length; j++) {
                        listData.push(new Polygon({ "coords": that._project(coords[x][j], proj), style, properties }));
                    }
                }
            } else {
                throw new Error("不支持的类型：" + obj.geometry.type);
            }
        }

        return listData;
    }

    getStyle(feature) {
		//let colorSet = Color.band(new Color(128, 255, 255), new Color(0, 35, 188), 5);
        let style = {};
        if(this.style != null) {
			style = Object.assign({}, this.style);
			// 从随机填充颜色中选择一种颜色
			if(Array.isArray(this.fillColorSet) && this.fillColorSet.length > 0) {
				style.fillColor = this.fillColorSet[this.fillColorIdx++%this.fillColorSet.length];   // MathUtil.getRandomNum(0, this.fillColorSet.length - 1)
			}
			// 从随机描边颜色中选择一种颜色
			if(Array.isArray(this.colorSet) && this.colorSet.length > 0) {
				style.color = this.colorSet[this.colorIdx++%this.colorSet.length];  // MathUtil.getRandomNum(0, this.colorSet.length - 1)
			}
		}       
        return style;
    }

    getProperties(feature) {
        return feature.properties;
    }

    /**
     * 坐标转换
     * @param {Array} coords 
     * @param {Projection} proj 
     * @returns 转换后的坐标
     */
    _project(coords, proj) {
        if (proj == null) {
            return coords;
        } else {
            return proj.project(coords);
        }
    }
}

export default GeoJSONFormat;

/**
 * @example:
 * GeoJSON 对象示例
 * {
 *    "type": "Feature",
 *    "id": "f1",
 *    "geometry": {...},
 *    "properties": {...},
 *    "title": "Example Feature"
 * }
 * {
 *     "type": "Point",
 *     "coordinates": [100.0, 0.0]
 * }
 * {
 *     "type": "LineString",
 *     "coordinates": [
 *         [100.0, 0.0],[101.0, 1.0]
 *     ]
 * }
 * {
 *     "type": "Polygon",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]
 *     ]
 * }
 * {
 *     "type": "Polygon",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
 *         [[100.8, 0.8], [100.8, 0.2], [100.2, 0.2], [100.2, 0.8], [100.8, 0.8]]
 *     ]
 * }
 * {
 *     "type": "MultiPoint",
 *     "coordinates": [
 *         [100.0, 0.0],[101.0, 1.0]
 *     ]
 * }
 * {
 *     "type": "MultiLineString",
 *     "coordinates": [
 *         [[100.0, 0.0], [101.0, 1.0]],
 *         [[102.0, 2.0],[103.0, 3.0]]
 *     ]
 * }
 * {
 *     "type": "MultiPolygon",
 *     "coordinates": [
 *         [
 *             [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
 *         ],
 *         [
 *             [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
 *             [[100.2, 0.2], [100.2, 0.8], [100.8, 0.8], [100.8, 0.2], [100.2, 0.2]]
 *         ]
 *     ]
 * }
 * {
 *     "type": "GeometryCollection",
 *     "geometries": [{
 *         "type": "Point",
 *         "coordinates": [100.0, 0.0]
 *     }, {
 *         "type": "LineString",
 *         "coordinates": [
 *             [101.0, 0.0], [102.0, 1.0]
 *         ]
 *     }]
 * }
 */