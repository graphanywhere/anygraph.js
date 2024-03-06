/**
 * 绘制网格线
 * @param color 颜色
 * @param stepX x轴网格间距
 * @param stepY y轴网格间距
 */
function drawGrid(color, stepX, stepY, context, options = {}) {
    if (context == null) context = ctx;
    context.save();

    let width = Math.ceil(context.canvas.width / 100) * 100;
    let height = Math.ceil(context.canvas.height / 100) * 100

    if (stepX > 0 && stepY > 0) {
        // 水平线
        context.beginPath();
        for (var i = -width; i <= width * 2; i += stepX) {
            if (i % 100 != 0) {
                context.moveTo(i, -height);
                context.lineTo(i, height * 2)
            }
        }

        // 垂直线
        for (var i = -height; i <= height * 2; i += stepY) {
            if (i % 100 != 0) {
                context.moveTo(-width, i);
                context.lineTo(width * 2, i);
            }
        }

        // 绘制
        context.lineWidth = 0.5;
        context.strokeStyle = color;
        context.stroke();

        // 水平线
        context.beginPath();
        for (var i = -width; i <= width * 2; i += stepX) {
            if (i % 100 == 0) {
                context.moveTo(i + 1, -height);
                context.lineTo(i + 1, height * 2)
            }
        }

        // 垂直线
        for (var i = -height; i <= height * 2; i += stepY) {
            if (i % 100 == 0) {
                context.moveTo(-width, i + 1);
                context.lineTo(width * 2, i + 1);
            }
        }
        // 绘制
        context.lineWidth = 1;
        context.strokeStyle = color;
        context.stroke();
    }
    // logo
    if (options.logo !== false) {
        context.fillStyle = "#A2A2A2";
        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = options.font ? options.font : "bold 16px 仿宋";
        context.fillText("图形开发学院", context.canvas.width - 10, 6);
        context.textAlign = "left";
        context.textBaseline = "bottom";
        context.fillText("www.graphAnywhere.com", 10, context.canvas.height - 6);
    }

    // restore
    context.restore();
}

// 垂直排布文字
function fillTextVertical(ctx, text, x, y) {
    let arrText = text.split('');
    let arrWidth = arrText.map(function (letter) {
        return ctx.measureText(letter).width;
    });

    ctx.save();
    let align = ctx.textAlign;
    let baseline = ctx.textBaseline;

    if (align == 'left' || align == 'start') {
        x = x + Math.max(...arrWidth) / 2;
    } else if (align == 'right') {
        x = x - Math.max(...arrWidth) / 2;
    }
    if (baseline == 'bottom' || baseline == 'alphabetic' || baseline == 'ideographic') {
        y = y - arrWidth[0] / 2;
    } else if (baseline == 'top' || baseline == 'hanging') {
        y = y + arrWidth[0] / 2;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 开始逐字绘制
    arrText.forEach(function (letter, index) {
        // 是否需要旋转判断
        let code = letter.charCodeAt(0);
        if (code <= 256) {
            // 英文字符，旋转90°
            ctx.translate(x, y);
            ctx.rotate(90 * Math.PI / 180);
            ctx.translate(-x, -y);
        } else if (index > 0 && text.charCodeAt(index - 1) < 256) {
            // y修正
            y = y + arrWidth[index - 1] / 2;
        }
        ctx.fillText(letter, x, y);
        // 旋转坐标系还原成初始态
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // 确定下一个字符的y坐标位置
        let letterWidth = arrWidth[index];
        y = y + letterWidth;
    });
    ctx.restore();
};

/**
 * 箭头大小
 */
let arrowSize = 10;

/**
 * 空心箭头的背景色
 */
let arrowBackground = "transparent";

/**
 * 实心三角形箭头
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} point {x, y, rotate}
 */
function triangleSolidArrow(ctx, point) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate((point.rotate * Math.PI) / 180);
    ctx.translate(-point.x, -point.y);
    var fromX = point.x - arrowSize;
    ctx.beginPath();
    ctx.moveTo(fromX, point.y - arrowSize / 4);
    ctx.lineTo(point.x, point.y);
    ctx.lineTo(fromX, point.y + arrowSize / 4);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
}

