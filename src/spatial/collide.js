import Measure from "./measure.js";

/**
 * 碰撞检测
 * Repo: https://github.com/bmoren/p5.2D/
 * Some functions and code modified version from http://www.jeffreythompson.org/collision-detection
 */
class Collide {
    constructor() {
        this._Debug = false
    }

    static debug(debugMode) {
        _Debug = debugMode;
    }

    /**
     * 判断点与点是否碰撞
     * @param {Point} point1 {x, y}
     * @param {Point} point2 {x, y}
     * @param {float} buffer 容差
     * @returns boolean
     */
    static pointPoint(point1, point2, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }
        if (Measure.dist([point1.x, point1.y], [point2.x, point2.y]) <= buffer) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与圆是否碰撞
     * @param {Point} point {x, y}
     * @param {Circle} circle {x, y, radius}
     * @returns boolean
     */
    static pointCircle(point, circle) {
        if (Measure.dist([point.x, point.y], [circle.x, circle.y]) <= circle.radius) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与椭圆是否碰撞
     * @param {Point} point {x, y}
     * @param {Ellipse} ellipse {x, y, radiusX, radiusY}
     * @returns boolean
     */
    static pointEllipse(point, ellipse) {
        // 粗略判断，排除Bounding Box之外的点
        if (point.x > ellipse.x + ellipse.radiusX || point.x < ellipse.x - ellipse.radiusX ||
            point.y > ellipse.y + ellipse.radiusY || point.y < ellipse.y - ellipse.radiusY) {
            return false;
        }
        // 将该点与其椭圆上的等效点进行比较
        let xx = point.x - ellipse.x,
            yy = point.y - ellipse.y;
        let eyy = Math.sqrt(Math.abs(ellipse.radiusX * ellipse.radiusX - xx * xx)) * ellipse.radiusY / ellipse.radiusX;
        return yy <= eyy && yy >= -eyy;
    }

    /**
     * 判断点与矩形是否碰撞
     * @param {*} point {x, y}
     * @param {*} rect {x, y, width, height}
     * @returns boolean
     */
    static pointRect(point, rect) {
        if (point.x >= rect.x && point.x <= rect.x + rect.width &&    // X坐标大于等于矩形的起点X坐标，小于等于矩形的起点X坐标加上矩形宽度
            point.y >= rect.y && point.y <= rect.y + rect.height) {   // Y坐标大于等于矩形的起点Y坐标，小于等于矩形的起点Y坐标加上矩形高度
            return true;
        }
        return false;
    }

    /**
     * 判断点与线段是否碰撞
     * @param {*} point {x, y}
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} buffer 容差
     * @returns boolean
     */
    static pointLine(point, line, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }

        // 计算点与线段的两个端点之间的距离
        let d1 = Measure.dist([point.x, point.y], [line.x1, line.y1]);
        let d2 = Measure.dist([point.x, point.y], [line.x2, line.y2]);

        // 计算线段长度
        let lineLen = Measure.dist([line.x1, line.y1], [line.x2, line.y2]);

        // 如果点与线段的两个端点之间的距离之和等于线的长度，则可判断点与线相交
        if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与三角形是否碰撞
     * @param {*} point {x, y}
     * @param {*} triangle {x1, y1, x2, y2, x3, y3}
     * @param {*} buffer 
     * @returns boolean
     */
    static pointTriangle(point, triangle) {

        // get the area of the triangle
        let areaOrig = Math.abs((triangle.x2 - triangle.x1) * (triangle.y3 - triangle.y1) - (triangle.x3 - triangle.x1) * (triangle.y2 - triangle.y1));

        // get the area of 3 triangles made between the point and the corners of the triangle
        let area1 = Math.abs((triangle.x1 - point.x) * (triangle.y2 - point.y) - (triangle.x2 - point.x) * (triangle.y1 - point.y));
        let area2 = Math.abs((triangle.x2 - point.x) * (triangle.y3 - point.y) - (triangle.x3 - point.x) * (triangle.y2 - point.y));
        let area3 = Math.abs((triangle.x3 - point.x) * (triangle.y1 - point.y) - (triangle.x1 - point.x) * (triangle.y3 - point.y));

        // if the sum of the three areas equals the original, we're inside the triangle!
        if (area1 + area2 + area3 === areaOrig) {
            return true;
        }
        return false;
    }

    /**
     * 判断点与圆弧是否碰撞(bug)
     * @param {*} point {x, y}
     * @param {*} arc {x, y, radius, heading, angle }
     * @param {*} buffer 
     * @returns boolean
     */
    static pointArc(point, arc, buffer) {
        if (buffer == null) {
            buffer = 0.1;
        }
        // point
        let pointA = this.createVector(point.x, point.y);
        // arc center point
        let arcPos = this.createVector(arc.x, arc.y);
        // arc radius vector
        let radius = this.createVector(arc.radius, 0).rotate(arc.heading);

        let pointToArc = pointA.copoint.y().sub(arcPos);
        if (pointA.dist(arcPos) <= (arc.radius + buffer)) {
            let dot = radius.dot(pointToArc);
            let angle = radius.angleBetween(pointToArc);
            if (dot > 0 && angle <= arc.angle / 2 && angle >= -arc.angle / 2) {
                return true;
            }
        }
        return false;
    }

    /**
     * 判断点与多边形是否碰撞
     * https://blog.csdn.net/tom_221x/article/details/51861129
     * @param {*} point {x, y}
     * @param {*} polygon [[x,y],[x,y],[x,y]]
     * @returns Boolean
     */
    static pointPoly(point, polygon) {
        let collision = false;

        // 遍历多边形的每一条边
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // 当前顶点
            let vc = polygon[current];
            // 下一个顶点
            next = (current === polygon.length - 1 ? 0 : current + 1);
            let vn = polygon[next];

            // 判断一个点和一条边(vc,vn)的位置关系, 如果两个检查都为 true，则切换到其相反的值
            if ((vc[1] >= point.y && vn[1] < point.y) || (vc[1] < point.y && vn[1] >= point.y)) {
                // 求出两个向量(x - x1, y - y1) 和 (x2 - x1, y2 - y1), 
                // 并对两个向量做叉积的 (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
                if ((point.x - vc[0]) < (point.y - vc[1]) * (vn[0] - vc[0]) / (vn[1] - vc[1])) {
                    // 如果结果为零: 表示点在线上
                    // 如果结果为正: 表示点在线的右边
                    // 如果结果为负: 表示点在线的左边
                    collision = !collision;
                }
            }
        }
        return collision;
    }

