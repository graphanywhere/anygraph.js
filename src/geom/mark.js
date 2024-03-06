import { GGeometryType, GGShapeType } from "./geometry.js";
import { default as Point } from './point.js';
import { ImageState, ImageLoader } from "../basetype/image.js";
import Extent from "../spatial/extent.js";
/**
 * 标记对象-数据类型
 * @extends Point
 */
class Mark extends Point {
    /**
     * 构造函数
     * @param {Object} options
     * @param {Coord} coords 坐标, 其格式为[x,y]，坐标位置为位图下边中间
     * @param {Object} style 
     * @param {Object} properties 
     * @param {String} src
     */
    constructor(options) {
        // 属性初始化
        super(options, ["filePath"]);

        // 类型
        this.type = GGeometryType.MARK;

        // 几何类型
        this.shapeType = GGShapeType.IMAGE;

        // 初始化
        this.initialize(options);

        // 文件路径
        this.filePath = (this.filePath == null ? "./images/icon.png" : this.filePath);

        // 旋转角度
        this.angle = 0;

        // 标记大小
        this.size = 16;
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
                } else if (typeof (coords[0]) == "number" && typeof (coords[1]) == "number") {
                    this.coords[0] = [coords[0], coords[1]];
                    this.coords[1] = [coords[0], coords[1]];
                } else {
                    throw new Error("坐标格式错误");
                }
            } else {
                this.coords = coords.slice();
            }
        }
        this.pixel = this.coords.slice();
    }

    /**
     * 返回对象边界
     * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
     * @returns {Extent} extent
     */
    getBBox(useCoord = true) {
        let coord = useCoord === false ? this.getPixel() : this.getCoord();
        let r = this.size / 2;
        let extent = [coord[0] - r, coord[1] - r, coord[0] + r, coord[1] + r];
        return extent;
    }

    /**
      * 返回对象边界
      * @param {Boolean} useCoord 为true时返回坐标Bound，为false时返回屏幕像素Bound
      * @returns {Extent} extent
      */
    getBBoxInsideSymbol(useCoord = true) {
        return getBBox(useCoord);
    }

    /**
     * 克隆对象
     * @returns Geometry
     */
    clone() {
        return new Mark(this);
    }

    /**
     * 绘制图标
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} style {color, fillColor}
     */
    draw(ctx, style, frameState) {
        if (ctx == null) ctx = this._context;

        let scale = 1;
        ctx.save();

        // 画板变换
        this.renderTransform(ctx, style.transData);

        // image
        let imgUrl;
        if (typeof (this.filePath) === "object") {
            if (this.filePath.length > 0) {
                // 根据比例尺选择图标
                let bgScale = frameState.scale;
                if (bgScale > 75000) {
                    scale = 0.8;
                    imgUrl = this.filePath[this.filePath.length - 1];
                } else if (bgScale > 40000) {
                    imgUrl = this.filePath[(this.filePath.length > 1 ? 1 : 0)];
                } else {
                    imgUrl = this.filePath[0];
                    scale = (bgScale < 1200 ? 2 : 1);
                }
            } else {
                throw new Error("marker iconFile argument error", this);
            }
        } else {
            imgUrl = this.filePath;
        }

        // 位图缩放
        Object.assign(style, { scale, imgUrl });

        // 渲染Image
        let imageObj = frameState.getLayer().getSource().getImageFromCache(imgUrl);
        if (imageObj != null && imageObj.getState() === ImageState.LOADED) {
            this.drawImage(ctx, style, imageObj.getImage(), frameState);
        } else {
            let that = this;
            // 加入缓存中，以便于下次使用
            frameState.getLayer().getSource().add2Cache(style.imgUrl);
            // 同时使用ImageLoader下载和渲染图片
            ImageLoader.load(imgUrl, function (image) {
                that.drawImage(ctx, style, image, frameState);
            }, function () {
                // frameState.getLayer().getGraph().getRenderer().renderFrame(false);
                frameState.getLayer().getGraph().renderLayer(frameState.getLayer());
            })
        }
        ctx.restore();
    }

    /**
     * 在Canvas上绘制Image
     */
    drawImage(ctx, style, image, frameState) {
        super.drawImage(ctx, style, image, frameState);

        let pixel = this.getPixel();
        // 将点信息添加至usemap对象中
        let usemap = frameState.getLayer().getGraph().mainCanvasMarkObj;
        if (usemap !== undefined) {
            let width = this.style.renderWidth;
            let height = this.style.renderHeight;
            let imageSize = (width > height ? width / 2 : height / 2);
            let title = (this.properties == null || this.properties.title == null ? null : this.properties.title);
            let click = (this.properties == null || this.properties.click == null ? null : this.properties.click);
            let mouseUp = (this.properties == null || this.properties.mouseUp == null ? null : this.properties.mouseUp);
            let mouseDown = (this.properties == null || this.properties.mouseDown == null ? null : this.properties.mouseDown);
            let mouseMove = (this.properties == null || this.properties.mouseMove == null ? null : this.properties.mouseMove);
            let area = $("<area shape =\"circle\" layerid=\"" + frameState.getLayer().getZIndex() + "\" coords =\"" + (pixel[0] - width / 2 + width / 2) + "," + (pixel[1] - height + height / 2) + "," + imageSize + "\"" + (title === null ? "" : " title=\"" + title + "\"") + "/>");
            if (click != null || mouseUp != null) {
                area.bind('mouseup', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        if (mouseUp != null) {
                            rtn = mouseUp(e);
                        } else {
                            rtn = click(e);
                        }
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            }
            if (mouseDown != null) {
                area.bind('mousedown', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        rtn = mouseDown(e);
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            } else {
                area.bind('mousedown', function (e) {
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return false;
                });
            }
            if (mouseMove != null) {
                area.bind('mousemove', function (e) {
                    let rtn = false;
                    if (e.button == 0 || e.button == 2) {    // 鼠标抬起事件为右键事件
                        rtn = mouseMove(e);
                    }
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return rtn == null ? false : rtn;
                });
            } else {
                area.bind('mousemove', function (e) {
                    e.stopPropagation();
                    e.returnValue = false;
                    e.cancelBubble = true;
                    return false;
                });
            }
            $(usemap).append(area);
        }
    };
}

export default Mark;
