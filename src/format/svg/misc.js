/**
 * 计算某个点的对称点坐标
 * @param {PointCoord} centerPoint 
 * @param {PointCoord} point 
 * @returns Array
 */
function getSymmetricPointRelative(point, centerPoint) {
    var a = centerPoint[0];
    var b = centerPoint[1];
    var x = point[0];
    var y = point[1];
    var nx = 2 * a - x;
    var ny = 2 * b - y;
    return [nx, ny];
}

/**
 * 将一段SVG椭圆曲线参数转换为canvas所能支持的椭圆曲线参数
 * @param {Number} x1 起点x坐标
 * @param {Number} y1 起点y坐标
 * @param {Number} rx 椭圆半径1
 * @param {Number} ry 椭圆半径2
 * @param {Number} phi 表示椭圆相对于 x 轴的旋转角度
 * @param {int} fA 允许选择一个大弧线（1）或一个小弧线（0）
 * @param {int} fS 允许选择一条顺时针旋转的弧线（1）或一条逆时针旋转的弧线（0）
 * @param {Number} x2 终点x坐标
 * @param {Number} y2 终点y坐标
 * @returns {Object} 椭圆曲线
 * @class
 * result: {
 *     cx: 49.99999938964844,
 *     cy: 49.99999938964844,
 *     startAngle: 2.356194477985314,
 *     deltaAngle: -3.141592627780225,
 *     endAngle: 5.497787157384675,
 *     clockwise: false
 * }
 */
