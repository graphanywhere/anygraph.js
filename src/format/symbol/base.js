import { Text, Polygon, Symbol } from "../../geom/index.js";
import { correctExtent } from "../../spatial/ratio.js";
import ClassUtil from "../../util/class.js";

const SYMBOL_ADD_BORDER = false;

/**
 * G符号
 */
class BaseSymbol {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        this.symbolCollection_ = {};
        this.originAtLeftTop = (options.originAtLeftTop == null ? true : (options.originAtLeftTop === false ? false : true));
    }

    /**
     * 获取所有符号
     * @returns Array
     */
    getKeyCollection() {
        let array = [];
        for (let obj in this.symbolCollection_) {
            let symbol = this.symbolCollection_[obj];
            array.push({ "id": symbol.id, "name": symbol.name, "stateCount": symbol.stateCount });
        }
        // 按符号ID排序
        array.sort((a, b) => a.id - b.id);
        return array;
    }

    /**
     * 获取符号对象
     * @param {String} id 
     * @returns {Object} 符号对象，其格式为: {name, width, height, alignCenter, id, state, childGeometrys}
     */
    getSymbol(id, state, layerSeq = 0) {
        let symbolData = this.symbolCollection_[id];
        if (symbolData == null) {
            return null;
        } else if (state == null) {
            // 缺省为最大状态的符号（开关类符号通常有两个状态，0:开，1:合)
            state = symbol.stateCount - 1;
        } else if (state > symbolData.stateCount - 1) {
            throw new Error("获取CIM/G符号失败：超过了最大状态号");
        }

        let childGeometrys = [];
        let shapes = symbolData.layers[layerSeq];
        for (let i = 0, ii = shapes.length; i < ii; i++) {
            if (shapes[i].properties.state === state) {
                childGeometrys.push(shapes[i].clone());
            } else if ( state != 0 && shapes[i].properties.state == 0 ) {
            	if ( shapes[i].getType() == "Point" ) { //pin值是各状态共享的,以便其它状态的符号获取锚点坐标
            		childGeometrys.push(shapes[i].clone());
            	}
            }
        }
        return Object.assign({}, symbolData, { "childGeometrys": childGeometrys });
        //return { "id": symbolData.id, "name": symbolData.name, "width": symbolData.width, "height": symbolData.height, "alignCenter": symbolData.alignCenter, "childGeometrys": childGeometrys };
    }

    /**
     * 获取符号列表
     * @param{int} columnNum 列数
     * @returns Array
     */
    getSymbolRenderList(columnNum = 10) {
        let gridWidth = 300;
        let gridHeight = 400;
        let space = [50, 180];
        let num = 0;
        let symbolIdArray = this.getKeyCollection();
        let list = [];
        for (let id in symbolIdArray) {
            let sym = symbolIdArray[id];
            for (let i = 0, ii = sym.stateCount; i < ii; i++) {
                let symbol = this.getSymbol(sym.id, i);
                if (symbol == null || symbol.childGeometrys.length == 0) continue;

                // 计算位置
                let col = Math.floor(num / columnNum);
                let row = num % columnNum;
                let x = row * (gridWidth + space[0]);
                let y = col * (gridHeight + space[1]);

                //符号
                let extent = correctExtent([0, 0, gridWidth, gridHeight], [0, 0, symbol.width, symbol.height]);
                let nw = extent[2] - extent[0];
                let nh = extent[3] - extent[1];
                list.push(new Symbol({
                    "x": x + gridWidth / 2, 
                    "y": y + gridHeight / 2,
                    "style": { "addBorder": SYMBOL_ADD_BORDER },
                    "width": nw, 
                    "height": nh, 
                    "symbol": symbol
                }));

                // 外框
                list.push(new Polygon({
                    "coords": [[x, y], [x, y + gridHeight], [x + gridWidth, y + gridHeight], [x + gridWidth, y], [x, y]],
                    "style": { "color": "#CCCCCC" }
                }));
/*
                // 增加名称文本
                list.push(new Text({
                    "text": (symbol.name + "/" + symbol.id + ":" + i),
                    "coords": [x, y + gridHeight + 50],
                    "width": gridWidth, "height": 30, 
                    "vectorSize":false,
                    "style": { fontBorder: false, "fillColor": "red" }
                }));
*/
                num += 1;
            }
        }

        console.debug("共加载了%d个符号, 按不同状态渲染符号数共%d个", symbolIdArray.length, num);
        return list;
    }

    /**
     * 装载符号文件
     * @param {String} fileUrl 
     */
    loadFile(callback, fileUrl) {
        ClassUtil.abstract();
    }

    /**
     * 装载符号数据
     * @param {String} fileUrl 
     */
    loadData(data) {
        ClassUtil.abstract();
    }
}

export default BaseSymbol;
