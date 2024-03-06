import MathUtil from "../util/math.js";

/**
 * 边界坐标范围处理类
 * 注意：屏幕坐标系(左上角、右下角)的设定：x正方向为自左向右，y正方向为自上向下，常规笛卡尔坐标系(左下角、右上角)与屏幕坐标系y方向相反
 */
class Extent {
    /**
     * 创建包络矩形
     * @param {number} xmin - x方向最小值
     * @param {number} ymin - y方向最小值
     * @param {number} xmax - x方向最大值
     * @param {number} ymax - y方向最大值
     */
    constructor(xmin, ymin, xmax, ymax) {
        this.extent = [xmin, ymin, xmax, ymax];
    }

    /**
     * 获取边界范围值
     * @returns Extent 边界范围值
     */
    getExtent() {
        return this.extent;
    }

    /**
     * 建立一个边界范围对象
     * @param {number} xmin - x方向最小值
     * @param {number} ymin - y方向最小值
     * @param {number} xmax - x方向最大值
     * @param {number} ymax - y方向最大值
     * @returns Extent 边界范围值
     */
    static create(xmin, ymin, xmax, ymax) {
        return [xmin, ymin, xmax, ymax];
    }

    /**
     * 建立一个空的边界范围对象
     * @returns Extent 边界范围值
     */
    static createEmpty() {
        return [Infinity, Infinity, -Infinity, -Infinity];
    }

    /**
     * 是否为边界范围对象
     * @param {Extent} extent
     * @returns Boolean
     */
    static isExtent(extent) {
        if (typeof (extent) === "object" && extent.length === 4) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 两个范围是否相等
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Boolean
     */
    static equal(extent1, extent2) {
        return (extent1 != null && extent2 != null && extent1.length == extent2.length && extent1[0] == extent2[0] && extent1[1] == extent2[1] && extent1[2] == extent2[2] && extent1[3] == extent2[3]);
    }

    /**
     * 是否为空
     * @param {Extent} extent
     * @returns Boolean
     */
    static isEmpty(extent) {
        return (extent == null) || (extent[2] < extent[0] && extent[3] < extent[1]);
    }

    /**
     * 返回两个extent的bbox
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Extent 边界范围值
     */
    static merge(extent1, extent2) {
        return [
            extent1[0] < extent2[0] ? extent1[0] : extent2[0],
            extent1[1] < extent2[1] ? extent1[1] : extent2[1],
            extent1[2] > extent2[2] ? extent1[2] : extent2[2],
            extent1[3] > extent2[3] ? extent1[3] : extent2[3]
        ]
    }

    /**
     * 计算中心点
     * @param {Extent} extent
     * @returns 中心点坐标
     */
    static getCenter(extent) {
        let center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        return center;
    }

    /**
     * 计算宽度
     * @param {Extent} extent
     * @returns width
     */
    static getWidth(extent) {
        return extent[2] - extent[0];
    }

    /**
     * 计算高度
     * @param {Extent} extent
     * @returns height
     */
    static getHeight(extent) {
        return extent[3] - extent[1];
    }

    /**
     * 计算宽高
     * @param {Extent} extent
     * @returns [width, height]
     */
    static getSize(extent) {
        return { "width": Math.abs(extent[2] - extent[0]), "height": Math.abs(extent[3] - extent[1]) };
    }

    /**
     * 计算面积
     * @param {Extent} extent
     * @returns 面积
     */
    static getArea(extent) {
        let area = 0;
        if (!this.isEmpty(extent)) {
            area = this.getWidth(extent) * this.getHeight(extent);
        }
        return area;
    }

    /**
     * 计算缓冲区范围
     * @param {Extent} extent
     * @param {number} value 
     * @returns Extent 边界范围值
     */
    static buffer(extent, value) {
        return [extent[0] - value, extent[1] - value, extent[2] + value, extent[3] + value];
    }

    /**
     * 判断点是否在空间范围内
     * @param {Extent} extent
     * @param {Coord} point 
     * @returns Boolean
     */
    static containsXY(extent, point) {
        return extent[0] <= point[0] && point[0] <= extent[2] && extent[1] <= point[1] && point[1] <= extent[3];
    }

    /**
     * 判断extent2是否在extent1内
     * @param {Extent} extent1
     * @param {Extent} extent2
     * @returns Boolean
     */
    static containsExtent(extent1, extent2) {
        return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] && extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
    }

    /**
     * 判断两个空间范围是否相交
     * @param {*} extent1 
     * @param {*} extent2 
     * @returns Boolean
     */
    static intersects(extent1, extent2) {
        return extent1[0] <= extent2[2] && extent1[2] >= extent2[0] && extent1[1] <= extent2[3] && extent1[3] >= extent2[1];
    }

    /**
     * 计算以中心点缩放后的空间范围
     * @param {Extent} extent
     * @param {number} scale 倍率
     * @returns Extent 边界范围值
     */
    static scaleFromCenter(extent, scale) {
        let size = this.getSize(extent);
        const deltaX = size.width * (scale - 1);
        const deltaY = size.height * (scale - 1);
        let x1 = extent[0] - deltaX * 0.5;
        let x2 = extent[2] + deltaX * 0.5;
        let y1 = extent[1] - deltaY * 0.5;
        let y2 = extent[3] + deltaY * 0.5;
        return [MathUtil.toFixed(x1, 2), MathUtil.toFixed(y1, 2), MathUtil.toFixed(x2, 2), MathUtil.toFixed(y2, 2)];
    }

    /**
     * 计算以指定点缩放的空间范围 （point必须在extent范围内）
     * @param {Extent} extent
     * @param {number} scale 
     * @param {Coord} point 
     * @returns Extent 边界范围值
     */
    static scaleFromPoint(extent, scale, point) {
        let size = this.getSize(extent);
        const deltaX = size.width * (scale - 1);
        const deltaY = size.height * (scale - 1);
        let x1 = extent[0] - deltaX * (point[0] - extent[0]) / size.width;
        let x2 = extent[2] + deltaX * (extent[2] - point[0]) / size.width;
        let y1 = extent[1] - deltaY * (point[1] - extent[1]) / size.height;
        let y2 = extent[3] + deltaY * (extent[3] - point[1]) / size.height;
        return [MathUtil.toFixed(x1, 2), MathUtil.toFixed(y1, 2), MathUtil.toFixed(x2, 2), MathUtil.toFixed(y2, 2)];
    }

    /**
     * 取左上角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getTopLeft(extent) {
        return [extent[0], extent[3]];
    }

    /**
     * 取右上角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getTopRight(extent) {
        return [extent[2], extent[3]];
    }

    /**
     * 取左下角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getBottomLeft(extent) {
        return [extent[0], extent[1]];
    }

    /**
     * 取右下角坐标
     * @param {Extent} extent
     * @returns Coord
     */
    static getBottomRight(extent) {
        return [extent[2], extent[1]];
    }

    /**
     * 转换为多边形坐标
     * @param {Extent} extent
     * @returns [coord1, coord2, coord3, coord4, coord5]
     */
    static getPolygonCoords(extent) {
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];
        const coords = [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];
        return coords;
    }
}

export default Extent;
