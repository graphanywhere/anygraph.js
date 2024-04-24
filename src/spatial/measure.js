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
        if (i == vtxp.length) {
            //console.log("len=" + vtxp.length + " d =" + d + " t=" + t);
            i = vtxp.length - 1;
        }
        ratio = (dist - d) / t;
        retval.out = [vtxp[i - 1][0] + ratio * x, vtxp[i - 1][1] + ratio * y];
        retval.angle = this.calcAngle(vtxp[i], vtxp[i - 1]);
        retval.index = i - 1;
        return retval;
    }

    static unit_circle = [
        { a: 0.0000000000, c: 1.0000000000, s: 0.0000000000 },	//  0/18*PI
        { a: 0.1745329252, c: 0.9848077530, s: 0.1736481777 },	//  1/18*PI
        { a: 0.3490658504, c: 0.9396926208, s: 0.3420201433 },	//  2/18*PI
        { a: 0.5235987756, c: 0.8660254038, s: 0.5000000000 },	//  3/18*PI
        { a: 0.6981317008, c: 0.7660444431, s: 0.6427876097 },	//  4/18*PI
        { a: 0.8726646260, c: 0.6427876097, s: 0.7660444431 },	//  5/18*PI
        { a: 1.0471975512, c: 0.5000000000, s: 0.8660254038 },	//  6/18*PI
        { a: 1.2217304764, c: 0.3420201433, s: 0.9396926208 },	//  7/18*PI
        { a: 1.3962634016, c: 0.1736481777, s: 0.9848077530 },	//  8/18*PI
        { a: 1.5707963268, c: 0.0000000000, s: 1.0000000000 },	//  9/18*PI
        { a: 1.7453292520, c: -0.1736481777, s: 0.9848077530 },	// 10/18*PI
        { a: 1.9198621772, c: -0.3420201433, s: 0.9396926208 },	// 11/18*PI
        { a: 2.0943951024, c: -0.5000000000, s: 0.8660254038 },	// 12/18*PI
        { a: 2.2689280276, c: -0.6427876097, s: 0.7660444431 },	// 13/18*PI
        { a: 2.4434609528, c: -0.7660444431, s: 0.6427876097 },	// 14/18*PI
        { a: 2.6179938780, c: -0.8660254038, s: 0.5000000000 },	// 15/18*PI
        { a: 2.7925268032, c: -0.9396926208, s: 0.3420201433 },	// 16/18*PI
        { a: 2.9670597284, c: -0.9848077530, s: 0.1736481777 },	// 17/18*PI
        { a: 3.1415926536, c: -1.0000000000, s: 0.0000000000 },	// 18/18*PI
        { a: 3.3161255788, c: -0.9848077530, s: -0.1736481777 },	// 19/18*PI
        { a: 3.4906585040, c: -0.9396926208, s: -0.3420201433 },	// 20/18*PI
        { a: 3.6651914292, c: -0.8660254038, s: -0.5000000000 },	// 21/18*PI
        { a: 3.8397243544, c: -0.7660444431, s: -0.6427876097 },	// 22/18*PI
        { a: 4.0142572796, c: -0.6427876097, s: -0.7660444431 },	// 23/18*PI
        { a: 4.1887902048, c: -0.5000000000, s: -0.8660254038 },	// 24/18*PI
        { a: 4.3633231300, c: -0.3420201433, s: -0.9396926208 },	// 25/18*PI
        { a: 4.5378560552, c: -0.1736481777, s: -0.9848077530 },	// 26/18*PI
        { a: 4.7123889804, c: 0.0000000000, s: -1.0000000000 },	// 27/18*PI
        { a: 4.8869219056, c: 0.1736481777, s: -0.9848077530 },	// 28/18*PI
        { a: 5.0614548308, c: 0.5000000000, s: -0.8660254038 },	// 30/18*PI
        { a: 5.4105206812, c: 0.7660444431, s: -0.6427876097 },	// 32/18*PI
        { a: 5.7595865316, c: 0.8660254038, s: -0.5000000000 },	// 33/18*PI
        { a: 5.9341194568, c: 0.9396926208, s: -0.3420201433 },	// 34/18*PI
        { a: 6.1086523820, c: 0.9848077530, s: -0.1736481777 }	// 35/18*PI
    ];

    /**
      * 生成圆的坐标
     */
    static genCircleVtx(cx, cy, radius, ccw = true) {
        let i, j;
        let circle = [];
        let len = this.unit_circle.length;

        if (ccw) {
            for (i = 0; i < len; i++) {
                circle.push([cx + radius * this.unit_circle[i].c, cy + radius * this.unit_circle[i].s]);
            }
        } else {
            for (i = 0, j = len - 1; i < len; i++, j--) {
                circle.push([cx + radius * this.unit_circle[j].c, cy + radius * this.unit_circle[j].s]);
            }
        }
        return circle;
    }

    static GK_2PI = 2 * Math.PI;

    /*
    /* 生成从ab至ae的弧段坐标
    */
    static genArcVtx(x, y, radius, ab, ae, ccw = true) {
        let arc = [];
        let data = [];
        let b, e, i, n;

        let len = this.unit_circle.length;
        // 根据unit_circle生成一个[0,GK_4PI]区间的大数组以简化算法
        data = this.unit_circle.slice();
        for (i = 0; i < len; i++) {
            let tmp = { a: data[i].a, c: data[i].c, s: data[i].s };
            data.push(tmp);
        }
        n = data.length;
        for (i = len; i < n; i++) {
            data[i].a += this.GK_2PI;
        }
        data.push({ a: data[0].a, c: data[0].c, s: data[0].s });
        data[n].a = 2 * this.GK_2PI;
        n++;

        // 角度标准化在[0,GK_2PI)区间内
        while (ab < 0.0) ab += this.GK_2PI;
        while (ab >= this.GK_2PI) ab -= this.GK_2PI;
        while (ae < 0.0) ae += this.GK_2PI;
        while (ae >= this.GK_2PI) ae -= this.GK_2PI;

        if (!ccw) {
            let tmp = ab, ab = ae, ae = tmp;	// 逆时针，交换ab和ae
        }
        if (ae <= ab) ae += this.GK_2PI;			// 确保ab < ae

        // 在data中找ab，如找不到则插入，令其下标为b
        for (b = 0; b < len; b++) {
            if (ab <= data[b].a)
                break;
        }

        // 在data中找ae，如找不到则插入，令其下标为e
        for (e = b + 1; e < n; e++) {
            if (ae <= data[e].a)
                break;
        }

        // 生成坐标数据
        if (ccw) {
            /*if ( ab != data[b].a ) {
                arc.push( [x + radius * Math.cos( ab ), y + Math.sin( ab )] );
            }*/
            for (i = b; i <= e; i++) {
                arc.push([x + radius * data[i].c, y + radius * data[i].s]);
            }
            /*if ( ae != data[e].a ) {
                arc.push( [x + radius * Math.cos( ae ), y + Math.sin( ae )] );
            }*/
        } else {
            /*if ( ae != data[e].a ) {
                arc.push( [x + radius * Math.cos( ae ), y + Math.sin( ae )] );
            }*/
            for (i = e; i >= b; i--) {
                arc.push([x + radius * data[i].c, y + radius * data[i].s]);
            }
            /*if ( ab != data[b].a ) {
                arc.push( [x + radius * Math.cos( ab ), y + Math.sin( ab) ] );
            }*/
        }
        return arc;
    }

    // 求两线段的交点
    //
    // 线段AB的参数方程：x = xa + (xb - xa) * t, y = ya + (yb - ya) * t
    // 线段CD的参数方程：x = xc + (xd - xc) * u, y = yc + (yd - yc) * u
    // 消去变量x,y,u，可解出：
    //	( yd - yc ) * ( xc - xa ) - ( xd - xc ) * ( yc - ya )
    // t = -------------------------------------------------------
    //	( yd - yc ) * ( xb - xa ) - ( xd - xc ) * ( yb - ya )
    // 如果ext=null，则只能路段相交，去掉与延长线相交的情况
    // 如果ext=ABCD，则可延长线相交
    static solveCrossPointSegment(A, B, C, D, ext = null) {
        let retval = { out: null, tab: null, tcd: null, cross: false };
        let ba0 = B[0] - A[0];
        let ba1 = B[1] - A[1];
        let dc0 = D[0] - C[0];
        let dc1 = D[1] - C[1];
        let ca0 = C[0] - A[0];
        let ca1 = C[1] - A[1];
        let d, t, u;
        let checkA, checkB, checkC, checkD;

        checkA = checkB = checkC = checkD = true;
        if (ext != null) {
            for (let i = 0; i < ext.length; i++) {
                switch (ext[i]) {
                    case 'A': checkA = false; break;
                    case 'B': checkB = false; break;
                    case 'C': checkC = false; break;
                    case 'D': checkD = false; break;
                }
            }
        }

        d = dc1 * ba0 - dc0 * ba1;
        if (Math.abs(d) < 0.00001) {
            //if ( tab ) *tab = GK_INFINITY;
            //if ( tcd ) *tcd = GK_INFINITY;
            //return false;	// 两线段平行
            return retval;
        }
        t = (dc1 * ca0 - dc0 * ca1) / d;
        u = (ba1 * ca0 - ba0 * ca1) / d;
        retval.tab = t;
        retval.tcd = u;
        retval.out = [A[0] + ba0 * t, A[1] + ba1 * t];
        retval.cross = true;
        if (checkA && t < 0)
            retval.cross = false;	// 交点超出A端
        if (checkB && t > 1)
            retval.cross = false;	// 交点超出B端
        if (checkC && u < 0)
            retval.cross = false;	// 交点超出C端
        if (checkD && u > 1)
            retval.cross = false;	// 交点超出D端
        return retval;
    }

    /** 
     * 求线段与polyline的交点
     */
    static solveCrossPoint(A, B, polyline) {
        for (let i = 0; i < polyline.length - 1; i++) {
            let retval = this.solveCrossPointSegment(A, B, polyline[i], polyline[i + 1]);
            if (retval.cross) {
                return retval.out;
            }
        }
        return null;
    }
    /**
     * 求线段与polyline的交点,并返回相交折线段的中间点
     */
    static solveCrossPointMidSegment(A, B, polyline) {
        for (let i = 0; i < polyline.length - 1; i++) {
            let retval = this.solveCrossPointSegment(A, B, polyline[i], polyline[i + 1]);
            if (retval.cross) {
                if (this.dist(retval.out, polyline[i]) < 0.0001)
                    return retval.out;
                if (this.dist(retval.out, polyline[i + 1]) < 0.0001)
                    return retval.out;
                let out = [];
                out.push((polyline[i][0] + polyline[i + 1][0]) * 0.5, (polyline[i][1] + polyline[i + 1][1]) * 0.5);
                return out;
            }
        }
        return null;
    }

    static GK_LENGTH_2D(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    }

    static GK_TOO_SMALL(d) {
        if (Math.abs(d) < 0.000001)
            return true;
        else
            return false;
    }

    static GK_DOT_PRODUCT_2D(x1, y1, x2, y2) {
        return ((x1) * (x2) + (y1) * (y2));
    }

    static GK_RIGHT_OF_LINE(x1, y1, x2, y2, x, y) {
        return (((x2) - (x1)) * ((y) - (y1)) < ((y2) - (y1)) * ((x) - (x1)));
    }

    /**
     * 求线段AB与BC所构成的角度，返回值在区间[0,GK_PI]内
     * @param {*} A 
     * @param {*} B 
     * @param {*} C 
     * @returns 角度
     */
    static calculateAngle(A, B, C) {
        let xa = A[0] - B[0];
        let ya = A[1] - B[1];
        let xc = C[0] - B[0];
        let yc = C[1] - B[1];
        let da = this.GK_LENGTH_2D(xa, ya);
        let dc = this.GK_LENGTH_2D(xc, yc);
        let ca;

        if (this.GK_TOO_SMALL(da) || this.GK_TOO_SMALL(dc)) return 0.0;	// 线段AB或CB长度为0

        ca = this.GK_DOT_PRODUCT_2D(xa, ya, xc, yc) / (da * dc);

        // 尽管ca的理论绝对值不会大于1，但为防止因计算误差而导致超界，并尽量避免调用三角函数，特进行如下判断
        if (ca >= 1.0) return 0.0;
        if (ca <= -1.0) return Math.PI;

        return acos(ca);
    }

    /**
     * 求距离给定边为base+offset和base-offset的两个对称点，其中out1位于前进方向左侧，out2位于右侧
     * @param {*} v1 
     * @param {*} v2 
     * @param {*} v3 
     * @param {*} offset 偏移距离
     * @param {*} detail "Head"/"Coor"/"Tail"
     * 当detail="Head"时，对称点位于v1处且与v2方向垂直（此时参数v3无意义）
     * 当detail="Coor"时，对称点位于v2处、v1v2和v2v3的角平分线上
     * 当detail="Tail"时，对称点位于v1处且与-v2方向垂直（此时参数v3无意义）
     * @param {*} base 
     * @returns 对称点坐标
     */
    static solveOffsetPoint(v1, v2, v3, offset, detail, base = 0) {
        let x, y, d, x1, y1, d1, x3, y3, d3;
        let retval = {};
        retval.out1 = null;
        retval.out2 = null;

        switch (detail) {
            case "Head":
            case "Tail":
                x = v2[0] - v1[0];
                y = v2[1] - v1[1];
                d = this.GK_LENGTH_2D(x, y);
                if (this.GK_TOO_SMALL(d)) {
                    retval.out1 = v1;
                    retval.out2 = v1;
                    return;
                }
                x /= d;
                y /= d;
                // 此时x,y为v1v2方向的单位矢量，乘相应偏移量后分别逆时针和顺时针旋转90度即可
                if (detail == "Head") {
                    retval.out1 = [v1[0] - y * (base + offset), v1[1] + x * (base + offset)];
                    retval.out2 = [v1[0] - y * (base - offset), v1[1] + x * (base - offset)];
                } else {
                    retval.out1 = [v1[0] + y * (base + offset), v1[1] - x * (base + offset)];
                    retval.out2 = [v1[0] + y * (base - offset), v1[1] - x * (base - offset)];
                }
                break;
            case "Coor":
                x1 = v1[0] - v2[0];
                y1 = v1[1] - v2[1];
                d1 = this.GK_LENGTH_2D(x1, y1);
                x3 = v3[0] - v2[0];
                y3 = v3[1] - v2[1];
                d3 = this.GK_LENGTH_2D(x3, y3);
                if (this.GK_TOO_SMALL(d1) || this.GK_TOO_SMALL(d3)) {
                    retval.out1 = v2;
                    retval.out2 = v2;
                    return;
                }
                x1 /= d1;
                y1 /= d1;
                x3 /= d3;
                y3 /= d3;

                // 此时x1,y1为v2沿v1方向的单位矢量，x3,y3为v2沿v3方向的单位矢量，两者的矢量和即为角平分线
                x = x1 + x3;
                y = y1 + y3;
                d = this.GK_LENGTH_2D(x, y);
                if (this.GK_TOO_SMALL(d)) {
                    // 两单位矢量相互抵消（即v1,v2,v3共线），此时利用x3,y3设置长度后逆时针旋转90度即可
                    retval.out1 = [v2[0] - y3 * (base + offset), v2[1] + x3 * (base + offset)];
                    retval.out2 = [v2[0] - y3 * (base - offset), v2[1] + x3 * (base - offset)];
                } else {
                    x /= d;
                    y /= d;
                    d = this.calculateAngle(v1, v2, v3);	// 夹角
                    if (this.GK_TOO_SMALL(d)) {
                        d = 1.0;			// 夹角过小时距离将很大，现实中没有意义
                    } else {
                        d = 1.0 / sin(d / 2);	// 距离
                    }
                    // 此时x,y为角平分线上的单位矢量，但尚需判别左右侧
                    if (this.GK_RIGHT_OF_LINE(0.0, 0.0, x1, y1, x, y)) {
                        retval.out1 = [v2[0] + x * (base + offset) * d, v2[1] + y * (base + offset) * d];
                        retval.out1 = [v2[0] + x * (base - offset) * d, v2[1] + y * (base - offset) * d];
                    } else {
                        retval.out1 = [v2[0] - x * (base + offset) * d, v2[1] - y * (base + offset) * d];
                        retval.out2 = [v2[0] - x * (base - offset) * d, v2[1] - y * (base - offset) * d];
                    }
                }
                break;
        }
        return retval;
    }
}

export default Measure;
