import Blob from "../../basetype/blob.js";
import {BIN_OBJ_TYPE} from "../../basetype/blob.js";

/**
 * AWG 二进制数据格式解析 <br>
 * Adam Web GeoJSON：一直非常精简的二进制格式 <br>
 * info + feature + feature + ……
 */
class AWG {
    constructor() {
    }

    /**
     * 从axfb文件中读取设备节点数据
     * @param {Arraybuffer} content 
     * @returns Array Geomerty设备节点数组
     */
    static convert(blobContent) {
        // console.info("file length:%d", blobContent.byteLength);
        let dv = new DataView(blobContent);
        let pos = 0;
        let awgObj = {};

        while (true) {
            let header = this._getHead(dv, pos);
            pos = header.pos;
            // console.info(header);

            let buffer = blobContent.slice(pos, pos + header.dataLen);
            if (header.objType === BIN_OBJ_TYPE.FILE) {
                this._getFileInbfo(buffer, awgObj);
            } else if (header.objType === BIN_OBJ_TYPE.FEATURE) {
                this._getFeature(buffer, awgObj);
            }

            pos += header.dataLen;
            if (pos >= blobContent.byteLength) break;
        }

        awgObj.toJSON = function() {
            return "hello world";
        }
        return awgObj;
    }

    static _getHead(dv, pos) {
        let objType = dv.getUint8(pos);
        pos += 1;
        let dataLen = dv.getInt32(pos, true);
        pos += 4;
        return { objType, dataLen, pos };
    }

    static _getFileInbfo(buffer, awgObj) {
        let dv = new DataView(buffer);
        let pos = 0;
        let gwi = dv.getInt32(pos, true);
        pos += 4;
        let blockId = dv.getInt32(pos, true);
        pos += 4;
        let entityId = dv.getInt32(pos, true);
        pos += 4;
        let txtObj = Blob.getText(buffer, dv, pos)
        pos += txtObj.pos;
        let title = txtObj.text;
        Object.assign(awgObj, { gwi, blockId, entityId, title });
    }