/**
 * 空心三角形箭头
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} point {x, y, rotate}
 */
function triangleArrow(ctx, point) {
    ctx.save();
    if (ctx.lineWidth < 2) {
        ctx.lineWidth = 2;
    }
    ctx.translate(point.x, point.y);
    ctx.rotate((point.rotate * Math.PI) / 180);
    ctx.translate(-point.x, -point.y);
    var fromX = point.x - arrowSize;
    ctx.beginPath();
    ctx.moveTo(fromX, point.y - arrowSize / 4);
    ctx.lineTo(point.x, point.y);
    ctx.lineTo(fromX, point.y + arrowSize / 4);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = arrowBackground;
    ctx.fill();
    ctx.restore();
}

/**
 * 绘制坐标值
 */
function drawCoord(context) {
    if (context == null) context = ctx;
    context.save();
    // 绘制x轴和y轴
    context.beginPath();
    context.moveTo(-2000, 0);
    context.lineTo(2000, 0);
    context.moveTo(0, -2000);
    context.lineTo(0, 2000);
    context.lineWidth = 1;
    context.strokeStyle = "red";
    context.stroke();

    // 绘制关键点坐标
    for (let x = -2000; x < 2000; x += 100) {
        for (let y = -1200; y < 1200; y += 100) {
            if (x % 200 == 0 && y % 200 == 0) {
                context.fillStyle = (x == 0 && y == 0 ? "red" : "blue");
                context.font = "16px Arial, sans-serif";
            } else {
                context.fillStyle = "#A2A2A2";
                context.font = "14px Arial, sans-serif";
            }
            context.fillText("(" + x + "," + y + ")", x, y + 20);

            context.beginPath();
            context.arc(x, y, 4, 0, 2 * Math.PI);
            context.fill();
        }
    }
    context.restore();
}

/**
 * 绘制星星
 */
function drawStar(type = 1) {
    ctx.save();
    let coords = type == 5 ? [0, -25, -15, 20, 24, -8, -24, -8, 15, 20, 0, -25] : [0, -16, 4, -4, 16, 0, 4, 4, 0, 16, -4, 4, -16, 0, -4, -4, 0, -16];
    ctx.beginPath();
    for (let i = 0; i < coords.length; i += 2) {
        if (i == 0) {
            ctx.moveTo(coords[i], coords[i + 1]);
        } else {
            ctx.lineTo(coords[i], coords[i + 1]);
        }
    }
    ctx.fill();
    ctx.restore();
}

/**
 * 获取Min和Max之间的随机整数
 */
function getRandomNum(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return Math.floor(Min + Math.round(Rand * Range));
}

/**
 * 角度转换为弧度
 */
function toRadians(angleInDegrees) {
    return (angleInDegrees * Math.PI) / 180;
}

/**
 * 将弧度转换为度
 */
function toDegrees(angleInRadians) {
    return (angleInRadians * 180) / Math.PI;
}

var raf = (function () {
    var TIME = Math.floor(1000 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
        frame = function (cb) {
            var id = Math.random();

            frames[id] = requestAnimationFrame(function onFrame(time) {
                if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                    lastFrameTime = time;
                    delete frames[id];

                    cb();
                } else {
                    frames[id] = requestAnimationFrame(onFrame);
                }
            });

            return id;
        };
        cancel = function (id) {
            if (frames[id]) {
                cancelAnimationFrame(frames[id]);
            }
        };
    } else {
        frame = function (cb) {
            return setTimeout(cb, TIME);
        };
        cancel = function (timer) {
            return clearTimeout(timer);
        };
    }

    return { frame: frame, cancel: cancel };
}());

/**
 * mini easyFramework
 */
(function (global) {
    var easyFramework = null;
    try {
        if (window.parent.easyFramework) {
            easyFramework = window.parent.easyFramework;
        } else if (window.opener && window.opener.easyFramework) {
            easyFramework = window.opener.easyFramework;
        } else if (window.dialogArguments && window.dialogArguments.easyFramework) {
            easyFramework = window.dialogArguments.easyFramework;
        } else {
            easyFramework = {};
        }
    } catch (E) {
        easyFramework = {};
    }
    global.easyFramework = easyFramework;
}(window));

