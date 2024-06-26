import { svgArcToCenterParam, getSymmetricPointRelative, fromArcToBeziers } from "./misc.js";
import { Ellipse } from "../../geom/index.js";
import MathUtil from "../../util/math.js";

/**
 * SVG路径分析
 */
class SvgPath {
    /**
     * 构造函数
     */
    constructor() {
    }

    /**
     * 分析Path节点中的d属性
     * @param {String} pathString 
     * @returns Object
     */
    static parse(pathString) {
        // M = moveto                           : m 10 10
        // L = lineto                           : l 100 20
        // H = horizontal lineto                : h 20
        // V = vertical lineto                  : v 20
        // C = curveto                          : c (x1,y1,x2,y2,x,y)+
        // S = smooth curveto                   : s (x2,y2,x,y)+
        // Q = quadratic Bézier curve           : q (x1,y1,x,y)+
        // T = smooth quadratic Bézier curveto  : t (x,y)+
        // A = elliptical Arc                   : a (rx ry angle large-arc-flag sweep-flag x y)+
        // Z = closepath                        : z

        //let commandList = pathParse(pathString);
        //let commandList = fabricPathParse(pathString);
        let commandList = svgPathParse(pathString);
        let coords = [];
        let commands = [];
        let childGeometrys = [];
        let lastPoint = [0, 0];
        let c_lastControlPoint = [0, 0];   // 三次贝塞尔曲线控制点
        let q_lastControlPoint = [0, 0];   // 二次贝塞尔曲线控制点
        for (let j = 0, jj = commandList.length; j < jj; j += 1) {
            let partArr = commandList[j];
            let cmd = partArr[0];
            let tc = [];

            switch (cmd) {
                case "M":
                case "L":
                    for (let m = 1; m < partArr.length; m += 2) {
                        tc.push([partArr[m], partArr[m + 1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "m":
                case "l":
                    for (let m = 1; m < partArr.length; m += 2) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "H":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([partArr[m], lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "h":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([partArr[m] + lastPoint[0], lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "V":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([lastPoint[0], partArr[m]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                case "v":
                    for (let m = 1; m < partArr.length; m += 1) {
                        tc.push([lastPoint[0], partArr[m] + lastPoint[1]]);
                        lastPoint = tc[tc.length - 1];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                //-------------------------------------------------------------------------------------------------

                case "C":    // 三次贝塞尔曲线，绝对位置， (x1,y1,x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 6) {
                        tc.push([partArr[m], partArr[m + 1]]);        // 控制点1
                        tc.push([partArr[m + 2], partArr[m + 3]]);    // 控制点2
                        tc.push([partArr[m + 4], partArr[m + 5]]);    // 终止点
                        c_lastControlPoint = [partArr[m + 2], partArr[m + 3]];
                        lastPoint = [partArr[m + 4], partArr[m + 5]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "c":    // 三次贝塞尔曲线，相对位置， (x1,y1,x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 6) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);        // 控制点1
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);    // 控制点2
                        tc.push([lastPoint[0] + partArr[m + 4], lastPoint[1] + partArr[m + 5]]);    // 终止点
                        c_lastControlPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]];
                        lastPoint = [lastPoint[0] + partArr[m + 4], lastPoint[1] + partArr[m + 5]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "S":    // 三次贝塞尔曲线，绝对位置， (x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        if (c_lastControlPoint[0] == 0 && c_lastControlPoint[1] == 0) {
                            c_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            c_lastControlPoint = getSymmetricPointRelative(c_lastControlPoint, lastPoint);        // 控制点1
                            tc.push(c_lastControlPoint);
                        }
                        tc.push([partArr[m], partArr[m + 1]]);                                // 控制点2
                        tc.push([partArr[m + 2], partArr[m + 3]]);                            // 终止点
                        c_lastControlPoint = [partArr[m], partArr[m + 1]]
                        lastPoint = [partArr[m + 2], partArr[m + 3]];
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                case "s":    // 三次贝塞尔曲线，绝对位置， (x2,y2,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        if (c_lastControlPoint[0] == 0 && c_lastControlPoint[1] == 0) {
                            c_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            c_lastControlPoint = getSymmetricPointRelative(c_lastControlPoint, lastPoint)              // 控制点1 
                            tc.push(c_lastControlPoint);
                        }
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);       // 控制点2
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);   // 终止点
                        c_lastControlPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]
                        lastPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]
                    }
                    coords.push(tc);
                    q_lastControlPoint = [0, 0];
                    break;
                //-------------------------------------------------------------------------------------------------

                case "Q":   // 二次贝塞尔曲线，绝对位置， (x1,y1,x,y)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        tc.push([partArr[m], partArr[m + 1]]);      // 控制点
                        tc.push([partArr[m + 2], partArr[m + 3]]);    // 终止点
                        q_lastControlPoint = [partArr[m], partArr[m + 1]];
                        lastPoint = [partArr[m + 2], partArr[m + 3]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "q":   // 二次贝塞尔曲线，相对位置  (dx1,dy1,dx,dy)+
                    for (let m = 1; m < partArr.length; m += 4) {
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);         // 控制点
                        tc.push([lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]]);         // 终止点
                        q_lastControlPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]];
                        lastPoint = [lastPoint[0] + partArr[m + 2], lastPoint[1] + partArr[m + 3]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "T": // 二次贝塞尔曲线，绝对位置   (x,y)+
                    for (let m = 1; m < partArr.length; m += 2) {
                        if (q_lastControlPoint[0] == 0 && q_lastControlPoint[1] == 0) {
                            q_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            q_lastControlPoint = getSymmetricPointRelative(q_lastControlPoint, lastPoint);
                            tc.push(q_lastControlPoint);
                        }
                        tc.push([partArr[m], partArr[m + 1]]);
                        lastPoint = [partArr[m], partArr[m + 1]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;
                case "t":// 二次贝塞尔曲线，相对位置   (dx,dy)+
                    for (let m = 1; m < partArr.length; m += 2) {
                        if (q_lastControlPoint[0] == 0 && q_lastControlPoint[1] == 0) {
                            q_lastControlPoint = lastPoint.slice();
                            tc.push(lastPoint);
                        } else {
                            q_lastControlPoint = getSymmetricPointRelative(q_lastControlPoint, lastPoint)
                            tc.push(q_lastControlPoint);
                        }
                        tc.push([lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]]);
                        lastPoint = [lastPoint[0] + partArr[m], lastPoint[1] + partArr[m + 1]];
                    }
                    coords.push(tc);
                    c_lastControlPoint = [0, 0];
                    break;

                //-------------------------------------------------------------------------------------------------
                case "a": // 椭圆曲线， 相对位置   (rx ry angle large-arc-flag sweep-flag dx dy)+

                    if (this.drawEllipseArcStyle === 1) {
                        // 通过换算为贝塞尔曲线，绘制椭圆弧
                        for (let m = 1; m < partArr.length; m += 7) {
                            let cArray = fromArcToBeziers(lastPoint[0], lastPoint[1], ["A", partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]]);
                            for (let i = 0; i < cArray.length; i++) {
                                coords.push([[cArray[i][1], cArray[i][2]], [cArray[i][3], cArray[i][4]], [cArray[i][5], cArray[i][6]]]);
                                commands.push("C");
                            }
                            lastPoint = [lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]];
                        }
                        continue;
                    } else {
                        // 通过计算椭圆的中心点、起始角度、终止角度等参数绘制椭圆弧
                        let tc = [];
                        for (let m = 1; m < partArr.length; m += 7) {
                            // 根据svg椭圆曲线参数计算canvas椭圆参数
                            let args = svgArcToCenterParam(lastPoint[0], lastPoint[1], partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]);

                            // Ellipse 椭圆参数
                            let [x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle] =
                                [args.cx, args.cy, partArr[m], partArr[m + 1], partArr[m + 2], args.startAngle, args.endAngle, !args.clockwise, args.deltaAngle];

                            // 添加至子对象，让Path绘制椭圆曲线
                            startAngle = MathUtil.toDegrees(startAngle);
                            endAngle = MathUtil.toDegrees(endAngle);
                            childGeometrys.push(new Ellipse({ x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle }));
                            
                            tc.push([partArr[m + 5], partArr[m + 6]]);   // 终止点
                            lastPoint = [lastPoint[0] + partArr[m + 5], lastPoint[1] + partArr[m + 6]];
                        }
                        coords.push(tc);
                    }
                    break;
                case "A": // 椭圆曲线， 绝对位置   (rx ry angle large-arc-flag sweep-flag x y)+
                    if (this.drawEllipseArcStyle === 1) {
                        // 通过换算为贝塞尔曲线，绘制椭圆弧
                        for (let m = 1; m < partArr.length; m += 7) {
                            let cArray = fromArcToBeziers(lastPoint[0], lastPoint[1], ["A", partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], partArr[m + 5], partArr[m + 6]]);
                            for (let i = 0; i < cArray.length; i++) {
                                coords.push([[cArray[i][1], cArray[i][2]], [cArray[i][3], cArray[i][4]], [cArray[i][5], cArray[i][6]]]);
                                commands.push("C");
                            }
                            lastPoint = [partArr[m + 5], partArr[m + 6]];
                        }
                        continue;
                    } else {
                        // 通过计算椭圆的中心点、起始角度、终止角度等参数绘制椭圆弧
                        let tc = [];
                        for (let m = 1; m < partArr.length; m += 7) {
                            // 根据svg椭圆曲线参数计算canvas椭圆参数
                            let args = svgArcToCenterParam(lastPoint[0], lastPoint[1], partArr[m], partArr[m + 1], partArr[m + 2],
                                partArr[m + 3], partArr[m + 4], partArr[m + 5], partArr[m + 6]);

                            // Ellipse 椭圆参数
                            let [x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle] =
                            [args.cx, args.cy, partArr[m], partArr[m + 1], partArr[m + 2], args.startAngle, args.endAngle, !args.clockwise, args.deltaAngle];

                            // 添加至子对象，让Path绘制椭圆曲线
                            startAngle = MathUtil.toDegrees(startAngle);
                            endAngle = MathUtil.toDegrees(endAngle);
                            childGeometrys.push(new Ellipse({ x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise, deltaAngle }));
                            
                            tc.push([partArr[m + 5], partArr[m + 6]]);   // 终止点
                            lastPoint = [partArr[m + 5], partArr[m + 6]];
                        }
                        coords.push(tc);
                    }
                    break;
                case "Z":
                case "z":
                    coords.push(coords[0]);
                    c_lastControlPoint = [0, 0];
                    q_lastControlPoint = [0, 0];
                    break;
                default:
                    console.info("unsupport path command: %s", cmd)
                    continue;
            }
            commands.push(cmd);
        }

