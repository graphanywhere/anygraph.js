import { default as Geometry, GGShapeType, GGeometryType} from "./geometry.js";
import Extent from "../spatial/extent.js"
import Collide from "../spatial/collide.js";

/**
 * 组对象类型
 * @extends Geometry
 * @desc coords: [centerCoord]
 */
class Group extends Geometry {
    /**
     * 构造函数
     * @param {Coord} coords 中心点坐标
     * @param {Object} style {width, height, addBorder} 渲染的宽和高
     * @param {Object} properties
     */
    constructor(options) {
        // 属性初始化
        super(options, ["childGeometrys"]);


        this.childGeometrys = this.childGeometrys || [];

        // 类型
        this.type = GGeometryType.GROUP;
        
        // 几何类型
        this.shapeType = GGShapeType.SURFACE;
        
        // 初始化
        this.initialize(options);
    }

    /**
     * 返回对象边界（符号外框）
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coords = useCoord === true ? this.getCoord() : this.getPixel();
        let extent = [coords[1][0], coords[1][1], coords[2][0], coords[2][1]];

        // 计算线宽对bbox的影响
        let style = this.getStyle();
        let lineWidth = (style.lineWidth == null ? 1 : style.lineWidth) * (style.allowStyleScale === true ? (this._styleScale == null || 1) : 1);
        return Extent.buffer(extent, lineWidth);
    }
    
    /**
     * 转换为屏幕坐标
     * @param {Transform|Ratio} tool 变化矩阵
     */
    toPixel(tool) {
        super.toPixel(tool)
        // 组对象内部坐标转换(矢量缩放)
        if (Array.isArray(this.childGeometrys)) {
            for (let i = 0; i < this.childGeometrys.length; i++) {
                this.childGeometrys[i].toPixel(tool);
            }
        }
    }

    /**
     * 是否包含该点，拾取时可根据此返回值判断是否被拾取到
     * @param {Coord} coord 点坐标
     * @param {Boolean} useCoord 是否世界坐标
     * @returns Boolean
     */
    contain(point, useCoord = true) {
        let bbox = this.getBBox(useCoord);
        return Collide.pointRect({"x":point[0], "y":point[1]}, {"x":bbox[0], "y":bbox[1], "width":bbox[2] - bbox[0], "height":bbox[3] - bbox[1]});
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Group(this);
    }

    /**
     * 符号渲染
     */
    draw(ctx, style, frameState) {
        ctx.save();
        
        // 画板变换
        this.renderTransform(ctx, style.transData);
        
        // 设置样式
        this.setContextStyle(ctx, style);

        // 起始位置
        let pixel = this.getPixel();

        // 渲染
        if (Math.abs(pixel[2][0] - pixel[1][0]) > 4 && Math.abs(pixel[2][1] - pixel[1][1]) > 4) {
            // 渲染符号内部结构
            if (this.childGeometrys != null && this.childGeometrys.length > 0) {
                let list = this.childGeometrys;
                for (let i = 0, ii = list.length; i < ii; i++) {
                    let innerObj = list[i];
                    // 缺省情况下，符号内部shape样式优先于符号样式
                    let newStyle = this._getGroupStyle(innerObj.getStyle(), style);
                    if (typeof (newStyle.function) === "function") {
                        newStyle.function(innerObj, newStyle, frameState);
                    }
                    // 逐个shape渲染
                    innerObj.draw(ctx, newStyle, frameState);
                }
            }

            // 符号外框
            if (style.addBorder === true) {
                ctx.strokeStyle = "#0000FF";
                ctx.strokeRect(pixel[1][0], pixel[1][1], Math.abs(pixel[2][0] - pixel[1][0]), Math.abs(pixel[2][1] - pixel[1][1]));
            }
        } 
        ctx.restore();
    }

    /**
     * 获取样式
     * @param {Object} objStyle 
     * @param {Object} parentStyle 
     * @param {Boolean} parentPrior 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
     * @returns style
     */
    _getGroupStyle(objStyle, parentStyle) {
        let style = Object.assign({}, objStyle);

        // 符号样式优先， 当该属性为true时，则符号样式优先于内部shape样式
        let parentPrior = (parentStyle.parentPrior === true ? true : false);

        // 父对象style优先于对象style
        if (parentStyle != null && parentPrior === true) {
            // 将父对象的有效样式复制到子对象中
            Object.keys(parentStyle).forEach(key=>{
                if(parentStyle[key] != null) {
                    style[key] = parentStyle[key];
                }
            })
        } else {
            // 子对象样式优先，仅将父对象比子对象多的样式复制到子对象中
            Object.keys(parentStyle).forEach(key=>{
                if(parentStyle[key] != null && objStyle[key] == null) {
                    style[key] = parentStyle[key];
                }
            })
        }

        // // 父对象style优先于对象style
        // if (parentStyle != null) {
        //     // 使用父对象颜色
        //     if (parentPrior && parentStyle.color != null && parentStyle.color != "none") {
        //         style.color = parentStyle.color;
        //     }
        //     // 使用父对象颜色作为填充色
        //     if (parentPrior && parentStyle.fillColor != null && parentStyle.fillColor != "none" && style.fillStyle != 0) {
        //         style.fillColor = parentStyle.fillColor;
        //     }
        //     // 使用父对象线宽
        //     if (parentPrior && parentStyle.lineWidth != null) {
        //         style.lineWidth = parentStyle.lineWidth * (objStyle.lineWidth == null ? 1 : objStyle.lineWidth)
        //     }

        //     if(parentStyle.allowStyleScale === true) {
        //         style.allowStyleScale = true;
        //     }
        // }

        return style;
    }
}

export default Group;
