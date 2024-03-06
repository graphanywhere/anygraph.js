import Point from "../geom/point.js";

/*
 * @namespace LineUtil
 *
 * Various utility functions for polyline points processing, used by Leaflet internally to make polylines lightning-fast.
 * 多段线点处理的各种实用功能，由Leaflet内部使用，使多段线闪电般快速
 */

// Simplify polyline with vertex reduction and Douglas-Peucker simplification.
// 使用顶点简化和Douglas-Peucker简化来简化多段线。
// Improves rendering performance dramatically by lessening the number of points to draw.
// 通过减少要绘制的点数，显著提高了渲染性能。

// @function simplify(points: Point[], tolerance: Number): Point[]
// Dramatically reduces the number of points in a polyline while retaining its shape and returns a new array of simplified points, 
// 在保持多段线形状的同时显著减少了多段线中的点的数量，并返回简化点的新阵列，
// using the [Ramer-Douglas-Peucker algorithm](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm).
// Used for a huge performance boost when processing/displaying Leaflet polylines for each zoom level and also reducing visual noise. 
// 用于在处理/显示每个缩放级别的传单多段线时大幅提高性能，同时减少视觉噪音
// tolerance affects the amount of simplification (lesser value means higher quality but slower and with more points).
// 公差会影响简化的数量（较小的值意味着较高的质量，但速度较慢且点数较多）
// Also released as a separated micro-library [Simplify.js](https://mourner.github.io/simplify-js/).


/**
 * polyline简化
 * @param {Array} points polyline坐标
 * @param {number} tolerance 公差
 * @returns points
 */
function simplify(points, tolerance) {
    if (!tolerance || !points.length) {
        return points.slice();
    }

    var sqTolerance = tolerance * tolerance;

    // stage 1: vertex reduction  阶段1：根据距离进行简化
    points = _reducePoints(points, sqTolerance);

    // stage 2: Douglas-Peucker simplification   第二阶段：道格拉斯-派克简化
    points = _simplifyDP(points, sqTolerance);

    return points;
}

// @function pointToSegmentDistance(p: Point, p1: Point, p2: Point): Number
// Returns the distance between point `p` and segment `p1` to `p2`.
function pointToSegmentDistance(p, p1, p2) {
    return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
}

// @function closestPointOnSegment(p: Point, p1: Point, p2: Point): Number
// Returns the closest point from a point `p` on a segment `p1` to `p2`.
function closestPointOnSegment(p, p1, p2) {
    return _sqClosestPointOnSegment(p, p1, p2);
}

/**
 * Ramer-Douglas-Peucker simplification
 * 道格拉斯-派克简化是一种用于抽稀曲线的算法，也称为Douglas-Peucker算法。该算法的目的是在保留曲线形状的前提下，尽可能减少曲线上的点数，从而实现对曲线的简化。
 * 算法的基本思想是：
 * 1. 在曲线上选取一个起点和终点，并计算该线段上各点到起点和终点之间的距离，
 * 2. 将距离超过阈值的点作为分割点，然后将这些分割点之间的线段用其两端点的连线代替，从而得到一条更简单的折线。
 * 3. 通过反复应用这个过程，可以将复杂的曲线近似为一条相对简单的折线，从而实现对曲线的简化。
 * see https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm
 * @private
 * @param {*} points 
 * @param {*} sqTolerance 
 * @returns Array
 */
function _simplifyDP(points, sqTolerance) {

    var len = points.length,
        ArrayConstructor = typeof Uint8Array !== undefined + '' ? Uint8Array : Array,
        markers = new ArrayConstructor(len);

    markers[0] = markers[len - 1] = 1;

    _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);

    var i, newPoints = [];
    for (i = 0; i < len; i++) {
        if (markers[i]) {
            newPoints.push(points[i]);
        }
    }

    return newPoints;
}

function _simplifyDPStep(points, markers, sqTolerance, first, last) {
    var maxSqDist = 0,
        index, i, sqDist;

    for (i = first + 1; i <= last - 1; i++) {
        sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        markers[index] = 1;
        _simplifyDPStep(points, markers, sqTolerance, first, index);
        _simplifyDPStep(points, markers, sqTolerance, index, last);
    }
}

// reduce points that are too close to each other to a single point
function _reducePoints(points, sqTolerance) {
    var reducedPoints = [points[0]];

    for (var i = 1, prev = 0, len = points.length; i < len; i++) {
        if (_sqDist(points[i], points[prev]) > sqTolerance) {
            reducedPoints.push(points[i]);
            prev = i;
        }
    }
    if (prev < len - 1) {
        reducedPoints.push(points[len - 1]);
    }
    return reducedPoints;
}

// square distance (to avoid unnecessary Math.sqrt calls)
function _sqDist(p1, p2) {
    var dx = p2[0] - p1[0],
        dy = p2[1] - p1[1];
    return dx * dx + dy * dy;
}

/**
 * return closest point on segment or distance to that point
 * 返回线段上最近的点或到该点的距离
 * @private
 */
function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
    var x = p1[0],
        y = p1[1],
        dx = p2[0] - x,
        dy = p2[1] - y,
        dot = dx * dx + dy * dy,
        t;

    if (dot > 0) {
        t = ((p[0] - x) * dx + (p[1] - y) * dy) / dot;

        if (t > 1) {
            x = p2[0];
            y = p2[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return sqDist ? dx * dx + dy * dy : new Point(x, y);
}

export default simplify;
