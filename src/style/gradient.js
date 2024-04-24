import Extent from "../spatial/extent.js";
import Transform from "../spatial/transform.js";
import Coordinate from "../spatial/coordinate.js";
import Color from "./color.js";
import MathUtil from "../util/math.js";

/**
 * 渐变效果类
 */
class Gradient {

    /**
     * @param {Object} options 选项{type, coords, gradientUnits, and colorStops}
     * @param {Object} [options.type] 渐变类型：linear or radial
     * @param {Object} [options.gradientUnits] 坐标单位：像素/百分比
     * @param {Object[]} options.colorStops colorstops参数
     * @param {Object} options.coords gradient坐标
     * @param {Number} [options.coords.x1] X coordiante of the first point for linear or of the focal point for radial
     * @param {Number} [options.coords.y1] Y coordiante of the first point for linear or of the focal point for radial
     * @param {Number} [options.coords.x2] X coordiante of the second point for linear or of the center point for radial
     * @param {Number} [options.coords.y2] Y coordiante of the second point for linear or of the center point for radial
     * @param {Number} [options.coords.r1] only for radial gradient, radius of the inner circle
     * @param {Number} [options.coords.r2] only for radial gradient, radius of the external circle
     */
    constructor(options) {
        /**
         * 渐变的变换矩阵
         * 在应用此变换之前，原点位于对象的左上角，加上offsetY和offsetX
         * @type Number[]
         * @default null
         */
        this.gradientTransform = null;

        /**
         * 对象的变换矩阵
         */
        this.objTransform_ = null;

        /**
         * 坐标单位. 可选值：像素(pixels)、百分数(percentage)
         * 当单位为百分数时，坐标值需采用小数值， 例如当值为50%时需使用0.5表示
         * @type String
         * @default 'pixels'
         */
        this.gradientUnits = 'pixels';

        /**
         * 渐变对象类型
         * @type String
         * @default 'linear'
         */
        this.type = 'linear';

        if (options == null) (options = {});
        if (options.coords == null) (options.coords = {});

        // 根据options设置对象属性
        let that = this;
        Object.keys(options).forEach(function (option) {
            that[option] = options[option];
        });

        /**
         * 坐标信息
         */
        let coords = {
            x1: options.coords.x1 || 0,
            y1: options.coords.y1 || 0,
            x2: options.coords.x2 || 0,
            y2: options.coords.y2 || 0
        };
        if (this.type === 'radial') {
            coords.r1 = options.coords.r1 || 0;
            coords.r2 = options.coords.r2 || 0;
        }
        this.coords = coords;

        /**
         * 像素信息，与坐标信息对应，缩放操作时需将坐标变换为像素
         */
        this.pixel = options.pixel;

        /**
         * 由偏移值和颜色值指定的断点到渐变数组
         */
        this.colorStops = options.colorStops.slice();
    }

    /**
     * Adds another colorStop
     * @param {Object} colorStop Object with offset and color
     * @return {Gradient} thisArg
     */
    addColorStop(colorStops) {
        for (let position in colorStops) {
            let color = Color.fromString(colorStops[position]);
            this.colorStops.push({
                offset: parseFloat(position),
                color: color.toRgb(),
                opacity: color.getAlpha()
            });
        }
        return this;
    }

    /**
     * 对象应用矩阵时，其关联的本渐变对象也需要进行矩阵变换；
     * 注意：其执行顺序需在 渐变应用矩阵执行之后再来执行该变换
     * @param {*} trans 
     */
    transform(trans) {
        this.objTransform_ = trans.slice();
        // 此处仅记录变换矩阵，在渲染时进行坐标变换   
    }

    // 根据矩阵修改坐标
    doTransform(trans) {
        let coords = [[this.coords.x1, this.coords.y1], [this.coords.x2, this.coords.y2]];
        coords = Transform.applys(trans, coords);
        let newCoords = {
            "x1": coords[0][0],
            "y1": coords[0][1],
            "x2": coords[1][0],
            "y2": coords[1][1]
        };

        if (this.type === "radial") {
            let scale = Transform.getScale(trans);
            newCoords.r1 = this.coords.r1 * scale
            newCoords.r2 = this.coords.r2 * scale
        }
        this.coords = newCoords;
    }

