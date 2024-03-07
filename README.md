# AnyGraph.js

## 1 AnyGraph 是什么?

&emsp;&emsp;**AnyGraph**中文名 前端图形开发引擎，该引擎是一个灵活、可扩展的WEB图形开源JavaScript库，实现了点、折线、矩形、圆形、多边形等基本几何对象和路径、组、符号等组合复杂对象的图形渲染和编辑功能，以及对图形的缩放、漫游、拾取、突出显示等交互性功能，并可支持加载SVG、GeoJson、CIM/G等格式的矢量数据，可用于在任何网页应用中创建和显示动态图形。

&emsp;&emsp;更多说明参见[AnyGraph官方文档](https://www.graphanywhere.com/anygraph/)。

## 2 安装 AnyGraph

### Github 下载

https://gitee.com/graphanywhere/anygraph

或

https://github.com/graphanywhere/anygraph

### 使用包管理器

(即将支持) npm install anygraph

## 3 开发说明

### 浏览器

AnyGraph 适用于所有现代移动和桌面浏览器。浏览器需要能够运行 ECMAScript 6 规范中的javascript代码。

### 加载anyGraph

AnyGraph 采用es 模块进行开发，可通过以下方式在浏览器中运行：

``` html
<script type="module">
    import { Graph } from "../../src/index.js";
    ......
</script>
```

## 4 示例

### 4.1 显示基本形状

``` html
<!DOCTYPE html>
<html lang="zh_CN">

<head>
    <title>绘制基本图形(矩形)</title>
    <meta charset="UTF-8">
</head>

<body style="margin:10px;">
    <div id="graphWrapper" data-type="graph" style="width:600px; height:200px; border:solid 1px #CCC;"></div>
</body>
<script type="module">
    import { Graph, Rect } from "../../src/index.js";

    // graph对象
    let graph = new Graph({
        "target": "graphWrapper"
    });
    
    // 新建绘图图层
    let layer = graph.addLayer();
    
    // 绘制矩形
    layer.getSource().add(new Rect({ "x": 50, "y": 50, "width": 200, "height": 100, "style":{"lineWidth":4 , "color":"blue"} }));
    layer.getSource().add(new Rect({ "x": 350, "y": 50, "width": 200, "height": 100, "rx":10, "ry":10, "style":{ "fillColor" : "#9FFFFF", "fillStyle":1, "lineWidth":4 , "color":"red" } }));

    graph.render();
</script>

</html>

```

### 4.2 加载SVG数据

``` html
<!DOCTYPE html>
<html lang="zh_CN">

<head>
    <title>SVG</title>
    <meta charset="UTF-8">

    <script type="module">
        import { Graph, VectorSource, Layer, SvgFormat } from "../../src/index.js";

        // 数据源
        let fileUrl = "../../demo-data/tiger.svg";

        // graph对象
        let graph = new Graph({
            "target": "graphWrapper",
            "layers": [
                new Layer({
                    "source": new VectorSource({
                        "dataType": "xml",
                        "fileUrl": fileUrl,
                        "format": new SvgFormat()
                    })
                })
            ]
        });
    </script>
</head>

<body style="margin:0px;" oncontextmenu="return false;">
    <div id="graphWrapper" data-type="graph" style="position:absolute; width:100%; height:100%; border:solid 0px #CCC;"></div>
</body>

</html>
```

