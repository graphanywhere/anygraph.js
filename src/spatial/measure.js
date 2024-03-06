import MathUtil from "../util/math.js";

/**
 * 测量算法类
 */
class Measure {
    constructor() {
    }

    /**
     * 返回点p1(x1,y1)和p2(x2,y2)之间距离
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} distance.
     */
    static dist(p1, p2) {
        if (arguments.length === 1) {
            if (Array.isArray(p1)) {
                let dist_ = 0;
                for (let i = 1, ii = p1.length; i < ii; i++) {
                    dist_ += Math.sqrt(this.dist2(p1[i - 1], p1[i]));
                }
                return dist_;
            } else {
                return NaN;
            }
        } else {
            return Math.sqrt(this.dist2(p1, p2));
        }
    }

    /**
     * 返回点p1(x1,y1)和p2(x2,y2)之间距离的平方。
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} Squared distance.
     */
    static dist2(p1, p2) {
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        return dx * dx + dy * dy;
    }

    /**
     * 计算两点与X轴夹角的角度
     * @param {*} p1
     * @param {*} p2
     * @returns {number} 角度
     */
    static calcAngle(p1, p2) {
        // return MathUtil.toFixed(MathUtil.toDegrees(Math.atan2(p2.y - p1.y, p2.x - p1.x)), 2);
        return MathUtil.toFixed(MathUtil.toDegrees(Math.atan2(p2[1] - p1[1], p2[0] - p1[0])), 2);
    }

    /**
     * 返回点p[x,y]和线段(p1[x1,y1], p2[x2,y2])之间最接近距离。
     * @param {Array} p[x, y]
     * @param {Array} p1[x1, y1]
     * @param {Array} p2[x2, y2]
     * @return {number} distance.
     * 参考：
     * https://www.bilibili.com/read/cv17169956/
     * https://blog.csdn.net/lee371042/article/details/101214204
     */
    static distToSegment(p, p1, p2) {
        // 计算线段两端点的差值
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
    
        // 如果dx和dy都不等于0, p1p2是一个线段，否则p1p2为同一个点
        if (dx !== 0 || dy !== 0) {
            // 计算p到线段p1p2的投影点 在线段上的相对位置t
            const t = ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
                // 如果t大于1，说明投影在线段p1p2外，此时将p1设置为p2
                p1[0] = p2[0];
                p1[1] = p2[1];
            } else if (t > 0) {
                // 如果t大于0且小于等于1，说明投影点在线段p1p2上，此时将p1设置为投影点的坐标
                p1[0] += dx * t;
                p1[1] += dy * t;
            }
        }
    
