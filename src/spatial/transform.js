import MathUtil from "../util/math.js";
import ClassUtil from "../util/class.js";

/**
 * 矩阵变换类
 * transform(a, b, c, d, e, f)
 * a (m11) 水平方向的缩放
 * b (m12) 竖直方向的倾斜偏移
 * c (m21) 水平方向的倾斜偏移
 * d (m22) 竖直方向的缩放
 * e (dx)  水平方向的移动
 * f (dy)  竖直方向的移动
 */
class Transform {
    /**
     * 构造函数
     */
    constructor() {
    }

    /**
     * 创建Transform.
     * @return {Transform} 初始矩阵.
     */
    static create() {
        return [1, 0, 0, 1, 0, 0];
    }

    /**
     * 重置矩阵
     * @param {Transform} transform Transform.
     * @return {Transform} transform.
     */
    static reset(transform) {
        return this.set(transform, 1, 0, 0, 1, 0, 0);
    }

    /**
     * 给矩阵赋值
     * @return {Transform} 重新赋值的矩阵，同时也将改变目标矩阵的值.
     */
    static set(transform, a, b, c, d, e, f) {
        transform[0] = a;
        transform[1] = b;
        transform[2] = c;
        transform[3] = d;
        transform[4] = e;
        transform[5] = f;
        return transform;
    }

    /**
     * 将两个变换的基础矩阵相乘，并返回第一个变换的结果。
     * @param {Transform} transform1 矩阵1.
     * @param {Transform} transform2 矩阵2.
     * @return {Transform} 变换的结果，同时也将改变目标矩阵的值.
     */
    static multiply(transform1, transform2) {
        let [a1, b1, c1, d1, e1, f1] = transform1;
        let [a2, b2, c2, d2, e2, f2] = transform2;

        transform1[0] = a1 * a2 + c1 * b2;
        transform1[1] = b1 * a2 + d1 * b2;
        transform1[2] = a1 * c2 + c1 * d2;
        transform1[3] = b1 * c2 + d1 * d2;
        transform1[4] = a1 * e2 + c1 * f2 + e1;
        transform1[5] = b1 * e2 + d1 * f2 + f1;

        return transform1;
    }

    /**
     * 将一个矩阵的值赋予另一个矩阵
     * @param {Transform} transform1 目标矩阵.
     * @param {Transform} transform2 原矩阵.
     * @return {Transform} 返回新的矩阵，同时也将改变目标矩阵的值.
     */
    static setFromArray(transform1, transform2) {
        transform1[0] = transform2[0];
        transform1[1] = transform2[1];
        transform1[2] = transform2[2];
        transform1[3] = transform2[3];
        transform1[4] = transform2[4];
        transform1[5] = transform2[5];
        return transform1;
    }

    /**
     * 使用矩阵变换坐标的值。
     * @param {Transform} transform 变换矩阵.
     * @param {Array} coordinate 原坐标，格式为[[x,y],[x,y],[x,y],[x,y],[x,y],……].
     * @param {Boolean} precision 返回值是否保留小数.
     * @return {Array} 返回变换之后的坐标
     */
    static applys(transform, coordinates, precision = true) {
        let dest = [];
        // 判断转换的是点坐标，还是多点坐标
        if (Array.isArray(coordinates)) {
            if (coordinates.length === 2 && !Array.isArray(coordinates[0])) {
                return this.apply(transform, coordinates, precision);
            } else {
                for (let i = 0, ii = coordinates.length; i < ii; i++) {
                    dest.push(this.applys(transform, coordinates[i], precision));
                }
                return dest;
            }
        } else {
            console.error("coordinates is error", coordinates);
        }
    }

    /**
     * 使用矩阵变换坐标的值。
     * @param {Transform} transform 变换矩阵.
     * @param {Array} coordinate 原坐标，格式为[x,y].
     * @param {Boolean} precision 返回值是否保留小数.
     * @return {Array} 返回变换之后的坐标
     */
    static apply(transform, coordinates, precision = true) {
        let dest = [];
        let x = coordinates[0], y = coordinates[1];
        dest[0] = transform[0] * x + transform[2] * y + transform[4];
        dest[1] = transform[1] * x + transform[3] * y + transform[5];
        if (precision === true || precision == null) {
            dest[0] = MathUtil.toFixed(dest[0], 6);
            dest[1] = MathUtil.toFixed(dest[1], 6);
        } else {
            dest[0] = MathUtil.toFixed(dest[0], 2);
            dest[1] = MathUtil.toFixed(dest[1], 2);
        }
        return dest;
    }

