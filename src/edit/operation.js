
/*
 * 操作类，记录数据变化，以便实现回退
 */
class Operation {
    constructor() {
        this.m_Level = 1;
        this.m_DataList = [];
    }

    begin() {
        return;
    }

    getLayer() {
        if (this.m_DataList.length > 0) {
            if (this.m_DataList[0].Layer != null)
                return this.m_DataList[0].Layer;
        }
        return null;
    }

    end(success) {
        if (success) {
            if (this.m_Level <= 0) {
                for (let i = 0; i < this.m_DataList.length; i++) {
                    let uid = null;
                    if (this.m_DataList[i].old_node)
                        uid = this.m_DataList[i].old_node.uid;
                    else if (this.m_DataList[i].new_node)
                        uid = this.m_DataList[i].new_node.uid;
                    else
                        continue;
                    let node = this.m_DataList[i].Layer.getSource().queryDataById(uid);
                    if (this.m_DataList[i].old_node != null) {
                        if (!node)
                            continue;
                        else {
                            if (this.m_DataList[i].new_node)
                                delete this.m_DataList[i].new_node;
                            this.m_DataList[i].new_node = node.clone();
                            this.m_DataList[i].new_node.setVisible(node.isVisible());
                        }
                    } else {
                        if (!node) {
                            if (this.m_DataList[i].new_node)
                                delete this.m_DataList[i].new_node;
                            this.m_DataList[i].new_node = null;
                            continue;
                        } else {
                            if (this.m_DataList[i].new_node)
                                delete this.m_DataList[i].new_node;
                            this.m_DataList[i].new_node = node.clone();
                            this.m_DataList[i].new_node.setVisible(node.isVisible());
                        }
                    }
                }
            } else {
                let i;
                for (i = 0; i < this.m_DataList.length; i++) {
                    if (this.m_DataList[i].m_Level > this.m_Level)
                        break;
                }
                for (let j = i; j < this.m_DataList.length; j++) {
                    if (this.m_DataList[j].new_node == null)
                        continue;
                    let node = this.m_DataList[j].Layer.getSource().queryDataById(this.m_DataList[j].new_node.uid);
                    if (this.m_DataList[j].new_node)
                        delete this.m_DataList[j].new_node;
                    this.m_DataList[j].new_node = null;
                    if (node) {
                        this.m_DataList[i].new_node = node.clone();
                        this.m_DataList[i].new_node.setVisible(node.isVisible());
                    }
                }
            }
        } else {

        }
    }

    undo() {
        let edges = [];
        for (let i = this.m_DataList.length - 1; i >= 0; i--) {
            if (this.m_DataList[i].old_node == null &&
                this.m_DataList[i].new_node == null)
                continue;
            if (this.m_DataList[i].old_node == null) {
                this.m_DataList[i].Layer.graph.removeGeom(this.m_DataList[i].new_node);
            } else {
                let node = this.m_DataList[i].Layer.getSource().queryDataById(this.m_DataList[i].old_node.uid);
                if (node) {
                    this.m_DataList[i].Layer.graph.removeGeom(node);
                }
                let nnode = this.m_DataList[i].old_node.clone();
                this.m_DataList[i].Layer.getSource().add(nnode);
                nnode.innerSeqId = this.m_DataList[i].old_node.innerSeqId;
                if (this.m_DataList[i].old_node.isVisible() == false) nnode.setVisible(false);
                if (nnode.getType() == "GraphEdge" ||
                    (nnode.getType() == "GraphNode" && nnode.insideshapeType == "SubGraph"))
                    edges.push(nnode);
            }
        }
        for (let i = 0; i < edges.length; i++)
            edges[i].addCB(edges[i].getLayer().graph);
    }

    redo() {
        let edges = [];
        for (let i = 0; i < this.m_DataList.length; i++) {
            if (this.m_DataList[i].old_node == null &&
                this.m_DataList[i].new_node == null)
                continue;
            if (this.m_DataList[i].old_node == null) {
                let node = this.m_DataList[i].Layer.getSource().queryDataById(this.m_DataList[i].new_node.uid);
                if (node) {
                    this.m_DataList[i].Layer.graph.removeGeom(node);
                }
                let nnode = this.m_DataList[i].new_node.clone();
                this.m_DataList[i].Layer.getSource().add(nnode);
                if (this.m_DataList[i].new_node.isVisible() == false) nnode.setVisible(false);
                nnode.innerSeqId = this.m_DataList[i].new_node.innerSeqId;
                if (nnode.getType() == "GraphEdge" ||
                    (nnode.getType() == "GraphNode" && nnode.insideshapeType == "SubGraph"))
                    edges.push(nnode);
            } else {
                let node = this.m_DataList[i].Layer.getSource().queryDataById(this.m_DataList[i].old_node.uid);
                if (node) {
                    this.m_DataList[i].Layer.graph.removeGeom(node);
                }
                if (this.m_DataList[i].new_node != null) {
                    let nnode = this.m_DataList[i].new_node.clone();
                    this.m_DataList[i].Layer.getSource().add(nnode);
                    nnode.innerSeqId = this.m_DataList[i].new_node.innerSeqId;
                    if (this.m_DataList[i].new_node.isVisible() == false) nnode.setVisible(false);
                    if (nnode.getType() == "GraphEdge" ||
                        (nnode.getType() == "GraphNode" && nnode.insideshapeType == "SubGraph"))
                        edges.push(nnode);
                }
            }
        }
        for (let i = 0; i < edges.length; i++)
            edges[i].addCB(edges[i].getLayer().graph);
    }

    saveDropNode(geom) {
        let Layer = geom.getLayer();
        for (let i = this.m_DataList.length - 1; i >= 0; i--) {
            if (this.m_DataList[i].old_node != null && this.m_DataList[i].old_node.uid == geom.uid) {
                return;
            } else if (this.m_DataList[i].new_node != null && this.m_DataList[i].new_node.uid == geom.uid) {
                return;
            }
        }
        let oneoperation = {};
        oneoperation.old_node = geom.clone();
        if (geom.isVisible() == false) oneoperation.old_node.setVisible(false);
        oneoperation.new_node = null;
        oneoperation.Layer = Layer;
        this.m_DataList.push(oneoperation);
    }
    saveCreateNode(geom) {
        let Layer = geom.getLayer();
        for (let i = this.m_DataList.length - 1; i >= 0; i--) {
            if (this.m_DataList[i].old_node != null && this.m_DataList[i].old_node.uid == geom.uid) {
                return;
            }
        }
        let oneoperation = {};
        oneoperation.old_node = null;
        oneoperation.new_node = geom.clone();
        oneoperation.Layer = Layer;
        this.m_DataList.push(oneoperation);
    }
}

export default Operation;