/**
 * 尝试一下
 */
function createTryIt() {
    if (window.location.href.indexOf("exec.html") < 0 && top.setArguments) {
        let button = document.createElement("button");
        button.innerHTML = " 尝试一下 ";
        button.style.position = "absolute"
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.background = "-webkit-linear-gradient(top, #656565, #4c4c4c)";
        button.style.color = "white";
        button.style.padding = "10px 20px";
        button.style.margin = "4px 2px";
        button.style.fontSize = "16px";
        document.body.appendChild(button);

        button.addEventListener("click", function () {
            let pageUrl = document.location.href.substring(document.location.href.lastIndexOf("/"));
            let navMenu = parent.getExampleMenu ? parent.getExampleMenu(pageUrl) : null;
            let data = {
                "url": document.location.href,
                "horizontal": true,
                "showNavArea": navMenu == null ? false : true,
                "navMenu": navMenu
            }
            top.setArguments("execArgs", data);
            window.open("../../debug/exec.html", "debug");
        })
    }
}

/**
 * 在页面中添加标题、HTML和代码块
 */
document.addEventListener('DOMContentLoaded', function () {

    // 在页面中添加"尝试一下"
    createTryIt();

    // 在页面中添加"脚本块"
    createDescBlock();

    // 生成页头和页脚
    // createHeader();
    //createHeaderNav();
});

function createHeader(title="AnyGraph") {
    if (typeof ($) == "undefined") return;
    let strHtml = [];
    strHtml.push('<header class="header-area header-sticky background-header">');
    strHtml.push('<p class="title">' + title + '</p>');
    strHtml.push('</header>');
    $("body").prepend(strHtml.join(''));
}

function createHeaderNav() {
    let strHtml = [];
    strHtml.push('<div class="container">');
    strHtml.push('<div class="row">');
    strHtml.push('<div class="col-12">');
    strHtml.push('<nav class="main-nav">');
    strHtml.push('<a href="/anygraph/index.html" class="logo">');
    // strHtml.push('<img src="/assets/images/logo.png" alt="" style="width: 158px;">');
    strHtml.push('</a>');
    strHtml.push('<ul class="nav">');
    strHtml.push('<li><a href="/anygraph/overview.html">文档</a></li>');
    strHtml.push('<li><a href="/anygraph/demo/">示例</a></li>');
    strHtml.push('<li><a href="/anygraph/docs/">开发手册</a></li>');
    strHtml.push('<li><a target="_blank" rel="noopener" href="https://github.com/hujq88/anygraph.git">GitHub</a></li>');
    strHtml.push('</ul>');
    strHtml.push('</nav>');
    strHtml.push('</div>');
    strHtml.push('</div>');
    strHtml.push('</div>');
    $(".header-area").append(strHtml.join(''));
}

/**
 * 在页面中添加"脚本块"
 */
function createDescBlock() {
    if (typeof ($) == "undefined") return;

    if (top.location.href.indexOf("exec.html") >= 0) return;

    // 在页面中添加标题
    if (typeof (pageTitle) != "undefined" && typeof (pageDesc) != "undefined") {
        createTitleBlock(pageTitle, pageDesc)
    }

    // 在页面中添加HTML和Code块
    if (typeof (CodeMirror) != "undefined") {
        // 在页面中添加 <HTML> 内容
        // let htmls = document.getElementsByTagName("div");
        // for (let i = 0; i < htmls.length; i++) {
        //     let html = htmls[i];
        //     if ($(html).attr("data-type") == "graph")
        //         // let strHtml = html.outerHTML;
        //         createHtmlBlock('<div id="graphWrapper" data-type="graph" data-type="graph" style="width:800px; height:500px; border:solid 1px #CCC;"></div>', i);
        // }
        $("body").append("<div id='divHiddenElement'></div>");
        $("#divHiddenElement").append($("div[data-type='graph']").clone().empty());
        let strHtml = $("#divHiddenElement").html();
        $("#divHiddenElement").remove();
        createHtmlBlock(strHtml, "");

        // 在页面中添加 <Script> 内容
        let scripts = document.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
            let script = scripts[i];
            let strScript = script.innerHTML;
            if (script.type === "module" && strScript.length > 100) {
                createScriptBlock(strScript, i);
            }
        }
    }

    // 在文本框中显示数据
    if (document.getElementById("divData")) {
        showData("divData", graph.getLayer().getSource().toData({ "string": true, "id": true, "decimals": 0 }));
    }
}

