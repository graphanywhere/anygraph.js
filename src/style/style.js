/**
 * 通用样式
 * @class
 */
const __GemoStyle = {
    /**
     * 描述画笔（绘制图形）颜色或者样式的属性
     */
    "color": "StringColor|Gradient|Pattern",
    /**
     * 描述填充颜色和样式的属性。
     */
    "fillColor": "StringColor|Gradient|Pattern",
    /**
     * 透明度, 取值范围为: 0~1
     */
    "opacity": 1,
    /**
     * 设置要在绘制新形状时应用的合成操作的类型
     */
    "compositeOperation": "source-over|source-in|source-out|source-atop|" +
        "destination-over|destination-in|destination-out|destination-atop|" +
        "lighter|copy|xor|multiply|screen|overlay|darken|lighten|" +
        "color-dodge|color-burn|hard-light|soft-light|" +
        "difference|exclusion|hue|saturation|color|luminosity",
    /**
     * 模糊效果程度
     */
    "shadowBlur": 0,
    /**
     * 模糊颜色
     */
    "shadowColor": "StringColor",
    /**
     * 阴影水平偏移距离
     */
    "shadowOffsetX": 0,
    /**
     * 阴影垂直偏移距离
     */
    "shadowOffsetY": 0,
    /**
     * 提供模糊、灰度等过滤效果的属性 <br>
     * 详见https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/filter
     */
    "filter": "String",
    /**
     * 运行样式缩放
     */
    "allowStyleScale": false,
    /**
     * 动态路名文本样式
     */
    "labelStyle": null,
    /**
     * 矩阵变换数组，其格式为：<br>
     * [
     *     {"action":"translate", "value":[5, 5], "scaleValue":[100, 100]}, 
     *     {"action":"scale", "value":[2, 2]}, 
     *     {"action":"rotate", "value":30, "origin":[0, 0], "originPixel":[0, 0]}
     * ]
     */
    "transData": []
};

/**
 * 点样式包含的属性
 * @class
 */
const PointStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0
};
Object.assign(PointStyle, __GemoStyle);

/**
 * 线样式包含的属性
 * @class
 */
const LineStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 虚线样式
     */
    "dash": [4, 4],
    /**
     * 虚线偏移量
     */
    "dashOffset": 2,
    /**
     * 边终点的形状
     */
    "lineCap": "butt|square|round",
    /**
     * 连接属性
     */
    "lineJoin": "miter|round|bevel",
    /**
     * 斜接长度
     */
    "miterLimit": 5
};
Object.assign(LineStyle, __GemoStyle);

/**
 * 面样式包含的属性
 * @class
 */
const SurfaceStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 是否填充
     */
    "fillStyle": 1,
    /**
     * 填充规则：一种算法，决定点是在路径内还是在路径外
     */
    "fillRule": "nonzero|evenodd",
    /**
     * 边终点的形状
     */
    "lineCap": "butt|square|round",
    /**
     * 连接属性
     */
    "lineJoin": "miter|round|bevel",
    /**
     * 斜接长度
     */
    "miterLimit": 10
};
Object.assign(SurfaceStyle, __GemoStyle);

/**
 * 符号样式包含的属性
 * @class
 */
const SymbolStyle = {
    /**
     * 符号样式优先
     */
    "symbolPrior": false
};
Object.assign(SymbolStyle, __GemoStyle);

/**
 * 文本样式包含的属性
 * @class
 */
const TextStyle = {
    /**
     * 线宽
     */
    "lineWidth": 0,
    /**
     * 字体名称
     */
    "fontName": "宋体",
    /**
     * 字体大小
     */
    "fontSize": 16,
    /**
     * 是否斜体
     */
    "fontItalic": false,
    /**
     * 是否粗体
     */
    "fontBold": false,
    /**
     * 字体的粗细程度
     */
    "fontWeight": 400,
    /**
     * 是否下划线
     */
    "textDecoration": 1,
    /**
     * 水平对齐方式
     */
    "textAlign": "left|center|right",
    /**
     * 垂直对齐方式
     */
    "textBaseline": "top|middle|buttom|ideographic|alphabetic|hanging",
    /**
     * 最小显示的字体大小
     */
    "minFontSize": 6,
    /**
     * 是否填充优先
     */
    "fillPrior": true,
    /**
     * 字母之间的间距
     */
    "letterSpacing": 0,
    /**
     * 单词之间的间距
     */
    "wordSpacing": 0,
    /**
     * 是否具有边框
     */
    "fontBorder": true,
    /**
     * 边框颜色
     */
    "borderColor": "StringColor",
    /**
     * 边框透明度
     */
    "borderOpacity": 1
};
Object.assign(TextStyle, __GemoStyle);

/**
 * 图像样式包含的属性
 * @class
 */
const ImageStyle = {
    /**
     * 是否具有边框
     */
    "border": true,
    /**
     * 边框颜色
     */
    "borderColor": "StringColor",
    /**
     * 是否平滑
     */
    "imageSmoothingEnabled": true,
    /**
     * 平滑度
     */
    "imageSmoothingQuality": "low|medium|high"
};
Object.assign(ImageStyle, __GemoStyle);

export { PointStyle, LineStyle, SurfaceStyle, SymbolStyle, TextStyle, ImageStyle };
