import EventTarget from "../basetype/event.target.js";
import GraphMouseOp from "../event/graph.mouse.js";
import DomUtil from "../util/dom.js";
import GraphEvent from "../event/graph.event.js";
import { Stack } from "../basetype/adt.js";
/**
 * 图形窗口操作/渲染对象
 */
class RenderObject extends EventTarget {
    /**
     * 构造函数
     * @param {String} container 容器对象或容器ID
     * @param {Object} options 选项，对象格式为{mouse:true, mapZoom, mapMove}
     */
    constructor(container, options = { mouse: true }, graph) {
        super();

        if (container == null) {
            throw new Error("图形容器对象不能为空, RenderObject初始化失败");
        }

        /**
         * 是否可用
         */
        this.isWorkable_ = (options.mouse == null ? true : options.mouse == true);

        // 创建画布对象
        this._createCanvas(container);

        /**
         * 图形鼠标操作对象（滚轮缩放、鼠标移动、鼠标中键漫游、hover、触摸缩放）
         */
        this.graphMouseOp = new GraphMouseOp(this, options);
        this.graphMouseOp.enabled(this.isWorkable_);

        // 绑定事件
        this._bindEvent(graph);

        /**
         * 事件堆栈，当该值为null时，仍旧执行图形鼠标操作对象中的事件
         */
        this.eventObj = null;
        this.eventQuene = new Stack();

        /**
         * 鼠标状态
         */
        this.previousCursor_ = "default";
        this.pointerName_ = "default";
    }

    enabledMouse(enabled) {
        this.isWorkable_ = (enabled === true);
        this.graphMouseOp.enabled(this.isWorkable_);
    }

    /**
     * 创建画布及其相关dom对象
     */
    _createCanvas(container) {
        // 容器对象
        this.containerObj_ = DomUtil.get(container);

        // 画布容器(eventTarget)
        let wrapId = this.containerObj_.id + "_wrap";
        this.wrapObj_ = DomUtil.get(wrapId);

        if (this.wrapObj_ == null) {
            let body = DomUtil.create("div", "", this.containerObj_);
            body.style.position = "relative";

            // wrap
            this.wrapObj_ = DomUtil.create("div", "", body);
            this.wrapObj_.id = wrapId;
            this.wrapObj_.tabIndex = -1;
            this.wrapObj_.style.outline = "blue solid 0px";

            // canvas
            this.canvas_ = DomUtil.create("canvas", "", this.wrapObj_);
            this.canvas_.oncontextmenu = function () { return false };

        } else {
            let first = this.wrapObj_.firstElementChild;
            while (first && first.localName != "canvas") {
                first = first.nextElementSibling;
            }
            if (first == null) {
                throw new Error("图形容器对象错误, CWRenderObject初始化失败!");
            } else {
                this.canvas_ = first;
            }
        }

        // 取容器边框大小
        let borderWidthArray = DomUtil.getStyle(this.containerObj_, "border-width").split(" ");
        this.borderTopWidth = parseInt(borderWidthArray[0]);
        this.borderRightWidth = (borderWidthArray.length > 1 ? parseInt(borderWidthArray[1]) : this.borderTopWidth);
        this.borderBottomWidth = (borderWidthArray.length > 2 ? parseInt(borderWidthArray[2]) : this.borderTopWidth);
        this.borderLeftWidth = (borderWidthArray.length > 3 ? parseInt(borderWidthArray[3]) : this.borderRightWidth);

        // 画板大小缺省=容器内部大小
        let canvasWidth = (this.containerObj_.offsetWidth > 0 ? this.containerObj_.offsetWidth : parseInt(DomUtil.getStyle(this.containerObj_, "width"))) - this.borderLeftWidth - this.borderRightWidth;      // 像素宽
        let canvasHeight = (this.containerObj_.offsetHeight > 0 ? this.containerObj_.offsetHeight : parseInt(DomUtil.getStyle(this.containerObj_, "height"))) - this.borderTopWidth - this.borderBottomWidth;    // 像素高
        this.canvas_.width = canvasWidth > 20 ? canvasWidth : 20;
        this.canvas_.height = canvasHeight > 20 ? canvasHeight : 20;
        this.wrapObj_.style.height = canvasHeight + "px";
        this.wrapObj_.parentElement.style.height = canvasHeight + "px";
    }

    _bindEvent(graph) {
        // 绑定事件, mouseUp事件在mousedown触发后产生，绑定时不包含该事件
        let bindEventArray = [
            "wheel", "click", "dblclick",
            "mousemove", "mousedown", "mouseout", "mouseenter", "mouseover",
            "dragover", "dragenter", "dragleave",
            //     "resize", "focus", "blur",
            "keydown",
            "touchstart", "touchmove", "touchend"];


        let geomEvent = ["click", "mousemove", "mousedown"];
        let that = this;
        let msTouch = !!window.navigator.msMaxTouchPoints;
        bindEventArray.forEach(eventName => {
            if (eventName.indexOf('touch') === 0) {
                if (!msTouch) return;
            }
            that.wrapObj_.addEventListener(eventName, function (e) {
                let x = e.offsetX;
                let y = e.offsetY;
                let bubbling = true;
                if (graph.isEnabledGeomEvent() && geomEvent.indexOf(eventName) >= 0) {
                    // 先执行geom事件
                    if (graph.handleEvent(eventName, { x, y, e }) !== false) {
                        // 然后执行graph事件
                        if (that.isWorkable_ === true) {
                            bubbling = that.handleEvent(eventName, { x, y, e });
                        }
                    }
                } else {
                    //if (that.isWorkable_ === true) {
                    bubbling = that.handleEvent(eventName, { x, y, e });
                    //}
                }
                if (bubbling === false) {
                    DomUtil.stop(e);
                }
            });
        });
    }

