/**
 * 调节RGBA通道滤镜
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {red, green, blue, alpha}
 */
function RGBA(imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        red = __checkRGB(options.red || 0),
        green = __checkRGB(options.green || 0),
        blue = __checkRGB(options.blue || 0),
        alpha = __checkAlpha(options.alpha || 0),
        ia;

    for (let i = 0; i < nPixels; i += 4) {
        ia = 1 - alpha;
        data[i] = red * alpha + data[i] * ia;
        data[i + 1] = green * alpha + data[i + 1] * ia;
        data[i + 2] = blue * alpha + data[i + 2] * ia;
    }
};

/**
 * 调节RGB通道滤镜
 * @param {*} imageData 
 * @param {*} options 
 */
const RGB = function (imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        red = __checkRGB(options.red || 255),
        green = __checkRGB(options.green || 255),
        blue = __checkRGB(options.blue || 255),
        brightness;

    for (let i = 0; i < nPixels; i += 4) {
        brightness = (0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]) / 255;
        data[i] = brightness * red;
        data[i + 1] = brightness * green;
        data[i + 2] = brightness * blue;
        data[i + 3] = data[i + 3];
    }
};


/**
 * RGB蒙版滤镜
 * 如果要做红色蒙版，首先求 rgb 3个通道的平均值，将平均值赋给红通道（r），最后将绿和蓝通道设置为0。
 * @param {*} imageData 
 * @param {*} options 
 */
const RGBMask = function (imageData, options = {}) {
    var data = imageData.data,
        nPixels = data.length,
        mask = (options.mask || 0),
        val;
    if(mask > 2 || mask < 0) mask = 0;

    for (let i = 0; i < nPixels; i += 4) {
        val = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = (mask == 0 ? val : 0);
        data[i + 1] = (mask == 1 ? val : 0);
        data[i + 2] = (mask == 2 ? val : 0);
    }
};


function __checkRGB(val = 0) {
    if (val > 255) {
        return 255;
    } else if (val < 0) {
        return 0;
    } else {
        return Math.round(val);
    }
}

function __checkAlpha(val = 1) {
    if (val > 1) {
        return 1;
    } else if (val < 0) {
        return 0;
    } else {
        return val;
    }
}

export default RGBA;
export { RGBA, RGB, RGBMask };
