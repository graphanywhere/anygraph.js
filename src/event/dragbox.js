import Layer from "../layer.js";
import VectorSource from "../source/vector.js";
import Draggable from "./draggable.js";
import { Polygon } from "../geom/index.js";

/**
 * 拖拽矩形框
 */
class DragBox extends Draggable {

    constructor(options = {}) {
        super(options);
        /**
         * 图形对象
         */
        this.graph = options.graph;
        
        /**
         * 拉框结束时的回调函数
         */
        this.callback = options.callback;

        // 
        this.overlayId_ = 211;                   // 覆盖层图层ID （度量尺、空间查询矩形框等）
        this.overlayDesc_ = "覆盖层图层";
        this.defaultStyle = {
            "color": "red",
            "fillColor": "rgba(255, 159, 159, 0.5)",
            "fillStyle": 1,
            "lineWidth": 2,
            "fontBorder": true
        }

        // 拉框geom对象
        this.polygon = null;
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
        if (this.polygon != null) {
            this.getOverLayer().getSource().clearData(this.polygon.getUid());
        }
        this.polygon = this.getOverLayer().getSource().add(new Polygon({ "coords": [[0, 0], [0, 0], [0, 0]], "style": this.defaultStyle }));
    }

    onMouseMove(e, isDrag) {
        if(isDrag === true) {
            let p1 = this.graph.getCoordinateFromPixel(this.startPoint, true);
            let p2 = this.graph.getCoordinateFromPixel(this.endPoint, true);
            let point1Coords = [p1[0], p1[1]];
            let point2Coords = [p1[0], p2[1]];
            let point3Coords = [p2[0], p2[1]];
            let point4Coords = [p2[0], p1[1]];
            this.polygon.setCoord([point1Coords, point2Coords, point3Coords, point4Coords, point1Coords]);
            this.polygon.setStyle({ "lineWidth": 1 });
            this.graph.renderLayer(this.getOverLayer());
        }
    }

    onMouseUp(e) {
        this.polygon.setStyle({ "lineWidth": 2, "fillStyle": 0 });
        this.graph.renderLayer(this.getOverLayer());
        if (typeof (this.callback) === "function") {
            let coord = this.polygon.getCoord();
            this.callback([coord[0], coord[2]]);
        }
    }
}

export default DragBox;
