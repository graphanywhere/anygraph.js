import MathUtil from "../util/math.js";
import createCanvas from "../control/canvas.js";
import { default as ImageObject, ImageState } from "../basetype/image.js";
import Coordinate from "../spatial/coordinate.js";
import Extent from "../spatial/extent.js";
import Transform from "../spatial/transform.js";

/**
 * 图案填充效果类
 */
class Pattern {

    /**
     * @param {Object} options 
     * @param {String} [options.type] 类型: canvas, image, simple
     * @param {String} [options.repeat] 重复: repeat, repeat-x, repeat-y or no-repeat
     */
    constructor(options = {}) {
        /**
         * 重复属性，取值为：repeat, repeat-x, repeat-y or no-repeat
         */
        this.repeat = options.repeat || 'repeat';

        /**
         * pattern类型
         */
        this.type = options.type || 'canvas';            // canvas, image, simple

        /**
         * 当pattern为canvas类型时，geomList则作为canvas中渲染的Geomerty对象集合
         */
        this.geomList = options.geomList || [];

        /**
         * 当pattern为canvas类型时， 以下属性为render()属性
         */
        this.patternTransform = options.patternTransform;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.viewBox = options.viewBox || [];

        // type = simple 的专用属性
        this.color = options.color;
        this.rotation = options.rotation;
        this.lineWidth = options.lineWidth || 0.5;

        // 如果没有指定宽高信息，则根据geomList确定宽高
        if ((this.width == 0 || this.height == 0) && this.type === "canvas") {
            let extent = Extent.createEmpty();
            this.geomList.forEach(element => {
                //if (element instanceof Geometry) {
                let objBBox = element.getBBox();
                extent[0] = Math.min(extent[0], objBBox[0]);
                extent[1] = Math.min(extent[1], objBBox[1]);
                extent[2] = Math.max(extent[2], objBBox[2]);
                extent[3] = Math.max(extent[3], objBBox[3]);
                //}
            });
            this.width = Extent.getWidth(extent);
            this.height = Extent.getHeight(extent);

            if (this.viewBox == null || this.viewBox.length == 0) {
                this.viewBox = [0, 0, this.width, this.height];
            }
        }

        // 渲染时的画板像素坐标值
        this.pixel = [[this.x, this.y], [this.x + this.width, this.y + this.height]];

        /**
         * 当pattern为image类型时，source则作为背景图片
         */
        this.source;
        if (this.type === "image") {
            if (typeof options.imageSrc == 'string') {
                this.source = new ImageObject(this.source);
            } else if (options.image instanceof ImageObject) {
                this.source = options.image;
            }
        }
    }

    /**
     * 加载背景图片图案
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Function} callback callback(CanvasPattern)
     */
    loadImagePattern(ctx, callback) {
        if (this.source && this.source instanceof ImageObject) {
            return this.create(ctx, callback);
        } else {
            let that = this;
            this.source = new ImageObject(this.source, function (img) {
                if (this.width == 0 || this.height == 0) {
                    this.width = img.width;
                    this.height = img.height;
                }
                callback && callback(that.create(ctx));
            });
            return null;
        }
    }

    /**
     * 创建画板填充图案对象
     * @param {CanvasRenderingContext2D} ctx Context to create pattern
     * @return {CanvasPattern}
     */
    create(ctx, callback) {
        let that = this;
        if (this.type == "image") {
            if (this.source.getState() == ImageState.LOADED) {
                let image = this.source.getImage();
                if (typeof (callback) == "function") {
                    callback(ctx.createPattern(image, this.repeat));
                } else {
                    return ctx.createPattern(image, this.repeat);
                }
            } else {
                if (typeof (callback) == "function") {
                    this.source.setCallback(function (image) {
                        callback(ctx.createPattern(image, that.repeat));
                    })
                } else {
                    // 位图未加载成功，且没有回调，则返回空对象
                    return null;
                }
            }
        } else if (this.type == "simple") {
            return this.createSimple(ctx, {
                "size": Math.max(this.width, this.height),
                "rotation": this.rotation,
                "color": this.color
            })
        } else {
            // 实例化画板，并绘制图案
            let width = this.pixel[1][0] - this.pixel[0][0];
            let height = this.pixel[1][1] - this.pixel[0][1];

            // 此处在建立画板对象时传入viewBox对象，渲染时将根据宽高的信息缩放内部Geometry
            let canvas = createCanvas({ "width": width, "height": height, "viewBox": this.viewBox, "transform": this.patternTransform })
            let pctx = canvas.getContext('2d');
            this.geomList.forEach(element => {
                //if (element instanceof Geometry) {
                element.draw(pctx, element.getStyle());
                //}
            });
            // 返回画板填充图案对象
            return ctx.createPattern(canvas, this.repeat);
        }
    }

