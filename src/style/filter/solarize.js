/**
 * 曝光过度调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Solarize(imageData, options = {}) {
    var data = imageData.data,
        w = imageData.width,
        h = imageData.height,
        w4 = w * 4,
        y = h;

    do {
        var offsetY = (y - 1) * w4;
        var x = w;
        do {
            var offset = offsetY + (x - 1) * 4;
            var r = data[offset];
            var g = data[offset + 1];
            var b = data[offset + 2];
            if (r > 127) {
                r = 255 - r;
            }
            if (g > 127) {
                g = 255 - g;
            }
            if (b > 127) {
                b = 255 - b;
            }
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
        } while (--x);
    } while (--y);
}

export default Solarize;
