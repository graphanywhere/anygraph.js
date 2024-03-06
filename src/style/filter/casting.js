/**
 * 熔铸调节滤镜 <br>
 * 对每个像素的R, G, B 三个值平均值大于125则设为255 反之设为0
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项
 */
function Casting(imageData, options = {}) {
    let data = imageData.data,
        len = data.length;

    for (var i = 0; i < len; i += 4) {
        let r = data[i],
            g = data[i + 1],
            b = data[i + 2];
        let newR = (r * 128) / (g + b + 1);
        let newG = (g * 128) / (r + b + 1);
        let newB = (b * 128) / (g + r + 1);
        let rgbArr = [newR, newG, newB].map((e) => {
            return e < 0 ? e * -1 : e;
        });
        [data[i], data[i + 1], data[i + 2]] = rgbArr;
    }
};

export default Casting;
