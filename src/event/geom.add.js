import Layer from "../layer.js";
import Geometry from "../geom/geometry.js";
import VectorSource from "../source/vector.js";
import Draggable from "./draggable.js";
// import Coordinate from "../spatial/coordinate.js";

/**
 * 拖拽绘制点
 */
class GeomAdd extends Draggable {

    constructor(options={}) {
        super(options);

        /**
         * 图形对象
         */
        this.graph = options.graph;

        /**
         * 绘制完毕的回调函数
         */
        this.callback = options.callback;

        /**
         * 模板对象
         */
        this.templateGeom = options.template;

        // 绘制的对象
        this.drawObj;

        // 绘图层图层ID
        this.overlayId_ = 211;                   // 覆盖层图层ID （度量尺、空间查询矩形框等）
        
        //  绘图层说明
        this.overlayDesc_ = "绘图层";

        // 拖拽结束坐标
        this.endPoint = [];

        // 拖拽开始坐标
        this.startPoint = [];

        // 拖拽移动时坐标
        this.movePoint = [];
    }

    /**
     * 设置绘图时的模板对象
     * @param {Geometry} geom 
     */
    setTemplate(geom) {
        if(geom instanceof Geometry || geom.type != null) {
            this.templateGeom = geom;
        }
    }

    /**
     * 获取浮动图层
     * @returns Layer
     */
    getOverLayer() {
        let layer = this.graph.getLayer(this.overlayId_);
        if (layer == null) {
            layer = new Layer({
                "source": new VectorSource(),
                zIndex: this.overlayId_,
                name: this.overlayDesc_
            });
            this.graph.addLayer(layer);
        }
        return layer;
    }

    onMouseDown(e) {
        if (this.drawObj != null) {
            this.getOverLayer().getSource().clearData(this.drawObj.getUid());
        }
        let p = this.graph.getCoordinateFromPixel(this.startPoint, true);
        let prop = Object.assign(this.templateGeom, { "x": p[0], "y": p[1] });
//        if(prop.getType() === GGeometryType.POINT) {
//            delete prop.coords;
//        }
        this.drawObj = this.getOverLayer().getSource().add(prop);
        this.drawObj.moveTo(p[0], p[1]);
    }

    onMouseMove(e, isDrag) {
        if(isDrag === true) {
            let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
            let p2 = this.graph.getCoordinateFromPixel(this.endPoint, true);
            if(this.drawObj) {
                //this.drawObj.setSize(Math.max(Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1])) * 4);
                //this.drawObj.prop("rotation", Measure.calcAngle(p1, p2));
            }
            this.graph.renderLayer(this.getOverLayer());    
        }
    }

    onMouseUp(e) {
		let that = this;
        this.graph.renderLayer(this.getOverLayer());
        if (typeof (this.callback) === "function") {
            this.callback(that.drawObj, this.graph.getCoordinateFromPixel(this.endPoint, true));
        }
        if (this.drawObj != null) {
            this.getOverLayer().getSource().clearData(this.drawObj.getUid());
        }
    }
}

export default GeomAdd;
