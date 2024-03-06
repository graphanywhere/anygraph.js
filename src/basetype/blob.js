const BIN_OBJ_TYPE = {
    "FILE": 1,
    "FEATURE": 2,
    "COORD": 11,
    "PROPERTIES": 12,
    "MARKS": 13,
    "MARK": 14,
    "SOURCE_NODE" : 15,
    "LAYER": 21,
    "SUBLAYER" : 22,
    "NODE_TYPE" : 31,

    "SYMBOL": 41,
    "SYMBOLLAYER": 45,
    "SYMBOLPIN": 51,
    "SYMBOLTEXT": 52,
    "SYMBOLPOINT": 53,
    "SYMBOLLINE": 55,
    "SYMBOLPOLYLINE": 56,
    "SYMBOLPOLYGON": 57,
    "SYMBOLRECT": 58,
    "SYMBOLCIRCLE": 59,
    "SYMBOLCIRCLEARC": 60,
    "SYMBOLELLIPSE": 61,
    
    "KEY": 80,
    "STRING": 81,
    "BOOLEAN": 82,
    "INT": 83,
    "FLOAT": 84,
    "JSONOBJECT": 85,
    "JSONARRAY": 86,
    
    // "NSTRING": 91,
    // "NBOOLEAN": 92,
    // "NINT": 93,
    // "NFLOAT": 94,
    // "NJSONOBJECT": 95,
    // "NJSONARRAY": 96,
    
    "OTHER": 255
}

/**
 * 二进制数据工具类
 */
class Blob {
    constructor() {
    }

    /**
     * 将一个包含Text内容转换为Wstring
     * @param {String} text 
     * @returns {ArrayBuffer} 消息内容
     *     Wstring数据类型定义如下:
     *       DataLen     字节数
     *       Ushort      宽字符1
     *       Ushort      宽字符2
     */
    static getWstringBuffer(text) {
        if (text == null) throw new Error("getWstringBuffer()参数不能为null");
        if (text == "") text = "\0";
        let bfText = this._str2ab(text);
        let bfDataLen = this._getDataLenBuffer(bfText.byteLength);
        let buffer = new ArrayBuffer(bfDataLen.byteLength + bfText.byteLength);
        this._concatBuffer(buffer, bfDataLen, 0);
        this._concatBuffer(buffer, bfText, bfDataLen.byteLength);
        return buffer;
    }

    /**
     * 得到一个含1个Uint8（Uchar）数字的ArrayBuffer
     * @param {int} int8 无符号整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint8Buffer(int8) {
        let buffer = new ArrayBuffer(1);
        let dv = new DataView(buffer);
        dv.setUint8(0, int8, true);
        return buffer;
    }

    /**
     * 得到一个含1个int8（char）数字的ArrayBuffer
     * @param {int} int8 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt8Buffer(int8) {
        let buffer = new ArrayBuffer(1);
        let dv = new DataView(buffer);
        dv.setInt8(0, int8, true);
        return buffer;
    }

    /**
     * 得到一个含1个Uint16数字的ArrayBuffer
     * @param {Array} int16 整数数组
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint16Buffer(int16) {
        let buffer = new ArrayBuffer(2);
        let dv = new DataView(buffer);
        dv.setUint16(0, int16, true);
        return buffer;
    }

    /**
     * 得到一个含1个Int16数字的ArrayBuffer
     * @param {int} int16 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt16Buffer(int16) {
        let buffer = new ArrayBuffer(2);
        let dv = new DataView(buffer);
        dv.setInt16(0, int16, true);
        return buffer;
    }

    /**
     * 得到一个含1个Uint32数字的ArrayBuffer
     * @param {int} int32 无符号整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getUint32Buffer(int32) {
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setUint32(0, int32, true);
        return buffer;
    }

    /**
     * 得到一个含1个Int32数字的ArrayBuffer
     * @param {int} int32 整数
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt32Buffer(int32) {
        if (typeof (int32) === "string") {
            int32 = parseInt(int32);
        }
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setInt32(0, int32, true);
        return buffer;
    }

    /**
     * 得到一个含1个Float数字的ArrayBuffer
     * @param {int} val 浮点数
     * @returns {ArrayBuffer} 消息内容
     */
    static getFloatBuffer(val) {
        let buffer = new ArrayBuffer(4);
        let dv = new DataView(buffer);
        dv.setFloat32(0, val, true);
        return buffer;
    }

    /**
     * 得到一个含Int32数组的ArrayBuffer
     * @param {Array} int32 整数数组
     * @returns {ArrayBuffer} 消息内容
     */
    static getInt32ArrayBuffer(int32) {
        let buffer = new ArrayBuffer(int32.length * 4 + 4);
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, int32.length, true);
        pos += 4;
        for (let i = 0; i < int32.length; i++) {
            dv.setInt32(pos, int32[i], true);
            pos += 4;
        }

