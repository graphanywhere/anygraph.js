let _lastCode;

/**
 * polyline裁切
 * @param {*} points 
 * @param {*} bounds 
 * @returns Array
 */
function clipSegments(points, bounds) {
    let clippedPoints = [];
    let clippedPointsArray = [];
    //clippedPoints.push(points[0]);
    for (let i = 1, ii = points.length; i < ii; i++) {
        let a = points[i - 1];
        let b = points[i];
        let v = clipSegment(a, b, bounds, false);
        if (v != false) {
            if (clippedPoints.length == 0)
                clippedPoints.push(v[0]);
            clippedPoints.push(v[1]);
        } else {
            if (clippedPoints.length > 0) {
                clippedPointsArray.push(clippedPoints);
                clippedPoints = [];
            }
        }
    }
    if (clippedPoints.length > 0) {
        clippedPointsArray.push(clippedPoints);
        clippedPoints = [];
    }
    return clippedPointsArray;
}

// @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
// Clips the segment a to b by rectangular bounds with the
// [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
// (modifying the segment points directly!). Used by Leaflet to only show polyline
// points that are on the screen or near, increasing performance.
function clipSegment(p1, p2, bounds, useLastCode = false) {
    let a = p1, b = p2;
    let codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
        codeB = _getBitCode(b, bounds),

        codeOut, p, newCode;

    // save 2nd code to avoid calculating it on the next segment
    _lastCode = codeB;

    while (true) {
        // if a,b is inside the clip window (trivial accept)
        if (!(codeA | codeB)) {
            return [a, b];
        }

        // if a,b is outside the clip window (trivial reject)
        if (codeA & codeB) {
            return false;
        }

        // other cases
        codeOut = codeA || codeB;
        p = _getEdgeIntersection(a, b, codeOut, bounds);
        newCode = _getBitCode(p, bounds);

        if (codeOut === codeA) {
            a = p;
            codeA = newCode;
        } else {
            b = p;
            codeB = newCode;
        }
    }
}

/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a separate method for it.
 */
function clipPolygon(points, bounds) {
    let clippedPoints,
        edges = [1, 4, 2, 8],
        i, j, k,
        a, b,
        len, edge, p;

    for (i = 0, len = points.length; i < len; i++) {
        points[i]._code = _getBitCode(points[i], bounds);
    }

    // for each edge (left, bottom, right, top)
    for (k = 0; k < 4; k++) {
        edge = edges[k];
        clippedPoints = [];

        for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            a = points[i];
            b = points[j];

            // if a is inside the clip window
            if (!(a._code & edge)) {
                // if b is outside the clip window (a->b goes out of screen)
                if (b._code & edge) {
                    p = _getEdgeIntersection(b, a, edge, bounds);
                    p._code = _getBitCode(p, bounds);
                    clippedPoints.push(p);
                }
                clippedPoints.push(a);

                // else if b is inside the clip window (a->b enters the screen)
            } else if (!(b._code & edge)) {
                p = _getEdgeIntersection(b, a, edge, bounds);
                p._code = _getBitCode(p, bounds);
                clippedPoints.push(p);
            }
        }
        points = clippedPoints;
    }

    return points;
}

function _getBitCode(p, bounds) {
    let code = 0;

    if (p[0] < bounds[0]) { // left
        code |= 1;
    } else if (p[0] > bounds[2]) { // right
        code |= 2;
    }

    if (p[1] < bounds[1]) { // bottom
        code |= 4;
    } else if (p[1] > bounds[3]) { // top
        code |= 8;
    }

    return code;
}

function _getEdgeIntersection(a, b, code, bounds) {
    let dx = b[0] - a[0],
        dy = b[1] - a[1],
        min = [bounds[0], bounds[1]],
        max = [bounds[2], bounds[3]],
        x, y;

    if (code & 8) { // top
        x = a[0] + dx * (max[1] - a[1]) / dy;
        y = max[1];

    } else if (code & 4) { // bottom
        x = a[0] + dx * (min[1] - a[1]) / dy;
        y = min[1];

    } else if (code & 2) { // right
        x = max[0];
        y = a[1] + dy * (max[0] - a[0]) / dx;

    } else if (code & 1) { // left
        x = min[0];
        y = a[1] + dy * (min[0] - a[0]) / dx;
    }

    //return [Math.round(x), Math.round(y)];
    return [x, y];
}

export default clipSegments;
export { clipSegments, clipPolygon };