    /**
     * 创建Canvas的Gradient对象
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @return {CanvasGradient}
     */
    create(ctx) {
        let gradient, coords = this.coords;

        if (!this.type) {
            return;
        }

        if (this.type === 'linear') {
            if (this.pixel != null && this.pixel.length == 2) {
                let pixel = this.pixel;
                gradient = ctx.createLinearGradient(pixel[0][0], pixel[0][1], pixel[1][0], pixel[1][1]);
            } else {
                gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);
            }
        } else if (this.type === 'radial') {
            if (this.pixel != null && this.pixel.length == 3) {
                let pixel = this.pixel;
                gradient = ctx.createRadialGradient(
                    pixel[0][0], pixel[0][1], Math.abs(pixel[2][0] - pixel[0][0]),
                    pixel[1][0], pixel[1][1], Math.abs(pixel[2][1] - pixel[1][1]));
            } else {
                gradient = ctx.createRadialGradient(coords.x1, coords.y1, coords.r1, coords.x2, coords.y2, coords.r2);
            }
        }

        for (let i = 0, len = this.colorStops.length; i < len; i++) {
            let color = this.colorStops[i].color,
                opacity = this.colorStops[i].opacity,
                offset = this.colorStops[i].offset;

            if (opacity >= 0 && opacity <= 1) {
                color = Color.fromString(color).setAlpha(opacity).toRgba();
            }
            gradient.addColorStop(offset, color);
        }

        return gradient;
    }

    /**
     * 获取具体的像素值，
     * 缩放时应先处理对象的坐标转换，然后处理渐变对象的坐标转换
     * @param {*} tool 
     * @param {*} geometry 
     */
    toPixel(tool, geometry) {
        let coords = [[this.coords.x1, this.coords.y1], [this.coords.x2, this.coords.y2]];
        let radius = (this.type === "linear" ? [0, 0] : [this.coords.r1, this.coords.r2]);

        let bbox = geometry.getBBox(false);
        let pixels = [];
        if (this.gradientUnits === 'pixels') {
            let nc = this._gradientTransform(coords, radius, bbox)
            pixels = Coordinate.transform2D(tool, nc, false);
        } else {
            // 如果坐标为百分比，且存在transform属性，则应先transform，然后计算为具体像素值
            // coords = this._gradientTransform(coords, radius, [0, 0, 1, 1]);   // 百分比单位不进行变形操作 20240418 hjq
            let width = Extent.getWidth(bbox);
            let height = Extent.getHeight(bbox);

            for (let i = 0, ii = coords.length; i < ii; i++) {
                // bbox[0] + 宽度*百分比
                // bbox[1] + 高度*百分比
                pixels.push([bbox[0] + width * coords[i][0], bbox[1] + height * coords[i][1]]);
            }

            // 将半径信息添加到pixel数组中
            if (this.type === "radial") {
                pixels.push([pixels[0][0] + width * radius[0], pixels[1][1] + height * radius[1]])
            }
        }

        // 存储至实例变量中
        this.pixel = pixels;
    }

    /**
     * 根据gradientTransform属性，在渲染时进行矩阵变换
     */
    _gradientTransform(pixels, radius, bbox) {
        if (this.gradientTransform != null) {
            let transform = Transform.create();
            let transData = this.gradientTransform;
            if (Array.isArray(transData) && transData.length > 0) {
                for (let i = 0; i < transData.length; i++) {
                    let prop = transData[i];
                    if (prop.action == "translate") {
                        Transform.translate(transform, prop.value[0], prop.value[1]);
                    } else if (prop.action === "rotate") {
                        // 旋转的基点为bbox的左上点
                        Transform.rotateAtOrigin(transform, MathUtil.toRadians(prop.value), [bbox[0], bbox[1]]);
                        // Transform.rotateAtOrigin(transform, MathUtil.toRadians(prop.value), Extent.getCenter(bbox));
                    } else if (prop.action === "scale") {
                        Transform.scale(transform, prop.value[0], prop.value[1]);
                    } else if (prop.action == "matrix") {
                        Transform.multiply(transform, prop.value);
                    }
                }
                pixels = Transform.applys(transform, pixels);
                radius = [radius[0] * Transform.getScale(transform), radius[1] * Transform.getScale(transform)];
            }
        }

        // 执行对象应用矩阵变换
        if (this.objTransform_ != null) {
            pixels = Transform.applys(this.objTransform_, pixels);
            radius = [radius[0] * Transform.getScale(this.objTransform_), radius[1] * Transform.getScale(this.objTransform_)];
        }

        // 将半径信息添加到pixel数组中
        if (this.type === "radial") {
            pixels.push([pixels[0][0] + radius[0], pixels[1][1] + radius[1]])
        }

        return pixels;
    }

    clone() {
        return new Gradient(this);
    }
}

export default Gradient;