        return buffer;
    }

    /**
     * 得到一组实体节点的ArrayBuffer
     * @param {Array} entitys 实体数组，其数组内容为{blockId, entityId}， 例如：[{blockId:3, entityId:30038}, {blockId:303, entityId:32330022}]
     * @returns {ArrayBuffer} 消息内容
     */
    static getEntitysBuffer(entitys) {
        let buffer = new ArrayBuffer(entitys.length * 8 + 4)
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, entitys.length, true);
        pos += 4;
        for (let i = 0; i < entitys.length; i++) {
            let blockId = entitys[i].blockId;
            let entityId = entitys[i].entityId;
            if(blockId == null || entityId == null) {
                throw new Error("blockId或entityId不能为空值!");
            }
            dv.setInt32(pos, blockId, true);
            pos += 4;
            dv.setInt32(pos, entityId, true);
            pos += 4;
        }
        return buffer;
    }

    /**
     * 得到一组实体节点+状态的ArrayBuffer
     * @param {Array} entitys 实体数组，其数组内容为{blockId, entityId, status}， 例如：[{blockId:3, entityId:30038, status:0}, {blockId:303, entityId:32330022, status:1}]
     * @returns {ArrayBuffer} 消息内容
     */
    static getEntityStatussBuffer(entitys) {
        let buffer = new ArrayBuffer(entitys.length * (8 + 1) + 4)
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, entitys.length, true);
        pos += 4;
        for (let i = 0; i < entitys.length; i++) {
            dv.setInt32(pos, entitys[i].blockId, true);
            pos += 4;
            dv.setInt32(pos, entitys[i].entityId, true);
            pos += 4;
            if (entitys[i].status == null) {
                dv.setUint8(pos, 1, true);
            } else {
                dv.setUint8(pos, entitys[i].status, true);
            }
            pos += 1;
        }
        return buffer;
    }

    /**
     * 得到一个范围的ArrayBuffer
     * @param {Array} extent: [x1,y1,x2,y2]
     * @returns {ArrayBuffer} 消息内容
     */
    static getExtentBuffer(extent) {
        if (typeof (extent) === "object" && extent.length === 4) {
            let buffer = new ArrayBuffer(16)
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setFloat32(pos, extent[0], true);
            pos += 4;
            dv.setFloat32(pos, extent[1], true);
            pos += 4;
            dv.setFloat32(pos, extent[2], true);
            pos += 4;
            dv.setFloat32(pos, extent[3], true);
            pos += 4;
            return buffer;
        } else {
            throw new Error("extent参数错误");
        }
    }

    /**
     * 得到多边形范围的ArrayBuffer
     * @param {Array} coords: [[x1,y1], [x2, y2], ……]
     * @returns {ArrayBuffer} 消息内容
     */
    static getPolygonBuffer(coords) {
        if (typeof (coords) === "object" && coords.length > 2) {
            let buffer = new ArrayBuffer(coords.length * 8 + 4)
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setInt32(pos, coords.length, true)
            pos += 4;
            for (let i = 0; i < coords.length; i++) {
                dv.setFloat32(pos, coords[i][0], true);
                pos += 4;
                dv.setFloat32(pos, coords[i][1], true);
                pos += 4;
            }
            return buffer;
        } else {
            throw new Error("coords参数错误");
        }
    }

    /**
     * 得到圆形范围的ArrayBuffer
     * @param {Array} coords: [x1,y1,radius]
     * @returns {ArrayBuffer} 消息内容
     */
    static getRoundBuffer(coords) {
        if (typeof (coords) === "object" && coords.length === 3) {
            let buffer = new ArrayBuffer(12)
            let dv = new DataView(buffer);
            let pos = 0;
            dv.setFloat32(pos, coords[0], true);
            pos += 4;
            dv.setFloat32(pos, coords[1], true);
            pos += 4;
            dv.setFloat32(pos, coords[2], true);
            pos += 4;
            return buffer;
        } else {
            throw new Error("extent参数错误");
        }
    }

    /**
     * 得到节点类型的ArrayBuffer
     * @param {Array} nodetypeArray
     * @returns {ArrayBuffer} 消息内容
     */
    static getNodeType(nodetypeArray) {
        let buffer = new ArrayBuffer(nodetypeArray.length * 4 + 4)
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint32(pos, nodetypeArray.length, true);
        pos += 4;
        for (let i = 0; i < nodetypeArray.length; i++) {
            //dv.setBigInt64(pos, nodetypeArray[i], true);  long类型需chrome67及以上版本方可支持，定义该类型时，需在末尾增加一个n
            dv.setInt32(pos, nodetypeArray[i], true);
            pos += 4;
        }
        return buffer;
    }

    /**
     * 得到窗口ID的ArrayBuffer
     * @returns {ArrayBuffer} 消息内容
     */
    static getWinArrayBuffer(winIdArray) {
        let buffer = new ArrayBuffer(winIdArray.length + 1)
        let dv = new DataView(buffer);
        let pos = 0;
        dv.setUint8(pos, winIdArray.length, true);
        pos += 1;
        for (let i = 0; i < winIdArray.length; i++) {
            dv.setUint8(pos, winIdArray[i], true);
            pos += 1;
        }
        return buffer;
    }

    /**
     * 合并Buffer
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _concatBuffer(targetBuffer, sourceBuffer, pos) {
        let targetArray = new Uint8Array(targetBuffer);
        let sourceArray = new Uint8Array(sourceBuffer);
        targetArray.set(sourceArray, pos);
        return targetBuffer;
    }

    /**
     * 将一个数字转换为长度Buffer
     * @param {int} dataLen
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _getDataLenBuffer(dataLen) {
        let range1 = 252;
        let range2 = (256 * 256 - 1);
        let range3 = (256 * 256 * 256 * 256 - 1);

        let buffer;
        if (dataLen == 0) {
            buffer = null;
        } else if (dataLen > 0 && dataLen <= range1) {
            buffer = new ArrayBuffer(1);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, dataLen, true);
        } else if (dataLen > range1 && dataLen <= range2) {
            buffer = new ArrayBuffer(3);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, 253, true);
            dvBuffer.setUint16(1, dataLen, true);
        } else if (dataLen > range2 && dataLen <= range3) {
            buffer = new ArrayBuffer(5);
            let dvBuffer = new DataView(buffer);
            dvBuffer.setUint8(0, 254, true);
            dvBuffer.setUint32(1, dataLen, true);
        }

        return buffer;
    }

    /**
     * 字符串转为ArrayBuffer对象，参数为字符串
     * @returns {ArrayBuffer} 消息内容
     * @private
     */
    static _str2ab(str) {
        let buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
        let bufView = new Uint16Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    /**
     * ArrayBuffer对象转字符串转，参数为ArrayBuffer
     * @private
     */
    static _ab2Str(array) {
        // 直接使用String.fromCharCode()进行转换的两种写法
        //let str1 = String.fromCharCode(...array);    //ES6支持
        //let str2 = String.fromCharCode.apply(null, array);

        // 说明：直接使用String.fromCharCode()会出现“Maximum call stack size exceeded”异常，因此需分为多段进行处理
        let res = "";
        let chunk = 8 * 1024;
        let i;
        for (i = 0; i < array.length / chunk; i++) {
            res += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
        }
        res += String.fromCharCode.apply(null, array.slice(i * chunk));
        return res;
    }

    /**
     * 读取颜色信息
     * @returns {Color} 颜色
     */
    static getColor(dv, pos) {
        let color = { r: 0, g: 0, b: 0, a: 0 };
        color.r = dv.getUint8(pos);
        color.g = dv.getUint8(pos + 1);
        color.b = dv.getUint8(pos + 2);
        color.a = dv.getUint8(pos + 3);
        //return "rgba(" + color.r + "," + color.g + "," + color.b + "," + (color.a / 100) + ")";
        return (color.a > 0 ? ("rgba(" + color.r + "," + color.g + "," + color.b + "," + ((255 - color.a) / 255) + ")") : ("rgb(" + color.r + "," + color.g + "," + color.b + ")"));
    }

    /**
     * 解析Wstring，为支持多行文本，返还值中包含了pos
     * @param {Buffer} data 
     * @param {DataView} dv 
     * @param {int} pos 
     * @returns {Object} 文本内容，格式为：{ text, pos }
     */
    static getText(data, dv, pos) {
        // 判断是否返还空值
        if (pos > (dv.byteLength - 1)) return { text: "", pos: pos };

        //Wstring     调试信息
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
        let buf = data.slice(pos, pos + dataLen);
        pos += dataLen;

        //if(buf.byteLength < 2) {   //齿轮箱返回的字符串均采用了UTF编码，
        //    debugger;
        //} else {
        return { "text": this._ab2Str(new Uint16Array(buf)), "pos": pos, "dataLen":dataLen };
        //}
    }

    /**
     * 解析Bstream
     * @param {Buffer} data 
     * @param {DataView} dv 
     * @param {int} pos 
     * @returns 二进制Image内容
     */
    static getImage(data, dv, pos) {
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
        let buf = data.slice(pos, pos + dataLen);
        pos += dataLen;

        return buf;
    }

    static getLength(dv, pos) {
        // 判断是否返还空值
        if (pos > (dv.byteLength - 1)) return { dataLen: -1, pos: pos };

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
        return { "dataLen": dataLen, "pos": pos };
    }
}

export default Blob;
export {BIN_OBJ_TYPE};
