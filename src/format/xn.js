import { Point, Polyline, Polygon } from "../geom/index.js";
import FeatureFormat from "./feature.js";

/**
 * 欣能JSON数据源，该数据源同GeoJson格式，但坐标值有所不同
 */
class XNGeoJsonData extends FeatureFormat {
    /**
     * 构造函数
     */
    constructor() {
        super();
    }

    /**
     * 加载GeoJSON数据
     * @param {*} file 
     * @param {Projection} proj  坐标投影
     */
    readData(data, proj) {
        let that = this;
        let listData = [];
        for (let i = 0, ii = data.features.length; i < ii; i++) {
            let obj = data.features[i];
            let style = {};
            if (obj.geometry == null || obj.geometry.coordinates == null) continue;
            let coords = obj.geometry.coordinates;
            if (obj.geometry.type == "Point") {
                let coord = that._project(coords, proj);
                listData.push(new Point({ "x": coord[0], "y": coord[1], "size": 0, style, "properties": obj.properties }));
            } else if (obj.geometry.type == "LineString") {
                listData.push(new Polyline({ "coords": that._project(coords, proj), style, "properties": obj.properties }));
            } else if (obj.geometry.type == "Polygon") {
                listData.push(new Polygon({ "coords": that._project(coords, proj), style, "properties": obj.properties }));
            } else {
                throw new Error("不支持的类型：" + obj.geometry.type);
            }
        }
        return listData;
    }

    /**
     * 坐标转换
     * @param {Array} coords 
     * @param {Projection} proj 
     * @returns 转换后的坐标
     */
    _project(coords, proj) {
        if (proj == null) {
            let num = coords.length;
            if (num === 2) {
                return coords;
            } else {
                let points = [];
                for (let i = 0; i < num; i += 2) {
                    points.push([coords[i], coords[i + 1]]);
                }
                return points;
            }
        } else {
            return proj.project(coords);
        }
    }
}

export default XNGeoJsonData;

