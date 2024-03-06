class Point {  
    constructor(x, y) {  
        const base = { x: 0, y: 0 }

        // ensure source as object
        const source = Array.isArray(x) ? { x: x[0], y: x[1] } : typeof x === 'object' ? { x: x.x, y: x.y } : { x: x, y: y }

        // merge source
        this.x = source.x == null ? base.x : source.x
        this.y = source.y == null ? base.y : source.y
    }  
}

/**
 * SVG Path节点中d属性语法分析(来源SVG.js，目前为止兼容性最强)
 */
let pathParse = (function () {
    "use strict";

    const isPathLetter = /[MLHVCSQTAZ]/i
    const segmentParameters = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }

    const pathHandlers = {
        M: function (c, p, p0) {
            p.x = p0.x = c[0]
            p.y = p0.y = c[1]

            return ['M', p.x, p.y]
        },
        L: function (c, p) {
            p.x = c[0]
            p.y = c[1]
            return ['L', c[0], c[1]]
        },
        H: function (c, p) {
            p.x = c[0]
            return ['H', c[0]]
        },
        V: function (c, p) {
            p.y = c[0]
            return ['V', c[0]]
        },
        C: function (c, p) {
            p.x = c[4]
            p.y = c[5]
            return ['C', c[0], c[1], c[2], c[3], c[4], c[5]]
        },
        S: function (c, p) {
            p.x = c[2]
            p.y = c[3]
            return ['S', c[0], c[1], c[2], c[3]]
        },
        Q: function (c, p) {
            p.x = c[2]
            p.y = c[3]
            return ['Q', c[0], c[1], c[2], c[3]]
        },
        T: function (c, p) {
            p.x = c[0]
            p.y = c[1]
            return ['T', c[0], c[1]]
        },
        Z: function (c, p, p0) {
            p.x = p0.x
            p.y = p0.y
            return ['Z']
        },
        A: function (c, p) {
            p.x = c[5]
            p.y = c[6]
            return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]]
        }
    }

    const mlhvqtcsaz = 'mlhvqtcsaz'.split('')

    for (let i = 0, il = mlhvqtcsaz.length; i < il; ++i) {
        pathHandlers[mlhvqtcsaz[i]] = (function (i) {
            return function (c, p, p0) {
                if (i === 'H') c[0] = c[0] + p.x
                else if (i === 'V') c[0] = c[0] + p.y
                else if (i === 'A') {
                    c[5] = c[5] + p.x
                    c[6] = c[6] + p.y
                } else {
                    for (let j = 0, jl = c.length; j < jl; ++j) {
                        c[j] = c[j] + (j % 2 ? p.y : p.x)
                    }
                }

                return pathHandlers[i](c, p, p0)
            }
        })(mlhvqtcsaz[i].toUpperCase())
    }

    function makeAbsolut(parser) {
        const command = parser.segment[0]
        return pathHandlers[command](parser.segment.slice(1), parser.p, parser.p0)
    }

    function segmentComplete(parser) {
        return parser.segment.length && parser.segment.length - 1 === segmentParameters[parser.segment[0].toUpperCase()]
    }

    function startNewSegment(parser, token) {
        parser.inNumber && finalizeNumber(parser, false)
        const pathLetter = isPathLetter.test(token)

        if (pathLetter) {
            parser.segment = [token]
        } else {
            const lastCommand = parser.lastCommand
            const small = lastCommand.toLowerCase()
            const isSmall = lastCommand === small
            parser.segment = [small === 'm' ? (isSmall ? 'l' : 'L') : lastCommand]
        }

        parser.inSegment = true
        parser.lastCommand = parser.segment[0]

        return pathLetter
    }

    function finalizeNumber(parser, inNumber) {
        if (!parser.inNumber) throw new Error('Parser Error')
        parser.number && parser.segment.push(parseFloat(parser.number))
        parser.inNumber = inNumber
        parser.number = ''
        parser.pointSeen = false
        parser.hasExponent = false

        if (segmentComplete(parser)) {
            finalizeSegment(parser)
        }
    }

    function finalizeSegment(parser) {
        parser.inSegment = false
        if (parser.absolute) {
            parser.segment = makeAbsolut(parser)
        }
        parser.segments.push(parser.segment)
    }

    function isArcFlag(parser) {
        if (!parser.segment.length) return false
        const isArc = parser.segment[0].toUpperCase() === 'A'
        const length = parser.segment.length

        return isArc && (length === 4 || length === 5)
    }

    function isExponential(parser) {
        return parser.lastToken.toUpperCase() === 'E'
    }

    return function (d, toAbsolute = true) {

        let index = 0
        let token = ''
        const parser = {
            segment: [],
            inNumber: false,
            number: '',
            lastToken: '',
            inSegment: false,
            segments: [],
            pointSeen: false,
            hasExponent: false,
            absolute: toAbsolute,
            p0: new Point(),
            p: new Point()
        }

        while ((parser.lastToken = token, token = d.charAt(index++))) {

            // 判断是否存在多余的空字符 2023/9/11
            let reg = /\s/;
            if (reg.exec(token)) {
                if (!parser.inSegment) {
                    continue;
                }
            }

            if (!parser.inSegment) {
                if (startNewSegment(parser, token)) {
                    continue
                }
            }

            if (token === '.') {
                if (parser.pointSeen || parser.hasExponent) {
                    finalizeNumber(parser, false)
                    --index
                    continue
                }
                parser.inNumber = true
                parser.pointSeen = true
                parser.number += token
                continue
            }

            if (!isNaN(parseInt(token))) {

                if (parser.number === '0' || isArcFlag(parser)) {
                    parser.inNumber = true
                    parser.number = token
                    finalizeNumber(parser, true)
                    continue
                }

                parser.inNumber = true
                parser.number += token
                continue
            }

            if (token === ' ' || token === ',') {
                if (parser.inNumber) {
                    finalizeNumber(parser, false)
                }
                continue
            }

            if (token === '-') {
                if (parser.inNumber && !isExponential(parser)) {
                    finalizeNumber(parser, false)
                    --index
                    continue
                }
                parser.number += token
                parser.inNumber = true
                continue
            }

            if (token.toUpperCase() === 'E') {
                parser.number += token
                parser.hasExponent = true
                continue
            }

            if (isPathLetter.test(token)) {
                if (parser.inNumber) {
                    finalizeNumber(parser, false)
                } else if (!segmentComplete(parser)) {
                    throw new Error('parser Error')
                } else {
                    finalizeSegment(parser)
                }
                --index
            }
        }

        if (parser.inNumber) {
            finalizeNumber(parser, false)
        }

        if (parser.inSegment && segmentComplete(parser)) {
            finalizeSegment(parser)
        }

        return parser.segments
    }
}());


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