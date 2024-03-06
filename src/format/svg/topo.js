class SvgTopo {
    constructor() {
        // adt graph
        // this.graphTopo = null;
    }

    create() {
        // 建立拓扑分析结构
        this.graphTopo = new CBGraph();
        // 增加顶点
        for(let i=0, ii=objList.length; i<ii; i++) {
            //console.info("idx=%d, id=%s", i, objList[i].properties.objectID);
            this.graphTopo.addVertex(objList[i].properties.objectID);
        }
        // 增加边
        for(let i=0, ii=objList.length; i<ii; i++) {
            let link = objList[i].properties.link;
            if(link != null && link.length > 0) {
                link.forEach(element => {
                    this.graphTopo.addEdge(objList[i].properties.objectID, element);        
                });
            }
        }
        this.counter.print();
    }

    /**
     * 分析节点的铭牌信息
     * @param {XmlElement} node 
     * @returns Object
     */
    analyzeProperties(node) {
        let properties = {};
        if (node.nodeName === "g" || node.nodeName === "metadata" || node.nodeName === "symbol") {
        } else if (node.nodeName === "text") {
            let parentNode = node.parentNode;
            if (parentNode.nodeName === "g") {
                let objectID = parentNode.getAttribute("id");
                let refObjectID = parentNode.getAttribute("attach_id");
                properties = { objectID, refObjectID };
            }
        } else {
            let nextNode = node.nextElementSibling;
            if (nextNode != null) {
                if (nextNode.tagName === "metadata") {
                    if (nextNode.childNodes.length > 0) {
                        let linkObjectId = [];
                        for (let i = 0, ii = nextNode.childNodes.length; i < ii; i++) {
                            let child = nextNode.childNodes[i];
                            if (child.nodeName === "cge:PSR_Ref") {
                                let objectID = child.getAttribute("ObjectID");
                                let objectName = child.getAttribute("ObjectName");
                                let pSRType = child.getAttribute("PSRType");
                                let globeID = child.getAttribute("GlobeID");
                                let lineType = child.getAttribute("LineType");
                                properties.attr = { objectName, pSRType, globeID, lineType };
                                properties.objectID = objectID;
                            } else if (child.nodeName === "cge:GLink_Ref") {
                                linkObjectId.push(child.getAttribute("ObjectID"));
                            } else if (child.nodeName === "cge:Layer_Ref") {
                                let ObjectName = child.getAttribute("ObjectName");
                                properties.layerName = ObjectName;
                            }
                        }
                        properties.link = linkObjectId;
                    }
                }
            }
        }
        return properties;
    }

    connectAnalyze(objId) {
        let that = this;

        // 广度搜索，并对对象着色
        this.graphTopo.bfs(objId, function(v){
            let objArray = that.getObj(v);
            let rtn = 0;
            for(let i=0, ii=objArray.length; i<ii; i++) {
                let obj = objArray[i];
                let symbolName = obj.properties.symbolName;
                obj.setRenderStyle({"color":"blue", "fillColor":"blue"});
                if(symbolName != null) {
                    let state = symbolName.substring(symbolName.lastIndexOf("@")+1);
                    if(state === "0") {
                        rtn = 1;
                    }    
                }
            }
            return rtn;
        });
    }        

    
    getObj(objId) {
        let objArray = [];
        let objList = this.dataBuffer;
        for (let i = 0, ii = objList.length; i < ii; i++) {
            let obj = objList[i];
            if (obj.properties.objectID === objId || obj.properties.refObjectID === objId) {
                objArray.push(obj);
            }
        }
        return objArray;
    }
}