        // 计算并返回两点之间的距离
        return this.dist(p, p1);
    }

    /**
     * 判断两条线段是否相交
     * @param {*} p0 
     * @param {*} p1 
     * @param {*} p2 
     * @param {*} p3 
     * @returns Boolean
     */
    static line_intersects(p0, p1, p2, p3) {
        let s1_x, s1_y, s2_x, s2_y;
        s1_x = p1[0] - p0[0];
        s1_y = p1[1] - p0[1];
        s2_x = p3[0] - p2[0];
        s2_y = p3[1] - p2[1];

        let s, t;
        s = (-s1_y * (p0[0] - p2[0]) + s1_x * (p0[1] - p2[1])) / (-s2_x * s1_y + s1_x * s2_y);
        t = (s2_x * (p0[1] - p2[1]) - s2_y * (p0[0] - p2[0])) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            // Collision detected
            return true;
        } else {
            return false; // No collision
        }
    }

    /**
     * 计算线段上最接近坐标的点。
     * 当垂足在线段上时，坐标到线段的垂足的距离，或者当垂足在线段外部时，离线段最近的线段坐标。
     * @param {Coordinate} coords The coords.
     * @param {Array<Coordinate>} segment The two coords of the segment.
     * @return {Coordinate} The foot of the perpendicular of the coords to the segment.
     * 如果给定点在线段上，那么垂足就是该点本身，因为它直接位于线段上。这个点是垂直于给定坐标线与线段相交的点。
     * 然而，如果给定点在线段外部，垂足可能不在线段上。在这种情况下，线段上离给定坐标最近的点被视为“垂足”。这个点是线段上离给定坐标最近的点，可以通过将从线段一个端点到给定坐标的向量投影到线段上来找到。
     * 在这两种情况下，结果都是在线段上或最接近线段的点，该点通过垂直线与给定坐标相连。这个概念在几何、计算机图形学和工程等领域都非常有用。
     */
    static closestOnSegment(coords, segment) {
        let [x0, y0] = [coords[0], coords[1]];
        let [x1, y1] = [segment[0][0], segment[0][1]];
        let [x2, y2] = [segment[1][0], segment[1][1]];
        let dx = x2 - x1;
        let dy = y2 - y1;
        let along = (dx === 0 && dy === 0) ? 0 : (dx * (x0 - x1) + dy * (y0 - y1)) / (dx * dx + dy * dy || 0);
        let x, y;
        if (along <= 0) {
            x = x1;
            y = y1;
        } else if (along >= 1) {
            x = x2;
            y = y2;
        } else {
            x = x1 + along * dx;
            y = y1 + along * dy;
        }
        return [x, y];
    }

    /**
     * 计算圆上最接近坐标的点。
     * @param {Coordinate} coords The coords.
     * @param {Circle} circle The circle.
     * @return {Coordinate} Closest point on the circumference.
     */
    static closestOnCircle(coords, circle) {
        let r = circle.getRadius();
        let center = circle.getCenter();
        let [x0, y0] = [center[0], center[1]];
        let [x1, y1] = [coords[0], coords[1]];
        let dx = x1 - x0;
        let dy = y1 - y0;
        if (dx === 0 && dy === 0) {
            dx = 1;
        }
        let d = Math.sqrt(dx * dx + dy * dy);
        let x = x0 + (r * dx) / d;
        let y = y0 + (r * dy) / d;
        return [x, y];
    }

    /**
     * 多边形计算面积
     * @param {Array} coords 多边形顶点坐标数组
     * https://blog.csdn.net/xza13155/article/details/112118676
     * https://zhuanlan.zhihu.com/p/612991648
     */
    static getArea(coords) {
        // 多边形面积换算公式
        // S = Math.abs(0.5 * (x1 * y2 - y1 * x2 + x2 * y3 - y2 * x3 +….+ xn * y1 - yn * x1)));
        let area = 0;
        for (let i = 2; i < coords.length; i++) {
            let ax = coords[i - 1][0] - coords[0][0];
            let bx = coords[i - 1][1] - coords[0][1];
            let cx = coords[i][0] - coords[0][0];
            let dx = coords[i][1] - coords[0][1];
            // 三角形面积公式
            // S = 0.5 * (ax * dx - cx * bx);
            area += 0.5 * (ax * dx - cx * bx);
        };
        //顺时针为正，逆时针为负
        return Math.abs(area);
    }

    /**
     * 计算折线长度
     * @param {Array} coords 折线点坐标数组
     */
    static getLength(coords) {
        let length = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            length += this.dist(coords[i], coords[i + 1]);
        }
        return length;
    }

    /**
     * 计算折线中最长的一段线段
     * @param {Array} coords 折线点坐标数组
     */
    static getMaxLenSegment(coords) {
        let maxlength = 0;
        let maxlength_segment = -1;
        for (let i = 0; i < coords.length - 1; i++) {
            let length = this.dist(coords[i], coords[i + 1]);
            if (length > maxlength) {
                maxlength = length;
                maxlength_segment = i;
            }
        };
        return maxlength_segment;
    }

    // static GK_ANGLE_2D(x1, y1, x2, y2) {
    //     return Math.atan2((y1) - (y2), (x1) - (x2));
    // }

    // static GK_ANGLE_2DV(vtx1, vtx2) {
    //     return this.GK_ANGLE_2D((vtx1)[0], (vtx1)[1], (vtx2)[0], (vtx2)[1]);
    // }

    /**
     * 求折线上位于总长ratio处的一点out，并可同时求出out处的角度angle
     */
    static solveRatioPointOnPolyline(ratio, vtxp) {
        let d, t, x, y, dist;
        let i;
        let retval = {};

        if (ratio < 0.0 || ratio > 1.0 || vtxp.length < 2) return null;

        if (Math.abs(ratio) < 0.0001) {
            retval.out = vtxp[0];
            retval.angle = this.calcAngle(vtxp[1], vtxp[0]);
            retval.index = 0;
            return retval;
        }
        if (Math.abs(ratio - 1.0) < 0.0001) {
            let num = vtxp.length;
            retval.out = vtxp[num - 1];
            retval.angle = this.calcAngle(vtxp[num - 1], vtxp[num - 2]);
            retval.index = num - 2;
            return retval;
        }
        dist = this.getLength(vtxp) * ratio;
        d = 0.0;
        for (i = 1; i < vtxp.length; i++) {
            x = vtxp[i][0] - vtxp[i - 1][0];
            y = vtxp[i][1] - vtxp[i - 1][1];
            t = this.dist(vtxp[i], vtxp[i - 1]);
            if (d < dist && dist <= d + t) break;

            d += t;
        }
        ratio = (dist - d) / t;
        retval.out = [vtxp[i - 1][0] + ratio * x, vtxp[i - 1][1] + ratio * y];
        retval.angle = this.calcAngle(vtxp[i], vtxp[i - 1]);
        retval.index = i - 1;
        return retval;
    }

}

export default Measure;
