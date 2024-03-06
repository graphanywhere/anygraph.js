/**
 * 色调分离调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {levels} levels: between 0 and 1
 */
function Posterize(imageData, options = {}) {
    var levels = Math.round((options.levels || 0.5) * 254) + 1,
        data = imageData.data,
        len = data.length,
        scale = 255 / levels, i;

    for (i = 0; i < len; i += 1) {
        data[i] = Math.floor(data[i] / scale) * scale;
    }
}

export default Posterize;
