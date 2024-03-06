import Blob from "../../basetype/blob.js";
import {BIN_OBJ_TYPE} from "../../basetype/blob.js";
import {AjaxUtil, UrlUtil, ClassUtil} from "../../util/index.js";

/**
 * 节点类型文件名路径
 */
const AXFG_NODETYPE_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_nodetype.awg";

/**
 * 节点类型
 */
class NodeType {
    /**
     * 构造函数
     * @param {Object} options {fileName} 
     */
    constructor(options = {}) {
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }

        //nodetypeGroup: {groupName, list:[nodeType, nodeType]}
        //nodeType:{id, name, symbolList}
        this.groups_ = [];
    }
    
    /**
     * 下载符号文件，并装载数据
     * @param {String} fileUrl 
     */
    load(callback, fileUrl = AXFG_NODETYPE_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: (fileUrl.indexOf(".awb") > 0 || fileUrl.indexOf(".awg") > 0) ? "arraybuffer" : "json",
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getNodetypeFromBuffer(data);
                }

                // 装载数据
                let rtn = that.loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(rtn);
                }
            },
            error: function (res) {
                console.error(res);
            }
        });
        return;
    }

    /**
     * 装载数据
     * @param {Object} data 图层配置数据
     */
    loadData(data) {
        this.groups_ = []; //data.allnodetypelist;
        for(let i=0, ii=data.allnodetypelist.length; i<ii; i++) {
            let group = data.allnodetypelist[i]
            let groupName = group.type;
            let list = [];
            group.nodetypelist.forEach(element => {
                let id=element.nodetype;
                let name = element.nodetypename;
                let symbolList = element.symlist;
                list.push({id, name, symbolList});
            });
            this.groups_.push({groupName, list});
        }
        return this.groups_;
    }

    /**
     * 根据ID获取nodetype信息
     * @param {int} id 
     * @returns Object
     */
    get(id) {
        let nodeType = null;
        for(let i=0, ii=this.groups_.length; i<ii; i++) {
            this.groups_[i].list.forEach(node => {
                if(node.id === id) {
                    nodeType = node;
                    return;
                }
            });
            if(nodeType != null) {
                nodeType.groupName = this.groups_[i].groupName;
                break;
            }
        }
        return nodeType;
    }

    /**
     * 从Buffer中读取节点集信息
     * @param {ArrayBuffer} buffer 
     * @returns nodetypeCollection
     */
    _getNodetypeFromBuffer(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let metaObj = {"allnodetypelist":[]};

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;
            if(objType == BIN_OBJ_TYPE.NODE_TYPE) {
                let buf = buffer.slice(pos, pos + dataLen);
                this._getNodetypeBuffer(buf, metaObj);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return metaObj;
    }

    _getNodetypeBuffer(buffer, metaObj) {
        let dv = new DataView(buffer);
        let pos = 0;

        // get layer property
        let nodetype = dv.getInt32(pos, true);
        pos += 4;
        let nodetypenameObj = Blob.getText(buffer, dv, pos);
        let nodetypename = nodetypenameObj.text;
        pos = nodetypenameObj.pos;
        let groupNameObj = Blob.getText(buffer, dv, pos);
        let type = groupNameObj.text;
        pos = groupNameObj.pos;
        
        // add to group
        let groupObj = this._getGroupObj(metaObj, type);
        let layerObj = {nodetype, nodetypename};

        // symlist
        if(pos < buffer.byteLength - 1) {
            let num = dv.getUint8(pos);
            pos += 1;
            let symlist = [];
            for(let i=0; i<num; i++) {
                symlist.push(dv.getInt16(pos, true));
                pos += 2;
            }
            layerObj.symlist = symlist;
        }

        groupObj.nodetypelist.push(layerObj);
    }

    _getGroupObj(metaObj, type) {
        let group;
        for(let i=0, ii=metaObj.allnodetypelist.length; i<ii; i++) {
            if(metaObj.allnodetypelist[i].type === type) {
                group = metaObj.allnodetypelist[i];
                break;
            }
        }
        // 当不存在该组时，自动创建组
        if(group == null) {
            group = {type, "nodetypelist":[]};
            metaObj.allnodetypelist.push(group);
        }
        return group;
    }
}

export default NodeType;