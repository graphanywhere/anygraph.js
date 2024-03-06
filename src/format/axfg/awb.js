import Blob from "../../basetype/blob.js";
import {BIN_OBJ_TYPE} from "../../basetype/blob.js";

/**
 * AWB 二进制数据格式解析 <br>
 * Adam Web Binary：二进制格式  <br>
 * objType + Dlength + value + objType + Dlength + value + ……
 */
class AWB {
    constructor() {
    }  

    /**
     * 从axfb文件中读取数据
     * @param {Arraybuffer} content 
     * @returns 内容
     */
    static convert(blobContent) {
        return this._getJSONObjectValue(blobContent);
    }


    static _getJSONObjectValue(blobContent) {
        let dv = new DataView(blobContent);
        let pos = 0;
        let key, val;    
        let awbObj = {};
        while (true) {
            let isKey = false;
            let header = this._getHead(dv, pos);
            pos = header.pos;

            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.KEY) {
                key = this._getStringValue(buffer);
                isKey = true;
            } else if (header.objType === BIN_OBJ_TYPE.STRING) {
                val = this._getStringValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.BOOLEAN) {
                val = this._getBooleanValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.INT) {
                val = this._getIntValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.FLOAT) {
                val = this._getFloatValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONOBJECT) {
                val = this._getJSONObjectValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONARRAY) {
                val = this._getJSONArrayValue(buffer);
            } else {
                console.log("unknow objtype, %d", header.objType);
            }
            if(isKey === false) {
                if(key == null) {
                    awbObj = val;
                } else {
                    awbObj[key] = val;
                    key = null;
                }
            }

            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }

        if(typeof(awbObj) === "object") {
            awbObj.toJSON = function() {
                return "hello world";
            }
        }

        return awbObj;
    }
    
    static _getJSONArrayValue(blobContent) {

        let dv = new DataView(blobContent);
        let pos = 0;
        let array = [];

        while (true) {
            let header = this._getHead(dv, pos);
            pos = header.pos;
            let val;
            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.STRING) {
                val = this._getStringValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.BOOLEAN) {
                val = this._getBooleanValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.INT) {
                val = this._getIntValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.FLOAT) {
                val = this._getFloatValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONOBJECT) {
                val = this._getJSONObjectValue(buffer);
            } else if (header.objType === BIN_OBJ_TYPE.JSONARRAY) {
                val = this._getJSONArrayValue(buffer);
            } else {
                console.warn("unknow objtype, %d", header.objType);
            }

            array.push(val);
            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }
        
        return array;
    }

    static _getStringValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let pvalue = Blob.getText(buffer, dv, pos);
        let value = pvalue.text;
        return value;
    }

    static _getBooleanValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getUint8(pos);
        return (value == 1 ? true : false);
    }

    static _getIntValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getInt32(pos, true);
        return value;
    }

    static _getFloatValue(buffer, pos = 0) {
        let dv = new DataView(buffer);
        let value = dv.getFloat32(pos, true);
        return value;
    }

    static _getHead(dv, pos) {
        let objType = dv.getUint8(pos);
        pos += 1;
        
        // get dataLen
        let dataLen = dv.getUint8(pos);
        pos += 1;
        if (dataLen === 253) {
            dataLen = dv.getUint16(pos, true);
            pos += 2;
        } else if (dataLen === 254) {
            dataLen = dv.getUint32(pos, true);
            pos += 4;
        } else if (dataLen === 255) {   // 保留
            return null;
        }

        return { objType, dataLen, pos };
    }
}

export default AWB;

