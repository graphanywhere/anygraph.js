import { getColor } from "./style.js";
import Blob from "../../basetype/blob.js";
import {BIN_OBJ_TYPE} from "../../basetype/blob.js";
import {AjaxUtil, UrlUtil, ClassUtil} from "../../util/index.js";

const GROW_STYLE_FILE_NAME = UrlUtil.getContextPath() + "/adam.lib/meta/meta_layer_style.json";

/**
 * 由GROW转出的以CIMG格式的符号集合
 */
class AxfgLayerStyle {
    /**
     * 构造函数
     * @param {Object} options {fileName, projection} 
     */
    constructor(options = {}) {
        // 分析options中是否包含了符号文件路径
        if (options.fileUrl != null) {
            this.load(null, options.fileUrl);
        }
        this.layers_ = {};

        this.status = 0;
    }

    getStatus() {
        return this.status;
    }

    /**
    * 下载图层配置文件，并装载数据
    * @param {String} fileUrl 
    */
    load(callback, fileUrl = GROW_STYLE_FILE_NAME) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: (fileUrl.indexOf(".awb") > 0 || fileUrl.indexOf(".awg") > 0) ? "arraybuffer" : "json",
            success: function (data) {
                if (ClassUtil.typeof(data) === "ArrayBuffer") {
                    data = that._getLayerStyleFromBuffer(data);
                }
                // 装载数据
                let obj = that._loadData(data);

                // 执行回调
                if (typeof (callback) === "function") {
                    callback(obj);
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
    _loadData(data) {
        for (let i = 0, ii = data.groups.length; i < ii; i++) {
            let group = data.groups[i];
            let groupname = group.groupname;
            for (let x = 0, xx = group.layers.length; x < xx; x++) {
                let layer = this._analyzeLayer(group.layers[x], groupname);
                this.layers_[layer.id] = layer;
            }
        }
        this.status = 1;
        return this.layers_;
    }

    _analyzeLayer(layerObj, groupname) {
        return Object.assign(layerObj, { groupname });
    }

    /**
     * 获取图层样式
     * @param {*} layerId 
     * @param {*} layerSid 
     * @returns Object
     */
    getLayerInfo(layerId, layerSid) {
        let layerInfo = {};
        let layerObj = this.layers_[layerId];

        // search sub layer
        if (layerObj != null && layerObj.sublayers != null) {
            if (layerObj.order == null) {
                layerObj.order = 1;
            }

            for (let i = 0, ii = layerObj.sublayers.length; i < ii; i++) {
                let subLayer = layerObj.sublayers[i];
                if (subLayer.sind === layerSid) {
                    layerInfo.groupName = layerObj.groupName || layerObj.groupname;
                    layerInfo.dydj = layerObj.property;                              // 电压等级
                    layerInfo.name = subLayer.name;
                    layerInfo.order = layerObj.order * 256 + subLayer.order;         // 顺序号
                    layerInfo.visible = subLayer.invisible;                          // 是否不可见
                    layerInfo.detail = subLayer.detail;                              // 是否显示明细
                    layerInfo.maxDist = subLayer.max_dist;                           // 是否显示明细
                    layerInfo.minDist = subLayer.min_dist;                           // 是否显示明细

                    layerInfo.style = {
                        "detail": subLayer.detail,                                    // 是否显示明细
                        "pointLineWidth": subLayer.ptlw,                              // 点符号线宽
                        "pointColor": getColor(subLayer.ptcolor),                     // 点符号颜色
                        "pointFillColor": getColor(subLayer.ptauxcolor),              // 点符号填充色

                        "lineWidth": subLayer.lw,                                     // 线宽
                        "lineType": subLayer.linestyle,                               // 线类型
                        "lineColor": getColor(subLayer.linecolor),                    // 线颜色
                        "lineFillColor": getColor(subLayer.fillcolor),                // 线填充色

                        "surfaceLineWidth": subLayer.edgewidth,                       // 面的线宽
                        "surfaceType": subLayer.fs,                                   // 面型
                        "surfaceFillColor": getColor(subLayer.facecolor),             // 面的填充色
                        "surfaceColor": getColor(subLayer.edgecolor),                 // 面的边框颜色

                        "textColor": getColor(subLayer.textcolor),                    // 文本颜色
                        "textShadowColor": getColor(subLayer.textshadowcolor),        // 文本阴影颜色
                        "textFontName": this._getChineseFontName(subLayer.VccFon),    // 中文字体
                        "textFontName2": this._getEnglishFontName(subLayer.AscFont)   // 英文字体
                    };
                    // break;
                }
            }
        }
        return layerInfo;
    }

    // //英文字体
    // typedef	enum	{
    // 	GK_ASC_FONT_LINE		= 0,	// 单线字符
    // 	GK_ASC_FONT_TIMES		= 1,	// Times
    // 	GK_ASC_FONT_COURIER		= 5,	// Courier
    // 	GK_ASC_FONT_PALATINO		= 9,	// Palatino
    // 	GK_ASC_FONT_ITCAVANTGARDEGOTHIC	= 13,	// ITC Avant Garde Gothic
    // 	GK_ASC_FONT_ITCBOOKMAN		= 17,	// ITC Bookman
    // 	GK_ASC_FONT_HELVETICA		= 21,	// Helvetica
    // 	GK_ASC_FONT_NEWCENTURYSCHOOLBOOK= 25,	// New Century Schoolbook
    // 	GK_ASC_FONT_CHARTER		= 29,	// Charter
    // 	GK_ASC_FONT_UTOPIA		= 33,	// Utopia
    // 	GK_ASC_FONT_ITCZAPFCHANCERY	= 37,	// ITC Zapf Chancery
    // 	GK_ASC_FONT_SYMBOL		= 41,	// Symbol
    // 	GK_ASC_FONT_FANGSONG		= 45,	// 简体仿宋
    // 	GK_ASC_FONT_SONGTI		= 49,	// 简体宋体
    // 	GK_ASC_FONT_HEITI		= 53,	// 简体黑体
    // 	GK_ASC_FONT_KAITI		= 57,	// 简体楷体
    // 	GK_ASC_FONT_SIMPLEX		= 62	// Simplex
    // }	GkAscFontType;

    _getEnglishFontName(ascfont) {
        let fontName = "Courier";
        if (ascfont === 1) {
            fontName = "Times";
        } else if (ascfont === 5) {
            fontName = "Courier";
        } else if (ascfont === 9) {
            fontName = "Palatino";
        } else if (ascfont === 29) {
            fontName = "Charter";
        } else if (ascfont === 33) {
            fontName = "Utopia";
        } else if (ascfont === 41) {
            fontName = "Symbol";
        }
        return fontName;
    }

    _getChineseFontName(vccfont) {
        let fontName = "宋体, simsun";
        if (vccfont === 2) {
            fontName = "黑体, 微软雅黑";
        } else if (vccfont === 3) {
            fontName = "行楷";
        } else if (vccfont === 4) {
            fontName = "黑体, 微软雅黑";
        } else if (vccfont === 5) {
            fontName = "录书";
        } else if (vccfont === 10) {
            fontName = "仿宋";
        } else if (vccfont === 11) {
            fontName = "幼圆";
        }
        return fontName;

        //         //中文字体
        // typedef	enum	{
        // 	GK_VCC_FONT_JTDX		= 0,	// 简体单线
        // 	GK_VCC_FONT_JTST,			// 简体宋体
        // 	GK_VCC_FONT_JTHT,			// 简体黑体
        // 	GK_VCC_FONT_JTXK,		= 3	// 简体行楷
        // 	GK_VCC_FONT_JTMH,			// 简体美黑
        // 	GK_VCC_FONT_JTLS,		= 5	// 简体隶书
        // 	GK_VCC_FONT_JTWB,			// 简体魏碑
        // 	GK_VCC_FONT_JTBS,			// 简体标宋
        // 	GK_VCC_FONT_JTBK,			// 简体标楷
        // 	GK_VCC_FONT_DXFS,			// 单线仿宋
        // 	GK_VCC_FONT_JTFS,		= 10// 简体仿宋
        // 	GK_VCC_FONT_YY,				// 幼圆
        // 	GK_VCC_FONT_FTBS		= 21,	// 繁体标宋
        // 	GK_VCC_FONT_FTFS,			// 繁体仿宋
        // 	GK_VCC_FONT_FTKT,			// 繁体楷体
        // 	GK_VCC_FONT_FTXY,			// 繁体细圆
        // 	GK_VCC_FONT_FTZY			// 繁体准圆
        // }	GkVccFontType;
        // //英文字体
        // typedef	enum	{
        // 	GK_ASC_FONT_LINE		= 0,	// 单线字符
        // 	GK_ASC_FONT_TIMES		= 1,	// Times
        // 	GK_ASC_FONT_COURIER		= 5,	// Courier
        // 	GK_ASC_FONT_PALATINO		= 9,	// Palatino
        // 	GK_ASC_FONT_ITCAVANTGARDEGOTHIC	= 13,	// ITC Avant Garde Gothic
        // 	GK_ASC_FONT_ITCBOOKMAN		= 17,	// ITC Bookman
        // 	GK_ASC_FONT_HELVETICA		= 21,	// Helvetica
        // 	GK_ASC_FONT_NEWCENTURYSCHOOLBOOK= 25,	// New Century Schoolbook
        // 	GK_ASC_FONT_CHARTER		= 29,	// Charter
        // 	GK_ASC_FONT_UTOPIA		= 33,	// Utopia
        // 	GK_ASC_FONT_ITCZAPFCHANCERY	= 37,	// ITC Zapf Chancery
        // 	GK_ASC_FONT_SYMBOL		= 41,	// Symbol
        // 	GK_ASC_FONT_FANGSONG		= 45,	// 简体仿宋
        // 	GK_ASC_FONT_SONGTI		= 49,	// 简体宋体
        // 	GK_ASC_FONT_HEITI		= 53,	// 简体黑体
        // 	GK_ASC_FONT_KAITI		= 57,	// 简体楷体
        // 	GK_ASC_FONT_SIMPLEX		= 62	// Simplex
        // }	GkAscFontType;

    }

    /**
     * 从Buffer中读取图层样式信息
     * @param {ArrayBuffer} buffer 
     * @returns layerStyleCollection
     */
    _getLayerStyleFromBuffer(buffer) {
        let dv = new DataView(buffer);
        let pos = 0;
        let layerStyle = {"groups":[]};

        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;

            let buf = buffer.slice(pos, pos + dataLen);
            if(objType == BIN_OBJ_TYPE.LAYER) {
                this._getLayerFromBuffer(buf, layerStyle);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return layerStyle;
    }

    _getLayerFromBuffer(buffer, layerStyle) {
        let dv = new DataView(buffer);
        let pos = 0;

        // get layer property
        let groupId = dv.getUint8(pos);
        pos += 1;
        let id = dv.getUint8(pos);
        pos += 1;
        let group = dv.getUint8(pos);
        pos += 1;
        let property = dv.getInt16(pos, true);
        pos += 2;
        let nstatus = dv.getUint8(pos);
        pos += 1;
        let order = dv.getInt16(pos, true);
        pos += 2;
        let groupNameObj = Blob.getText(buffer, dv, pos);
        let groupName = groupNameObj.text;
        pos = groupNameObj.pos;

        // add to group
        let groupObj = this._getGroupObj(layerStyle, groupId, groupName);
        let layerObj = {id, group, property, nstatus, order, "sublayers":[]};
        groupObj.layers.push(layerObj);

        // generate sub layer
        while (true) {
            let objType = dv.getUint8(pos);
            pos += 1;
            let dataLen = dv.getInt32(pos, true);
            pos += 4;
            let buf = buffer.slice(pos, pos + dataLen);
            if(objType == BIN_OBJ_TYPE.SUBLAYER) {
                this._getSubLayerFromBuffer(buf, layerObj);
            }
            pos += dataLen;
            if (pos >= buffer.byteLength) break;
        }
        return layerStyle;
    }

    _getGroupObj(layerStyle, groupid, groupname) {
        let group;
        for(let i=0, ii=layerStyle.groups.length; i<ii; i++) {
            if(layerStyle.groups[i].groupid === groupid) {
                group = layerStyle.groups[i];
                break;
            }
        }
        // 当不存在该组时，自动创建组
        if(group == null) {
            group = {groupid, groupname, "layers":[]};
            layerStyle.groups.push(group);
        }
        return group;
    }

    _getSubLayerFromBuffer(buffer, layerStyle) {
        let dv = new DataView(buffer);
        let pos = 0;
        // 基本信息
        let sind = dv.getUint8(pos);
        pos += 1;
        let invisible = dv.getUint8(pos);
        pos += 1;
        let detail = dv.getUint8(pos);
        pos += 1;
        let order = dv.getInt16(pos, true);
        pos += 2;
        // 点样式
        let ptlw = dv.getUint8(pos);
        pos += 1;
        let ptcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let ptauxcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 线样式
        let lw = dv.getUint8(pos);
        pos += 1;
        let linestyle = dv.getUint8(pos);
        pos += 1;
        let linecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let fillcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 面样式
        let edgewidth = dv.getUint8(pos);
        pos += 1;
        let fs = dv.getUint8(pos);
        pos += 1;
        let facecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let edgecolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let textcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        let textshadowcolor = this._getColorByBuffer(dv, pos);
        pos += 4;
        // 字体
        let VccFon = dv.getUint8(pos);
        pos += 1;
        let AscFont = dv.getUint8(pos);
        pos += 1;
        // 子图层名称
        let nameObj = Blob.getText(buffer, dv, pos);
        let name = nameObj.text;
        pos = nameObj.pos;

        // 子图层对象
        let sublayer = {sind, name, invisible, detail, order, ptlw, ptcolor, ptauxcolor, lw, linestyle, linecolor, fillcolor, edgewidth, fs, facecolor, edgecolor,textcolor,textshadowcolor, VccFon, AscFont};
  
         // add to layer
        if(layerStyle.sublayers == null) {
            layerStyle.sublayers = [];
        }
        layerStyle.sublayers.push(sublayer);
    }

    _getColorByBuffer(dv, pos) {
        let strColor = [dv.getUint8(pos), dv.getUint8(pos+1), dv.getUint8(pos+2), dv.getUint8(pos+3)];
        return strColor.join(",")
    }

    /**
     * 显示图层信息
     */
    printLayers() {
        for (let layerId in this.layers_) {
            let layer = this.layers_[layerId];
            for (let x = 0, xx = layer.sublayers.length; x < xx; x++) {
                let layerObj = layer.sublayers[x];
                console.info("group:%d, id:%d, sid:%d, name:%s, status:%d", layer.group, layer.id, layerObj.sind, layerObj.name, layer.nstatus);
            }
        }
    }
}

export default AxfgLayerStyle;
