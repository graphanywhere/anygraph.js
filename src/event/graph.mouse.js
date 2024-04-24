import Extent from "../spatial/extent.js";
import DomUtil from "../util/dom.js";
import Cursor from "../util/cursor.js";

/**
 * 图形鼠标操作
 * 滚轮缩放、鼠标移动、鼠标中键漫游、hover、触摸缩放
 */
class GraphMouseOp {

    /**
     * 构造函数
     * @param {RenderObject} render 
     * @param {Object} options {mapZoom, mapMove}
     */
    constructor(render, options = {}) {
        this.render_ = render;
        this.targetElement = render.getWrapObj();

        /**
         * 鼠标中键漫游
         */
        this._lastClientX = 0;
        this._lastClientY = 0;
        this._beginMove = false;

        /**
         * 触摸事件双指缩放
         */
        this._beginZoom = false;
        this.touchZoonDist = 0;

        // 缺省缩放方法
        this.defaultMapZoom = options.mapZoom;     //MouseWheelZoom

        // 缺省漫游方法
        this.defaultMapMove = options.mapMove;

        // 缺省漫游的鼠标按键（0：鼠标左键，1：鼠标中键）
        this.defaultMapMoveKey = 1;

        /**
         * time事件，用于监视鼠标移动的位置
         */
        this.intervalTimeId_ = -1;

        /**
         * 鼠标最近移动时的位置和时间
         */
        this.lastMovePointer_ = { "time": Infinity, "position": [Infinity, Infinity], "clientPosition": [Infinity, Infinity] };
        this.mouseHovering = false;

        /**
         * 最后一次单击时间
         */
        this.lastClickTime = 0;
        this.lastClickTimeFunc = 0;

        /**
         * GraphEvent 自定义事件类型
         */
        this.eventObj = null;

        // 滚轮缩放/漫游功能是否可用
        this.isWorkable_ = true;
    }

    /**
     * 滚轮缩放/漫游功能是否可用
     */
    enabled(bool) {
        if (bool) {
            this.getRender().setPointer("");
            if (this.isWorkable_ === false) {
                this.isWorkable_ = true;
                // this.mouseenter({ "offsetX": 0, "offsetY": 0 });
            }
        } else {
            this.isWorkable_ = false;
        }
    };

    /**
     * 
     * @param {*} event 
     */
    setEvent(event) {
        this.eventObj = event;
    }

    /**
     * 图形对象
     */
    getRender() {
        return this.render_;
    }

    /**
     * 滚轮事件
     * @param {*} e 
     * @returns boolean
     */
    onWheel(e) {
        if (this.isWorkable_ === true) {
            DomUtil.stop(e);
            if (this.defaultMapZoom != null && (typeof this.defaultMapZoom === "function")) {
                let delta = (e.deltaY > 0 ? -1 : 1);   // 垂直滚动距离其值为：100/-100
                let offsetX = e.offsetX;
                let offsetY = e.offsetY;
                return this.defaultMapZoom({ op: delta, x: offsetX, y: offsetY });
            }
        } else {
            return true;
        }
    }

    /**
     * click Event
     * @param {*} e 
     */
    onClick(e) {
        // console.info("graph.mouse click");
    }

    /**
     * 鼠标双击事件
     * @param {Object} e 
     */
    onDblclick(e) {
        let rtn = false;
        if (this.eventObj != null && typeof (this.eventObj.dblclick) === "function") {
            rtn = this.eventObj.dblclick(e); //Object.assign({}, e, { x, y, "mouse": this }));
        }
        return rtn || false;
    }

