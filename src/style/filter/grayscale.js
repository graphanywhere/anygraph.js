/**
 * 灰度调节滤镜 <br>
 * 使用 加权平均值 的方式计算出灰度照片
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Grayscale (imageData, options = {}) {
    let data = imageData.data,
        len = data.length,
        brightness;

    for (let i = 0; i < len; i += 4) {
        brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        // brightness = 0.3 * data[i] + 0.6 * data[i + 1] + 0.1 * data[i + 2];   // 另一种效果
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
    }
}

export default Grayscale;
