import { Geometry, GGShapeType, GGeometryType } from "../../geom/index.js";
import { Graph } from "../../basetype/adt.js";

const HIGH_LIGHT_STYLE = { "color": "#FF0000", "fillColor": "#FF0000", "lineWidth": 3 };
const CONNECT_ANLYZED_STYLE = { "color": "blue", "fillColor": "blue", "lineWidth": 3 };

/**
 * AXFG数据管理
 */
class Dataset {
    constructor() {
        /**
         * 块集合，对象格式：
         * {
         *     "3" : [{"blockId":3, "entityId":100, "nodeType":12583430, "properties":{}, geometryObj, markGeometryObjs:[]}]
         * }
         */
        this._dataCollection = {};

        /**
         * 拓扑分析结构
         */
        this.graphTopo = new Graph();
    }

    /**
     * 增加图形对象至数据池中
     * @param {Geometry} geometry 
     */
    addGraphNode(geometry, marks) {
        if (geometry instanceof Geometry) {
            let blockId = geometry.properties.blockId;
            let entityId = geometry.properties.entityId;
            let nodeType = geometry.properties.nodeType;

            let blockNodes = this._dataCollection[blockId];
            if (blockNodes == null) {
                blockNodes = [];
                this._dataCollection[blockId] = blockNodes;
            }

            let newEntity = {
                "blockId": blockId,
                "entityId": entityId,
                "nodeType": nodeType,
                "geometryObj": geometry,
                "markGeometryObjs": marks
            };
            blockNodes.push(newEntity);
        }
    }

    /**
     * 移除对象
     * @param {Entity} entity 
     */
    remove(entity) {
        let blockId = entity.blockId;
        let entityId = entity.entityId;
        let blockNodes = this._dataCollection[blockId];
        if (blockNodes == null) {
            return false;
        } else {
            let index = blockNodes.findIndex(obj => obj.entityId === entityId);
            if (index < 0) {
                return false;
            } else {
                blockNodes.splice(index, 1);
                return true;
            }
        }
    }

    /**
     * 获取栈中节点的个数
     */
    size() {
        let count = 0;
        for (let key in this._dataCollection) {
            let blockNodes = this._dataCollection[key];
            count += blockNodes.length;
        }
        return count;
    }
    
    /**
     * 判断坐标是否与数据中的节点相交
     * @param {Array} coord 
     * @param {Object} options {useCoord, includeSurface, pointPrior}
     * @returns Array
     */
    contain(coord, options={}) {
        let useCoord = (options.useCoord == null ? false : options.useCoord === true);
        let includeSurface = (options.includeSurface == null ? false : options.includeSurface === true);
        let pointPrior = (options.pointPrior == null ? true : options.pointPrior === true);
        let nodes = [];
        // 逐个对象判断是否与点相交，存储与entitys数组中
        for (let key in this._dataCollection) {
            let blockNodes = this._dataCollection[key];
            for (let i = 0, ii = blockNodes.length; i < ii; i++) {
                let gobj = blockNodes[i].geometryObj;
                // 是否包含‘面’类型
                if ( ( gobj.getShapeType() === GGShapeType.SURFACE && gobj.getType() != GGeometryType.SYMBOL ) && !includeSurface) {
                    continue;
                }
                // 根据bbox判断是否与coord相交
                if (gobj.contain(coord, useCoord)) {   // gobj.getPixel() != null && 
                    nodes.push(blockNodes[i]);
                } else {
                    // 如果不与该gobj相交，还需判断是否与该gobj的文本相交
                    for (let x = 0, xx = blockNodes[i].markGeometryObjs.length; x < xx; x++) {
                        let markObj = blockNodes[i].markGeometryObjs[x];
                        if (markObj.contain(coord, useCoord)) {   // markObj.getPixel() != null && 
                            nodes.push(blockNodes[i]);
                            break;
                        }
                    }
                }
            }
        }

        // 如果选项为点优先，则如果结果中包含了线，则需要移除线
        if(pointPrior === true && nodes.length > 0) {
            let hasPoint = false;
            nodes.forEach(obj=>{
                if(obj.geometryObj.getShapeType() == GGShapeType.POINT) {
                    hasPoint = true;
                    return;
                }
            })
            if(hasPoint === true) {
                for(let i=nodes.length - 1; i>=0; i--) {
                    let obj = nodes[i];
                    if(obj.geometryObj.getShapeType() == GGShapeType.LINE) {
                        nodes.splice(i, 1);
                    }
                }
            }
        }

        return nodes;
    }

