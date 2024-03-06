import Collide from "../spatial/collide.js";
import Cursor from "../util/cursor.js";

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
    }

    getControlPoint(coord) {
        let controlPoint;
        for (let i = 0, len = this.controlPoints.length; i < len; i++) {
            let p = this.controlPoints[i];
            let buffer = 4;
            if (Collide.pointRect({ "x": coord[0], "y": coord[1] },
                {
                    "x": p.x - p.width / 2 - buffer, "y": p.y - p.width / 2 - buffer,
                    "width": p.width + 2 * buffer, "height": p.height + 2 * buffer
                })) {
                controlPoint = p;
                break;
            }
        }
        return controlPoint;
    }

    /**
     * 
     * @param {*} ctx 
     * @param {*} options 
     */
    draw(ctx, options) {

        let boxProp = options.prop;
        let bbox = options.extent;

        ctx.save();
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
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#007F80";
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // 绘制控制点
        let size = this.borderSize;
        let getPosition = function (cmd) {
            let y = (cmd === 1 || cmd === 2 || cmd === 3 ?
                (bbox[1]) :
                (cmd === 4 || cmd === 5 || cmd === 6 ? ((bbox[1] + bbox[3]) / 2) : bbox[3]));
            let x = (cmd === 1 || cmd === 4 || cmd === 7 ?
                (bbox[0]) :
                (cmd === 2 || cmd === 5 || cmd === 8 ? ((bbox[0] + bbox[2]) / 2) : bbox[2]));
            return [x, y];
        }

        // 绘制编辑控件
        let that = this;
        this.controlPoints = [];
        let points = Object.keys(boxProp);
        ctx.fillStyle = "#00E5E6";
        points.forEach(c => {
            let p = boxProp[c];
            if (p.cmd > 0 && p.enabled != false) {
                // cmd == 11 多边形顶点移动编辑
                let pos = p.cmd == 11 ? p.coord : getPosition(p.cmd);
                ctx.fillRect(pos[0] - size / 2, pos[1] - size / 2, size, size);
                that.controlPoints.push({
                    x: pos[0],
                    y: pos[1],
                    width: size,
                    height: size,
                    cursor: p.cursor,
                    cmd: p.cmd,
                    ringIdx: p.ringIdx >= 0 ? p.ringIdx : -1,
                    idx: p.idx == null ? -1 : p.idx
                })
            }
        })

        ctx.restore();
    }
}

export default GeomBorder;
export { defaultCtrlBorderProp };
