/**
 * 亮度调节滤镜 <br>
 * 如果需要调亮，就把 rgb 每个值往上调；如果要调暗，就往下调
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {brightness}  brightness: between 0 and 1
 */
function Brighten(imageData, options = {}) {
    let brightness = (options.brightness || 0.1) * 255,
        data = imageData.data,
        len = data.length;

    for (let i = 0; i < len; i += 4) {
        data[i] += brightness;
        data[i + 1] += brightness;
        data[i + 2] += brightness;
    }
};

export default Brighten;
