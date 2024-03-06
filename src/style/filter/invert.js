/**
 * 反色调节滤镜 <br>
 * 反色的原理就是用 255 减去原来的值。也就是说红、绿、蓝各自取反。<br>
 * 在反色效果中，不需要修改 a ，因为它负责不透明度。而 rgb 如果都是 255 ，就是白色，如果都是 0 就是黑色。比如 rgb(10, 200, 100) ，那么反色就是 rgb(245, 55, 155)。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Invert(imageData, options = {}) {
    let data = imageData.data,
        len = data.length,
        i;

    for (i = 0; i < len; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
    }
};

export default Invert;
