/**
 * 箭头渲染类
 */
class Arrow {
    constructor(options = {}) {
        /**
         * 箭头大小
         */
        this.arrowSize = options.arrowSize || 20;

        /**
         * 空心箭头的背景色
         */
        this.background = options.background || "transparent";
    }

    /**
     * 实心三角形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    triangleSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 4);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 4);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    /**
     * 空心三角形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    triangle(ctx, point) {
        ctx.save();
        if (ctx.lineWidth < 2) {
            ctx.lineWidth = 2;
        }
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 4);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 4);
        ctx.closePath();
        ctx.stroke();
        //ctx.fillStyle = this.background || '#ffffff';
        //ctx.fill();
        ctx.restore();
    }

    /**
     * 实心圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    circleSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.arc(point.x - r, point.y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    
    /**
     * 空心圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    circle(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.arc(point.x - r, point.y, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = this.background || '#ffffff';
        ctx.fill();
        ctx.restore();
    }

    /**
     * 实心菱形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    diamondSolid(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y);
        ctx.lineTo(fromX + r, point.y - r / 2);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX + r, point.y + r / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }

    /**
     * 空心菱形箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    diamond(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        var r = this.arrowSize / 2;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y);
        ctx.lineTo(fromX + r, point.y - r / 2);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX + r, point.y + r / 2);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = this.background || '#ffffff';
        ctx.fill();
        ctx.restore();
    }
    
    /**
     * 单线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    line(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(fromX, point.y + this.arrowSize / 3);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 上线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineUp(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y - this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 下线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineDown(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        var fromX = point.x - this.arrowSize;
        ctx.beginPath();
        ctx.moveTo(fromX, point.y + this.arrowSize / 3);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
    }
    
    /**
     * 上线箭头
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} point {x, y, angle}
     */
    lineEnd(ctx, point) {
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate((point.angle * Math.PI) / 180);
        ctx.translate(-point.x, -point.y);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - this.arrowSize / 2);
        ctx.lineTo(point.x, point.y + this.arrowSize / 2);
        ctx.stroke();
        ctx.restore();
    }
}

export default Arrow;
