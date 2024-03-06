/**
 * 对GeoJSON文件进行简化，从而减小从服务器下载时的数据传输量 <br>
 * 文件简化后，可使用format_s.js中的format进行解析
 * @param {Object} axfgfile 
 */
function simplifyFile(axfgfile) {
    let newFile = { "gwi": axfgfile.gwi, "title": axfgfile.title, "simplify": true, "layers": axfgfile.layers, "no": 1, "type": axfgfile.type, "features": [] };
    let size = 75000;
    for (let no = 0; no < Math.ceil(axfgfile.features.length / size); no++) {
        for (let i = 0; i < size; i++) {
            let rowIdx = no * size + i;
            if (axfgfile.features[rowIdx] == null) break;
            let obj = axfgfile.features[rowIdx];
            let newObj = {};
            if (obj.geometry == null || obj.geometry.coordinates == null) continue;

            let mark = _getMark(obj.mark);
            if (obj.geometry.type === "Point") {
                let coords = _coordsRound(obj.geometry.coordinates);
                let prop = _getProp(obj.properties, "Point");
                newObj = { "g": { "t": "p", "c": coords }, "m": mark, "p": prop };
            } else {
                let shapeType = obj.geometry.type === "MultiLineString" ? "l" : "f";
                let coords = _simplifyCoords(obj.geometry.coordinates, obj.geometry.type);
                coords = _coordsRound(obj.geometry.coordinates);
                let prop = _getProp(obj.properties, "Edge");
                newObj = { "g": { "t": shapeType, "c": coords }, "m": mark, "p": prop };
            }
            if (obj.sourcenode != null) {
                newObj.s = obj.sourcenode;
            }
            newFile.features.push(newObj);
        }
        console.info(axfgfile.title + ":" + (no + 1), JSON.stringify(newFile));
        newFile = { "gwi": axfgfile.gwi, "title": axfgfile.title, "simplify": true, "layers": axfgfile.layers, "no": (no + 1), "type": axfgfile.type, "features": [] };
    }
}

/**
 * 坐标四舍五入
 * @private
 * @param {Array} originalCoords 
 * @param {int} num 小数点位数
 * @returns Array
 */
function _coordsRound(originalCoords, num = 2) {
    let _round = function (originalCoord, num = 2) {
        let coords;
        if (Array.isArray(originalCoord)) {
            coords = [];
            originalCoord.forEach(ele => {
                coords.push(_round(ele, num));
            })
        } else {
            coords = MathUtil.toFixed(originalCoord, num);
        }
        return coords;
    }

    let coords = [];
    originalCoords.forEach(ele => {
        coords.push(_round(ele, num));
    })
    return coords;
}

/**
 * 简化Properties
 * @private
 * @param {*} properties 
 * @param {*} type 
 * @returns Object
 */
function _getProp(properties, type) {
    let prop;
    if (type === "Point") {
        prop = {
            "nt": properties.NODETYPE, "bid": properties.BID, "id": properties.ID, "lid": properties.LAYER_ID, "lsid": properties.LAYER_SID,
            "sid": properties.SYMBOL_ID, "ss": properties.SYMBOL_STATE, "sa": properties.SYMBOL_ANGLE, "sc": properties.SYMBOL_SCALE
        };
    } else {
        prop = { "nt": properties.NODETYPE, "bid": properties.BID, "id": properties.ID, "lid": properties.LAYER_ID, "lsid": properties.LAYER_SID };
    }
    if (properties.SCOLOR != null) {
        prop.scc = properties.SCOLOR;
    }
    return prop;
}

/**
 * 简化Mark
 * @private
 * @param {*} marks 
 * @returns Array
 */
function _getMark(marks) {
    let objs = [];
    marks.forEach(mark => {
        let t = { "t": mark.text, "a": mark.angle, "h": mark.textheight, "c": _coordsRound(mark.coordinates) };
        if (mark.SCOLOR != null) {
            t.scc = mark.SCOLOR;
        }
        objs.push(t);
    })
    return objs;
}

/**
 * 坐标简化（简化线和面的坐标点数）
 * @private
 * @param {*} coords 
 * @param {*} type 
 * @returns Array
 */
function _simplifyCoords(coords, type) {
    let newCoords = (coords == null ? [] : coords);
    let tolerance = 1;
    if (type == "MultiLineString") {
        for (let i = 0, ii = coords.length; i < ii; i++) {
            if (coords[i].length > 2) {
                // 对线和面进行简化
                newCoords[i] = simplify(coords[i], tolerance);
            }
        }
    } else if (type == "MultiPolygon") {
        for (let i = 0, ii = coords.length; i < ii; i++) {
            if (coords[i].length > 2) {
                // 对线和面进行简化
                let newCoord = simplify(coords[i], tolerance);
                while (newCoord.length < 3) {
                    tolerance = tolerance / 2;
                    newCoord = simplify(coords[i], tolerance);
                }
                newCoords[i] = newCoord;
            }
        }
    } else {
        console.error(coords, type);
    }
    return newCoords;
}

export default simplifyFile;