        // console.info({ commands, coords, childGeometrys });
        return { commands, coords, childGeometrys };
    }

}

// 椭圆弧绘制方式：2椭圆，1贝塞尔曲线
SvgPath.drawEllipseArcStyle = 1;


// 路径数据的语法
// SVG路径数据与以下EBNF语法匹配。
// EBNF grammar是指扩展巴科斯-诺尔范式（Extended Backus-Naur Form），它是一种用于描述上下文无关文法（Context-Free Grammar）的扩展形式。
// svg_path::= wsp* moveto? (moveto drawto_command*)?
/*
drawto_command::=
    moveto
    | closepath
    | lineto
    | horizontal_lineto
    | vertical_lineto
    | curveto
    | smooth_curveto
    | quadratic_bezier_curveto
    | smooth_quadratic_bezier_curveto
    | elliptical_arc

moveto::=
    ( "M" | "m" ) wsp* coordinate_pair_sequence

closepath::=
    ("Z" | "z")

lineto::=
    ("L"|"l") wsp* coordinate_pair_sequence

horizontal_lineto::=
    ("H"|"h") wsp* coordinate_sequence

vertical_lineto::=
    ("V"|"v") wsp* coordinate_sequence

curveto::=
    ("C"|"c") wsp* curveto_coordinate_sequence

curveto_coordinate_sequence::=
    coordinate_pair_triplet
    | (coordinate_pair_triplet comma_wsp? curveto_coordinate_sequence)

smooth_curveto::=
    ("S"|"s") wsp* smooth_curveto_coordinate_sequence

smooth_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? smooth_curveto_coordinate_sequence)

quadratic_bezier_curveto::=
    ("Q"|"q") wsp* quadratic_bezier_curveto_coordinate_sequence

quadratic_bezier_curveto_coordinate_sequence::=
    coordinate_pair_double
    | (coordinate_pair_double comma_wsp? quadratic_bezier_curveto_coordinate_sequence)

smooth_quadratic_bezier_curveto::=
    ("T"|"t") wsp* coordinate_pair_sequence

elliptical_arc::=
    ( "A" | "a" ) wsp* elliptical_arc_argument_sequence

elliptical_arc_argument_sequence::=
    elliptical_arc_argument
    | (elliptical_arc_argument comma_wsp? elliptical_arc_argument_sequence)

elliptical_arc_argument::=
    number comma_wsp? number comma_wsp? number comma_wsp
    flag comma_wsp? flag comma_wsp? coordinate_pair

coordinate_pair_double::=
    coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_triplet::=
    coordinate_pair comma_wsp? coordinate_pair comma_wsp? coordinate_pair

coordinate_pair_sequence::=
    coordinate_pair | (coordinate_pair comma_wsp? coordinate_pair_sequence)

coordinate_sequence::=
    coordinate | (coordinate comma_wsp? coordinate_sequence)

coordinate_pair::= coordinate comma_wsp? coordinate

coordinate::= sign? number

sign::= "+"|"-"
number ::= ([0-9])+
flag::=("0"|"1")
comma_wsp::=(wsp+ ","? wsp*) | ("," wsp*)
wsp ::= (#x9 | #x20 | #xA | #xC | #xD)
*/


