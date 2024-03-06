import Extent from "./extent.js";
import MathUtil from "../util/math.js";

/**
 * 坐标等比例变换处理类
 */
class Ratio {
    constructor() {
        /**
         * 画板大小
         */
        this.canvasExtent_;

        /**
         * 坐标范围
         */
        this.worldExtent_;

        /**
         * 两个坐标系原点是否相同, (地理坐标系false，0点在左下, 屏幕坐标系true，0点在左上)
         */
        this.sameOrigin_ = false;
    }

    getScale() {
        return Extent.getWidth(this.canvasExtent_) / Extent.getWidth(this.worldExtent_);
    }

    /**
     * 设置画板尺寸
     * @param {Size} size 
     */
    setCanvasSize(size) {
        this.canvasExtent_ = [0, 0, size.width, size.height];
    }

    /**
     * 设置画板范围
     * @param {Extent} extent
     */
    setCanvasExtent(extent) {
        this.canvasExtent_ = extent;
    }

    /**
     * 设置世界坐标范围
     * @param {Extent} extent
     */
    setWorldExtent(extent) {
        this.worldExtent_ = extent;
    }

    /**
     * 设置坐标原点是否与屏幕原点一致
     * @example 地理坐标系false，0点在左下, 屏幕坐标系true，0点在左上
     * @param {Boolean} val 
     */
    setWorldExtentOrigin(val) {
        this.sameOrigin_ = (val === true);
    }

    /**
     * 坐标变换
     * @param {Coord} originalCoord  原坐标值，其格式为[x,y]或[[x,y],[x,y]]
     * @param {Extent} originalExtent 原坐标范围
     * @param {Extent} destExtent     目标坐标范围
     * @param {Boolean} precision 返回值是否保留小数
     * @returns {Coord} flatCoords 目标坐标值，其格式为[x,y]
     */
    convert(originalCoord, originalExtent, destExtent, options = {}, precision = false) {
        if (originalExtent == null) throw new Error("originalExtent is null");
        if (destExtent == null) throw new Error("destExtent is null");
        if(options.correct == null) options.correct = true;
        if(options.sameOrigin == null) options.sameOrigin = false;

        if (options.correct) {
            destExtent = correctExtent(destExtent, originalExtent);
        }

        let originalWidth = Math.abs(originalExtent[2] - originalExtent[0]);
        let originalHeight = Math.abs(originalExtent[3] - originalExtent[1]);
        let destWidth = Math.abs(destExtent[2] - destExtent[0]);
        let destHeight = Math.abs(destExtent[3] - destExtent[1]);

        // 分辨率
        let resX = destWidth / originalWidth
        let resY = destHeight / originalHeight

        if (Array.isArray(originalCoord[0])) {
            let flatCoords = [];
            for (let i = 0; i < originalCoord.length; i++) {
                flatCoords.push(this.convert(originalCoord[i], originalExtent, destExtent, options, precision));
            }
            return flatCoords;
        } else {
            if(originalCoord[0] == null || originalCoord[1] == null) {
                return [null, null];
            }
            let destX = resX * (originalCoord[0] - originalExtent[0]) + destExtent[0];
            let destY;
            if (options.sameOrigin === true) {
                destY = resY * (originalCoord[1] - originalExtent[1]) + destExtent[1];
            } 
            // Y轴翻转
            else {
                destY = destExtent[3] - resY * (originalCoord[1] - originalExtent[1]);
            }
            if (precision == true) {
                return [destX, destY];
            } else {
                //return [destX == null ? null : Math.floor(destX), destY == null ? null : Math.floor(destY)];
                return [destX == null ? null : Math.round(destX), destY == null ? null : Math.round(destY)];
            }
        }
    }

    // // openlayer 2.13 
    // getLocalXY (point) {
    //     var resolution = this.getResolution();
    //     var extent = this.extent;
    //     var x = ((point.x - this.featureDx) / resolution + (-extent.left / resolution));
    //     var y = ((extent.top / resolution) - point.y / resolution);
    //     return [x, y];
    // }

    /**
     * 屏幕坐标转世界坐标
     * @param {Coord} pixArray 
     * @returns Coord flatCoords
     */
    toWorld(pixArray, precision = true) {
        return this.convert(pixArray, this.canvasExtent_, this.worldExtent_, { correct: true, sameOrigin: this.sameOrigin_ }, precision);
    }

    /**
     * 世界坐标转屏幕坐标
     * @param {Coord} coordArray 
     * @returns Coord flatCoords
     */
    toPix(coordArray, precision = false) {
        return this.convert(coordArray, this.worldExtent_, this.canvasExtent_, { correct: true, sameOrigin: this.sameOrigin_ }, precision);
    }
}

/**
 * 按originalExtent宽高比矫正extent
 * @param {Extent} extent
 * @param {Extent} originalExtent
 * @returns Extent 边界范围值
 */
function correctExtent(extent, originalExtent) {
    let osize = Extent.getSize(originalExtent);
    if (osize.width == 0 || osize.height == 0) {
        return [extent[0], extent[1], extent[2], extent[3]];
    }
    let nsize = Extent.getSize(extent);

    // 按屏幕的宽高比，矫正extent的宽高比
    if (MathUtil.toFixed(osize.width / osize.height, 2) == MathUtil.toFixed(nsize.width / nsize.height, 2)) {
    } else if (osize.width / osize.height < nsize.width / nsize.height) {
        let newWidth = osize.width / osize.height * nsize.height;
        extent[0] = extent[0] - (newWidth - nsize.width) / 2;
        extent[2] = extent[2] + (newWidth - nsize.width) / 2;
    } else {
        let newHeight = nsize.width / osize.width * osize.height;
        if (extent[1] < extent[3]) {
            extent[1] = extent[1] - (newHeight - nsize.height) / 2;
            extent[3] = extent[3] + (newHeight - nsize.height) / 2;
        } else {
            extent[1] = extent[1] + (newHeight - nsize.height) / 2;
            extent[3] = extent[3] - (newHeight - nsize.height) / 2;
        }
    }
    return [extent[0], extent[1], extent[2], extent[3]];
}

export default Ratio;
export {correctExtent};
