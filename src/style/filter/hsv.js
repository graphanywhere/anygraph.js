/**
 * 色相/明度/饱和度调节滤镜 <br>
 * HSB（Hue、Saturation、Brightness/Value）HSB也称为HSV <br>
 * HSB与HSL是对RGB色彩模式的另外两种描述方式，尝试描述比RGB更准确的感知颜色联系 <br>
 * https://blog.csdn.net/qq_41176800/article/details/104230797
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {hue, saturation, value} <br>
 * hue: 色相, 用0~360°来表示 <br>
 * saturation: 饱和度(Saturation)，用0%~100%表示 <br>
 * value: 明度(Brightness/Value)，表示光的量，用0%~100%表示
 */
function HSV(imageData, options = {}) {
    let data = imageData.data,
        nPixels = data.length,
        v = Math.pow(2, options.value || 0), 
        s = Math.pow(2, options.saturation || 0),
        h = Math.abs((options.hue || 0) + 360) % 360;

    let vsu = v * s * Math.cos((h * Math.PI) / 180), vsw = v * s * Math.sin((h * Math.PI) / 180);
    let rr = 0.299 * v + 0.701 * vsu + 0.167 * vsw, rg = 0.587 * v - 0.587 * vsu + 0.33 * vsw, rb = 0.114 * v - 0.114 * vsu - 0.497 * vsw;
    let gr = 0.299 * v - 0.299 * vsu - 0.328 * vsw, gg = 0.587 * v + 0.413 * vsu + 0.035 * vsw, gb = 0.114 * v - 0.114 * vsu + 0.293 * vsw;
    let br = 0.299 * v - 0.3 * vsu + 1.25 * vsw, bg = 0.587 * v - 0.586 * vsu - 1.05 * vsw, bb = 0.114 * v + 0.886 * vsu - 0.2 * vsw;
    let r, g, b, a;

    for (let i = 0; i < nPixels; i += 4) {
        r = data[i + 0];
        g = data[i + 1];
        b = data[i + 2];
        a = data[i + 3];
        data[i + 0] = rr * r + rg * g + rb * b;
        data[i + 1] = gr * r + gg * g + gb * b;
        data[i + 2] = br * r + bg * g + bb * b;
        data[i + 3] = a;
    }
}

export default HSV;
