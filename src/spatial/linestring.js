import Point from "../geom/point.js";

/**
 * 线坐标处理类
 */
class LineString {
    constructor() {
        this.points = [];
    }

    addPoint(point) {
        this.points.push(point);
    }

    getPoints() {
        return this.points;
    }

    getLength() {
        let totalLength = 0;
        for (let i = 1; i < this.points.length; i++) {
            let p1 = this.points[i - 1];
            let p2 = this.points[i];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        return totalLength;
    }

    getStart() {
        return this.points[0];
    }

    getEnd() {
        return this.points[this.points.length - 1];
    }

    /**
     * 获取沿线上的点坐标
     */
    static getLinePoint(flatCoords, interval) {
        let list = []
        for (let i = 0; i < flatCoords.length - 1; i++) {
            this._getLineSegmentPoint(list, flatCoords[i], flatCoords[i + 1], interval);
        }
        return list;
    }

    /**
     * @private
     */
    static _getLineSegmentPoint(list, p1, p2, interval = 5) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        let xStep = (x2 - x1) * interval / dist;
        let yStep = (y2 - y1) * interval / dist;
        let idx = 1;
        let newX = x1 + idx * xStep;
        let newY = y1 + idx * yStep;
        while (newX >= Math.min(x1, x2) && newX <= Math.max(x1, x2) && newY >= Math.min(y1, y2) && newY <= Math.max(y1, y2)) {
            list.push([newX, newY]);
            idx += 1;
            newX = x1 + idx * xStep;
            newY = y1 + idx * yStep;
        }
    }

    /**
     * 计算延伸线
     * @param {*} line 
     * @param {*} length 
     * @returns Array
     */
    static extendLine(line, length) {
        var [x1, y1] = line[0];
        var [x2, y2] = line[1];
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy);
        var extendX = dx / len * length;
        var extendY = dy / len * length;
        return [[x1 + extendX, y1 + extendY], [x2 + extendX, y2 + extendY]];
    }

    /**
     * 已知点、线段，求垂足
     * 垂足可能在线段上，也可能在线段延长线上。
     * @param line 线段；[[经度,纬度],[经度,纬度]]；例：[[116.01,40.01],[116.52,40.01]]
     * @param p 点；[经度,纬度]；例：[116.35,40.08]
     *
     * @return point 返回垂足坐标
     */
    static getFootPoint(line, p) {
        var p1 = line[0]
        var p2 = line[1]
        var dx = p2[0] - p1[0];
        var dy = p2[1] - p1[1];
        var cross = dx * (p[0] - p1[0]) + dy * (p[1] - p1[1])
        var d2 = dx * dx + dy * dy
        var u = cross / d2
        return [(p1[0] + u * dx), (p1[1] + u * dy)]
    }

    /**
     * 读取坐标数组，并转换为LineString对象
     * @param {*} coords 
     * @returns LineString
     */
    static readCoord(coords) {
        let line = new LineString();
        for (let i = 0, ii = coords.length; i < ii; i++) {
            let coord = coords[i];
            let point = new Point(coord[0], coord[1]);
            line.addPoint(point);
        }
        return line;
    }
}

export default LineString;

// let val = extendLine([[0, 0], [0, 10]], 10);
// console.info(val[0], val[1]);
