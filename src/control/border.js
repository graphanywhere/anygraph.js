import Collide from "../spatial/collide.js";
import Cursor from "../util/cursor.js";
// import { GGShapeType } from "../geom/geometry.js"; // Circular dependencies error
import Transform from "../spatial/transform.js";
import Coordinate from "../spatial/coordinate.js";

/**
 * 缺省控制点属性 <br>
 *   tl(1)  mt(2) tr(3)  <br>
 *   ml(4) mid(5) mr(6)  <br>
 *   bl(7)  mb(8) br(9)
 */
const defaultCtrlBorderProp = {
    "ml": {    // middle left
        cmd: 4,
        cursor: Cursor.E_RESIZE
    },
    "mr": {    // middle right
        cmd: 6,
        cursor: Cursor.W_RESIZE
    },
    "mb": {    // middle buttom
        cmd: 8,
        cursor: Cursor.S_RESIZE
    },
    "mt": {     // middle top
        cmd: 2,
        cursor: Cursor.N_RESIZE
    },
    "tl": {    // top left
        cmd: 1,
        cursor: Cursor.NW_RESIZE
    },
    "tr": {    // top right
        cmd: 3,
        cursor: Cursor.NE_RESIZE
    },
    "bl": {    // bottom left
        cmd: 7,
        cursor: Cursor.SW_RESIZE
    },
    "br": {    // bottom right
        cmd: 9,
        cursor: Cursor.SE_RESIZE
    },
    "mid": {    // middle
        cmd: 5,
        cursor: Cursor.MOVE
    }
}

/**
 * 边框对象
 */
class GeomBorder {
    constructor(size) {
        /**
         * 控制点
         */
        this.controlPoints = [];

        /**
         * 控制点大小
         */
        this.borderSize = size || 10;

        this.controlColor = "#FF0000";  // "#007F80"
        this.controlFillColor = "#FF0000"      // "#00E5E6"
    }

    /**
     * 返回坐标位置的控制点
     * @param {Point} coord 
     * @returns {Object} 控制点对象 {cmd, cursor}
     */
    getControlPoint(coord) {
        let controlPoint;
        for (let i = 0, len = this.controlPoints.length; i < len; i++) {
            let p = this.controlPoints[i];
            let buffer = 4;
            if (Collide.pointRect({ "x": coord[0], "y": coord[1] }, {
                "x": p.x - p.width / 2 - buffer,
                "y": p.y - p.width / 2 - buffer,
                "width": p.width + 2 * buffer,
                "height": p.height + 2 * buffer
            })) {
                controlPoint = p;
                break;
            }
        }
        return controlPoint;
    }

    /**
     * 绘制geom对象外框（焦点框）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} options 
     */
    draw(ctx, style={}, options={}) {
        let boxProp = options.prop;
        let bbox = options.extent;
        let scale = options.frameState.useTransform ? Transform.getScale(options.frameState.pixelToCoordinateTransform) : 1;
        // 计算控制点位置（像素坐标）
        let getPosition = function (cmd) {
            let y = (cmd === 1 || cmd === 2 || cmd === 3 ?
                (bbox[1]) :
                (cmd === 4 || cmd === 5 || cmd === 6 ? ((bbox[1] + bbox[3]) / 2) : bbox[3]));
            let x = (cmd === 1 || cmd === 4 || cmd === 7 ?
                (bbox[0]) :
                (cmd === 2 || cmd === 5 || cmd === 8 ? ((bbox[0] + bbox[2]) / 2) : bbox[2]));
            return [x, y];
        }

        ctx.save();
        // 绘制外框(线类型的geom对象不绘制外框)
        if (options.shapeType != 3) { // GGShapeType.LINE) {
            let pixels = [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]];
            ctx.beginPath();
            for (let i = 0; i < pixels.length; i++) {
                let pixel = pixels[i];
                if (i == 0) {
                    ctx.moveTo(pixel[0], pixel[1]);
                } else {
                    ctx.lineTo(pixel[0], pixel[1]);
                }
            }
            ctx.closePath();
            ctx.lineWidth = 4 * scale;
            ctx.strokeStyle = style.controlColor || this.controlColor;
            // 锁定时绘制实线，否则绘制虚线
            if (!options.lockState) ctx.setLineDash([4, 4]);
            ctx.stroke();
        }
        // 线类型的geom对象，沿顶点绘制虚线（不适合弧线类型的geom对象，例如GraphEdge）
        else {
            if (options.drawLine === true) {
                let points = Object.keys(boxProp);
                let i = 0;
                ctx.beginPath();
                points.forEach(c => {
                    let p = boxProp[c];
                    if (p.cmd == 11) {
                        let pos = p.coord;
                        if (i == 0) {
                            ctx.moveTo(pos[0], pos[1]);
                        } else {
                            ctx.lineTo(pos[0], pos[1]);
                        }
                        i++;
                    }
                });
                ctx.lineWidth = 2 * scale;
                ctx.strokeStyle = style.controlColor || this.controlColor;
                // 锁定时绘制实线，否则绘制虚线
                if (!options.lockState) ctx.setLineDash([4, 4]);
                ctx.stroke();
            } 
            // 绘制线的端点
            else {
                if (options.lockState == true) {
                    let size = this.borderSize * scale;
                    let points = Object.keys(boxProp);
                    ctx.fillStyle = style.controlFillColor || this.controlFillColor;
                    if (points.length >= 2) {
                        let p = boxProp[0];
                        let pos = p.cmd == 11 ? p.coord : getPosition(p.cmd);
                        ctx.fillRect(pos[0] - size / 2, pos[1] - size / 2, size, size);
                        p = boxProp[points.length - 1];
                        pos = p.cmd == 11 ? p.coord : getPosition(p.cmd);
                        ctx.fillRect(pos[0] - size / 2, pos[1] - size / 2, size, size);
                    }
                }
            }
        }

        // 非锁定状态时，绘制编辑控件
        let size = this.borderSize * scale;
        if (options.lockState == false) {
            let that = this;
            this.controlPoints = [];
            let points = Object.keys(boxProp);
            ctx.fillStyle = style.controlFillColor || this.controlFillColor;
            points.forEach(c => {
                let p = boxProp[c];
                if (p.cmd > 0 && p.enabled != false) {
                    // cmd == 11 多边形顶点,移动编辑
                    let pos = p.cmd == 11 ? p.coord : getPosition(p.cmd);
                    ctx.fillRect(pos[0] - size / 2, pos[1] - size / 2, size, size);
                    let coord = options.frameState.useTransform ?
                        Coordinate.transform2D(options.frameState.coordinateToPixelTransform, pos, false) : pos;
                    that.controlPoints.push({
                        x: coord[0],
                        y: coord[1],
                        width: this.borderSize,
                        height: this.borderSize,
                        cursor: p.cursor,
                        cmd: p.cmd,
                        ringIdx: p.ringIdx >= 0 ? p.ringIdx : -1,
                        idx: p.idx == null ? -1 : p.idx
                    });
                }
            });
        }

        ctx.restore();
    }
}

export default GeomBorder;
export { defaultCtrlBorderProp };
