/**
 * 特殊点的渲染类，包括正方形、三角形、五角星、圆形、笑脸、红桃、方块、梅花、黑桃
 */
class PointSharp {

    /**
     * 绘制圆
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 直径
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawRound(ctx, x, y, size, style) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.strokeStyle = style.color;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制正方形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawSquare(ctx, x, y, size, style) {
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        // 正方形坐标
        let x1 = - size / 2;
        let x2 = x1 + size;
        let y1 = - size / 2
        let y2 = y1 + size;
        let coords = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    static _drawPolygon(ctx, coords, style) {
        let num = coords.length;
        ctx.beginPath();
        for (let i = 0; i < num; i++) {
            let point = coords[i];
            if (i == 0) {
                ctx.moveTo(point[0], point[1]);
            } else {
                ctx.lineTo(point[0], point[1]);
            }
        }
        ctx.closePath();
        ctx.lineWidth = style.lineWidth == null ? 1 : style.lineWidth;
        if (style.fillColor != null && style.fillColor != "none") {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        }
        if (style.color != null && style.color != "none") {
            ctx.strokeStyle = style.color;
            ctx.stroke();
        }
    }

    /**
     * 绘制三角形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高/底边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawTriangle(ctx, x, y, size, style) {
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }
        let x1 = 0;
        let y1 = - size / 2
        let x2 = x1 + size / 2;
        let y2 = y1 + size;
        let x3 = x1 - size / 2;
        let y3 = y1 + size
        let coords = [[x1, y1], [x2, y2], [x3, y3], [x1, y1]];
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    /**
     * 绘制五角星
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 边长
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawStar(ctx, x, y, size, style) {
        if (size == null || size < 4) size = 4;
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        //设半径：r=50，圆心：x=100，y=100 
        //1 最上一个顶点坐标为：x1=100,y1=50                                 (x,y-r);
        //2 左边第二个顶点坐标为：x2=x-50*sin72度，y2=y-50*cos72度            (x-r*sin72度，y-r*cos72度);
        //3 右边第二个顶点坐标为：x3=x+50*sin72度，y3=y-50*cos72度            (x+r*sin72度,y-r*cos72度);   
        //4 左边第三个顶点坐标为：x4=x-50*sin36度，y4=y+50*cos36度            (x-r*sin36度,y+r*cos36度);
        //5 右边第三个顶点坐标为：x5=x+50*sin36度，y5=y+50*cos36度            (x+r*sin36度，y+r*cos36度) 

        let rad1 = Math.sin(0.4 * Math.PI);     //sin(72)  
        let rad2 = Math.cos(0.4 * Math.PI);     //cos(72)  
        let rad3 = Math.sin(0.2 * Math.PI);     //sin(36)  
        let rad4 = Math.cos(0.2 * Math.PI);     //cos(36)  
        let r = size / 2;
        let x1 = 0; let y1 = 0 - r;             // 1 上
        let x2 = 0 - r * rad3; let y2 = 0 + r * rad4;      // 3 左下
        let x3 = 0 + r * rad1; let y3 = 0 - r * rad2;      // 5 右上
        let x4 = 0 - r * rad1; let y4 = 0 - r * rad2;      // 2 左上
        let x5 = 0 + r * rad3; let y5 = 0 + r * rad4;      // 4 右下

        let coords = [[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x5, y5], [x1, y1]];
        if (style.fillColor == null || style.fillColor === "none") { //空心刷子
            style.fillColor = style.color;
        } else {
            style.color = style.fillColor;
        }

        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    /**
     * 规则形状，包括五角星、三角形等
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} points 点数 
     * @param {int} radius 半径 
     * @param {int} radius2 凹半径 
     * @param {Object} style 风格
     */
    static drawRegularShape(ctx, x, y, points, radius = 16, radius2 = 0, style) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(x, y);

        ctx.beginPath();
        if (radius2 !== radius) {
            points = 2 * points;
        }

        let lineWidth = style.lineWidth == null ? 0 : style.lineWidth;

        for (let i = 0; i <= points; i++) {
            let angle0 = i * 2 * Math.PI / points - Math.PI / 2 + (style.angle == null ? 0 : style.angle);
            let radiusC = i % 2 === 0 ? radius : radius2;
            ctx.lineTo(radiusC * Math.cos(angle0), radiusC * Math.sin(angle0));
        }