    /**
     * 鼠标移动
     * @param {Object} e 
     * @param {int} x 
     * @param {int} y 
     */
    onMouseMove(e) {
        let rtn = false;
        let [x, y] = [e.offsetX, e.offsetY];

        // 鼠标中键移动
        if (this._beginMove === true && this.isWorkable_ === true) {
            rtn = this._doMapMove(x, y);
        }
        // 自定义鼠标操作
        else {
            if (this.eventObj != null && typeof (this.eventObj.mouseMove) === "function") {
                rtn = this.eventObj.mouseMove(e); //Object.assign({}, e, { x, y, "mouse": this }));
                if (this.eventObj.cursor != null) {
                    this.getRender().setPointer(this.eventObj.cursor);
                }
                if (rtn === false) return false;
            }
        }

        // 分析hover状态
        let moveExtent = Extent.buffer([x, y, x, y], 10);
        if (!Extent.containsXY(moveExtent, this.lastMovePointer_.position)) {
            this.lastMovePointer_ = {
                "time": (new Date()).getTime(),
                "position": [x, y],
                "clientPosition": [e.clientX, e.clientY]
            };
            if (this.mouseHovering === true && this.eventObj != null && typeof (this.eventObj.mouseHoverEnd) == "function") {
                this.mouseHovering = false;
                this.eventObj.mouseHoverEnd({
                    "x": e.offsetX,
                    "y": e.offsetY,
                    "offsetX": e.offsetX,
                    "offsetY": e.offsetY,
                    "clientX": e.clientX,
                    "clientY": e.clientY
                });
            }
        }

        return rtn;
    }

    /**
    * 鼠标按钮按下事件
    * @param {Object} e 
    */
    onMouseDown(e) {
        let that = this;
        let rtn = false;
        let [x, y] = [e.offsetX, e.offsetY];

        // 执行附加事件的mouseDown
        if (e.button == 0) {    // 鼠标左键
            if (that.eventObj != null && typeof (that.eventObj.mouseDown) === "function") {
                rtn = that.eventObj.mouseDown(e);  // Object.assign({}, e, { x, y, "mouse": that });
                if (that.eventObj.cursor != null) {
                    that.getRender().setPointer(that.eventObj.cursor);
                }
                if (rtn == false) return false;
            }
        }

        if (e.button == this.defaultMapMoveKey) {    // 鼠标中键/左键
            this.previousCursor_ = DomUtil.getStyle(this.targetElement, "cursor");
            this.getRender().setPointer(Cursor.PAN);
            this._lastClientX = x; //e.offsetX;
            this._lastClientY = y; //e.offsetY;
            this._beginMove = true;
        }

        return rtn;
    }

    /**
     * 鼠标按钮抬起事件
     * @param {Object} e 
     */
    onMouseUp(e) {
        let rtn = false;
        let that = this;

        // 结束漫游状态（鼠标中键）
        if (that._beginMove === true) {
            this.getRender().setPointer(that.previousCursor_);
            that._beginMove = false;
        }
        // 处理扩展的鼠标事件
        if (that.eventObj != null) {
            if (e.button == 0) {         //IE:1, FF:0 鼠标左键
                let callback = (typeof (that.eventObj) === "function" ? that.eventObj : that.eventObj.mouseUp);
                if (callback != null) {
                    rtn = callback(e);
                }
            } else if (e.button == 2) {    // 鼠标右键
                //执行右键回调
                let callback = that.eventObj.rclick;
                if (typeof (callback) === "function") {
                    rtn = callback(e);
                }
            }
            if (that.eventObj.cursor != null) {
                that.getRender().setPointer(that.eventObj.cursor);
            }
            if (rtn === false) return rtn;
        }

        that.lastClickTime = Date.now();
        return rtn;
    }

    /**
     * 鼠标移出
     * @param {Object} e 
     */
    onMouseOut(e) {
        this.lastMovePointer_.time = Infinity;
        if (this.intervalTimeId_ > 0) {
            window.clearInterval(this.intervalTimeId_)
        };
        return false;
    }

    /**
     * 鼠标移入
     * @param {Object} e 
     */
    onMouseEnter(e) {
        //监测鼠标的hover事件
        let that = this;
        if (this.intervalTimeId_ > 0) {
            window.clearInterval(this.intervalTimeId_)
        };
        this.lastMovePointer_.time = Infinity;
        this.intervalTimeId_ = window.setInterval(function () {
            if ((new Date()).getTime() - that.lastMovePointer_.time > 1100) {
                that.lastMovePointer_.time = Infinity;
                that._doMouseHover({
                    "x": that.lastMovePointer_.position[0],
                    "y": that.lastMovePointer_.position[1],
                    "offsetX": that.lastMovePointer_.position[0],
                    "offsetY": that.lastMovePointer_.position[1],
                    "clientX": that.lastMovePointer_.clientPosition[0],
                    "clientY": that.lastMovePointer_.clientPosition[1],
                    "targetElement": that.targetElement
                });
            }
        }, 400);
        return false;
    }