    /**
     * 获取具体的像素值，
     * 完全缩放时应先处理对象的坐标转换，然后处理渐变对象的坐标转换
     * @param {*} tool 
     */
    toPixel(tool) {
        // 坐标:[[x,y], [x+width, y+height]]
        let coords = [[this.x, this.y], [this.x + this.width, this.y + this.height]];
        // 执行矩阵变换
        let nc = this._patternTransform(coords)
        // 转换为屏幕坐标
        let pixels = Coordinate.transform2D(tool, nc, false);
        // 存储至实例变量中
        this.pixel = pixels;
    }

    /**
     * 根据gradientTransform属性，在渲染时进行矩阵变换
     */
    _patternTransform(pixels) {
        if (Array.isArray(this.patternTransform)) {
            pixels = Transform.applys(this.patternTransform, pixels);
        }
        // 执行对象应用矩阵变换
        if (Array.isArray(this.objTransform_)) {
            pixels = Transform.applys(this.objTransform_, pixels);
        }
        return pixels;
    }

    /**
     * 对象应用矩阵时，其关联的本填充图案对象也需要进行矩阵变换；
     * 注意：其执行顺序需在 渐变应用矩阵执行之后再来执行该变换
     * @param {*} trans 
     */
    transform(trans) {
        this.objTransform_ = trans.slice();
        // 此处仅记录变换矩阵，在渲染时进行坐标变换
    }

    // 根据矩阵修改坐标
    doTransform(trans) {
        // TOOD
    }

    /**
     * 克隆
     * @returns Object
     */
    clone() {
        return new Pattern(this);
    }

    /**
     * 建立斜线pattern
     * @param {Object} options {lineWidth, size, color, rotation, repeat} 
     */
    createSimple(ctx, options = {}) {
        let lineWidth = (options.lineWidth || 0.5),
            size = (options.size || 40),
            color = (options.color || "#9FFFFF"),
            rotation = (options.rotation || 0),
            repeat = (options.repeat || "repeat");     //可选值为: repeat, repeat-x, repeat-y, no-repeat

        while (rotation < 0) {
            rotation = rotation + 360;
        }
        while (rotation >= 180) {
            rotation = rotation - 180;
        }
        let width, height;
        let x1, y1, x2, y2;
        if (rotation >= 0 && rotation < 90) {
            [x1, y1] = [0, 0];
            x2 = Math.floor(size);
            y2 = Math.floor(x2 * Math.tan(MathUtil.toRadians(rotation)));
            [width, height] = [x2, y2];
        } else if (rotation >= 90 && rotation < 180) {
            x1 = Math.floor(size * Math.tan(MathUtil.toRadians(rotation - 90)));
            y1 = 0;
            x2 = 0;
            y2 = size;
            [width, height] = [x1, y2];
        }

        let canvas = createCanvas({ width: width, height: height })
        let pctx = canvas.getContext('2d');
        pctx.beginPath();
        pctx.moveTo(x1, y1);
        pctx.lineTo(x2, y2);
        pctx.lineWidth = lineWidth;
        pctx.strokeStyle = color;
        pctx.stroke();

        return ctx.createPattern(canvas, repeat);
    }
};

export default Pattern;
