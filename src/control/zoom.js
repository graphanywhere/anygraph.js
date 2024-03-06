import { default as GraphControl } from "./control.js";
import DomUtil from "../util/dom.js";

/**
 * 放大/缩小控件
 */
class ZoomControl extends GraphControl {
    constructor(options = {}) {
        super(options);
        this.element;
    }

    create() {
        let that = this;
        // create div
        this.element = DomUtil.create("div", "zoom-buttom", this.graph.getRenderObject().getWrapObj().parentElement);
        // create button
        this.zoomin = DomUtil.create("button", "btn", this.element);
        this.zoomout = DomUtil.create("button", "btn", this.element);
        this.zoomin.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z" fill-rule="evenodd" fill-opacity=".9"/></svg>';
        this.zoomout.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19v2H5v-2z" fill-rule="evenodd" fill-opacity=".9"/></svg>';
        // bind event
        this.zoomin.addEventListener("click", function () {
            that.graph.animailZoom(0.8);
        })
        this.zoomout.addEventListener("click", function () {
            that.graph.animailZoom(1.25);
        })
    }

    show() {
        this.element.style.display = "block";
    }

    hide() {
        this.element.style.display = "none";
    }
}

export default ZoomControl;
