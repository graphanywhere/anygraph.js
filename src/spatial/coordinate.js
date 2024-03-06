import Ratio from "./ratio.js";
import Transform from "./transform.js";
import MathUtil from "../util/math.js";

/**
 * 坐标数据处理类
 */
class Coordinate {
    constructor() {
    }

    /**
     * 基于原点坐标旋转
     * @param {Array<Coord>} coords 坐标
     * @param {number} angle 角度
     * @return {Array<Coord>} 转换后的坐标
     */
    static rotate(coords, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] * cos - coords[j][1] * sin;
            let y = coords[j][1] * cos + coords[j][0] * sin;
            dest.push([x, y]);
        }
        return dest;
    }

    /**
     * 基于锚点进行坐标旋转
     * @param {Array<Coord>} coords 坐标
     * @param {number} angle 角度
     * @param {Coord} anchor 锚点坐标
     * @return {Array<Coord>} 转换后的坐标
     */
    static rotateByAnchor(coords, angle, anchor) {
        // ClassUtil.assert(this.isValidate(coords) && ClassUtil.typeof(angle) === "Number" && anchor.length == 2, "参数错误");
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let anchorX = anchor[0];
        let anchorY = anchor[1];
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let deltaX = coords[j][0] - anchorX;
            let deltaY = coords[j][1] - anchorY;
            dest.push([anchorX + deltaX * cos - deltaY * sin, anchorY + deltaX * sin + deltaY * cos]);
        }
        return dest;
    }

    /**
     * 基于原点进行坐标缩放
     * @param {Array<Coord>} coords 坐标.
     * @param {number} sx x方向上的缩放比例
     * @param {number} sy y方向上的缩放比例
     * @return {Array<Coord>} 转换后的坐标.
     */
    static scale(coords, sx, sy = sx) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            dest.push([coords[j][0] * sx, coords[j][1] * sy]);
        }
        return dest;
    }

    /**
     * 基于锚点进行坐标缩放
     * @param {Array<Coord>} coords 坐标.
     * @param {number} sx x方向上的缩放比例
     * @param {number} sy y方向上的缩放比例
     * @param {Array<Coord>} anchor Scale anchor point.
     * @return {Array<Coord>} 转换后的坐标.
     */
    static scaleByAnchor(coords, sx, sy, anchor) {
        let dest = [];
        let anchorX = anchor[0];
        let anchorY = anchor[1];
        for (let j = 0; j < coords.length; j += 1) {
            let deltaX = coords[j][0] - anchorX;
            let deltaY = coords[j][1] - anchorY;
            dest[j] = [];
            dest[j][0] = anchorX + sx * deltaX;
            dest[j][1] = anchorY + sy * deltaY;
        }
        return dest;
    }

    /**
     * 坐标平移
     * @param {Array<Coord>} coords 坐标.
     * @param {number} deltaX x方向上的平移距离
     * @param {number} deltaY y方向上的平移距离
     * @return {Array<Coord>} 转换后的坐标.
     */
    static translate(coords, deltaX, deltaY) {
        // ClassUtil.assert(deltaX != null && deltaY != null && this.isValidate(coords), "参数错误");
        let dest = [];
        for (let j = 0; j < coords.length; j += 1) {
            dest[j] = [];
            dest[j][0] = coords[j][0] + deltaX;
            dest[j][1] = coords[j][1] + deltaY;
        }
        return dest;
    }

    static add(coords, delta) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] + delta[0];
            let y = coords[j][1] + delta[1];
            dest.push([x, y]);
        }
        return dest;
    }

    static sub(coords, delta) {
        let dest = [];
        for (let j = 0; j < coords.length; j++) {
            let x = coords[j][0] - delta[0];
            let y = coords[j][1] - delta[1];
            dest.push([x, y]);
        }
        return dest;
    }

    /**
     * 坐标小数位处理
     * @param {Array} coords
     * @param {int} decimals
     * @returns Array
     */
    static toFixed(coords, decimals = 0) {
        let dest = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0])) {
                return [MathUtil.toFixed(coords[0], decimals), MathUtil.toFixed(coords[1], decimals)];
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    dest.push(this.toFixed(coords[i], decimals));
                }
                return dest;
            }
        }
        return dest;
    }

    /**
     * 判断是否为坐标
     * @param {Array} coords 
     * @returns Boolean
     */
    static isValidate(coords) {
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0]) && !Array.isArray(coords[1])) {
                let [x, y] = coords;
                return (typeof (x) === "number" && typeof (y) === "number" && !isNaN(x) && !isNaN(y));
                // } else if (coords.length === 3 && !Array.isArray(coords[0])) {
                //     let [x, y, z] = coords;
                //     return (typeof (x) === "number" && typeof (y) === "number" && typeof (z) === "number" && !isNaN(x) && !isNaN(y) && !isNaN(z));
                // } else if (coords.length === 4 && !Array.isArray(coords[0])) {
                //     let [x, y, rx, ry] = coords;
                //     return (typeof (x) === "number" && typeof (y) === "number" && typeof (rx) === "number" && !isNaN(x) && !isNaN(y) && !isNaN(rx));
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    if (this.isValidate(coords[i]) === false) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 两个坐标是否相等
     * @param {Coord} coord1 
     * @param {Coord} coord2 
     * @returns Boolean
     */
    static equal(coord1, coord2) {
        if (Array.isArray(coord1) && Array.isArray(coord2) && coord1.length === coord2.length) {
            if (coord1.length === 2) {
                return coord1[0] == coord2[0] && coord1[1] == coord2[1];
            } else if (coord1.length > 2) {
                for (let i = 0, ii = coord1.length; i < ii; i++) {
                    if (coord1[i][0] != coord2[i][0] || coord1[i][1] != coord2[i][1]) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * 坐标反转
     * @param {Array<Coord>} coords 
     * @returns {Array<Coord>} coords
     */
    static reverse(coords) {
        let dest = [];
        for (let j = coords.length - 1; j >= 0; j -= 1) {
            dest.push(coords[j]);
        }
        return dest;
    }

    /**
     * 坐标转换
     * @param {Transform|Ratio} tool 变化矩阵
     * @param {Array<Coord>} coords 原坐标值
     * @param {Boolean} precision 是否保留小数
     * @returns {Array<Coord>} 转换后的坐标.
     */
    static transform2D(tool, coords, precision) {
        let pixels = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coords)) {
            if (coords.length === 2 && !Array.isArray(coords[0]) && !Array.isArray(coords[1])) {
                //let point = DynamicTransform.projToWorld(coords)
                let point = coords;
                if (Array.isArray(tool)) {
                    return Transform.apply(tool, point, precision);
                } else {
                    return tool.toPix(point, precision);
                }
            } else {
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    pixels.push(this.transform2D(tool, coords[i], precision));
                }
                return pixels;
            }
        } else {
            console.error("coords is error", coords);
        }
    }

    /**
     * 坐标转换为字符串格式，x1,y1,x2,y2,x3,y3,……
     * @param {Array<Coord>} coords
     * @returns String
     */
    static toString(coords) {
        if (this.isValidate(coord2)) {
            if (typeof (coords[0]) === "number") {
                return coords[0] + "," + coords[1];
            } else {
                let strCoordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [x, y] = coords[i];
                    strCoordList.push(x + "," + y);
                }
                return strCoordList.join(",");
            }
        } else {
            throw Error("参数错误");
        }
    }
}

export default Coordinate;