    /**
     * 判断圆与圆是否碰撞
     * @param {*} circle1 {x, y, radius}
     * @param {*} circle2 {x, y, radius}
     * @returns Boolean
     */
    static circleCircle(circle1, circle2) {
        if (Measure.dist([circle1.x, circle1.y], [circle2.x, circle2.y]) <= (circle1.radius) + (circle2.radius)) {
            return true;
        }
        return false;
    };

    /**
     * 判断圆与多边形是否碰撞
     * @param {*} circle 
     * @param {*} polygon 
     * @param {*} interior 
     * @returns Boolean
     */
    static circlePoly(circle, polygon, interior = false) {

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = polygon[current];    // c for "current"
            let vn = polygon[next];       // n for "next"

            // check for collision between the circle and a line formed between the two polygon
            let collision = this.lineCircle(vc[0], vc[1], vn[0], vn[1], circle.x, circle.y, circle.radius);
            if (collision) return true;
        }

        // test if the center of the circle is inside the polygon
        if (interior === true) {
            let centerInside = this.pointPoly({ "x": circle.x, "y": circle.y }, polygon);
            if (centerInside) return true;
        }

        // otherwise, after all that, return false
        return false;
    }


    /**
     * 判断线与线是否碰撞
     * @param {*} line1 {x1, y1, x2, y2}
     * @param {*} line2 {x1, y1, x2, y2}
     * @param {*} calcIntersection 
     * @returns Boolean
     */
    static lineLine(line1, line2, calcIntersection) {
        let intersection;

        // calculate the distance to intersection point
        let uA = ((line2.x2 - line2.x1) * (line1.y1 - line2.y1) - (line2.y2 - line2.y1) * (line1.x1 - line2.x1)) / ((line2.y2 - line2.y1) * (line1.x2 - line1.x1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1));
        let uB = ((line1.x2 - line1.x1) * (line1.y1 - line2.y1) - (line1.y2 - line1.y1) * (line1.x1 - line2.x1)) / ((line2.y2 - line2.y1) * (line1.x2 - line1.x1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1));

        // if uA and uB are between 0-1, lines are colliding
        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {

            if (this._Debug || calcIntersection) {
                // calc the point where the lines meet
                let intersectionX = line1.x1 + (uA * (line1.x2 - line1.x1));
                let intersectionY = line1.y1 + (uA * (line1.y2 - line1.y1));
            }

            // if (this._Debug) {
            //     this.ellipse(intersectionX, intersectionY, 10, 10);
            // }

            if (calcIntersection) {
                intersection = {
                    "x": intersectionX,
                    "y": intersectionY
                }
                return intersection;
            } else {
                return true;
            }
        }
        if (calcIntersection) {
            intersection = {
                "x": false,
                "y": false
            }
            return intersection;
        }
        return false;
    }

    /**
     * 判断线与矩形是否碰撞
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} rect {x, y, width, height}
     * @param {*} calcIntersection 
     * @returns Boolean
     */
    static lineRect(line, rect, calcIntersection) {
        // check if the line has hit any of the rectangle's sides. uses the lineLine function above
        let left, right, top, bottom, intersection;

        if (calcIntersection) {
            left = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x, "y2": rect.y + rect.height }, true);
            right = this.lineLine(line, { "x1": rect.x + rect.width, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y + rect.height }, true);
            top = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y }, true);
            bottom = this.lineLine(line, { "x1": rect.x, "y1": rect.y + rect.height, "x2": rect.x + rect.width, "y2": rect.y + rect.height }, true);
            intersection = {
                "left": left,
                "right": right,
                "top": top,
                "bottom": bottom
            }
        } else {
            //return booleans
            left = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x, "y2": rect.y + rect.height });
            right = this.lineLine(line, { "x1": rect.x + rect.width, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y + rect.height });
            top = this.lineLine(line, { "x1": rect.x, "y1": rect.y, "x2": rect.x + rect.width, "y2": rect.y });
            bottom = this.lineLine(line, { "x1": rect.x, "y1": rect.y + rect.height, "x2": rect.x + rect.width, "y2": rect.y + rect.height });
        }

        // if ANY of the above are true, the line has hit the rectangle
        if (left || right || top || bottom) {
            if (calcIntersection) {
                return intersection;
            }
            return true;
        }
        return false;
    }

    /**
     * 判断线与圆是否碰撞
     * @param {*} line {x1, y1, x2, y2}
     * @param {*} circle {x, y, radius}
     * @returns Boolean
     */
    static lineCircle(line, circle) {
        // is either end INSIDE the circle?
        // if so, return true immediately
        let inside1 = this.pointCircle({ "x": line.x1, "y": line.y1 }, circle);
        let inside2 = this.pointCircle({ "x": line.x2, "y": line.y2 }, circle);
        if (inside1 || inside2) return true;

        // get length of the line
        let distX = line.x1 - line.x2;
        let distY = line.y1 - line.y2;
        let len = this.sqrt((distX * distX) + (distY * distY));

        // get dot product of the line and circle
        let dot = (((circle.x - line.x1) * (line.x2 - line.x1)) + ((circle.y - line.y1) * (line.y2 - line.y1))) / this.pow(len, 2);

        // find the closest point on the line
        let closestX = line.x1 + (dot * (line.x2 - line.x1));
        let closestY = line.y1 + (dot * (line.y2 - line.y1));

        // is this point actually on the line segment?
        // if so keep going, but if not, return false
        let onSegment = this.collidePointLine(closestX, closestY, line.x1, line.y1, line.x2, line.y2);
        if (!onSegment) return false;

        // draw a debug circle at the closest point on the line
        if (this._collideDebug) {
            this.ellipse(closestX, closestY, 10, 10);
        }

        // get distance to closest point
        distX = closestX - circle.x;
        distY = closestY - circle.y;
        let distance = this.sqrt((distX * distX) + (distY * distY));

        if (distance <= circle.radius) {
            return true;
        }
        return false;
    }

    /**
     * 判断线与多边形是否碰撞
     * @param {*} line 
     * @param {*} polygon 
     * @returns Boolean
     */
    static linePoly(line, polygon) {
        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position extract X/Y coordinates from each
            let x1 = polygon[current][0];
            let y1 = polygon[current][1];
            let x2 = polygon[next][0];
            let y2 = polygon[next][1];

            // do a Line/Line comparison if true, return 'true' immediately and stop testing (faster)
            let hit = this.lineLine(line, { x1, y1, x2, y2 });
            if (hit) {
                return true;
            }
        }
        // never got a hit
        return false;
    }

    /**
     * 判断矩形与矩形是否碰撞
     * @param {*} rect1 
     * @param {*} rect2 
     * @returns Boolean
     */
    static rect1Rect(rect1, rect2) {
        //add in a thing to detect rect1Mode CENTER
        if (rect1.x + rect1.width >= rect2.x &&    // r1 right edge past r2 left
            rect1.x <= rect2.x + rect2.width &&    // r1 left edge past r2 right
            rect1.y + rect1.height >= rect2.y &&    // r1 top edge past r2 bottom
            rect1.y <= rect2.y + rect2.height) {    // r1 bottom edge past r2 top
            return true;
        }
        return false;
    };

    /**
     * 判断矩形与圆是否碰撞
     * @param {*} rect {x, y, width, height}
     * @param {*} circle {x, y, radius}
     * @returns Boolean
     */
    static rectCircle(rect, circle) {
        // temporarect.y variables to set edges for testing
        let testX = circle.x;
        let testY = circle.y;

        // which edge is closest?
        if (circle.x < rect.x) {
            testX = rect.x       // left edge
        } else if (circle.x > rect.x + rect.width) {
            testX = rect.x + rect.width   // right edge
        }

        if (circle.y < rect.y) {
            testY = rect.y       // top edge
        } else if (circle.y > rect.y + rect.height) {
            testY = rect.y + rect.height   // // bottom edge
        }

        // // get distance from closest edges
        let distance = Measure.dist([circle.x, circle.y], [testX, testY])

        // if the distance is less than the circle.radius, collision!
        if (distance <= circle.radius) {
            return true;
        }
        return false;
    };

    /**
     * 判断矩形与多边形是否碰撞
     * @param {*} rect {x, y, width, height}
     * @param {*} polygon 
     * @param {*} interior 
     * @returns Boolean
     */
    static rectPoly(rect, polygon, interior) {
        if (interior == undefined) {
            interior = false;
        }

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < polygon.length; current++) {

            // get next vertex in list if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === polygon.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = polygon[current];    // c for "current"
            let vn = polygon[next];       // n for "next"

            // check against all four sides of the rectangle
            let collision = this.lineRect({ x1: vc[0], y1: vc[1], x2: vn[0], y2: vn[1] }, rect);
            if (collision) return true;

            // optional: test if the rectangle is INSIDE the polygon note that this iterates all sides of the polygon again, so only use this if you need to
            if (interior === true) {
                let inside = this.pointPoly({ "x": rect.x, "y": rect.y }, polygon);
                if (inside) return true;
            }
        }

        return false;
    }

    /**
     * 判断多边形与多边形是否碰撞
     * @param {*} p1 
     * @param {*} p2 
     * @param {*} interior 
     * @returns Boolean
     */
    static polyPoly(p1, p2, interior) {
        if (interior === undefined) {
            interior = false;
        }

        // go through each of the polygon, plus the next vertex in the list
        let next = 0;
        for (let current = 0; current < p1.length; current++) {

            // get next vertex in list, if we've hit the end, wrap around to 0
            next = current + 1;
            if (next === p1.length) next = 0;

            // get the PVectors at our current position this makes our if statement a little cleaner
            let vc = p1[current];    // c for "current"
            let vn = p1[next];       // n for "next"

            //use these two points (a line) to compare to the other polygon's polygon using polyLine()
            let collision = this.linePoly({ "x1": vc[0], "y1": vc[1], "x2": vn[0], "y2": vn[1] }, p2);
            if (collision) return true;

            //check if the either polygon is INSIDE the other
            if (interior === true) {
                collision = this.pointPoly({ "x": p2[0][0], "y": p2[0][1] }, p1);
                if (collision) return true;
                collision = this.pointPoly({ "x": p1[0][0], "y": p1[0][1] }, p2);
                if (collision) return true;
            }
        }

        return false;
    }
}

export default Collide;