let svgArcToCenterParam = (function () {

    // 对于大多数情况，实际上有四个不同的圆弧（两个不同的椭圆，每个椭圆有两个不同圆弧扫掠）满足这些约束。大圆弧标志和扫掠标志指示绘制四个圆弧中的哪一个，如下所示：
    // 1 在四个候选圆弧扫掠中，两个表示大于或等于180度的圆弧扫掠（“大圆弧”），两个代表小于或等于180°的圆弧扫荡（“小圆弧”）。如果大圆弧标志为“1”，则将选择两个较大圆弧扫掠中的一个；否则，如果大圆弧标志为“0”，则将选择较小的圆弧扫掠之一，
    // 2 如果扫描标志为“1”，则弧将沿“正角度”方向绘制（即，椭圆公式x=cx+rx*cos（θ）和y=cy+ry*sin（θ）被评估为使得θ从对应于当前点的角度开始，并正增加，直到弧达到（x，y））。
    //   值为0会导致电弧沿“负角度”方向绘制（即，θ从对应于当前点的角度值开始，然后减小，直到电弧达到（x，y））。
    // 
    // 椭圆弧参数超出范围
    //   所有椭圆弧参数（布尔标志除外）都允许使用任意数值，但用户代理在渲染曲线或计算其几何体时必须对无效值进行以下调整：
    // 1 如果线段的端点（x，y）与当前点（例如，前一个线段的端点）相同，则这相当于完全省略椭圆弧线段。
    // 2 如果rx或ry为0，则此圆弧将被视为连接端点的直线段（“lineto”）。
    // 3 如果rx或ry中的任何一个具有负号，则这些负号被丢弃；而是使用绝对值。
    // 4 如果rx、ry和x轴旋转不存在解（基本上，椭圆不够大，无法从当前点到达新端点），则椭圆将均匀放大，直到刚好有一个解（直到椭圆刚好足够大）。

    return function (x1, y1, rx, ry, phi, fA, fS, x2, y2) {

        var cx, cy, startAngle, deltaAngle, endAngle;
        var PIx2 = Math.PI * 2.0;

        if (rx < 0) {
            rx = -rx;
        }
        if (ry < 0) {
            ry = -ry;
        }
        if (rx == 0.0 || ry == 0.0) { // invalid arguments
            throw Error('rx and ry can not be 0');
        }

        phi *= Math.PI / 180;
        var s_phi = Math.sin(phi);
        var c_phi = Math.cos(phi);
        var hd_x = (x1 - x2) / 2.0; // half diff of x
        var hd_y = (y1 - y2) / 2.0; // half diff of y
        var hs_x = (x1 + x2) / 2.0; // half sum of x
        var hs_y = (y1 + y2) / 2.0; // half sum of y

        // F6.5.1
        var x1_ = c_phi * hd_x + s_phi * hd_y;
        var y1_ = c_phi * hd_y - s_phi * hd_x;

        // F.6.6 Correction of out-of-range radii
        //   Step 3: Ensure radii are large enough
        var lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
        if (lambda > 1) {
            rx = rx * Math.sqrt(lambda);
            ry = ry * Math.sqrt(lambda);
        }

        var rxry = rx * ry;
        var rxy1_ = rx * y1_;
        var ryx1_ = ry * x1_;
        var sum_of_sq = rxy1_ * rxy1_ + ryx1_ * ryx1_; // sum of square
        if (!sum_of_sq) {
            throw Error('start point can not be same as end point');
        }
        var coe = Math.sqrt(Math.abs((rxry * rxry - sum_of_sq) / sum_of_sq));
        if (fA == fS) { coe = -coe; }

        // F6.5.2
        var cx_ = coe * rxy1_ / ry;
        var cy_ = -coe * ryx1_ / rx;

        // F6.5.3
        cx = c_phi * cx_ - s_phi * cy_ + hs_x;
        cy = s_phi * cx_ + c_phi * cy_ + hs_y;

        var xcr1 = (x1_ - cx_) / rx;
        var xcr2 = (x1_ + cx_) / rx;
        var ycr1 = (y1_ - cy_) / ry;
        var ycr2 = (y1_ + cy_) / ry;

        // F6.5.5
        startAngle = __radian(1.0, 0.0, xcr1, ycr1);
        while (startAngle > PIx2) { startAngle -= PIx2; }
        while (startAngle < 0.0) { startAngle += PIx2; }

        // F6.5.6
        deltaAngle = __radian(xcr1, ycr1, -xcr2, -ycr2);
        while (deltaAngle > PIx2) { deltaAngle -= PIx2; }   // add by hjq 2023/8/29
        while (deltaAngle < 0.0) { deltaAngle += PIx2; }    // add by hjq 2023/8/29

        if (fS == false || fS == 0) { deltaAngle -= PIx2; }
        endAngle = startAngle + deltaAngle;
        while (endAngle > PIx2) { endAngle -= PIx2; }
        while (endAngle < 0.0) { endAngle += PIx2; }

        var outputObj = { /* cx, cy, startAngle, deltaAngle */
            cx: cx,
            cy: cy,
            startAngle: startAngle,
            deltaAngle: deltaAngle,
            endAngle: endAngle,
            clockwise: (fS == true || fS == 1)
        }

        return outputObj;
    }

    function __radian(ux, uy, vx, vy) {
        var dot = ux * vx + uy * vy;
        var mod = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
        var rad = Math.acos(dot / mod);
        if (ux * vy - uy * vx < 0.0) {
            rad = -rad;
        }
        return rad;
    }
}())

/**
 * Converts arc to a bunch of bezier curves
 * @param {Number} fx starting point x
 * @param {Number} fy starting point y
 * @param {Array} coords Arc command
 */
