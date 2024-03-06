/**
 * 黑白调节滤镜 <br>
 * 对每个像素的R, G, B 三个值平均值大于125则设为255 反之设为0
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Black(imageData, options = {}) {
    let data = imageData.data,
        len = data.length;

    for (var i = 0; i < len; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg >= 125 ? 255 : 0;
    }
};

export default Black;
