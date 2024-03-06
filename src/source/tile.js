import { default as Source, IMAGE_CACHE_SIZE } from "./base.js";
import ImageCache from "../basetype/cache.js";
import ImageState from "../basetype/image.js";


/**
 * 切片地图数据源
 */
class TileSource extends Source {
    constructor(options = {}) {
        super(options);

        /**
        * 切片网格
        */
        this.tileGrid = options.tileGrid !== undefined ? options.tileGrid : null;

        /**
         * 切片缓存
         */
        this.tileCache = new ImageCache(IMAGE_CACHE_SIZE);
        this._canCache = true;

        /**
         * 切片地图的Http地址
         */
        this.urlTemplate = options.url;

        /**
         * Y方向是否是地图坐标轴（地图Y方向坐标轴越往北数值越大，而屏幕Y方向坐标轴越是下方数值越大）
         */
        this.isMapAxis = options.isMapAxis == null ? true : options.isMapAxis;
    }

    /**
     * 是否进行切片缓存
     */
    canCache() {
        return this._canCache;
    }

    /**
     * 清除之前的消息
     */
    clearData(id) {
        super.clearData(id);
        this.tileCache.expireCache();
    }

    /**
     * 增加数据
     */
    add(data) {
        super.add(data);
    }

    /**
     * 将图片数据加至缓存中
     * filePath:可为string，或者为array
     */
    add2Cache(filePath) {
        let tileKey = filePath;
        if (tileKey === undefined) return;

        // 缓存数据
        if (!this.tileCache.containsKey(tileKey)) {
            let tile = new TileImage(tileKey);
            tile.load();
            this.tileCache.set(tileKey, tile);
        }
    }

    /**
     * 获取切片
     */
    getTileByUrl(tileKey) {
        let val = this.tileCache.get(tileKey);
        if (val == null) {
            this.add2Cache(tileKey);
            return null;
        } else {
            return val;
        }
    }

    /**
     * 获取切片
     */
    getTile(z, x, y) {
        //let tileCoordKey = this.getKeyZXY(z, x, y);
        let tileCoord = [z, x, y];
        let tileUrl = this.tileUrlFunction(tileCoord);
        let tile = new TileImage(tileUrl, tileCoord);

        if (!this.tileCache.containsKey(tileUrl)) {
            tile = this.createTile_(z, x, y);
            this.tileCache.set(tileUrl, tile);
        } else {
            tile = this.tileCache.get(tileUrl);
        }
        return tile;
    }

    /**
     * 建立切片位图对象
     */
    createTile_(z, x, y) {
        let tileCoord = [z, x, y];
        let tileUrl = this.tileUrlFunction(tileCoord);
        let tile = new TileImage(tileUrl, tileCoord);
        tile.load();
        return tile;
    };

    /**
    * 根据地址模板生成切片URL
    */
    tileUrlFunction(tileCoord) {
        let z = tileCoord[0];
        let x = tileCoord[1];
        let y = this.isMapAxis ? tileCoord[2] : (-tileCoord[2] - 1);
        return this.urlTemplate.replace('{z}', z.toString()).replace('{y}', y.toString()).replace('{x}', x.toString());
    }

    /**
     * @protected
     */
    getKeyZXY(z, x, y) {
        return z + '/' + x + '/' + y;
    }

    /**
     * 取TitleGrid
     */
    getTileGrid() {
        return this.tileGrid;
    }

    /**
     * 取某一层的切片像素尺寸
     */
    getTilePixelSize(z) {
        let tileGrid = this.getTileGrid();
        let tileSize = tileGrid.getTileSize(z);
        return tileSize;
    }
}

/**
 * 异步加载的图形对象
 */
class TileImage {
    constructor(src, imgUid) {
        this.blankTile = new window.Image();
        this.blankTile.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAB9JREFUOE9jZKAQMFKon2HUAIbRMGAYDQNQPhr4vAAAJpgAEX/anFwAAAAASUVORK5CYII=";  // 临时瓦片Image

        // fileUrl
        this.src_ = src;
        // key
        this.imgUid_ = imgUid;
        this.image_ = new window.Image();
        //this.image_.crossOrigin = "anonymous";   // 跨域,不发送用户凭据（即允许对未经过验证的图像进行跨源下载）
        this.state = ImageState.IDLE;
        this.waitToDraw = false;
        this.drawOption = {};

        // 是否下载切片，当无法下载切片时可将该值设置为false
        this.isLoadImage_ = true;
    }

    getKey() {
        return this.imgUid_;
    }

    /**
     * 返还切片名称
     */
    getName() {
        this.src_;
    }

    /**
     * 返回切片状态
     */
    getState() {
        return this.state;
    }

    /**
     * 获取切片对应的Image
     */
    getImage() {
        if (this.state == ImageState.LOADED) {  // 已装载完毕
            return this.image_;
        } else {                                     // 没有装载或出现错误
            return this.blankTile;
        }
    };

    /**
     * 装入切片位图
     */
    load() {
        if (this.state == ImageState.IDLE || this.state == ImageState.ERROR) {
            this.state = ImageState.LOADING;
            let that = this;
            this.image_.addEventListener('load', function (e) { return that.onload(); }, { once: true });
            this.image_.addEventListener('error', function (e) { return that.onerror(); }, { once: true });
            this.image_.src = this.isLoadImage_ === true ? this.src_ : "";
        }
    };

    /**
     * 绘制
     */
    draw(renderContext, sx, sy, sw, sh, dx, dy, dw, dh, callback) {
        this.drawOption = { renderContext, sx, sy, sw, sh, dx, dy, dw, dh, callback };

        if (this.state === ImageState.LOADED) {
            this._drawImage();
        } else {
            this.waitToDraw = true;
        }
    }

    /**
     * 装入成功事件 
     */
    onload() {
        if (this.image_.naturalWidth && this.image_.naturalHeight) {
            this.state = ImageState.LOADED;
        } else {
            this.state = ImageState.EMPTY;
        }
        // 当image装载完成后，若已经执行了draw，则需重新draw
        if (this.waitToDraw) {
            this._drawImage();
        }
    }

    /**
     * 将切片在画板中绘制出来
     */
    _drawImage() {
        let arg = this.drawOption;
        if (this.state === ImageState.EMPTY) {
            arg.renderContext.drawImage(this.blankTile, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);
        } else {
            arg.renderContext.drawImage(this.image_, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);
        }
        arg.callback();
    }

    /**
     * 切片装入失败事件 
     */
    onerror() {
        this.state = ImageState.ERROR;
    }
}

export default TileSource;
