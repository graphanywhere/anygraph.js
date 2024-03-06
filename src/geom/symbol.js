import { default as Geometry, GGShapeType, GGeometryType } from "./geometry.js";
import Extent from "../spatial/extent.js"
import Collide from "../spatial/collide.js";
import Transform from "../spatial/transform.js";
import Ratio from "../spatial/ratio.js";
import Coordinate from "../spatial/coordinate.js";

/**
 * 符号对象类型
 * @extends Geometry
 * @desc coords: [centerCoord]
 */
class Symbol extends Geometry {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 中心点坐标, 其格式为[[x,y]] 
     * @param {Object} style { addBorder} 渲染的宽和高
     * @param {Object} properties {}  
     * @param {Object} symbol {childGeometrys, width, height} 符号自身的信息
     */
    constructor(options) {
        // 属性初始化
        super(options, ["x", "y", "width", "height", "rotation", "symbol"]);

        // 类型
        this.type = GGeometryType.SYMBOL;

        // 几何类型
        this.shapeType = GGShapeType.SYMBOL;

        // 初始化
        this.initialize(options);

        // 坐标
        this.x;
        this.y;

        // 字体宽和高（当vectorSize=true时，按照fontHeight缩放字体，否则才会判断字体宽和高）
        this.width = this.width || 0;
        this.height = this.height || 0;

        // 旋转角度(°)
        this.rotation = this.rotation || 0;

        // 临时变量
        this._renderWidth = 0;
        this._renderHeight = 0;
    }

    /**
     * 设置坐标
     * @param {*} coords 
     */
    setCoord(coords) {
        this.coords = [];
        if (coords == null) {
            if (this.x == null || this.y == null) {
                throw new Error("坐标不能为空");
            } else {
                this.coords.push([this.x, this.y]);
                this.coords.push([this.x + this.width, this.y + this.height]);
            }
        } else {
            if (coords.length === 2) {
                if (Array.isArray(coords[0]) && Array.isArray(coords[1])) {
                    this.coords = coords.slice();
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }

        // 以下代码在执行旋转操作后调用本方法时会造成width和height的值受到影响，导致变形
        // // setCoord时更新对象几何属性
        // if (Array.isArray(this.coords) && this.coords.length > 0) {
        //     [this.x, this.y] = this.coords[0];
        //     // width, height
        //     this.width = this.coords[1][0] - this.coords[0][0];
        //     this.height = this.coords[1][1] - this.coords[0][1];
        // }

        this.pixel = this.coords.slice();
    }

    /**
     * 返回对象边界（符号外框）
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === true ? this.getCoord() : this.getPixel();
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);
        let extent = Extent.createEmpty();
        extent[0] = coords[0][0] - width / 2;
        extent[1] = coords[0][1] - height / 2;
        extent[2] = coords[0][0] + width / 2;
        extent[3] = coords[0][1] + height / 2;

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth / 2) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }

    /**
     * 返回对象边界(符号轮廓，相比较getBBox()，计算结果更为精细)
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox2(useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);
        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Text" || innerObj.getType() == "Point")
                continue;
            bbox = Extent.merge(innerObj.getBBoxInsideSymbol(true), bbox);
        }
        let cosa, sina;
        bbox[0] -= 0.5;
        bbox[1] -= 0.5;
        bbox[2] -= 0.5;
        bbox[3] -= 0.5;
        if (useCoord /*&& this.symbol.originAtLeftTop*/) {
            let tmp = -bbox[1];
            bbox[1] = -bbox[3];
            bbox[3] = tmp;
            cosa = Math.cos(-this.rotation * Math.PI / 180);
            sina = Math.sin(-this.rotation * Math.PI / 180);
        } else {
            cosa = Math.cos(this.rotation * Math.PI / 180);
            sina = Math.sin(this.rotation * Math.PI / 180);
        }
        let coordsborder = [], coordsborderx, coordsbordery;
        coordsborderx = coords[0][0] + bbox[0] * width * cosa - bbox[1] * sina * height;
        coordsbordery = coords[0][1] + bbox[0] * width * sina + bbox[1] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[2] * width * cosa - bbox[1] * sina * height;
        coordsbordery = coords[0][1] + bbox[2] * width * sina + bbox[1] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[2] * width * cosa - bbox[3] * sina * height;
        coordsbordery = coords[0][1] + bbox[2] * width * sina + bbox[3] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        coordsborderx = coords[0][0] + bbox[0] * width * cosa - bbox[3] * sina * height;
        coordsbordery = coords[0][1] + bbox[0] * width * sina + bbox[3] * cosa * height;
        coordsborder.push([coordsborderx, coordsbordery]);
        return coordsborder;
    }

