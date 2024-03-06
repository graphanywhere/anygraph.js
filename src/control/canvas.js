import Extent from "../spatial/extent.js";

/**
 * 画板对象
 * @param {*} options 
 * @returns Canvas
 */
function createCanvas(options = {}) {
    let width = options.width || 50;
    let height = options.height || 50;
    let viewBox = options.viewBox || [0, 0, width, height];

    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    let ctx = canvas.getContext('2d');
    ctx.scale(width / Extent.getWidth(viewBox), height / Extent.getHeight(viewBox));

    return canvas;
}

/**
 * 删除画板
 * @param  {...Object} canvases 
 */
function releaseCanvas(...canvases) {
    canvases.forEach((c) => {
        c.width = 0;
        c.height = 0;
    });
}

export default createCanvas;
export { releaseCanvas };