    static _getFeature(buffer, awgObj) {
        let feature = {};
        let dv = new DataView(buffer);
        let pos = 0;

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLength = dv.getInt32(pos, true);
            pos += 4;

            if(dataLength > 0) {
                let buf = buffer.slice(pos, pos + dataLength);
                if (objType === BIN_OBJ_TYPE.COORD) {
                    this._getGeomery(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.PROPERTIES) {
                    this._getProperties(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.MARKS) {
                    this._getMarks(buf, feature);
                } else if (objType === BIN_OBJ_TYPE.SOURCE_NODE) {
                    this._getSourceNode(buf, feature);
                } else {
                    console.warn("unSupport object type! objType:%d", objType);
                }
                pos += dataLength;
            }

            if (pos >= buffer.byteLength) break;
        }
        if (awgObj.features == null) {
            awgObj.features = [];
        }
        awgObj.features.push(feature);
    }

    static _getGeomery(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let geometry = {};
        let coordType = dv.getUint8(pos);
        pos += 1;
        if (coordType == 1) {
            geometry.type = "Point";
            geometry.coordinates = this._getCoords(dv, pos, coordType);
            feature.geometry = geometry;
        } else {
            geometry.type = (coordType == 4 ? "MultiLineString" : "MultiPolygon");
            geometry.coordinates = this._getCoords(dv, pos, coordType);
            feature.geometry = geometry;
        }
        return pos;
    }

    static _getCoords(dv, pos, type) {
        if (type === 1) {
            let x = dv.getFloat32(pos, true);
            pos += 4;
            let y = dv.getFloat32(pos, true);
            pos += 4;
            return [x, y]
        } else if (type === 2 || type === 3) {
            let num = dv.getInt32(pos, true);
            pos += 4;
            let coords = [];
            for (let i = 0; i < num; i++) {
                let x = dv.getFloat32(pos, true);
                pos += 4;
                let y = dv.getFloat32(pos, true);
                pos += 4;
                coords.push([x, y]);
            }
            return coords;
        } else {
            let groupNum = dv.getInt32(pos, true);
            pos += 4;
            let groupCoord = [];
            for (let j = 0; j < groupNum; j++) {
                let num = dv.getInt32(pos, true);
                pos += 4;
                let coords = [];
                for (let i = 0; i < num; i++) {
                    let x = dv.getFloat32(pos, true);
                    pos += 4;
                    let y = dv.getFloat32(pos, true);
                    pos += 4;
                    coords.push([x, y]);
                }
                groupCoord.push(coords);
            }
            return groupCoord;
        }
    }

    static _getProperties(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let coordType = dv.getUint8(pos);
        pos += 1;
        // read properties
        let BID = dv.getInt32(pos, true);
        pos += 4;
        let ID = dv.getInt32(pos, true);
        pos += 4;
        let NODETYPE = dv.getInt32(pos, true);
        pos += 4;
        let LAYER_ID = dv.getInt32(pos, true);
        pos += 4;
        let LAYER_SID = dv.getInt32(pos, true);
        pos += 4;

        let properties;
        if (coordType == 1) {
            let SYMBOL_ID = dv.getInt32(pos, true);
            pos += 4;
            let SYMBOL_STATE = dv.getInt32(pos, true);
            pos += 4;
            let SYMBOL_ANGLE = dv.getFloat32(pos, true);
            pos += 4;
            let SYMBOL_SCALE = dv.getFloat32(pos, true);
            pos += 4;
            properties = { BID, ID, NODETYPE, LAYER_ID, LAYER_SID, SYMBOL_ID, SYMBOL_STATE, SYMBOL_ANGLE, SYMBOL_SCALE };
        } else {
            properties = { BID, ID, NODETYPE, LAYER_ID, LAYER_SID };
        }

        // SCOLOR
        let scolorObj = Blob.getText(buffer, dv, pos)
        pos = scolorObj.pos;
        let SCOLOR = scolorObj.text;
        if(SCOLOR != null && SCOLOR != "") {
            properties.SCOLOR = SCOLOR;
        }

        feature.properties = properties;
        return pos;
    }

    static _getMarks(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let markArray = [];

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLength = dv.getInt32(pos, true);
            pos += 4;
            if (objType === BIN_OBJ_TYPE.MARK && dataLength > 0) {
                markArray.push(this._getMark(buffer.slice(pos, pos + dataLength)));
            }
            pos += dataLength;
            if (pos >= buffer.byteLength) break;
        }
        feature.mark = markArray;
    }

    static _getMark(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let angle = dv.getFloat32(pos, true);
        pos += 4;
        let textheight = dv.getFloat32(pos, true);
        pos += 4;

        // text
        let txtObj = Blob.getText(buffer, dv, pos)
        pos = txtObj.pos;
        let text = txtObj.text;

        // 坐标对象
        let objT = dv.getUint8(pos);
        pos += 1;
        let objLen = dv.getInt32(pos, true);
        pos += 4;
        let coordinates;
        if(objT === BIN_OBJ_TYPE.COORD) {
            // mark的坐标为线坐标类型
            let shapeType = dv.getUint8(pos);
            //pos += 1;
            coordinates = this._getCoords(dv, pos + 1, shapeType)
            pos += objLen;   
        }

        // SCOLOR
        let scolorObj = Blob.getText(buffer, dv, pos)
        pos = scolorObj.pos;
        let SCOLOR = scolorObj.text;

        // mark对象
        let objMark = { angle, textheight, coordinates, text };
        if(SCOLOR != null && SCOLOR != "") {
            objMark.SCOLOR = SCOLOR;
        }
        return objMark;
    }

    static _getSourceNode(buffer, feature) {
        let dv = new DataView(buffer);
        let pos = 0;
        let sourcenode = [];
        let count = dv.getUint8(pos);
        pos += 1;
        for(let i=0; i<count; i++) {
            let blockId = dv.getInt32(pos, true);
            pos += 4;
            let entityId = dv.getInt32(pos, true);
            pos += 4;
            sourcenode.push([blockId, entityId]);
        }
        feature.sourcenode = sourcenode;
    }
}

export default AWG;