        if (style.fillColor != null && style.fillColor != "none") {
            ctx.fillStyle = style.fillColor;
            ctx.fill();
        } else {
            ctx.strokeStyle = style.color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
        ctx.closePath();
        ctx.restore();
    }

    /**
     * 绘制任意正多边形
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 正多边形外切圆的直径
     * @param {int} sideNum 边数
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawRegularPolygon(ctx, x, y, size, sideNum, style) {
        let coords = this._getEdgeCoords(size, sideNum);
        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }
        this._drawPolygon(ctx, coords, style);
        ctx.restore();
    }

    // 求正多边形坐标 （size为正多边形外切圆的直径，sideNum为多边形的边数）
    static _getEdgeCoords(size, sideNum) {
        let vPoint = [];                            //vPoint为返回得到的多边形状的各顶点坐标
        let arc = Math.PI / 2 - Math.PI / sideNum;
        let r = size / 2;
        for (let i = 0; i < sideNum; i++) {
            arc = arc - 2 * Math.PI / sideNum;
            vPoint[i] = [r * Math.cos(arc), r * Math.sin(arc)];
        }
        return vPoint;
    }

    // 求正多边形坐标 （r为正多边形的边长，sideNum为多边形的边数）
    static _getPloyCoord(r, sideNum) {
        let vPoint = [];                            //vPoint为返回得到的多边形状的各顶点坐标
        let R = (r / 2) / Math.sin(Math.PI / sideNum);

        if (sideNum % 2 == 1) {
            vPoint.push([0, R]);
            let arc = Math.PI / 2;
            for (let i = 0; i < sideNum - 1; i++) {
                arc -= (2 * Math.PI) / sideNum;
                vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            }
        } else {
            let arc = Math.PI / 2 - Math.PI / sideNum;
            vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            for (let i = 0; i < sideNum - 1; i++) {
                arc -= (2 * Math.PI) / sideNum;
                vPoint.push([R * Math.cos(arc), R * Math.sin(arc)]);
            }
        }
        return vPoint;
    }

    /**
     * 绘制笑脸
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 笑脸直径
     * @param {Object} style 渲染样式 {color, fillColor, angle}
     */
    static drawFace(ctx, x, y, size, style = {}) {
        if (size < 10) size = 10;    // 笑脸的最小大小为10
        size = size / 20;            // size：眼睛大小(半径)，笑脸大小是眼睛大小的10倍

        ctx.save();
        // 平移至0,0，便于旋转处理
        ctx.translate(x, y);
        if (style.angle > 0) {
            ctx.rotate(style.angle * Math.PI / 180);
        }

        ctx.beginPath();
        ctx.arc(0, 0, 10 * size, 0, Math.PI * 2, true);  // Outer circle
        ctx.moveTo(7 * size + 0, 0);
        ctx.arc(0, 0, 7 * size, 0, Math.PI, false);    // Mouth
        ctx.moveTo(0 - 2 * size, 0 - 2.5 * size);
        ctx.arc(0 - 3 * size, 0 - 2.5 * size, size, 0, Math.PI * 2, true);  // Left eye
        ctx.moveTo(0 + 4 * size, 0 - 2.5 * size);
        ctx.arc(0 + 3 * size, 0 - 2.5 * size, size, 0, Math.PI * 2, true);  // Right eye
        ctx.closePath();
        ctx.strokeStyle = style.color; //"rgb(0,0,0)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 绘制黑桃
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawSpade(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        let bottomWidth = width * 0.7;
        let topHeight = height * 0.7;
        let bottomHeight = height * 0.3;

        ctx.beginPath();
        ctx.moveTo(x, y);

        // top left of spade          
        ctx.bezierCurveTo(
            x, y + topHeight / 2,             // control point 1
            x - width / 2, y + topHeight / 2, // control point 2
            x - width / 2, y + topHeight      // end point
        );

        // bottom left of spade
        ctx.bezierCurveTo(
            x - width / 2, y + topHeight * 1.3, // control point 1
            x, y + topHeight * 1.3,             // control point 2
            x, y + topHeight                    // end point
        );

        // bottom right of spade
        ctx.bezierCurveTo(
            x, y + topHeight * 1.3,             // control point 1
            x + width / 2, y + topHeight * 1.3, // control point 2
            x + width / 2, y + topHeight        // end point
        );

        // top right of spade
        ctx.bezierCurveTo(
            x + width / 2, y + topHeight / 2,  // control point 1
            x, y + topHeight / 2,              // control point 2
            x, y                               // end point
        );
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom of spade
        ctx.beginPath();
        ctx.moveTo(x, y + topHeight);
        ctx.quadraticCurveTo(
            x, y + topHeight + bottomHeight,                  // control point
            x - bottomWidth / 2, y + topHeight + bottomHeight // end point
        );
        ctx.lineTo(x + bottomWidth / 2, y + topHeight + bottomHeight);
        ctx.quadraticCurveTo(
            x, y + topHeight + bottomHeight,                  // control point
            x, y + topHeight                                  // end point
        );
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制红心
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawHeart(ctx, x, y, size, style) {
        ctx.save();

        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        ctx.beginPath();
        let topCurveHeight = height * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
            x, y,
            x - width / 2, y,
            x - width / 2, y + topCurveHeight
        );

        // bottom left curve
        ctx.bezierCurveTo(
            x - width / 2, y + (height + topCurveHeight) / 2,
            x, y + (height + topCurveHeight) / 2,
            x, y + height
        );

        // bottom right curve
        ctx.bezierCurveTo(
            x, y + (height + topCurveHeight) / 2,
            x + width / 2, y + (height + topCurveHeight) / 2,
            x + width / 2, y + topCurveHeight
        );

        // top right curve
        ctx.bezierCurveTo(
            x + width / 2, y,
            x, y,
            x, y + topCurveHeight
        );

        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制梅花
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawClub(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        y = y - height / 2;

        let circleRadius = width * 0.3;
        let bottomWidth = width * 0.5;
        let bottomHeight = height * 0.35;

        // top circle
        ctx.beginPath();
        ctx.arc(x, y + circleRadius + (height * 0.05), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom right circle
        ctx.beginPath();
        ctx.arc(x + circleRadius, y + (height * 0.6), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom left circle
        ctx.beginPath();
        ctx.arc(x - circleRadius, y + (height * 0.6), circleRadius, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // center filler circle
        ctx.beginPath();
        ctx.arc(x, y + (height * 0.5), circleRadius / 2, 0, 2 * Math.PI, false);
        ctx.closePath();
        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }

        // bottom of club
        ctx.beginPath();
        ctx.moveTo(x, y + (height * 0.6));
        ctx.quadraticCurveTo(x, y + height, x - bottomWidth / 2, y + height);
        ctx.lineTo(x + bottomWidth / 2, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + (height * 0.6));
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "black";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制方块
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawDiamond(ctx, x, y, size, style) {
        ctx.save();
        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        let width = size * 3 / 4;
        let height = size;
        ctx.beginPath();
        ctx.moveTo(x, y - height / 2);

        // top left edge
        ctx.lineTo(x - width / 2, y);
        // bottom left edge
        ctx.lineTo(x, y + height / 2);
        // bottom right edge
        ctx.lineTo(x + width / 2, y);
        // closing the path automatically creates the top right edge
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * 绘制花朵
     * @param {CanvasRenderingContext2D} ctx 
     * @param {int} x 中心点X坐标
     * @param {int} y 中心点Y坐标
     * @param {int} size 高
     * @param {int} sideNum 花瓣数，最小为3， 最大为8
     * @param {Object} style 渲染样式 {color, fillColor}
     */
    static drawFlower(ctx, x, y, size, sideNum, style) {
        ctx.save();

        if (sideNum < 3) sideNum = 4;
        if (sideNum > 8) sideNum = 6;
        size--;

        // 旋转处理
        if (style.angle > 0) {
            ctx.translate(x, y);
            ctx.rotate(style.angle * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        // begin
        ctx.beginPath();

        // 绘制花瓣
        for (let n = 0; n < sideNum; n++) {
            let theta1 = ((Math.PI * 2) / sideNum) * (n + 1);
            let theta2 = ((Math.PI * 2) / sideNum) * (n);
            let x1 = (size * Math.sin(theta1)) + x;
            let y1 = (size * Math.cos(theta1)) + y;
            let x2 = (size * Math.sin(theta2)) + x;
            let y2 = (size * Math.cos(theta2)) + y;
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
        }
        ctx.closePath();

        if (style.fillColor == null || style.fillColor == "none") {
            ctx.lineWidth = 1;
            ctx.strokeStyle = style.color; //"rgb(0,0,0)";
            ctx.stroke();
        } else {
            ctx.fillStyle = "red";
            ctx.fill();
        }

        // 绘制花蕾
        ctx.beginPath();
        ctx.arc(x, y, size / 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

export default PointSharp;
