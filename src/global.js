const DATA_LAYER_ID = 10000;
let layerId = DATA_LAYER_ID;
let lastSeqID = 0;
let WATER_LAYER_ZINDEX = DATA_LAYER_ID - 9900;
let LOG_LEVEL = 2;

/**
 * 返回一个唯一字符串
 */
function getUniqueID(prefix, len) {
    if (prefix == null) {
        prefix = "G";
    } else {
        prefix = prefix.replace(dotless, "_");
    }
    lastSeqID += 1;
    len = (len == null ? prefix.length + 7 : (len > prefix.length ? len : 10));
    return prefix + _zeroPad(lastSeqID, len - prefix.length, 32);
};

function _zeroPad(num, len, radix) {
    let str = num.toString(radix || 10);
    while (str.length < len) {
        str = "0" + str;
    }
    return str.toUpperCase();
}

function getLayerId() {
    layerId++;
    return layerId;
}

export {
    getLayerId,
    DATA_LAYER_ID,
    WATER_LAYER_ZINDEX,
    LOG_LEVEL,
    getUniqueID
};

export default { "version": "1.0" };
