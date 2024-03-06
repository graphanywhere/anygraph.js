/**
 * 面膜调节滤镜 <br>
 * 先定义一个马赛克范围参数，该参数越大，马赛克的格子就越大。通过该参数去到当前正在操作的像素的四周像素，并将这些像素的颜色值求出一个平均值，然后该像素四周的像素都使用求出来的颜色值。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {threshold}
 * @method
 */
const Mask = (function () {
    return function (imageData, options = {}) {
        var threshold = options.threshold || 200,
            mask = __backgroundMask(imageData, threshold);
        if (mask) {
            mask = __erodeMask(mask, imageData.width, imageData.height);
            mask = __dilateMask(mask, imageData.width, imageData.height);
            mask = __smoothEdgeMask(mask, imageData.width, imageData.height);
            __applyMask(imageData, mask);
        }
        return imageData;
    };

    function __pixelAt(idata, x, y) {
        var idx = (y * idata.width + x) * 4;
        var d = [];
        d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
        return d;
    }

    function __rgbDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1[0] - p2[0], 2) +
            Math.pow(p1[1] - p2[1], 2) +
            Math.pow(p1[2] - p2[2], 2));
    }

    function __rgbMean(pTab) {
        var m = [0, 0, 0];
        for (var i = 0; i < pTab.length; i++) {
            m[0] += pTab[i][0];
            m[1] += pTab[i][1];
            m[2] += pTab[i][2];
        }
        m[0] /= pTab.length;
        m[1] /= pTab.length;
        m[2] /= pTab.length;
        return m;
    }

    function __backgroundMask(idata, threshold) {
        var rgbv_no = __pixelAt(idata, 0, 0);
        var rgbv_ne = __pixelAt(idata, idata.width - 1, 0);
        var rgbv_so = __pixelAt(idata, 0, idata.height - 1);
        var rgbv_se = __pixelAt(idata, idata.width - 1, idata.height - 1);
        var thres = threshold || 10;
        if (__rgbDistance(rgbv_no, rgbv_ne) < thres &&
            __rgbDistance(rgbv_ne, rgbv_se) < thres &&
            __rgbDistance(rgbv_se, rgbv_so) < thres &&
            __rgbDistance(rgbv_so, rgbv_no) < thres) {
            var mean = __rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);
            var mask = [];
            for (var i = 0; i < idata.width * idata.height; i++) {
                var d = __rgbDistance(mean, [
                    idata.data[i * 4],
                    idata.data[i * 4 + 1],
                    idata.data[i * 4 + 2],
                ]);
                mask[i] = d < thres ? 0 : 255;
            }
            return mask;
        }
    }

    function __applyMask(idata, mask) {
        for (var i = 0; i < idata.width * idata.height; i++) {
            idata.data[4 * i + 3] = mask[i];
        }
    }

    function __erodeMask(mask, sw, sh) {
        var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a === 255 * 8 ? 255 : 0;
            }
        }
        return maskResult;
    }

    function __dilateMask(mask, sw, sh) {
        var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a >= 255 * 4 ? 255 : 0;
            }
        }
        return maskResult;
    }

    function __smoothEdgeMask(mask, sw, sh) {
        var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);
        var maskResult = [];
        for (var y = 0; y < sh; y++) {
            for (var x = 0; x < sw; x++) {
                var so = y * sw + x;
                var a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = y + cy - halfSide;
                        var scx = x + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = scy * sw + scx;
                            var wt = weights[cy * side + cx];
                            a += mask[srcOff] * wt;
                        }
                    }
                }
                maskResult[so] = a;
            }
        }
        return maskResult;
    }

})();


export default Mask;
