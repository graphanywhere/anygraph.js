/**
  * 图形渲染基础类
 */
class RendererBase {
    constructor() {
        /**
         * 工作画板上下文
         */
        this._context = null;

        /**
         * 工作画板对象
         */
        this._canvas = null;

        // 点击拾取画布
        this._hitCanvas = null;
        this._hitContext = null;
        this._useHitCanvas = true;
    }

    /**
     * 初始化画板对象
     * @param {Size} size
     */
    initCanvas(size) {
        // 建立缓冲画板
        if (this._canvas === null) {
            this._canvas = document.createElement("canvas");
        }
        this._canvas.width = size.width;
        this._canvas.height = size.height;
        this._context = this._canvas.getContext("2d");
        this._context.clearRect(0, 0, size.width, size.height);

        // 建立点击拾取画板
        if (this._useHitCanvas === true) {
            if (this._hitCanvas === null) {
                this._hitCanvas = document.createElement("canvas");
            }
            this._hitCanvas.width = size.width;
            this._hitCanvas.height = size.height;
            this._hitContext = this._hitCanvas.getContext("2d", { "willReadFrequently": true });
            this._hitContext.clearRect(0, 0, size.width, size.height);
        } else {
            this._hitContext = null;
        }
    }

    /**
     * 获取当前图层的图形
     */
    getImage() {
        let ctx = this._context;
        return ctx ? ctx.canvas : null;
    }

    /**
     * 设置当前图形内容
     */
    setImage(img) {
        let ctx = this._context;
        ctx.drawImage(img, 0, 0);
    }

    /**
     * 点击拾取图形
     * @returns Canvas
     */
    getHitImage() {
        return this._hitCanvas;
    }

    /**
     * 获取视图尺寸
     * @returns size
     */
    getSize() {
        return {
            "width": this._canvas.width,
            "height": this._canvas.height
        };
    }

    /**
     * 清屏
     */
    clearScreen(ctx) {
        if (ctx == null) ctx = this._context;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default RendererBase;
