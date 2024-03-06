/**
 * 浮雕调节滤镜 <br>
 * 浮雕图像效果是指图像的前景前向凸出背景。<br>
 * 所谓的“浮雕”处理是指图像上的一个像素和它左上方的那个像素之间的差值的一种处理过程，为了使图像保持一定的亮度并呈现灰色，在处理过程中为这个差值加上一个数值为128的常量，需要注意的是，当设置一个像素值的时候，它和它的左上方的像素都要被用到，为了避免用到已经设置过的像素，应该从图像的右下方的像素开始处理，这样还会出现一个问题就是图像最左方和最上方的没有得到处理，这里我把它们的像素值设为128。
 * @param {ImageData} imageData 像素数据
 * @param {Object} options 选项 {embossStrength, embossWhiteLevel, embossDirection, embossBlend}
 */
function Emboss(imageData, options = {}) {
    let strength = (options.embossStrength || 0.5) * 10,
        greyLevel = (options.embossWhiteLevel || 0.5) * 255,
        direction = (options.embossDirection || "top-left"),
        blend = (options.embossBlend == null ? false : options.embossBlend),
        dirY = 0,
        dirX = 0,
        data = imageData.data,
        w = imageData.width,
        h = imageData.height,
        w4 = w * 4, 
        y = h;

    switch (direction) {
        case 'top-left':
            dirY = -1;
            dirX = -1;
            break;
        case 'top':
            dirY = -1;
            dirX = 0;
            break;
        case 'top-right':
            dirY = -1;
            dirX = 1;
            break;
        case 'right':
            dirY = 0;
            dirX = 1;
            break;
        case 'bottom-right':
            dirY = 1;
            dirX = 1;
            break;
        case 'bottom':
            dirY = 1;
            dirX = 0;
            break;
        case 'bottom-left':
            dirY = 1;
            dirX = -1;
            break;
        case 'left':
            dirY = 0;
            dirX = -1;
            break;
        default:
            console.error('Unknown emboss direction: ' + direction);
    }
    do {
        let offsetY = (y - 1) * w4;
        let otherY = dirY;
        if (y + otherY < 1) {
            otherY = 0;
        }
        if (y + otherY > h) {
            otherY = 0;
        }
        let offsetYOther = (y - 1 + otherY) * w * 4;
        let x = w;
        do {
            let offset = offsetY + (x - 1) * 4;
            let otherX = dirX;
            if (x + otherX < 1) {
                otherX = 0;
            }
            if (x + otherX > w) {
                otherX = 0;
            }

            let offsetOther = offsetYOther + (x - 1 + otherX) * 4;
            let dR = data[offset] - data[offsetOther];
            let dG = data[offset + 1] - data[offsetOther + 1];
            let dB = data[offset + 2] - data[offsetOther + 2];
            let dif = dR;
            let absDif = dif > 0 ? dif : -dif;
            let absG = dG > 0 ? dG : -dG;
            let absB = dB > 0 ? dB : -dB;
            if (absG > absDif) {
                dif = dG;
            }
            if (absB > absDif) {
                dif = dB;
            }

            dif *= strength;
            if (blend) {
                let r = data[offset] + dif;
                let g = data[offset + 1] + dif;
                let b = data[offset + 2] + dif;
                data[offset] = r > 255 ? 255 : r < 0 ? 0 : r;
                data[offset + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
                data[offset + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
            } else {
                let grey = greyLevel - dif;
                if (grey < 0) {
                    grey = 0;
                }
                else if (grey > 255) {
                    grey = 255;
                }
                data[offset] = data[offset + 1] = data[offset + 2] = grey;
            }
        } while (--x);
    } while (--y);
}

export default Emboss;