    /**
     * 清空数据
     */
    clear() {
        this._dataCollection = {};
    }

    /**
     * TODO
     */
    addTopo() {
        // 增加顶点
        for (let i = 0, ii = objList.length; i < ii; i++) {
            //console.info("idx=%d, id=%s", i, objList[i].properties.objectID);
            that.graphTopo.addVertex(objList[i].properties.objectID);
        }
        // 增加边
        for (let i = 0, ii = objList.length; i < ii; i++) {
            let link = objList[i].properties.link;
            if (link != null && link.length > 0) {
                link.forEach(element => {
                    that.graphTopo.addEdge(objList[i].properties.objectID, element);
                });
            }
        }
    }

    /**
     * 连通性分析（TODO）
     * @param {*} objId 
     */
    connectAnalyze(objId) {
        let that = this;
        // 广度搜索，并对对象着色
        this.graphTopo.bfs(objId, function (v) {
            let objArray = that.getObj(v);
            let rtn = 0;
            for (let i = 0, ii = objArray.length; i < ii; i++) {
                let obj = objArray[i];
                let symbolName = obj.properties.symbolName;
                obj.setRenderStyle(CONNECT_ANLYZED_STYLE);
                if (symbolName != null) {
                    let state = symbolName.substring(symbolName.lastIndexOf("@") + 1);
                    if (state === "0") {
                        rtn = 1;
                    }
                }
            }
            return rtn;
        });
    }

    /**
     * 从指定块的数据集中获取Node
     * @param {int} blockId 
     * @param {int} entityId 
     * @returns Object
     */
    getNode(blockId, entityId) {
        let blockNodes = this._dataCollection[blockId];
        if (blockNodes != null) {
            let index = blockNodes.findIndex(obj => obj.entityId === entityId);
            if (index >= 0) {
                return blockNodes[index];
            }
        }
        return this.getNodeAux(blockId, entityId);
    }

    /**
     * 遍历所有块，从数据集中获取Node
     * @param {int} blockId 
     * @param {int} entityId 
     * @returns Object
     */
    getNodeAux(blockId, entityId) {
        let blocks = Object.keys(this._dataCollection);       
        for(let x=0, xx=blocks.length; x<xx; x++) {
            let blockNodes = this._dataCollection[blocks[x]];
            for(let i=0, ii=blockNodes.length; i<ii; i++) {
                let obj = blockNodes[i];
                if(obj.geometryObj != null && obj.geometryObj.properties.sourceNode != null) {
                    let index = -1;
                    obj.geometryObj.properties.sourceNode.forEach(source=>{
                        if(source.blockId == blockId && source.entityId == entityId) {
                            index = i;
                            return;
                        }
                    })
                    if (index >= 0) {
                        return blockNodes[index];
                    }  
                }
            }
        }      
        return null;
    }

    /**
     * 设置节点的高亮显示样式
     * @param {Array} nodes 
     */
    setRenderStyle(nodes) {
        for (let i = 0, ii = nodes.length; i < ii; i++) {
            let gobj = nodes[i].geometryObj;
            gobj.setRenderStyle(HIGH_LIGHT_STYLE);
            for (let x = 0, xx = nodes[i].markGeometryObjs.length; x < xx; x++) {
                let markObj = nodes[i].markGeometryObjs[x];
                markObj.setRenderStyle(HIGH_LIGHT_STYLE);
            }
        }
    }

    /**
     * 清除节点的高亮显示样式
     * @param {Array} nodes 
     */
    clearRenderStyle(nodes) {
        for (let i = 0, ii = nodes.length; i < ii; i++) {
            let gobj = nodes[i].geometryObj;
            gobj.setRenderStyle(null);
            for (let x = 0, xx = nodes[i].markGeometryObjs.length; x < xx; x++) {
                let markObj = nodes[i].markGeometryObjs[x];
                markObj.setRenderStyle(null);
            }
        }
    }
}

export default Dataset;