    /**
    /* 获取锚点个数 
    */
    GetPinNumber() {
        let count = 0;
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Point")
                count++;
        }
        return count;
    }

    /**
    /* 获取锚点坐标, index: 第index个锚点，从1到GetPinNumber
    /* 返回锚点坐标
    */
    GetPinCoord(index, useCoord = true) {
        let coords = (useCoord === false ? this.getPixel() : this.getCoord());
        if (index <= 0)
            return coords[0];
        let count = 0;
        let width = useCoord === true ? this.width : (this._renderWidth == null ? this.width : this._renderWidth);
        let height = useCoord === true ? this.height : (this._renderHeight == null ? this.height : this._renderHeight);

        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
            let innerObj = this.symbol.childGeometrys[i];
            if (innerObj.getType() == "Point") {
                count++;
                if (count == index) {
                    bbox = Extent.merge(innerObj.getBBoxInsideSymbol(true), bbox);
                    break;
                }
            }
        }
        if (count < index)
            return coords[0];
        let cosa, sina;
        bbox[0] -= 0.5;
        bbox[1] -= 0.5;
        bbox[2] -= 0.5;
        bbox[3] -= 0.5;
        if (useCoord /*&& this.symbol.originAtLeftTop*/) {
            let tmp = -bbox[1];
            bbox[1] = -bbox[3];
            bbox[3] = tmp;
            cosa = Math.cos(-this.rotation * Math.PI / 180);
            sina = Math.sin(-this.rotation * Math.PI / 180);
        } else {
            cosa = Math.cos(this.rotation * Math.PI / 180);
            sina = Math.sin(this.rotation * Math.PI / 180);
        }
        bbox[0] = (bbox[0] + bbox[2]) * 0.5;
        bbox[1] = (bbox[1] + bbox[3]) * 0.5;
        let pincoord;
        pincoord = [coords[0][0] + bbox[0] * width * cosa - bbox[1] * sina * height, coords[0][1] + bbox[0] * width * sina + bbox[1] * cosa * height];
        return pincoord;
    }

    /**
    /* 根据路口上的路段id
    /* 返回相关的路段
    */
    GetConnectedREdge(dataset_) {
        let edges = [];
        for (let i = 0; i < this.properties.edge.length; i++) {
            let edgeobj = dataset_.getNode(this.properties.edge[i].block,
                this.properties.edge[i].entityId);
            if (edgeobj == null)
                continue;
            edges.push(edgeobj);
        }
        return edges;
    }

    /**
    /* 路口参数发生变化后，修改连接的路段的起止点坐标
    /* 返回相关的路段
    */
    UpdateConnectedREdge(dataset_) {
        let edges = [];
        for (let i = 0; i < this.properties.edge.length; i++) {
            let edgeobj = dataset_.getNode(this.properties.edge[i].block,
                this.properties.edge[i].entityId);
            if (edgeobj == null)
                continue;
            edgeobj = edgeobj.geometryObj;
            let edgecoord = edgeobj.getCoord();
            if (edgeobj.properties.head.entityId == this.properties.entityId)
                edgecoord[0] = this.GetPinCoord(edgeobj.properties.head.lid);
            else
                edgecoord[edgecoord.length - 1] = this.GetPinCoord(edgeobj.properties.tail.lid);
            edgeobj.setCoord(edgecoord);
            edges.push(edgeobj);
        }
        return edges;
    }

    /**
    * 绘制控制外框
    * @param {CanvasRenderingContext2D} ctx 
    * @param {Object} style 
    */
    drawBorder(ctx, style) {
        ctx.save();
        let bbox = this.getBBox2(false);
        this.drawPolyline(ctx, bbox, true);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#007F80";
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} point 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        // let bbox = this.getBBox(useCoord); // this.getBBox2(useCoord);
        // return Collide.pointRect({"x":point[0], "y":point[1]}, {"x":bbox[0], "y":bbox[1], "width":bbox[2] - bbox[0], "height":bbox[3] - bbox[1]});

        let objCoords = this.getBBox2(useCoord);
        return Collide.pointPoly({ "x": point[0], "y": point[1] }, objCoords);
    }

    /**
     * 设置符号的像素坐标，且重新计算置子对象坐标
     * @param {Array} pixelArray 
     */
    setPixel(pixelArray) {
        this.pixel = pixelArray;
        let width = this._renderWidth == null ? this.width : this._renderWidth;
        let height = this._renderHeight == null ? this.height : this._renderHeight;
        if (width > 0 && height > 0) {
            // 使用Transform进行坐标变换
            let transform = Transform.create();
            let v = (this.symbol.originAtLeftTop === false ? -1 : 1);
            let symbolWidth = this.symbol.width;
            let symbolHeight = this.symbol.height;
            Transform.compose(transform, width / 2, height / 2, width / symbolWidth, v * height / symbolHeight, 0, -symbolWidth / 2, -symbolHeight / 2);

            // 使用Matrix进行坐标变换
            let symbolInnerExtent = this.symbol.bbox; //[0, 0, this.symbol.width, this.symbol.height];
            let canvasExtent = [0, 0, width, height];
            // 使用Matrix类进行坐标变换
            let symbolMatrix = new Ratio();
            symbolMatrix.setCanvasExtent(canvasExtent);
            symbolMatrix.setWorldExtent(symbolInnerExtent);
            symbolMatrix.setWorldExtentOrigin(this.symbol.originAtLeftTop !== false);

            // 符号内部坐标转换(矢量缩放)
            for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
                let innerObj = this.symbol.childGeometrys[i];
                innerObj.toPixel(symbolMatrix);
            }

        } else {
            for (let i = 0; i < this.symbol.childGeometrys.length; i++) {
                let innerObj = this.symbol.childGeometrys[i];
                innerObj.setPixel(innerObj.getCoord());
            }
        }
    }

    /**
     * 转换为屏幕坐标
     *  @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        // 记录缩放比例
        this._styleScale = (Array.isArray(tool) ? Transform.getScale(tool) : tool.getScale());

        // 转换为屏幕坐标
        let coord = this.coords;
        let pixel = Coordinate.transform2D(tool, coord, false);

        // 计算符号渲染的宽和高
        let coordwh = [coord[0][0] + this.width, coord[0][1] + this.height];
        let pixelwh = Coordinate.transform2D(tool, coordwh, false);
        this._renderWidth = pixelwh[0] - pixel[0][0];
        this._renderHeight = Math.max(pixelwh[1], pixel[0][1]) - Math.min(pixelwh[1], pixel[0][1]);
        // 计算符号内部对象渲染的像素
        this.setPixel(pixel);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Symbol(this);
    }

    /**
     * 符号的的矩阵变换，除了坐标的变换，还需对宽高进行缩放
     * @param {*} trans 
     */
    transform(trans) {
        let transResult = super.transform(trans);
        // 变换宽和高
        this.width = this.width * transResult.scale[0];
        this.height = this.height * transResult.scale[1];

        // 子对象变换（无需逐个对子对象进行变换2023/9/28）
        //  对子对象进行变换会造成子对象布局错落
        //  符号应做为一个整体变换，而不需要逐个对子对象变换，就好比一幅画，如果是翻转，应该是对整幅画进行翻转，而不是对每一个子对象进行翻转
        // if (this.symbol != null && this.symbol.childGeometrys != null && this.symbol.childGeometrys.length > 0) {
        //     this.symbol.childGeometrys.forEach(geom => {
        //         geom.transform(trans)
        //     })
        // };

        // 符号的旋转需要通过画板的旋转来实现，此处记录旋转角度，draw()时根据此数据旋转画板
        this.rotation = this.rotation != 0 ? this.rotation + transResult.angle : transResult.angle;
    }

    /**
     * 符号渲染
     */
    draw(ctx, style, frameState) {
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // 起始位置
        let pixels = this.getPixel();

        // 旋转，矩形的旋转需通过画板的旋转来实现
        if (this.rotation != null && this.rotation != 0) {
            this.renderRotate(ctx, [this.rotation, pixels[0][0], pixels[0][1]]);
        }

        // 平移
        ctx.translate(pixels[0][0], pixels[0][1]);

        if (style.overView == true && frameState.dist > style.overViewMaxDist) {
            // 概貌渲染
            style.fillColor = style.color;
            ctx.beginPath();
            let radius = (style.overViewSize ? style.overViewSize : 1);
            ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
            // 设置样式并渲染出来
            this.setContextStyle(ctx, style);
            this.strokeAndFill(ctx, style);
        } else {
            // 符号渲染
            let width = this._renderWidth == null ? this.width : this._renderWidth;
            let height = this._renderHeight == null ? this.height : this._renderHeight;
            if (width > 4 && height > 4) {

                // 渲染符号内部结构
                if (this.symbol != null && this.symbol.childGeometrys != null && this.symbol.childGeometrys.length > 0) {
                    /*let tmpSymbol = document.createElement("canvas");
                    tmpSymbol.width = width * 2;
                    tmpSymbol.height = height * 2;
                    let tmpSymbolCtx = tmpSymbol.getContext("2d");
                    this._drawSymbol(this.symbol.childGeometrys, tmpSymbolCtx, style, frameState);
                    ctx.drawImage(tmpSymbol, -width / 2, -height / 2, width * 2, height * 2);*/
                    // debugger;
                    ctx.save();
                    ctx.translate(-width * 0.5, -height * 0.5);
                    this._drawSymbol(this.symbol.childGeometrys, ctx, style, frameState);
                    ctx.restore();
                }

                // 符号外框
                if (style.addBorder === true) {
                    ctx.strokeStyle = "#0000FF";
                    ctx.strokeRect(-width / 2, -height / 2, width, height);
                }
            }
        }
        ctx.restore();
    }

    /**
     * 渲染符号内部shape
     * @param {Array} list 
     * @param {Object} style 
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawSymbol(list, ctx, style, frameState) {
        if (ctx == null) ctx = this._context;
        for (let i = 0, ii = list.length; i < ii; i++) {
            let innerObj = list[i];
            if (this.isFocus() == false && innerObj.getType() == "Point")
                continue;
            // 缺省情况下，符号内部shape样式优先于符号样式
            let newStyle = this._getSymbolStyle(innerObj.style, style);
            if (typeof (newStyle.function) === "function") {
                newStyle.function(innerObj, newStyle, frameState);
            }
            // 逐个shape渲染
            innerObj.draw(ctx, newStyle, frameState);
        }
    }

    /**
     * 获取样式
     * @param {Object} objStyle 
     * @param {Object} parentStyle 
     * @returns style
     */
    _getSymbolStyle(objStyle, parentStyle) {
        let style = Object.assign({}, objStyle);

        // 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
        let symbolPrior = (parentStyle.symbolPrior === true ? true : false);

        // 排除的样式，这些样式需针对性处理，例如柱变符号是有两个圈组成的，第一个圈使用符号颜色且不填充，第二个圈应保留符号的颜色且需要填充
        let excludeAttr = ["color", "fillColor", "lineWidth", "fillStyle"];

        // 父对象style优先于对象style
        if (parentStyle != null && symbolPrior === true) {
            // 将父对象的有效样式复制到子对象中
            Object.keys(parentStyle).forEach(key => {
                if (parentStyle[key] != null) {
                    if (excludeAttr.indexOf(key) < 0) style[key] = parentStyle[key];
                }
            })
        } else {
            // 子对象样式优先，仅将父对象比子对象多的样式复制到子对象中
            Object.keys(parentStyle).forEach(key => {
                if (parentStyle[key] != null && objStyle[key] == null) {
                    style[key] = parentStyle[key];
                }
            })
        }

        // 使用父对象颜色
        if (symbolPrior && parentStyle.color != null && parentStyle.color != "none") {
            style.color = parentStyle.color;
        }
        // 使用父对象颜色作为填充色
        if (symbolPrior && parentStyle.fillColor != null && parentStyle.fillColor != "none" && style.fillStyle != 0) {
            style.fillColor = parentStyle.fillColor;
        }
        // 使用父对象线宽
        if (symbolPrior && parentStyle.lineWidth != null) {
            style.lineWidth = parentStyle.lineWidth * (objStyle.lineWidth == null ? 1 : objStyle.lineWidth)
        }

        return style;
    }
}

export default Symbol;
