/**
 * 对比度调节滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {contrast} contrast: between -100 and 100
 */
function Contrast(imageData, options = {}) {
	let contrast = options.contrast || 20;
    var adjust = Math.pow((contrast + 100) / 100, 2);
    var data = imageData.data,
        nPixels = data.length,
        red = 150, green = 150, blue = 150;

    for (let i = 0; i < nPixels; i += 4) {
        red = data[i];
        green = data[i + 1];
        blue = data[i + 2];
        red /= 255;
        red -= 0.5;
        red *= adjust;
        red += 0.5;
        red *= 255;
        green /= 255;
        green -= 0.5;
        green *= adjust;
        green += 0.5;
        green *= 255;
        blue /= 255;
        blue -= 0.5;
        blue *= adjust;
        blue += 0.5;
        blue *= 255;
        red = red < 0 ? 0 : red > 255 ? 255 : red;
        green = green < 0 ? 0 : green > 255 ? 255 : green;
        blue = blue < 0 ? 0 : blue > 255 ? 255 : blue;
        data[i] = red;
        data[i + 1] = green;
        data[i + 2] = blue;
    }
};

export default Contrast;