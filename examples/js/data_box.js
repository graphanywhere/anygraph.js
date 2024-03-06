class DataBox {
    /**
     * 代码搜索器
     * containerId 容器 #id
     * data 文本字符串
     * option : 设置选项
     * {
     *     dataType: javascript, 必填，文本类型：htmlmixed/css/javascript
     *     readOnly: true, 是否只读：true/false
     * }
     */
    constructor(sObj, data, options) {
        if (null === sObj) return;
        //搜索器对象
        this.$sBox = $("#" + sObj);
        this.options = options;
        this.data = data === undefined ? "" : data;
        this.dataType = options.dataType;
        this.markers = [];
        this._init();
    }

    /**
     * 初始化
     * @private
     */
    _init() {
        this.createDataBox();
    }

    /**
     * 创建输入框
     */
    createDataBox() {
        let that = this;
        let areaId = that.$sBox.attr("id") + "_area";
        that.$sBox.html($("<textarea id='" + areaId + "' style='height:100%; width: 100%;'></textarea>"));

        that.dataBox = CodeMirror.fromTextArea(document.getElementById(areaId), {
            mode: that.dataType === undefined ? "javascript" : that.dataType,
            lineNumbers: true,
            //主题
            theme: "default",
            readOnly: that.options.readOnly === undefined ? false : that.options.readOnly
        });
        that.dataBox.setValue(that.data);
        that.dataBox.setSize(null, "100%");
    }

    //获取第一个{,如果先找到了},则需要再向下找一个{才是这段数据中的第一个{
    _getIndexOfLastLeftBrace(textBeforeCursor) {
        let leftBraceCount = 0;
        let rightBraceCount = 0;
        let indexOfLastLeftBrace = -1;

        for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
            if (textBeforeCursor[i] === "}") {
                rightBraceCount++;
            } else if (textBeforeCursor[i] === "{") {
                if (rightBraceCount > 0) {
                    rightBraceCount--;
                } else {
                    leftBraceCount++;
                    if (leftBraceCount === 1) {
                        indexOfLastLeftBrace = i;
                        break;
                    }
                }
            }
        }
        return indexOfLastLeftBrace;
    }
    //获取}
    _getIndexOfNextRightBrace(textAfterCursor) {

        let leftBraceCount = 0;
        let rightBraceCount = 0;
        let indexOfNextRightBrace = -1;

        for (let i = 0; i < textAfterCursor.length; i++) {
            if (textAfterCursor[i] === "{") {
                leftBraceCount++;
            } else if (textAfterCursor[i] === "}") {
                if (leftBraceCount > 0) {
                    leftBraceCount--;
                } else {
                    rightBraceCount++;
                    if (rightBraceCount === 1) {
                        indexOfNextRightBrace = i;
                        break;
                    }
                }
            }
        }
        // return textBeforeCursor.length + indexOfNextRightBrace;
        return indexOfNextRightBrace;
    }
    /**
     * 创建双击回调功能
     * @param func function()
     */
    dblclick(func) {
        let that = this;
        that.dataBox.on("dblclick", function (cm) {
            let clickCursor = cm.getCursor();
            function getContentBetweenBraces(cursor) {
                let textBeforeCursor = cm.getRange({ line: 0, ch: 0 }, cursor);
                let textAfterCursor = cm.getRange(cursor, { line: cm.lastLine(), ch: 0 });
                let indexOfLastLeftBrace = that._getIndexOfLastLeftBrace(textBeforeCursor);
                let indexOfNextRightBrace = that._getIndexOfNextRightBrace(textAfterCursor);
                //取出{}中的内容并实例化，判断里面是否包含type参数
                let contentBetweenBraces = textBeforeCursor.substring(indexOfLastLeftBrace) + textAfterCursor.substring(0, indexOfNextRightBrace + 1);
                let json = JSON.parse(contentBetweenBraces);
                //如果不包含type，则从{再往前找
                if (json.type === undefined) {
                    let outerCursor = {}
                    if (cursor.ch === 0) {
                        outerCursor.ch = that.dataBox.getLine(cursor.line - 1).length - 1;
                        outerCursor.line = cursor.line - 1;
                    } else {
                        outerCursor.ch = cursor.ch - 1;
                        outerCursor.line = cursor.line;
                    }
                    return getContentBetweenBraces(outerCursor);
                } else {
                    return contentBetweenBraces;
                }
            }
            let contentBetweenBraces = getContentBetweenBraces(clickCursor);
            func(JSON.parse(contentBetweenBraces));
        });
    }

    /**
     * 设置输入框只读
     * @param readOnly true/false
     */
    readOnly(readOnly) {
        this.dataBox.setOption("readOnly", readOnly);
    }

    /**
     * 设置内容
     * @param data
     */
    setData(data) {
        this.dataBox.setValue(data);
    }

    /**
     * 获取内容
     * @returns {[]|*}
     */
    getData() {
        return this.dataBox.getValue();
    }

    /**
     * 高亮字符串
     * @param str 高亮的字符串
     * @param type 高亮类型 word:字符串/line:一行/object:整个对象
     * @param clearHighLight 是否清除之前点击的高亮
     * @returns {{cursors: [], markers: []}}
     */
    highLightStr(str, type = "word", clearHighLight = true) {
        //如果要清除之前点击的高亮
        if (clearHighLight) {
            this.clearAll();
        }
        let cursor = this.dataBox.getSearchCursor(str, { line: 0, ch: 0 }, { caseFold: true });
        let cursors = [];
        let markers = [];
        switch (type) {
            case "object":
                while (cursor.findNext()) {
                    let textBeforeCursor = this.dataBox.getRange({ line: 0, ch: 0 }, cursor.pos.from);
                    let textAfterCursor = this.dataBox.getRange(cursor.pos.from, { line: this.dataBox.lastLine(), ch: 0 });
                    let indexOfLastLeftBrace = this._getIndexOfLastLeftBrace(textBeforeCursor);
                    let indexOfNextRightBrace = this._getIndexOfNextRightBrace(textAfterCursor);
                    let from = this.dataBox.posFromIndex(indexOfLastLeftBrace);
                    let to = this.dataBox.posFromIndex(textBeforeCursor.length + indexOfNextRightBrace + 1);
                    cursors.push({
                        from: from,
                        to: to
                    })
                    let marker = this.dataBox.markText(from, to, { className: "highlight" });
                    markers.push(marker);
                    if (cursors.length !== 0) {
                        this.setCursor(cursors[0].to.line, cursors[0].to.ch);
                    }
                }
                break;
            case "line":
                while (cursor.findNext()) {

                    let from = {
                        line: cursor.from().line,
                        ch: 0
                    }
                    let to = {
                        line: cursor.to().line,
                        ch: this.dataBox.getLine(cursor.to().line).length
                    }
                    cursors.push({
                        from: from,
                        to: to
                    })
                    let marker = this.dataBox.markText(from, to, { className: "highlight" });
                    markers.push(marker);
                    if (cursors.length !== 0) {
                        this.setCursor(cursors[0].to.line, cursors[0].to.ch);
                    }
                }
                break;
            case "word":
            default:

                while (cursor.findNext()) {
                    cursors.push({
                        from: cursor.from(),
                        to: cursor.to()
                    });
                    let marker = this.dataBox.markText(cursor.from(), cursor.to(), { className: "highlight" });
                    markers.push(marker);
                }
                if (cursors.length !== 0) {
                    this.setCursor(cursors[0].to.line, cursors[0].to.ch);
                }
        }
        this.markers = this.markers.concat(markers);
        return { cursors, markers };
    }

    /**
     * 根据位置高亮
     * @param from
     * @param to
     */
    highlightByCoordinate(from, to) {
        let marker = this.dataBox.markText(from, to, { className: "highlight" });
        return { cursors: [from, to], markers: [marker] }
    }

    /**
     * 设置光标位置
     * @param line 行号（从0开始）
     * @param ch 第几个字符（从0开始
     */
    setCursor(line, ch) {
        this.dataBox.setCursor(line, ch);
        this.dataBox.focus();
    }

    clearAll() {
        while (this.markers.length !== 0) {
            this.clearMarker(this.markers.shift());
        }
    };

    /**
     * 清除字符串样式
     * @param marker
     */
    clearMarker(marker) {
        marker.clear();
    }

    /**
     * 批量清除字符串样式
     * @param markers
     */
    clearMarkers(markers) {
        for (let marker of markers) {
            this.clearMarker(marker);
        }
    }
}