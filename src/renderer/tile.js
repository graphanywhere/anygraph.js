import LayerRenderer from "./layer.js";
import LayerRendererState from "./layer.js";
import Extent from "../spatial/extent.js";
import ImageState from "../basetype/image.js";
import { LOG_LEVEL } from "../global.js";

/**
 * 切片数据图层渲染类
 */
class TileLayerRenderer extends LayerRenderer {
    /**
     * 构造函数
     */
    constructor(tileLayer) {
        super();
        this.layer_ = tileLayer;
        this.zDirection = 0;
        this.tmpExtent = Extent.createEmpty();
        this.tmpTileCoord_ = [0, 0, 0];

        /**
         * 当前图层的渲染状态
         */
        this.state = LayerRendererState.IDLE;
        this.waitRenderTileCount = 0;
    }

    /**
     * 合成Frame
     */
    composeBuffer(frameState) {

        let tilesToDraw = this._getRenderedTiles(frameState);
        if (tilesToDraw.length === 0) {
            return;
        }

        this.state = LayerRendererState.LOADING;
        this.waitRenderTileCount = 0;

        let center = frameState.center;
        let resolution = frameState.resolution;
        let size = frameState.size;
        let offsetX = Math.round(size.width / 2);
        let offsetY = Math.round(size.height / 2);
        let pixelScale = 1 / resolution;
        let layer = this.getLayer();
        let source = layer.getSource();
        let tileGutter = 0;
        let tileGrid = source.getTileGrid();
        let ctx = this._context;

        let alpha = ctx.globalAlpha;
        ctx.save();

        for (let i = 0, ii = tilesToDraw.length; i < ii; ++i) {
            let tile = tilesToDraw[i];
            let tileCoord = tile.getKey();
            let tileExtent = tileGrid.getTileCoordExtent(tileCoord);
            let currentZ = tileCoord[0];
            let origin = Extent.getBottomLeft(tileGrid.getTileCoordExtent(tileGrid.getTileCoordForCoordAndZ(center, currentZ, this.tmpTileCoord_)));
            let w = Math.round(Extent.getWidth(tileExtent) * pixelScale);
            let h = Math.round(Extent.getHeight(tileExtent) * pixelScale);
            let left = Math.round((tileExtent[0] - origin[0]) * pixelScale / w) * w + offsetX + Math.round((origin[0] - center[0]) * pixelScale);
            let top = Math.round((origin[1] - tileExtent[3]) * pixelScale / h) * h + offsetY + Math.round((center[1] - origin[1]) * pixelScale);
            let tilePixelSize = source.getTilePixelSize(currentZ);

            // 渲染切片
            if (tile.getState() == ImageState.LOADING) {
                this.waitRenderTileCount++;
                tile.draw(ctx, tileGutter, tileGutter, tilePixelSize[0], tilePixelSize[1], left, top, w, h, function () {
                    frameState.getLayer().getGraph().getRenderer().renderFrame(false);
                });
            } else {
                ctx.drawImage(tile.getImage(), tileGutter, tileGutter, tilePixelSize[0], tilePixelSize[1], left, top, w, h);
            }

            // 画调试框和文字，备注：由于drawImages时位图往往还未下载，因此将出现位图将覆盖调试框的情况
            if (LOG_LEVEL > 4) {
                ctx.beginPath();
                ctx.moveTo(left, top);
                ctx.lineTo(left + w, top);
                ctx.lineTo(left + w, top + h);
                ctx.lineTo(left, top + h);
                ctx.lineTo(left, top);
                ctx.closePath();
                ctx.strokeStyle = "#DDDDDD";
                ctx.stroke();
                ctx.fillText(tileCoord.toString(), left, top)
            }
        }
        ctx.restore();
        ctx.globalAlpha = alpha;

        if (this.waitRenderTileCount === 0) {
            this.state = LayerRendererState.RENDERED;
        }
    }
    
    /**
     * 根据范围计算所需切片位图
     */
    _getRenderedTiles(frameState) {
        let tileLayer = this.getLayer();
        let tileSource = tileLayer.getSource();
        let tileGrid = tileSource.getTileGrid();
        let z = tileGrid.getZForResolution(frameState.resolution, this.zDirection);
        let tileResolution = tileGrid.getResolution(z);
        let extent = frameState.extent;
        if (Extent.isEmpty(extent)) {
            return false;
        }

        // 根据视图确定 切片范围
        let tileRange = tileGrid.getTileRangeForExtentAndResolution(extent, tileResolution);

        let tile, x, y;
        let renderedTiles = [];

        // 预处理切片数据
        for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
            for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
                tile = tileSource.getTile(z, x, y);
                renderedTiles.push(tile);
            }
        }

        return renderedTiles;
    }
}

export default TileLayerRenderer;
