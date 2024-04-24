import { GGeometryType, Point, Circle, Polyline, Polygon, Ellipse, Rect, Path, Triangle, Mark, Text, Image, Symbol } from "./index.js";

class GeomFactory {
    static factory = new Map();

    static add2Factory(key, Class) {
        this.factory.set(key, Class);
    }

    /**
     * 根据Geom数据创建Geometry对象
     * @param {Object} obj 
     * @returns GeometryObject
     */
    static create(obj) {
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
        // } else if (obj.type === GGeometryType.GRAPHNODE) {
        //     geomObj = new GraphNode(obj);
        // } else if (obj.type === GGeometryType.GRAPHEDGE) {
        //     geomObj = new GraphEdge(obj);
        } else {
            if (this.factory.has(obj.type)) {
                let fun = this.factory.get(obj.type);
                geomObj = fun(obj);
            } else {
                console.info("unsupport object", geomObj);
            }
        }
        return geomObj;
    }
}

export default GeomFactory;