function createTitleBlock(title, desc) {
    createHeader("AnyGraph示例：" + title);
    let descString = "<p class='bg-info'>本示例演示：" + desc + "</p>"
    $(".header-area").after(descString);
}

/**
 * 在页面中添加标题和描述
 */
// function createTitleBlock(title, desc) {
//     // <h2 class='demoTitle'>示例：" + title + "</h2>
//     let descString = "<p class='bg-info'>本示例演示：" + desc + "</p>"
//     $("body").prepend(descString);
// }

/**
 * 在页面中添加HTML块
 */
function createHtmlBlock(str, no = 0) {
    let cid = "html_area_" + no;
    let strHtml = [];
    strHtml.push('<h3>HTML</h3>');
    strHtml.push('<div class="htmlblock" style="margin-top: 10px; border: solid 1px #CCC;">');
    strHtml.push('<textarea id="' + cid + '"></textarea>');
    strHtml.push('</div>');
    $("body").append(strHtml.join(''));
    const htmlArea = CodeMirror.fromTextArea(document.getElementById(cid), {
        mode: "htmlmixed",
        lineNumbers: true,
        theme: "default"
    });
    htmlArea.setValue(str);
}

/**
 * 在页面中添加代码块
 */
function createScriptBlock(str, no = 0) {
    let cid = "js_area_" + no;
    let strHtml = [];
    strHtml.push('<h3>JavaScript</h3>');
    strHtml.push('<div style="margin-top: 10px; border: solid 1px #CCC;">');
    strHtml.push('<textarea id="' + cid + '"></textarea>');
    strHtml.push('</div>');
    $("body").append(strHtml.join(''));
    $("body").append("<p>&nbsp;</p>");
    const jsArea = CodeMirror.fromTextArea(document.getElementById(cid), {
        mode: "javascript",
        lineNumbers: true,
        theme: "default"
    });
    jsArea.setValue(str);
}

let searcher;
/**
 * 在页面中显示数据（geom examples)
 */
function showData(id, geoms) {
    let container = document.getElementById(id);
    if (container != null) {
        let box = (typeof (DataBox) != "undefined");
        let wrapline = "\n";
        let strData = ["[" + wrapline];
        for (let i = 0, len = geoms.length; i < len; i++) {
            strData.push("    " + geoms[i] + (i < len - 1 ? "," + wrapline : wrapline));
        }
        strData.push("]");

        let txtAreaId = "txtDataBox";
        let txtArea = document.getElementById(txtAreaId);
        if (txtArea == null) {
            txtArea = box ? document.createElement("div") : document.createElement("textarea");
            txtArea.style.fontSize = "16px";
            txtArea.style.border = "solid 1px #CCC";
            txtArea.style.outline = "blue solid 0px";
            txtArea.style.width = "100%";
            txtArea.style.height = "100%";
            txtArea.spellcheck = false;
            txtArea.setAttribute("id", "txtDataBox");
            container.appendChild(txtArea)
        }

        if (box) {
            //创建文本编辑器
            //创建文本编辑器
            let options = {
                dataType: "javascript"
            }
            searcher = new DataBox("txtDataBox", strData.join(""), options);
            searcher.readOnly(true);
            //双击返回数据
            searcher.dblclick(function (obj) {
                let layer = graph.getLayer();
                let geom = layer.getSource().queryDataById(obj.uid);
                if (geom) {
                    searcher.highLightStr(obj.uid, "object");
                    activeShape({ "geometry": geom }, false);
                }
            })
        } else {
            txtArea.innerHTML = strData.join("");
        }
    }
}

let activeGeometry;
function activeShape(args, box = true) {
    if (activeGeometry != null) {
        activeGeometry.setFocus(false);
    }
    activeGeometry = args.geometry;
    activeGeometry.setFocus(true);
    graph.render();

    if (box == true) {
        let uid = activeGeometry.uid;
        searcher.highLightStr(uid, "object");
    }
}
