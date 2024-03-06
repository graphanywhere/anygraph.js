/**
 * 大理石滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {threshold}, threshold: between 0 and 1
 */
function Threshold(imageData, options = {}) {
    let level = (options.threshold || 0.5) * 255,
        data = imageData.data,
        len = data.length;

    for (let i = 0; i < len; i += 1) {
        data[i] = data[i] < level ? 0 : 255;
    }
}

export default Threshold;