    /**
     * 鼠标hover事件处理
     * @param {Object} e 
     */
    _doMouseHover(e) {
        this.mouseHovering = true;
        if (this.eventObj != null && typeof (this.eventObj.mouseHover) === "function") {
            this.eventObj.mouseHover(e);
        }
        return false;
    }

    /**
     * 触摸事件开始
     * @param {EventTarget} e 
     */
    onTouchStart(e) {
        //阻止触摸时浏览器的缩放、滚动条滚动等
        e.preventDefault();
        const touches = e.touches;
        if (touches.length == 2) {
            let diffX = touches[0].clientX - touches[1].clientX;
            let diffY = touches[0].clientY - touches[1].clientY;
            this.touchZoonDist = Math.sqrt(diffX * diffX + diffY * diffY);
            this._beginZoom = true;
        } else if (touches.length == 1) {
            this._beginMove = true;
            let touch = touches[0];          //获取第一个触点
            this._lastClientX = parseInt(touch.clientX); //页面触点X坐标
            this._lastClientY = parseInt(touch.clientY); //页面触点Y坐标
        }
    }

    /**
     * 触摸事件结束
     * @param {EventTarget} e 
     */
    onTouchEnd(e) {
        this._beginMove = false;
        this._beginZoom = false;
    }

    /**
     * 触摸事件移动中
     * @param {EventTarget} e 
     */
    onTouchMove(e) {
        //阻止触摸时浏览器的缩放、滚动条滚动等
        e.preventDefault();
        const touches = e.touches;
        if (this._beginMove === true && touches.length === 1 && this.isWorkable_ === true) {
            // 单指触摸移动
            let touch = touches[0]; //获取第一个触点
            this._doMapMove(parseInt(touch.clientX), parseInt(touch.clientY));
        } else if (touches.length === 2 && this._beginZoom === true) {
            let diffX = touches[0].clientX - touches[1].clientX;
            let diffY = touches[0].clientY - touches[1].clientY;
            let touchZoonDist = Math.sqrt(diffX * diffX + diffY * diffY);
            let touchZoonCenter = [(touches[0].clientX + touches[1].clientX) / 2, (touches[0].clientY + touches[1].clientY) / 2];

            if (this.defaultMapZoom != null && (typeof this.defaultMapZoom === "function")) {
                let scale = this.touchZoonDist / touchZoonDist;
                if (scale > 1.02 || scale < 0.98) {
                    this.defaultMapZoom({ "scale": scale, "x": touchZoonCenter[0], "y": touchZoonCenter[1] });
                    this.touchZoonDist = touchZoonDist;
                }
            }
        }
    }

    /**
     * 按键事件
     * @param {EventTarget} e 
     */
    onKeyDown(e) {
        if (this.eventObj != null && typeof (this.eventObj.keyDown) === "function") {
            this.eventObj.keyDown(e);
        }
    }

    /**
     * 漫游
     * @param {int} x 
     * @param {int} y 
     */
    _doMapMove(x, y) {
        let that = this;
        let _doit = function (callback) {
            window.setTimeout(function () {
                let xdist = x - that._lastClientX;
                let ydist = y - that._lastClientY;
                let rtn = -1;
                if (Math.abs(xdist) > 10 || Math.abs(ydist) > 10) {
                    rtn = callback(Object.assign({ xdist, ydist }, { x, y, "mouse": that }));
                    that._lastClientX = x;
                    that._lastClientY = y;
                }
                that.moveing = false;
            });
        }

        if (this._beginMove === true) {
            if (this.moveing) {
                return false;
            } else {
                if (this.eventObj != null && this.eventObj.mapMove != null) {
                    this.moveing = true;
                    _doit(this.eventObj.mapMove);
                    return true;
                } else {
                    if (this.defaultMapMove != null) {
                        _doit(this.defaultMapMove);
                    }
                    return false;
                }
            }
        }
        return false;
    }
}

export default GraphMouseOp;