    /**
     * 在矩阵中增加旋转量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} angle 旋转角度（弧度）.
     * @return {Transform} 旋转后的矩阵.
     */
    static rotate(transform, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, cos, sin, -sin, cos, 0, 0));
    }

    static rotateAtOrigin(transform, angle, origin = [0, 0]) {
        this.translate(transform, origin[0], origin[1]);
        this.rotate(transform, angle);
        this.translate(transform, -origin[0], -origin[1]);
    }

    /**
     * 在矩阵中增加缩放量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} x 水平方向缩放倍数.
     * @param {number} y 垂直方向缩放倍数.
     * @return {Transform} 缩放后的矩阵.
     */
    static scale(transform, sx, sy = sx) {
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, sx, 0, 0, sy, 0, 0));
    }

    /**
     * 在矩阵中增加错切量
     * @param {*} transform 
     * @param {*} sx 水平方向错切量.
     * @param {*} sy 垂直方向错切量.
     * @returns {Transform} 错切后的矩阵.
     */
    static skew(transform, sx, sy) {
        var m11 = transform[0] + transform[2] * sy;
        var m12 = transform[1] + transform[3] * sy;
        var m21 = transform[2] + transform[0] * sx;
        var m22 = transform[3] + transform[1] * sx;
        transform[0] = m11;
        transform[1] = m12;
        transform[2] = m21;
        transform[3] = m22;
        return transform;
    }

    /**
     * 在矩阵中增加平移量
     * @param {Transform} transform 变换前的矩阵.
     * @param {number} dx 水平方向平移量.
     * @param {number} dy 垂直方向平移量.
     * @return {Transform} 平移后的矩阵.
     */
    static translate(transform, dx, dy) {
        let tmp_ = new Array(6);
        return this.multiply(transform, this.set(tmp_, 1, 0, 0, 1, dx, dy));
    }

    /**
     * 反转给定的变换
     * @param {Transform} transform Transform.
     * @return {Transform} Inverse of the transform.
     */
    static invert(transform) {
        let det = this.determinant(transform);
        ClassUtil.assert(det !== 0, 32); // Transformation matrix cannot be inverted

        let [a, b, c, d, e, f] = transform;
        transform[0] = d / det;
        transform[1] = -b / det;
        transform[2] = -c / det;
        transform[3] = a / det;
        transform[4] = (c * f - d * e) / det;
        transform[5] = -(a * f - b * e) / det;
        return transform;
    }

    /**
     * 在给定目标坐标系点（初始平移）、缩放、旋转和源坐标系点（最终平移）的情况下创建合成变换。
     * @param {Transform} transform 引用的矩阵.
     * @param {number} dx1 目标坐标系点X坐标.
     * @param {number} dy1 目标坐标系点Y坐标.
     * @param {number} sx Scale factor x.
     * @param {number} sy Scale factor y.
     * @param {number} angle 旋转角度
     * @param {number} dx2 源坐标系点X坐标.
     * @param {number} dy2 源坐标系点Y坐标.
     * @return {Transform} 坐标系转换矩阵.
     */
    static compose(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        transform[0] = sx * cos;
        transform[1] = sy * sin;
        transform[2] = -sx * sin;
        transform[3] = sy * cos;
        transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
        transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
        return transform;
    }

    /**
     * 返回给定矩阵的行列式.
     * 行列式可以表达矩阵缩放倍率的平方
     * @param {Transform} transform 矩阵.
     * @return {number} 行列式.
     */
    static determinant(transform) {
        return transform[0] * transform[3] - transform[1] * transform[2];
    }

    /**
     * 取旋转角度
     * @param {Transform} transform 
     * @returns {number} angle.
     */
    static getRotationAngle(transform) {
        return MathUtil.toDegrees(Math.atan2(transform[1], transform[3]));
    }

    /**
     * 取缩放倍率，
     * 行列式可以表达 矩阵缩放倍率的平方，当x轴和y轴的缩放倍率相同时，可以通过行列式计算缩放倍率
     * 但是，x或y出现翻转时，行列式的值为负值，例如d=-1表示垂直翻转
     */
    static getScale(transform) {
        return Math.sqrt(Math.abs(transform[0] * transform[3] - transform[1] * transform[2]));
    }

    /**
     * 转换为字符串
     * @param {Transform} transform
     * @return string
     */
    static toString(transform) {
        const transformString = 'matrix(' + transform.join(', ') + ')';
        return transformString;
    }

    /**
     * 生成坐标变换对象
     * @param {Array} transData 
     * [{"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *  {"action":"scale", "value":[2, 2]}, 
     *  {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}]
     * @returns transform
     */
    static createByData(transData) {
        let trans = Transform.create();
        //let angle = 0;
        if (Array.isArray(transData)) {
            for (let i = 0; i < transData.length; i++) {
                let prop = transData[i];
                if (prop.action == "translate") {
                    Transform.translate(trans, prop.value[0], prop.value[1]);
                } else if (prop.action === "rotate") {
                    Transform.rotateAtOrigin(trans, MathUtil.toRadians(prop.value), prop.origin);
                    //angle += prop.value;
                } else if (prop.action === "scale") {
                    Transform.scale(trans, prop.value[0], prop.value[1]);
                } else if (prop.action == "matrix") {
                    Transform.multiply(trans, prop.value);
                }
            }
        }
        return trans;
    }
}

export default Transform;