/**
 * SVG Path节点中d属性语法分析(来源SVG.js，目前为止兼容性最强)
 */
let svgPathParse = (function () {
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

    class __Point {  
        constructor(x, y) {  
            const base = { x: 0, y: 0 }
    
            // ensure source as object
            const source = Array.isArray(x) ? { x: x[0], y: x[1] } : typeof x === 'object' ? { x: x.x, y: x.y } : { x: x, y: y }
    
            // merge source
            this.x = source.x == null ? base.x : source.x
            this.y = source.y == null ? base.y : source.y
        }  
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
            p0: new __Point(),
            p: new __Point()
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
 * SVG Path节点中d属性语法分析（兼容性相对较弱）
 */
let pathParse = (function () {
    // 移除数组中的空白元素，处理一个数值中包含多个小数点的数值，例如“23.135.85”
    function coordParse(str) {
        let arr = str.split(/([MLHVCSQTAZmlhvcsqtaz ,])/);

        // 使用filter方法过滤掉值为空格和逗号的元素  
        var arr2 = arr.filter(function (value) {
            return value !== " " && value !== "," && value !== "";
        });

        // 逐个数值中检查是否包含多个小数点的数值，例如“23.135.85”
        let nonStandard = false;
        for (let m = 0; m < arr2.length; m++) {
            let str = arr2[m];
            let idx = [];
            for (let i = 0; i < str.length; i++) {
                if (str.substring(i, i + 1) == ".") {
                    idx.push(i);
                    nonStandard = true;
                }
            }
            for (let i = idx.length - 1; i > 0; i--) {
                str = str.substring(0, idx[i]) + " " + str.substring(idx[i]);
            }
            arr2[m] = str;
        }
        arr2 = arr2.join(" ").split(" ");

        // 处理整数部分连续多个零的数值
        if (nonStandard === true) {
            for (let m = 0; m < arr2.length; m++) {
                let str = arr2[m];
                let idx = [];
                if (str.substring(0, 1) === "0" && str.length > 1) {
                    if (str.substring(1, 2) != ".") {
                        for (let i = 1; i < str.length; i++) {
                            idx.push(i);
                            let chat = str.substring(i, i + 1);
                            if (chat == ".") {
                                break;
                            } else if (parseInt(chat) > 0 && str.substring(i + 1, i + 2) === ".") {
                                break;
                            }
                        }
                        for (let i = idx.length - 1; i >= 0; i--) {
                            str = str.substring(0, idx[i]) + " " + str.substring(idx[i]);
                        }
                    }

                    arr2[m] = str;
                }
            }
        }
        arr2 = arr2.join(" ").split(" ");

        let list = [];
        for (let i = 0; i < arr2.length; i++) {
            list.push(i == 0 ? arr2[i] : parseFloat(arr2[i]));
        }
        return list;
    }

    return function (pathString) {
        let regCommand = /(?=[MLHVCSQTAZmlhvcsqtaz])/;
        let strSegments = pathString.split(regCommand).filter(Boolean);
        let list = [];

        for (let i = 0; i < strSegments.length; i++) {
            let seg = strSegments[i].replaceAll(/e\-/g, "ee").replaceAll(/\-/g, " -");
            list.push(coordParse(seg));
        }
        return list;
    }
}());

/**
 * 分析Path节点中的d属性 (来源fabric.js，兼容性较强，解析个别SVG时存在错误)
 */
let fabricPathParse = (function () {
    let rePathCommand = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:[eE][-+]?\d+)?)/ig;
    let commaWsp = '(?:\\s+,?\\s*|,\\s*)';

    let commandLengths = {
        m: 2,
        l: 2,
        h: 1,
        v: 1,
        c: 6,
        s: 4,
        q: 4,
        t: 2,
        a: 7
    },
        repeatedCommands = {
            m: 'l',
            M: 'L'
        };

    /**
     *  分析Path节点中的d属性 (来源fabric.js)
     * @param {string} pathString
     * @return {Array} An array of SVG path commands
     * @example <caption>Usage</caption>
     * parsePath('M 3 4 Q 3 5 2 1 4 0 Q 9 12 2 1 4 0') === [
     *   ['M', 3, 4],
     *   ['Q', 3, 5, 2, 1, 4, 0],
     *   ['Q', 9, 12, 2, 1, 4, 0],
     * ];
     *
     */
    return function (pathString) {
        var result = [],
            coords = [],
            currentPath,
            parsed,
            re = rePathCommand,
            rNumber = '[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?\\s*',
            rNumberCommaWsp = '(' + rNumber + ')' + commaWsp,
            rFlagCommaWsp = '([01])' + commaWsp + '?',
            rArcSeq = rNumberCommaWsp + '?' + rNumberCommaWsp + '?' + rNumberCommaWsp + rFlagCommaWsp + rFlagCommaWsp + rNumberCommaWsp + '?(' + rNumber + ')',
            regArcArgumentSequence = new RegExp(rArcSeq, 'g'),
            match,
            coordsStr,
            path;
        if (!pathString || !pathString.match) {
            return result;
        }
        path = pathString.match(/[mzlhvcsqta][^mzlhvcsqta]*/gi);

        for (var i = 0, coordsParsed, len = path.length; i < len; i++) {
            currentPath = path[i];

            coordsStr = currentPath.slice(1).trim();
            coords.length = 0;

            var command = currentPath.charAt(0);
            coordsParsed = [command];

            if (command.toLowerCase() === 'a') {
                // arcs have special flags that apparently don't require spaces so handle special
                for (var args; (args = regArcArgumentSequence.exec(coordsStr));) {
                    for (var j = 1; j < args.length; j++) {
                        coords.push(args[j]);
                    }
                }
            } else {
                while ((match = re.exec(coordsStr))) {
                    coords.push(match[0]);
                }
            }

            for (var j = 0, jlen = coords.length; j < jlen; j++) {
                parsed = parseFloat(coords[j]);
                if (!isNaN(parsed)) {
                    coordsParsed.push(parsed);
                }
            }

            var commandLength = commandLengths[command.toLowerCase()],
                repeatedCommand = repeatedCommands[command] || command;

            if (coordsParsed.length - 1 > commandLength) {
                for (var k = 1, klen = coordsParsed.length; k < klen; k += commandLength) {
                    result.push([command].concat(coordsParsed.slice(k, k + commandLength)));
                    command = repeatedCommand;
                }
            }
            else {
                result.push(coordsParsed);
            }
        }

        return result;
    };
}())

export default SvgPath;


//let pathString = "M11.908.183a12.012 12.012 0 00-8.044 3.172c-4.882 4.475-5.166 12.08-.692 16.962.204.244.448.447.692.692a.315.315 0 00.408-.04l.53-.61a.32.32 0 000-.448C.53 15.965.243 9.253 4.23 4.982 8.217.711 14.889.427 19.16 4.414c4.271 3.986 4.555 10.655.568 14.927-.203.203-.365.407-.568.57a.32.32 0 000 .447l.53.611a.37.37 0 00.446.04c4.882-4.516 5.166-12.081.692-16.962a11.98 11.98 0 00-8.92-3.864zm.387 3.518A8.607 8.607 0 006.143 6c-3.458 3.213-3.66 8.623-.447 12.08.122.123.243.285.406.407a.319.319 0 00.447 0l.53-.61a.32.32 0 000-.446A7.263 7.263 0 014.8 12.183c0-3.946 3.212-7.16 7.158-7.16s7.16 3.253 7.16 7.199a7.207 7.207 0 01-2.238 5.209.319.319 0 000 .447l.529.61c.122.121.325.162.447.04a8.599 8.599 0 00.408-12.122 8.494 8.494 0 00-5.97-2.705zm-.266 3.316A5.198 5.198 0 008.34 8.48c-2.075 1.993-2.115 5.247-.122 7.322l.121.123a.319.319 0 00.447 0l.53-.611a.32.32 0 000-.448 3.814 3.814 0 01-1.098-2.683 3.732 3.732 0 013.742-3.742 3.732 3.732 0 013.742 3.742c0 1.017-.406 1.951-1.139 2.683a.32.32 0 000 .448l.53.61a.32.32 0 00.447 0c2.034-1.992 2.116-5.246.123-7.321a5.128 5.128 0 00-3.633-1.586zm.006 7.744a.599.599 0 00-.402.146l-.04.041-7.159 8.055a.506.506 0 00.041.69.437.437 0 00.283.124h14.36a.495.495 0 00.489-.488.463.463 0 00-.121-.326l-7.08-8.055a.5.5 0 00-.37-.187z";
//let pathString = "A8.607 8.607 0 006.143 6";
//let pathString = "M11.908.183a12.012 12.012 0 00-8.044 3.172c-4.882 4.475-5.166 12.08-.692 16.962.204.244.448.447.692.692a.315.315 0 00.408-.04l.53-.61a.32.32 0 000 .447";
//let pathString = "M39.502,61.823c-1.235-0.902-3.038-3.605-3.038-3.605s0.702,0.4,3.907,1.203  c3.205,0.8,7.444-0.668,10.114-1.97c2.671-1.302,7.11-1.436,9.448-1.336c2.336,0.101,4.707,0.602,4.373,2.036  c-0.334,1.437-5.742,3.94-5.742,3.94s0.4,0.334,1.236,0.334c0.833,0,6.075-1.403,6.542-4.173s-1.802-8.377-3.272-9.013  c-1.468-0.633-4.172,0-4.172,0c4.039,1.438,4.941,6.176,4.941,6.176c-2.604-1.504-9.279-1.234-12.619,0.501  c-3.337,1.736-8.379,2.67-10.083,2.503c-1.701-0.167-3.571-1.036-3.571-1.036c1.837,0.034,3.239-2.669,3.239-2.669  s-2.068,2.269-5.542,0.434c-3.47-1.837-1.704-8.18-1.704-8.18s-2.937,5.909-1,9.816C34.496,60.688,39.502,61.823,39.502,61.823z   M77.002,40.772c0,0-1.78-5.03-2.804-8.546l-1.557,8.411l1.646,1.602c0,0,0-0.622-0.668-1.691  C72.952,39.48,76.513,40.371,77.002,40.772z M102.989,86.943 M102.396,86.424c0.25,0.22,0.447,0.391,0.594,0.519  C102.796,86.774,102.571,86.578,102.396,86.424z M169.407,119.374c-0.09-5.429-3.917-3.914-3.917-2.402  c0,0-11.396,1.603-13.086-6.677c0,0,3.56-5.43,1.69-12.461c-0.575-2.163-1.691-5.337-3.637-8.605  c11.104,2.121,21.701-5.08,19.038-15.519c-3.34-13.087-19.63-9.481-24.437-9.349c-4.809,0.135-13.486-2.002-8.011-11.618  c5.473-9.613,18.024-5.874,18.024-5.874c-2.136,0.668-4.674,4.807-4.674,4.807c9.748-6.811,22.301,4.541,22.301,4.541  c-3.097-13.678-23.153-14.636-30.041-12.635c-4.286-0.377-5.241-3.391-3.073-6.637c2.314-3.473,10.503-13.976,10.503-13.976  s-2.048,2.046-6.231,4.005c-4.184,1.96-6.321-2.227-4.362-6.854c1.96-4.627,8.191-16.559,8.191-16.559  c-1.96,3.207-24.571,31.247-21.723,26.707c2.85-4.541,5.253-11.93,5.253-11.93c-2.849,6.943-22.434,25.283-30.713,34.274  s-5.786,19.583-4.005,21.987c0.43,0.58,0.601,0.972,0.62,1.232c-4.868-3.052-3.884-13.936-0.264-19.66  c3.829-6.053,18.427-20.207,18.427-20.207v-1.336c0,0,0.444-1.513-0.089-0.444c-0.535,1.068-3.65,1.245-3.384-0.889  c0.268-2.137-0.356-8.549-0.356-8.549s-1.157,5.789-2.758,5.61c-1.603-0.179-2.493-2.672-2.405-5.432  c0.089-2.758-1.157-9.702-1.157-9.702c-0.8,11.75-8.277,8.011-8.277,3.74c0-4.274-4.541-12.82-4.541-12.82  s2.403,14.421-1.336,14.421c-3.737,0-6.944-5.074-9.879-9.882C78.161,5.874,68.279,0,68.279,0  c13.428,16.088,17.656,32.111,18.397,44.512c-1.793,0.422-2.908,2.224-2.908,2.224c0.356-2.847-0.624-7.745-1.245-9.882  c-0.624-2.137-1.159-9.168-1.159-9.168c0,2.67-0.979,5.253-2.048,9.079c-1.068,3.828-0.801,6.054-0.801,6.054  c-1.068-2.227-4.271-2.137-4.271-2.137c1.336,1.783,0.177,2.493,0.177,2.493s0,0-1.424-1.601c-1.424-1.603-3.473-0.981-3.384,0.265  c0.089,1.247,0,1.959-2.849,1.959c-2.846,0-5.874-3.47-9.078-3.116c-3.206,0.356-5.521,2.137-5.698,6.678  c-0.179,4.541,1.869,5.251,1.869,5.251c-0.801-0.443-0.891-1.067-0.891-3.473c0-2.402,2.492-1.423,2.492-1.423  c-0.089,4.54,2.672,4.452,2.672,4.452c-0.98-2.674-0.712-4.187,3.561-4.008c4.273,0.177,5.429,7.123,5.518,9.079  c0.091,1.96-1.157,3.029-2.669,3.917c-1.515,0.892-2.938,2.228-5.432,2.049c-2.492-0.177-1.69-4.986-1.69-4.986  c-3.028,1.96-1.692,5.7-1.692,5.7c-1.869-0.18-2.227-3.028-2.227-3.028c-0.889,1.692-0.8,4.361-0.177,5.429  c0.622,1.069-0.533,3.562-0.533,3.562s1.601-0.445,1.601-1.247s1.068-1.871,1.068-1.871s-0.356,1.604-0.089,2.672  c0.268,1.069-1.512,1.603-1.512,1.603c2.937,0.979,5.342-2.493,6.587-4.185c0.794-1.077,5.074-3.804,8.087-5.65l0.214,0.353  c2.603-0.401,4.941-1.336,4.607,0.601s-0.867,2.67-4.206,4.408c-3.146,1.635-9.545,6.532-11.284,13.681l-0.001-0.061  c-0.12,0.213-0.409,1.153-0.706,2.568c-0.839-0.1-2.799,0.303-5.257,5.02c-3.293,6.321-0.98,9.081,0.179,10.148  c0.496,0.46,1.144,1.167,1.72,1.825c-1.119-0.958-3.014-2.033-6.082-2.358c-5.875-0.622-9.614-0.624-11.306-2.672  c-1.692-2.045-4.184-2.759-5.788-1.423c-1.601,1.336-5.963,3.473-8.011,3.473s-5.342-1.159-7.657-2.226  c-2.313-1.071-3.56,1.512-3.56,1.512s-0.979-0.179-3.205-0.179c-2.225,0-3.472,2.137-3.472,2.137S0,99.169,0,102.016  c0,2.85,2.493,3.027,2.493,3.027s-2.849-3.027,3.026-4.986c0,0,1.603,1.246,3.828,1.246s2.76,0,2.76,0s-1.069,1.336-0.889,2.316  c0.177,0.979-3.205,2.403-1.871,5.696c0,0,1.96-3.65,3.116-3.026c1.157,0.624,2.76,0.09,3.649-0.712  c0.892-0.801,5.164-2.582,8.013-2.493c0.157,0.006,0.293,0.01,0.419,0.016c0.299,0.446,1.721,2.255,5.457,2.565  c4.273,0.357,3.738,2.581,2.314,3.472s-2.76,1.157-2.76,1.157s4.985,0.445,5.698-1.958c0.712-2.402,0.445-7.298-3.294-6.677  c-3.738,0.626-4.273,0.356-4.718-0.445c-0.444-0.798,0-1.067,2.76-1.333c2.76-0.267,5.609-0.355,8.19,2.047  c2.583,2.403,10.862,7.123,15.845,7.123c4.984,0,6.41,0.71,6.41,0.71s-0.158-3.636,0.908-3.586c0.669,0.693,1.409,1.342,2.253,1.918  c2.695,1.785,4.096,2.5,4.824,2.77c-0.926,1.025-1.909,2.373-2.688,4.107c-2.071,4.605-9.415,12.686-10.883,13.755  c-1.468,1.066-3.539,0.466-3.539,0.466s0.2,1.002,0.803,1.069c0.601,0.067-3.738,0.867-5.007,0.067  c-1.269-0.803-3.406-2.004-4.207-3.141c-0.801-1.134-2.537,0.334-2.67,1.269s-0.133,0.935-0.133,0.935s-2.672-1.066-3.606-2.136  s-4.874-1.535-5.941,0.067c-0.475,0.709-0.501,0.935-0.385,0.964c-1.024,0.519-3.22,2.004-3.22,5.177  c0,4.14,2.536,5.145,2.536,5.145s-2.67-3.006,1.937-7.213c0,0,0.268,1.603,2.871,1.67s6.343,1.67,6.343,1.67  s-4.474-0.671-5.542,3.27c-1.068,3.938,2.537,6.876,2.537,6.876s-1.803-5.007,1.203-6.741c0,0,0.867,2.335,5.607,2.335  s6.943-4.673,11.685-4.673c4.74,0,4.003,3.006,7.409,3.006s4.608-2.206,4.608-0.536c0,1.673-0.335,2.136-0.335,2.136  s3.141-1.066,2.539-4.805c-0.601-3.741-4.808-3.606-6.075-2.537c-1.27,1.066-4.409-0.601-3.139-1.737  c1.269-1.134,2.536-0.132,2.536-0.132s0.604-2.604,2.604-3.806c2.004-1.204,11.418-10.617,14.423-12.284  c1.198-0.668,2.121-1.403,2.808-2.054c1.991,0.305,9.088,1.251,11.3-0.352c0,0,7.123,0.179,8.459-2.405c0,0,4.628-0.267,6.053-2.314  c1.256-1.808,4.937-3.402,5.785-3.754c0.129,1.674-0.87,7.07-1.868,9.941c-1.069,3.073,2.804,7.567,4.051,9.926  c1.246,2.358,0.622,3.428-0.624,5.165c-1.245,1.734-5.741,7.21-9.791,7.21c-4.052,0-4.72-4.494-6.143-4.494  c-1.424,0-1.826,2.402-1.826,2.402s-3.027-3.56-5.341-3.56c-2.312,0-2.805,1.022-2.805,1.022  c-7.565,1.737-6.097,10.014-6.097,10.014c0-2.716,3.382-6.363,4.408-6.586c1.022-0.226,1.868-0.401,2.492,0.621  c0.543,0.896,3.8,0.973,4.62,0.981c-0.421,0.041-1.531,0.384-3.151,2.625c-2.093,2.891-0.268,6.143-0.268,6.143  c-0.267-2.891,3.205-3.471,5.432-3.295c2.225,0.178,7.432-0.354,8.144-0.979c0.714-0.621,2.894-0.935,3.738,0.047  c0.847,0.975,6.679,0.442,9.437,1.156c2.76,0.713,1.068,3.871,1.068,3.871s4.362-1.646,4.362-4.45s-3.383-6.275-5.341-5.074  c-1.96,1.201-4.897,1.512-4.897,1.512c0-2.355,8.947-10.904,10.729-11.616c1.78-0.712,2.492-3.205,1.068-4.052  c-1.424-0.844-2.314-2.355-2.314-6.407c0-3.604,4.849-8.324,5.922-10.267c2.562,6.265,8.915,17.922,18.916,17.922  c12.105,0,15.489,3.205,16.111,6.053c0.623,2.848,0.267,6.943-3.561,6.943c-3.828,0-4.807-2.848-8.724-2.848  c-2.049-0.179-2.139,1.336-2.139,1.336s-5.072-0.803-6.141,6.853c0,0,2.671-3.114,5.964-2.669c3.294,0.445,2.227,1.957,6.054,1.957  c0,0-5.163,4.362,0.712,8.37c0,0-1.425-3.742,1.512-3.742c2.938,0,1.069,0.713,4.364,0.713c3.293,0,7.834-5.071,8.101-9.079  c0,0,1.87,3.026,3.115,3.026C174.392,140.918,169.496,126.053,169.407,119.374z M58.93,45.222c-1.156,0-2.134-1.157-0.177-1.336  c2.32-0.211,4.005,2.493,4.005,2.493S60.089,45.222,58.93,45.222z M151.469,68.1c2.537,0,2.804,2.136,2.804,2.136  c3.071-4.673,9.882,0.267,9.08,0.668c-0.801,0.4,0.132,1.871-0.801,1.871c-0.935,0-1.201,1.202-1.201,1.202s2.002-0.134,2.002,0.801  s1.736,0.667,1.736,0.667c-0.135,6.01-3.872,7.078-3.872,7.078s0.267-2.004-0.936-1.869c-1.201,0.132-1.335-2.672-1.335-2.672  c-1.735,0.536-0.135,2.938-1.603,3.073c-1.469,0.132-1.069,2.804-1.069,2.804s-4.138,0-6.141-0.267  c-2.004-0.269-2.405-1.604-2.137-2.271c0.267-0.668-0.802-1.471-0.535-2.139c0.267-0.665,1.603-1.467,1.603-1.467  s2.804,0.131-0.135-0.534c-2.936-0.667-2.936,1.735-4.271,1.867c-1.09,0.11-1.639,1.273-1.808,1.701  c-1.791-1.301-3.844-2.422-6.183-3.274c0.247-1.129-0.703-0.895-0.822-2.432c-0.133-1.736,1.468-2.938,1.468-2.938  c-2.537,0-4.406,2.537-4.406,2.537c-1.17,0-1.767,0.923-2.005,1.421c-2.595-0.352-5.466-0.388-8.63-0.048  c3.038-2.167,6.986-2.485,6.986-2.485s-5.253-0.624-3.384-5.697c1.23-3.337,4.876-5.78,7.234-7.068l0.066,0.39  C135.846,69.436,148.93,68.1,151.469,68.1z M96.691,77.988c0.036,0.436-0.082,0.913-0.485,1.399  C96.432,78.702,96.571,78.262,96.691,77.988z M68.724,51.365c0.623,0.536,1.601-0.624,3.472,0.355  c1.869,0.98,3.917-0.533,3.917-0.533l-3.116-2.851c-2.493,1.603-4.185-2.046-2.849-3.024c1.334-0.98,2.493-2.404,3.738-1.159  c1.247,1.247-0.267,3.562-0.267,3.562l2.761,2.492c-0.268-1.512,1.868-2.404,1.868-2.404s0.303,0.251,0.817,0.778  c-0.442-0.144-0.729-0.245-0.729-0.245s-1.78,0.445-1.068,1.959c0.713,1.515-3.826,3.293-5.073,1.872  c-0.923-1.055-2.626,0.334-3.328-0.56c-0.015-0.018-0.132-0.166-0.297-0.371L68.724,51.365z M68.544,61.196  c0.385-0.237,0.744-0.454,1.08-0.658C69.102,61.035,68.762,61.201,68.544,61.196z M55.283,107.625  c-8.012-0.355-17.005-7.744-17.005-7.744c9.615,6.677,17.983,6.853,17.983,6.853L55.283,107.625z M68.279,89.199  c0,0-2.08,2.858-1.627,8.056c-0.193,6.951,1.627,9.503,1.627,9.503c-1.469-2.07-3.004-2.403-3.004-2.403s1,0.734,2.068,1.804  c0.36,0.359,0.628,1.057,0.828,1.819c-2.052-0.691-7.307-2.997-9.173-8.965c0,0,1.403,3.273,7.345,1.404  c0,0-5.742,0.865-7.478-3.873c0,0,4.875,1.268,7.21,0c0,0-6.81,0.332-8.212-2.539c-1.402-2.869-0.734-3.738-0.734-3.738  s3.072,3.203,7.879,2.669c0,0-7.813-2.201-7.478-6.476c0.059-0.764,0.113-1.345,0.16-1.796c1.162,4.447,7.213,3.656,8.786,3.599  c0,0-10.214,0.267-7.611-8.745c0,0,0.199,3.005,6.41,3.14c0,0-3.004-0.27-4.607-2.739c-1.604-2.47-0.4-4.137,0.869-5.941  c0,0,0.734,3.472,4.538,4.072c0,0-2.735-1.936-3.337-4.072c-0.601-2.138,1.537-2.872,1.537-2.872s1.267,3.206,3.738,3.271  c0,0-3.205-2.402-2.738-4.273c0.467-1.869,2.137-1.535,2.137-1.535s0.533,2.804,2.402,3.07c0,0-2.738-2.738-0.869-4.271  c1.871-1.535,1.67,0.734,3.272,1.134c0,0-2.404-2.871,1-3.806c3.406-0.933,0.601,3.272,0.601,3.272s5.476-2.67,4.942-6.611  c-0.417-3.066-4.626-2.931-7.261-1.938l0.073-0.042c-1.736-0.788-1.934-3.319-1.956-5.001c0.103,0.328,0.174,0.62,0.174,0.819  c0,1.422,1.159,2.936,2.314,3.737c0,0-0.091-1.157,2.492-0.801c2.584,0.357,4.986,1.515,4.897,3.652s-2.227,6.05-6.231,9.437  c-3.74,3.157-7.865,8.798-5.429,16.121c0.308-0.307,0.646-0.582,1.03-0.846c1.075-0.733,2.017-1.396,3.287-1.772  c0.319-0.094,0.647-0.164,0.984-0.227l0.346-0.305l0.004,0.001c0,0,2.035,0.105,4.104,0.441  C71.923,84.294,68.279,89.199,68.279,89.199z M71.288,108.398l-0.023,0.013l0.01-0.009L71.288,108.398z M79.138,111.809  c-0.533,1.781-11.571,13.175-16.201,15.58c-4.629,2.402-5.518,4.717-5.518,4.717s-0.801-2.224,3.826-4.808  c4.63-2.578,15.668-13.529,16.292-16.559c0.624-3.024-1.78-2.76-1.78-2.76s3.472-0.8,4.361-10.235c0,0,0.356,8.1-2.225,10.057  C77.893,107.801,79.674,110.028,79.138,111.809z M78.604,79.672c0,0-2.581-0.179,0.356-3.203c2.938-3.028,4.808-5.697,4.986-4.987  c0.177,0.712,1.512,1.336,2.225,0.445c0,0-2.048-1.422-0.267-4.273c1.78-2.849,5.162-11.751,2.226-15.845  c-2.939-4.095,0.445-4.095,0.445-4.095s-1.67-0.268-2.664,0.222l-0.007-0.044c-0.434-1.406,0.217-2.382,0.796-2.935  c0.039,0.743,0.071,1.476,0.086,2.19c0.226-0.028,0.469-0.043,0.743-0.043c0.618,0,1.11,0.078,1.132,0.081  c0.274,0.045,0.469,0.293,0.445,0.571c-0.021,0.276-0.253,0.489-0.531,0.489c-0.009,0-0.796,0.021-1.031,0.481  c-0.122,0.234-0.266,0.978,1.02,2.771c3.07,4.28-0.287,13.369-2.206,16.439c-0.27,0.432-0.441,0.819-0.54,1.167l1.155,0.996  c0,0,3.205,0.936,3.205,3.338c0,1.229,2.506,2.593,4.961,3.638c-1.497,0.256-5.525,0.502-7.834,0.502  C84.903,77.581,83.389,80.164,78.604,79.672z M88.111,96.574c-0.803-2.489-1.91-5.395-3.557-7.717  c0.703-1.322,1.883-2.758,3.844-3.396c4.095-1.336,5.876,2.758,5.876,2.758s4.984-4.539,7.834-2.048c0,0,1.246-4.184,5.963-3.293  c0,0-0.712-0.801-0.8-2.76c-0.091-1.958,1.155-3.027,4.094-3.114c0,0-3.026-3.206-0.267-4.453c2.759-1.247,5.429-2.49,5.429-2.49  s-2.581-0.535-2.493-2.672c0.09-2.137,2.138-4.986,7.213-6.233c0,0-3.027-0.979-3.027-2.848c0-1.871,3.206-5.162,6.231-6.676  c0,0-4.005,0.179-4.362-1.869c-0.356-2.047,3.65-6.677,6.32-7.834c0,0-2.848-0.98-2.136-3.828c0.693-2.773,6.444-7.991,6.752-8.266  c-0.289,0.259-4.795,4.269-4.795,1.857c0,0,14.868-18.34,16.558-20.12c0,0-5.25,8.367-5.073,13.087  c0.179,4.717,5.073,4.629,7.745,2.492c0,0-5.519,7.745-7.033,9.614c-1.513,1.871-1.601,7.211,2.404,7.388  c0,0-10.95,6.588-7.033,15.045c0,0-8.546,3.56-9.17,9.526c-0.71,3.204,1.603,4.094,1.603,4.094s-5.963,2.225-7.565,5.965  c-1.603,3.738-0.357,7.834-0.357,7.834s-9.079-1.336-9.524,6.852c0,0-8.636-1.156-9.614,3.65  C99.169,97.12,92.877,91.751,88.111,96.574z M113.77,103.084c-1.96,1.514-2.138-1.246-2.138-1.246s-1.246,3.426-2.672,4.852  c-1.424,1.425-2.937-0.046-2.67-1.646c0,0-1.336,2.937-3.381,3.829c-2.048,0.889-3.917,0.089-3.384-1.514  c0,0-1.069,1.868-3.384,3.025c-1.708,0.856-2.783,0.06-3.123-0.738c5.446-1.295,11.852-5.88,15.498-7.096  c2.468-0.82,4.749-3.381,7.181-5.243C115.606,98.801,115.24,101.948,113.77,103.084z M116.427,99.315  c-0.116-1.029-0.301-1.763-0.454-2.219c1.053-0.775,2.136-1.406,3.276-1.694C118.78,97.944,117.2,98.965,116.427,99.315z   M120.178,97.078c0.152-0.521,0.184-1.16,0.146-1.837c0.943-0.05,1.929,0.155,2.969,0.725c0.233,0.125,0.441,0.26,0.656,0.391  C122.583,99.641,119.519,99.317,120.178,97.078z M127.39,100.417c-1.47-1.336-2.806-2.096-2.895-2.982  c-0.018-0.187,0.053-0.402,0.156-0.621c1.67,1.161,2.797,2.467,3.548,3.664c0.16,0.473,0.304,0.916,0.433,1.328  C128.24,101.29,127.817,100.803,127.39,100.417z M166.358,122.916c-0.068-2.136-0.602-1.201-2.271-1.201s-12.352-1.939-16.558-6.876  c-4.205-4.943-8.479-19.097-10.615-24.104c-2.138-5.009-13.688-5.874-13.688-5.874s11.617-0.202,14.755,5.739  c3.138,5.944,5.408,22.033,12.887,25.974c7.478,3.94,13.352,3.539,13.352,3.539s1.937-1.336,2.672,1.134  c0.734,2.47,0.535,5.007,1.068,6.741C167.96,127.987,166.423,125.051,166.358,122.916z";
// let pathString = "M3.5,6  A8.607 8.607 0 006.143 6";

// let rtn = pathParser(pathString);
// for (let j = 0, jj = rtn.length; j < jj; j += 1) {
//     let partArr = rtn[j]
//       console.info(partArr.length + ":" + partArr.join("/"))
// }
// console.info("----------------")

// rtn = pathParser(pathString, false);
// for (let j = 0, jj = rtn.length; j < jj; j += 1) {
//     let partArr = rtn[j]
//       console.info(partArr.length + ":" + partArr.join("/"))
// }
