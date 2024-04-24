import { default as Operation } from "./operation.js";

/*
 * 操作管理类，记录数据变化，以便实现回退
 */
class OperationManager {
    static m_OperationArray = [];
    static m_CurOperationID = -1;
    static m_RecordEnable = true;
    static insideundoredo = false;
    static loading = 0; //正在装入数据
    static loadingnode = [];
    static graphediting = false;
    constructor() {

    }

    /**
     * 设置是否记录数据变化
     * @param {*} flag 
     */
    static operationEnable(flag) {
        this.m_RecordEnable = flag;
    }

    /**
     * 获取是否记录数据变化
     * @returns 
     */
    static operationIsEnable() {
        return this.m_RecordEnable;
    }

    /**
     * 清除记录的数据变化
     */
    static clearAllOperation() {
        for (let i = this.m_OperationArray.length - 1; i >= 0; i--) {
            delete this.m_OperationArray[i];
        }
        this.m_OperationArray = [];
        this.m_CurOperationID = -1;
        //console.log("clearAllOperation");
    }

    /**
     * 开始一个数据操作
     * @param {boolean} [graphediting=false] 是否来自于图形编辑
     * @returns 
     */
    static beginOperation( graphediting = false ) {
        //console.log("beginOperation");
        this.graphediting = graphediting;
        if (!this.m_RecordEnable)
            return;
        if (this.m_CurOperationID != -1) {
            if (this.m_OperationArray[this.m_CurOperationID].m_Level > 0) {
                this.m_OperationArray[this.m_CurOperationID].m_Level++;
                //console.log("m_CurOperationID="+this.m_CurOperationID);
                return;
            }
        }
        let operation = new Operation();
        if (this.m_CurOperationID + 1 < this.m_OperationArray.length) {
            for (let i = this.m_OperationArray.length - 1; i > this.m_CurOperationID; i--) {
                delete this.m_OperationArray[i];
                this.m_OperationArray.splice(i, 1);
            }
        }
        if ( typeof(graph) != "undefined" && graph.saveParam != undefined ) {
            operation.param = graph.saveParam();
        }
        this.m_OperationArray.push(operation);
        this.m_CurOperationID = this.m_OperationArray.length - 1;
        //console.log("m_CurOperationID="+this.m_CurOperationID);
    }

    /**
     * 结束数据操作
     * @param {*} success 
     * @returns 
     */
    static endOperation(success=true) {
        //console.log("endOperation");
        if (!this.m_RecordEnable)
            return;
        if (this.m_CurOperationID != -1) {
            let currentLayer = null;
            this.m_OperationArray[this.m_CurOperationID].m_Level--;
            this.m_OperationArray[this.m_CurOperationID].end(success);
            if (this.m_OperationArray[this.m_CurOperationID].m_Level <= 0) {
                this.graphediting = false;
                if ( success == true && typeof(graph) != "undefined" && graph.saveParam != undefined ) {
                    this.m_OperationArray[this.m_CurOperationID].param = graph.saveParam();
                }
                if (!success) {
                    this.m_CurOperationID--;
                }
            }
            if (currentLayer != null)
                currentLayer.graph.render();
        }
        return;
    }

    /**
     * 判断是否在BeginOperation与EndOperation间
     * @returns 
     */
    static insideOperation()
    {
        if (this.m_CurOperationID != -1) {
            if ( this.m_OperationArray[this.m_CurOperationID].m_Level >= 0 )
                return true;
        }
        return false;
    }

    static IsGraphEditing()
    {
        return this.graphediting;
    }
    
    /**
     * 撤销
     */
    static undoOperation() {
        if (this.m_CurOperationID >= 0) {
            this.insideundoredo = true;
            this.m_OperationArray[this.m_CurOperationID].undo();
            this.insideundoredo = false;
            this.m_CurOperationID--;
            if ( this.m_CurOperationID >= 0 && 
                typeof(graph) != "undefined" && graph.loadParam != undefined &&
                this.m_OperationArray[this.m_CurOperationID].param != undefined )
                graph.loadParam( this.m_OperationArray[this.m_CurOperationID].param );
        }
    }

    /**
     * 重做
     */
    static redoOperation() {
        if (this.m_CurOperationID + 1 < this.m_OperationArray.length) {
            this.m_CurOperationID++;
            this.insideundoredo = true;
            this.m_OperationArray[this.m_CurOperationID].redo();
            if ( typeof(graph) != "undefined" && graph.loadParam != undefined && this.m_OperationArray[this.m_CurOperationID].param != undefined )
                graph.loadParam( this.m_OperationArray[this.m_CurOperationID].param );
            this.insideundoredo = false;
        }
    }

    /**
     * 判断是否在Undo/Redo中
     * @returns 
     */
    static insideUndoRedo() {
        return this.insideundoredo;
    }

    /**
     * 修改或删除节点前记录变化前的数据
     * @param {*} geom 
     * @returns 
     */
    static saveDropNode(geom) {
        if (!this.m_RecordEnable)
            return;
        if (this.insideundoredo)
            return;
        if (this.m_CurOperationID != -1) {
            if (this.m_OperationArray[this.m_CurOperationID].m_Level <= 0)
                return;
            this.m_OperationArray[this.m_CurOperationID].saveDropNode(geom);
        }
    }

    /**
     * 记录新增了一节点
     * @param {*} geom 
     * @returns 
     */
    static saveCreateNode(geom) {
        if (!this.m_RecordEnable)
            return;
        if (this.insideundoredo)
            return;
        if (this.m_CurOperationID != -1) {
            if (this.m_OperationArray[this.m_CurOperationID].m_Level <= 0)
                return;
            this.m_OperationArray[this.m_CurOperationID].saveCreateNode(geom);
        }
    }

    /**
     * 开始装入数据
     */
    static loadStart()
    {
        this.loading = 1;
        this.loadingnode = [];
    }

    /**
     * 记录装入的数据需要在最后进行后处理，确保节点关联数据的完整性
     * @param {*} node 
     */
    static loadAddNode( node )
    {
        this.loadingnode.push( node );
    }

    /**
     * 数据装载结束，后处理关联数据
     * @param {*} graph 
     */
    static loadFinish( graph )
    {
        //装入结束时，处理节点的关联关系，避免由于路段在路口前装入导致数据不完整的问题。
        this.loading = 2;
        for ( let i = 0; i < this.loadingnode.length; i++ ) {
            this.loadingnode[i].addCB( graph );
        }
        this.loading = 0;
       /* for ( let i = 0; i < this.loadingnode.length; i++ ) {
            if ( this.loadingnode[i].getType() == "GraphEdge") {
                if ( this.loadingnode[i].headnode == null )
                    console.log("err")
                if ( this.loadingnode[i].tailnode == null )
                    console.log("err")
            } else if ( this.loadingnode[i].getType() == "GraphNode") {
                if ( this.loadingnode[i].subnodes.length != this.loadingnode[i].subnodeids.length )
                    console.log("err")
            }

        } */
    }
}

export default OperationManager;