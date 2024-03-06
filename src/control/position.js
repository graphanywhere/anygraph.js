import { default as GraphControl } from "./control.js";
import DomUtil from "../util/dom.js";
import MathUtil from "../util/math.js";

/**
 * 鼠标当前位置控件
 */
class MousePositionControl extends GraphControl {
    constructor(options = {}) {
        super(options);
        this.element;
        this.showRes = options.showRes === true;

        let that = this;
        this.onMouseMove = function (e) {
            that.redraw(e);
        }
    }

    create() {
        // create div
        this.element = DomUtil.create("div", "mouse-position", this.graph.getRenderObject().getWrapObj().parentElement);
        this.element.style.zIndex = 100;
    }

    show() {
        this.graph.getRenderObject().on('mousemove', this.onMouseMove);
    }

    hide() {
        this.graph.getRenderObject().off('mousemove', this.onMouseMove);
        this.element.innerHTML = "";
    }

    redraw(e) {
        let posi = [e.offsetX, e.offsetY];
        let coord = this.graph.getCoordinateFromPixel(posi, true);
        
        if(this.showRes) {
			let res = this.graph.getFrameState().resolution;
            this.element.innerHTML = this.formatOutput(coord) + "," + MathUtil.toFixed(res, 2);			
		} else {
			this.element.innerHTML = this.formatOutput(coord);
		}
    }

    reset() {
    }

    formatOutput(coord) {
        return MathUtil.toFixed(coord[0], 2) + ", " + MathUtil.toFixed(coord[1], 2);
    }
}

export default MousePositionControl;
