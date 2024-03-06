import Layer from "../layer.js";
import VectorSource from "../source/vector.js";
import Easing from "../util/easing.js";

/**
 * 闪烁类
 */
class Flicker {
    constructor() {
    }

    /**
     * 开始闪烁
     * @param {Graph} graph 
     * @param {Array} data 
     * @param {Object} options 
     */
    static run(graph, data, options = {}) {
        this.end(graph);
        this.times = 0;
        this.beginFlicker = true;
        this._add2Layer(graph, data, options.type);
        this._render(graph, options.duration);
    }

    /**
     * 顺序闪烁
     * @param {Graph} graph 
     * @param {Array} data 
     * @param {Object} options 
     */
    static sequence(graph, data, options = {}) {
        this.end(graph);
        this.times = 0;
        this.beginFlicker = false;
        this._add2Layer(graph, [], options.type);
        this._render(graph, options.duration, data);
    }

    /**
     * 结束闪烁
     * @param {Graph} graph 
     */
    static end(graph) {
        window.cancelAnimationFrame(this.animationKey_);
        graph.removeLayer(this.flickerLayer_);
        graph.render();
    }

    static _add2Layer(graph, data, type = 1) {
        let that = this;
        this.flickerLayer_ = new Layer({
            "source": new VectorSource({
                "data": data
            }),
            "style": {
                "layerPrior": true,
                "lineWidth": 4,
                "pointLineWidth": 4,
                "surfaceLineWidth": 4,
                "dynamic": function (layer, frameState) {
                    if (type === 1) {
                        that._styleFn1(layer, frameState);
                    } else if (type === 2) {
                        that._styleFn2(layer, frameState);
                    } else {
                        that._styleFn(layer, frameState);
                    }
                }
            },
            "zIndex": 1000000
        });
        graph.addLayer(this.flickerLayer_);
    }

    static _render(graph, duration = this.defaultDuration, data = []) {
        let start = Date.now();
        let that = this;
        let idx = 0;
        let loop = function () {
            let speed;
            if(data.length > 120) {
                speed = 1;
            } else if(data.length > 80) {
                speed = 2;
            } else {
                speed = 4;
            }
            if (that.times % speed === 0) {
                if (idx < data.length) {
                    let geom = data[idx];
                    Object.assign(geom.style, {"color":"red", "fillColor":"red", "lineWidth":4});
                    that.flickerLayer_.getSource().add(geom);
                    idx += 1;
                } else {
                    that.beginFlicker = true;
                }
            }
            that.times++;
            if (Date.now() <= start + (duration > 0 ? duration * 1000 : 0)) {
                if (that.times % 2 === 0) {
                    // graph.renderSync();
                    graph.renderLayer(that.flickerLayer_);
                }
                that.animationKey_ = window.requestAnimationFrame(loop);
            } else {
                graph.removeLayer(that.flickerLayer_);
                graph.render();
                return false;
            }
        }
        window.requestAnimationFrame(loop);
    }

    /**
     * 红白闪烁效果，红色的变化范围为：rgb(255, 0, 0) 至 rgb(255, 255, 255)
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn(layer, frameState) {
        if (this.beginFlicker) {
            let delta = Easing.easeOut(this.times % 30 / 30);
            let color = "rgb(255," + Math.floor(255 * delta) + "," + Math.floor(255 * delta) + ")";
            let style = layer.getStyle();
            style.color = color;
            style.fillColor = color;
            layer.setStyle(style);
        }
    }

    /**
     * 通过改变透明色，实现闪烁效果
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn1(layer, frameState) {
        if (this.beginFlicker) {
            let delta = Easing.easeOut(this.times % 30 / 30);
            layer.setOpacity(delta);
        }
    }

    /**
     * 虚线滚动效果
     * @param {*} layer 
     * @param {*} frameState 
     */
    static _styleFn2(layer, frameState) {
        if (this.beginFlicker) {
            let style = layer.getStyle();

            // 点和面的颜色变化
            let delta = Easing.easeOut(this.times % 20 / 20);
            let color = "rgb(255," + Math.floor(255 * delta) + "," + Math.floor(255 * delta) + ")";
            style.pointColor = color;
            style.surfaceColor = color;

            // 虚线流动
            delta = Easing.linear(this.times % 20 / 20);
            style.lineColor = "rgb(255,0,0)";
            style.lineType = 10;
            style.dashOffset = delta * 30;
            layer.setStyle(style);
        }
    }
}

Flicker.times = 0;
Flicker.defaultDuration = 3;
Flicker.flickerLayer_ = null;
Flicker.animationKey_ = 0;
Flicker.beginFlicker = false;
export default Flicker;
