/**
 * 噪声调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {noise} noise: between 0 and 1
 */
function Noise(imageData, options = {}) {
    let noise = options.noise || 0.2;
    var amount = noise * 255,
        data = imageData.data,
        nPixels = data.length,
        half = amount / 2, i;

    for (i = 0; i < nPixels; i += 4) {
        data[i + 0] += half - 2 * half * Math.random();
        data[i + 1] += half - 2 * half * Math.random();
        data[i + 2] += half - 2 * half * Math.random();
    }
}

export default Noise;