    /**
     * 获取渲染对象大小
     * @returns {Object} size {width, height}
     */
    updateSize() {
        let owidth = this.canvas_.width;
        let oheight = this.canvas_.height;
        let width = (this.containerObj_.offsetWidth - this.borderLeftWidth - this.borderRightWidth);       // 像素宽
        let height = (this.containerObj_.offsetHeight - this.borderTopWidth - this.borderBottomWidth);    // 像素高;
        width = (width > 300 ? width : owidth);
        height = (height > 200 ? height : oheight);

        // 支持改变画板大小，而不改变容器大小
        // *** 修改画板的宽高将会清空画板中的内容 ***
        this.canvas_.width = width;
        this.canvas_.height = height;

        return { width, height };
    }

    /**
     * 当前渲染对象的事件绑定ID
     */
    getWrapObj() {
        return this.wrapObj_;
    }

    /**
     * 获取画板
     */
    getCanvas() {
        return this.canvas_;
    }

    /**
     * 移除对象
     */
    remove() {
        let wrapObj = this.getWrapObj();
        if (wrapObj != null) {
            wrapObj.parentElement.remove();
        }
    }

    getEvent() {
        return this.eventObj;
    }

    /**
     * 外部控制执行鼠标操作
     * @param {Object} event event如果为function，则表示mouseUp事件所执行的function，否则event需为对象类型
     * @example event的对象格式为{mouseUp, mouseDown, mouseMove, mapMove, rclick, dblclick, mouseHover, mouseHoverEnd}，属性值为各事件所执行的function
     * 其参数均为对象，包含e, x, y, mouse等属性，Object.assign(e, {x, y, mouse:this})
     */
    addEvent(event) {
        if (event instanceof GraphEvent) {
            // this.enabled(true);
            this.eventQuene.push(event);
            this.eventObj = event;
            this.setPointer(event.cursor);
            this.graphMouseOp.setEvent(this.eventObj);
            event.setParent(this);
        } else {
            throw new Error("参数错误");
        }
    }

    /**
     * 结束最后一次addEvent()的事件，恢复至上一次addEvent()指定的操作
     */
    endEvent() {
        if (this.eventQuene.isEmpty()) {
            this.eventObj = null;
            this.setPointer();
            this.graphMouseOp.setEvent(null);
        } else {
            // 移动最后一个
            this.eventQuene.pop();
            // 新的最后事件成为当前事件
            this.eventObj = this.eventQuene.peek();
            this.setPointer(this.eventObj == null ? null : this.eventObj.cursor);
            this.graphMouseOp.setEvent(this.eventObj);
        }
    }

    /**
     * 设置鼠标样式
     * @param {GP_CURSOR_TYPE} status 或者直接指定文件名 url(" + UrlUtil.getContextPath() + "/adam.lib/images/cursor/gk_std.cur) 
     */
    setPointer(name) {
        let pointer = name || "default";
        DomUtil.setStyle(this.getWrapObj(), "cursor", pointer);
        this.pointerName_ = name;
        return false;
    };

    /**
     * 返回鼠标当前状态
     */
    getPointer() {
        return (this.pointerName_ === undefined ? "default" : this.pointerName_);
    }

    /**
     * 事件分发，从target中通过该方法将鼠标事件分发至 click()、dblclick()等方法中
     * @param {*} name 
     * @param {*} args 
     */
    handleEvent(name, args) {

        // 触发已绑定的事件
        this.triggerEvent(name, args.e);

        // 触发图形事件
        let that = this;
        switch (name) {
            case "wheel":
                this.graphMouseOp.onWheel(args.e);
                break;
            case "click":
                this.graphMouseOp.onClick(args.e);
                break;
            case "dblclick":
                this.graphMouseOp.onDblclick(args.e)
                break;
            case "mousemove":
                this.graphMouseOp.onMouseMove(args.e)
                break;
            case "mousedown":
                // 添加mouseUp事件
                this.getWrapObj().ownerDocument.addEventListener("mouseup", function (e) {
                    let rtn = that.graphMouseOp.onMouseUp(e);
                    if (e.button == 2) {
                        if (rtn !== false && that.eventObj != null && that.eventObj.rightClickCancel === true) {
                            that.endEvent();  // 结束鼠标操作
                        }
                    }
                    return rtn;
                }, { "once": true });
                this.graphMouseOp.onMouseDown(args.e)
                break;
            case "mouseout":
                this.graphMouseOp.onMouseOut(args.e)
                break;
            case "mouseenter":
                this.graphMouseOp.onMouseEnter(args.e)
                break;
            case "touchstart":
                this.graphMouseOp.onTouchStart(args.e)
                break;
            case "touchend":
                this.graphMouseOp.onTouchEnd(args.e)
                break;
            case "touchmove":
                this.graphMouseOp.onTouchMove(args.e)
                break;
            case "keydown":
                this.graphMouseOp.onKeyDown(args.e)
                break;
            default:
                // if (this[name]) {
                //     this[name](args.e);
                // }
                break;
        }
        if (this.eventObj != null && this.eventObj.cursor != null) {
            this.setPointer(this.eventObj.cursor);
        }
    }
}

export default RenderObject;