let fromArcToBeziers = (function () {
    return function (fx, fy, coords) {
        var rx = coords[1],
            ry = coords[2],
            rot = coords[3],
            large = coords[4],
            sweep = coords[5],
            tx = coords[6],
            ty = coords[7],
            segsNorm = arcToSegments(tx - fx, ty - fy, rx, ry, large, sweep, rot);

        for (var i = 0, len = segsNorm.length; i < len; i++) {
            segsNorm[i][1] += fx;
            segsNorm[i][2] += fy;
            segsNorm[i][3] += fx;
            segsNorm[i][4] += fy;
            segsNorm[i][5] += fx;
            segsNorm[i][6] += fy;
        }
        return segsNorm;
    };

    /* Adapted from http://dxr.mozilla.org/mozilla-central/source/content/svg/content/src/nsSVGPathDataParser.cpp
        * by Andrea Bogazzi code is under MPL. if you don't have a copy of the license you can take it here
        * http://mozilla.org/MPL/2.0/
        */
    function arcToSegments(toX, toY, rx, ry, large, sweep, rotateX) {
        var PI = Math.PI, th = rotateX * PI / 180,
            sinTh = Math.sin(th),
            cosTh = Math.cos(th),
            fromX = 0, fromY = 0;

        rx = Math.abs(rx);
        ry = Math.abs(ry);

        var px = -cosTh * toX * 0.5 - sinTh * toY * 0.5,
            py = -cosTh * toY * 0.5 + sinTh * toX * 0.5,
            rx2 = rx * rx, ry2 = ry * ry, py2 = py * py, px2 = px * px,
            pl = rx2 * ry2 - rx2 * py2 - ry2 * px2,
            root = 0;

        if (pl < 0) {
            var s = Math.sqrt(1 - pl / (rx2 * ry2));
            rx *= s;
            ry *= s;
        } else {
            root = (large === sweep ? -1.0 : 1.0) * Math.sqrt(pl / (rx2 * py2 + ry2 * px2));
        }

        var cx = root * rx * py / ry,
            cy = -root * ry * px / rx,
            cx1 = cosTh * cx - sinTh * cy + toX * 0.5,
            cy1 = sinTh * cx + cosTh * cy + toY * 0.5,
            mTheta = calcVectorAngle(1, 0, (px - cx) / rx, (py - cy) / ry),
            dtheta = calcVectorAngle((px - cx) / rx, (py - cy) / ry, (-px - cx) / rx, (-py - cy) / ry);

        if (sweep === 0 && dtheta > 0) {
            dtheta -= 2 * PI;
        } else if (sweep === 1 && dtheta < 0) {
            dtheta += 2 * PI;
        }

        // Convert into cubic bezier segments <= 90deg
        var segments = Math.ceil(Math.abs(dtheta / PI * 2)),
            result = [], mDelta = dtheta / segments,
            mT = 8 / 3 * Math.sin(mDelta / 4) * Math.sin(mDelta / 4) / Math.sin(mDelta / 2),
            th3 = mTheta + mDelta;

        for (var i = 0; i < segments; i++) {
            result[i] = segmentToBezier(mTheta, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY);
            fromX = result[i][5];
            fromY = result[i][6];
            mTheta = th3;
            th3 += mDelta;
        }
        return result;
    }

    function segmentToBezier(th2, th3, cosTh, sinTh, rx, ry, cx1, cy1, mT, fromX, fromY) {
        var costh2 = Math.cos(th2),
            sinth2 = Math.sin(th2),
            costh3 = Math.cos(th3),
            sinth3 = Math.sin(th3),
            toX = cosTh * rx * costh3 - sinTh * ry * sinth3 + cx1,
            toY = sinTh * rx * costh3 + cosTh * ry * sinth3 + cy1,
            cp1X = fromX + mT * (-cosTh * rx * sinth2 - sinTh * ry * costh2),
            cp1Y = fromY + mT * (-sinTh * rx * sinth2 + cosTh * ry * costh2),
            cp2X = toX + mT * (cosTh * rx * sinth3 + sinTh * ry * costh3),
            cp2Y = toY + mT * (sinTh * rx * sinth3 - cosTh * ry * costh3);

        return ['C',
            cp1X, cp1Y,
            cp2X, cp2Y,
            toX, toY
        ];
    }

    /*
    * Private
    */
    function calcVectorAngle(ux, uy, vx, vy) {
        var ta = Math.atan2(uy, ux),
            tb = Math.atan2(vy, vx);
        if (tb >= ta) {
            return tb - ta;
        }
        else {
            return 2 * Math.PI - (ta - tb);
        }
    }

}());

export { svgArcToCenterParam, getSymmetricPointRelative, fromArcToBeziers }
