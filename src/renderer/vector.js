import LayerRenderer from "./layer.js";
import { GGeometryType, Geometry, Point, Polygon, GGShapeType, MultiPolyline, Text, Symbol } from "../geom/index.js";
import Extent from "../spatial/extent.js";
import Ratio from "../spatial/ratio.js";
import { getTypeStyle } from "../format/axfg/style.js";
import Transform from "../spatial/transform.js";
import EventType from "../basetype/event.type.js";
import { LOG_LEVEL } from "../global.js";
import { Color } from "../style/index.js";

/**
 * 矢量数据图层渲染类
 */
class VectorRenderer extends LayerRenderer {
    constructor() {
        super();
    }

    /**
     * 将source合成画面
     */
    composeBuffer(frameState) {
        let beginTime = Date.now();
        let t1 = 0, t2 = 0, t3 = 0;
        // 取出待渲染的数据
        let buffer;
        if (frameState.extent == null) {
            buffer = this.getLayer().getSource().getData();
        } else {
            buffer = this.getLayer().getSource().getExtentData(frameState.extent);
        }
        t1 = (Date.now() - beginTime);
        beginTime = Date.now();
        // 清空mainCanvasMarkObj中的内容
        if (this.getLayer().getGraph().mainCanvasMarkObj !== undefined) {
            let layerId = this.getLayer().getZIndex();
            $(this.getLayer().getGraph().mainCanvasMarkObj).children("[layerid='" + layerId + "']").remove();
        }

        // 触发图层事件
        this.getLayer().triggerEvent(EventType.ComposeBefore, { "layer": this.getLayer(), "frameState": frameState, "context": this._context, "buffer": buffer });

        let pointCount = 0;
        if (buffer == null || buffer.length == 0) {
            this.clearScreen();
        } else {
            this.clearScreen();
            // 坐标转换为像素
            pointCount = this._convert2Pixel(buffer, frameState);
            // 裁切, 测试并没有提升效率2023/7/7
            // if (frameState.extent != null) {
            //     this.clip(this._context, [0, 0, frameState.size.width, frameState.size.height]);
            // }
            t2 = (Date.now() - beginTime);
            beginTime = Date.now();

            // 在画板中渲染矢量数据
            if (this.getLayer().isUseTransform()) {
                this._context.save();
                let trans = frameState.coordinateToPixelTransform;
                this._context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4], trans[5]);
                this._loopDraw(buffer, this._context, frameState);
                this._context.restore();
            } else {
                this._loopDraw(buffer, this._context, frameState);
            }
            t3 = (Date.now() - beginTime);
        }

        // 返回执行时间
        let execTime = t1 + t2 + t3; //(Date.now() - beginTime);
        if ((LOG_LEVEL > 3 || execTime > 120) && execTime > 10) {
            console.debug("execute VectorRenderer.composeBuffer(), name:%s, time:%dms, nodeCount:%d, coordCount:%d, getData():%d, conver2Pixel():%d, loopDraw():%d",
                this.getLayer().getFullName(), execTime, (buffer == null ? 0 : buffer.length), pointCount, t1, t2, t3);
        }

        // 触发图层事件
        this.getLayer().triggerEvent(EventType.ComposeAfter, { "layer": this.getLayer(), "frameState": frameState, "context": this._context });

        return buffer == null ? 0 : buffer.length;
    }

    /**
     * 将坐标转换为像素
     * @param {Array} list
     */
    _convert2Pixel(list, frameState) {
        let pointCount = 0;
        if (this.getLayer().isUsePixelCoord() || this.getLayer().isUseTransform()) {
            let transform = Transform.create();
            for (let i = 0; i < list.length; i++) {
                let obj = list[i];
                if (obj instanceof Geometry) {
                    obj.toPixel(transform);
                    obj.styleToPixel(transform);
                    pointCount += obj.getCoord().length;
                }
            }
        } else {
            let ratio;
            if (frameState.useMatrix === true) {
                ratio = new Ratio();
                let size = frameState.size;
                ratio.setCanvasExtent([0, 0, size.width, size.height]);
                ratio.setWorldExtent(frameState.extent);
                ratio.setWorldExtentOrigin(this.getLayer().getGraph().originAtLeftTop);
            }
            // 逐个对象进行转换
            for (let i = 0; i < list.length; i++) {
                let obj = list[i];
                if (obj instanceof Geometry) {
                    if (frameState.useMatrix === true) {
                        obj.toPixel(ratio);
                        obj.styleToPixel(ratio);
                    } else {
                        obj.toPixel(frameState.coordinateToPixelTransform);
                        obj.styleToPixel(frameState.coordinateToPixelTransform);
                    }
                    pointCount += obj.getCoord().length;
                }
            }
        }
        return pointCount;
    }

    /**
     * 数据渲染
     * @param {Array} list 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} frameState
     */
    _loopDraw(list, ctx, frameState) {
        if (ctx == null) ctx = this._context;
        let mergeLineObj = new MultiPolyline({ "coords": [] });
        let mergeLine = false;

        ctx.save();

        // 整体偏移
        let offset = this.getLayer().getOffset();
        ctx.translate(offset.x, offset.y);

        // 逐个对象开始渲染
        for (let i = 0, ii = list.length; i < ii; i++) {
            let goon = true;
            let obj = list[i];
            let style = this._getStyle(obj);

            // 动态样式
            if (typeof (style.dynamicFn) === "function") {
                goon = style.dynamicFn(obj, style, frameState);
            }

            // 将polyline合并为multiPolyline，从而提高渲染效率
            if (obj.getType() === GGeometryType.POLYLINE && this.getLayer().getStyle().mergeLine === true && obj.getRenderStyle() == null) {
                mergeLineObj.addLine(obj, style);
                mergeLine = true;
                continue;
            }

            // 对象渲染
            if (style.visible !== false) {
                if (goon || goon == null) {
                    obj.draw(ctx, style, frameState);
                    // 绘制边框
                    if (LOG_LEVEL > 3 || obj.isFocus()) {
                        obj.drawBorder(ctx, style);
                    }
                    // 当frameState.viewGeomList不为空时，绘制用于拾取的颜色框
                    if (this._hitContext && frameState.viewGeomList != null && !this.getLayer().isAuxLayer()) {
                        let hitStyle = style;
                        let uniqueColor = obj.prop("uniqueColor");
                        if (uniqueColor == null) {
                            uniqueColor = Color.getUniqueColor().toHex();
                            obj.prop("uniqueColor", uniqueColor);
                        }
                        if (hitStyle.color != null && hitStyle.color != "none") {
                            hitStyle.color = uniqueColor;
                            frameState.viewGeomList.set(uniqueColor, obj);
                        }
                        if (hitStyle.fillColor != null && hitStyle.fillColor != "none") {
                            hitStyle.fillColor = uniqueColor;
                            frameState.viewGeomList.set(uniqueColor, obj);
                        }
                        // 绘制拾取颜色框
                        obj.drawHitBlock(this._hitContext, hitStyle, frameState);
                    }
                }
            }
        }

        if (mergeLine === true) {
            mergeLineObj.draw(ctx, mergeLineObj.style, frameState);
        }
        ctx.restore();
    }

    /**
     * 获取样式，优先级：对象样式>符号样式>图层样式
     * @param {Geometry} obj 
     * @returns style
     */
    _getStyle(obj) {
        let objStyle = obj.style;
        let layerStyle = this._getTypeStyle(obj, this.getLayer().getStyle());

        // 父style是否优先
        let layerPrior = (layerStyle !== null && layerStyle.layerPrior === true ? true : false);
        let style = (layerPrior ? Object.assign({}, objStyle, layerStyle) : Object.assign({}, layerStyle, objStyle));

        // 对象附加样式最优先
        Object.assign(style, obj.getRenderStyle());

        return style;
    }

    /**
     * 根据几何对象类型从layerStyle获取相应样式
     * @private
     * @param {*} obj 
     * @param {*} layerStyle 
     * @returns Object
     */
    _getTypeStyle(obj, layerStyle) {
        // 根据几何对象类型从layerStyle获取相应样式
        let style = {};
        if (obj instanceof Geometry) {
            if (obj instanceof Polygon) {
                style = getTypeStyle(GGShapeType.SURFACE, layerStyle)
            } else if (obj instanceof Text) {
                style = getTypeStyle(GGShapeType.TEXT, layerStyle)
            } else if (obj instanceof Point || obj instanceof Symbol) {
                style = getTypeStyle(GGShapeType.POINT, layerStyle)
            } else {
                style = getTypeStyle(GGShapeType.LINE, layerStyle)
            }
        } else {
            style = getTypeStyle(GGShapeType.OTHER, layerStyle)
        }
        return style;
    }

    /**
     * 裁切
     * @param {CanvasRenderingContext2D} context 
     * @param {*} extent 
     * @private
     */
    clip(context, extent) {
        let topLeft = Extent.getTopLeft(extent);
        let topRight = Extent.getTopRight(extent);
        let bottomRight = Extent.getBottomRight(extent);
        let bottomLeft = Extent.getBottomLeft(extent);
        //context.save();
        context.beginPath();
        context.moveTo(topLeft[0], topLeft[1]);
        context.lineTo(topRight[0], topRight[1]);
        context.lineTo(bottomRight[0], bottomRight[1]);
        context.lineTo(bottomLeft[0], bottomLeft[1]);
        context.clip();
        context.closePath();
        //context.restore()
    };

    /**
     * 清空画板内容
     * @param {CanvasRenderingContext2D} ctx 
     * @returns Object
     */
    clearContext(ctx) {
        let size = this.getSize();
        ctx.clearRect(0, 0, size.width, size.height);
        return this;
    }
}

export default VectorRenderer;
