/**
 * 位图状态
 */
const ImageState = {
    IDLE: 0,
    LOADING: 1,
    LOADED: 2,
    ERROR: 3,
    EMPTY: 4,
    ABORT: 5
};

/**
 * 异步加载的图形对象
 */
class ImageObject {
    constructor(src, callback) {
        this.blankTile = new window.Image();
        this.blankTile.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAB9JREFUOE9jZKAQMFKon2HUAIbRMGAYDQNQPhr4vAAAJpgAEX/anFwAAAAASUVORK5CYII=";  // 临时瓦片Image

        // fileUrl
        this.src_ = src;
        this.image_ = new window.Image();
        //this.image_.crossOrigin = "anonymous";   // 跨域,不发送用户凭据（即允许对未经过验证的图像进行跨源下载）
        this.state = ImageState.IDLE;
        this.waitToDraw = false;

        // 是否下载切片，当无法下载时可将该值设置为false
        this.isLoadImage_ = true;

        // load finish callback
        if (typeof (callback) == "function") {
            this.imageLoadedCallback = callback;
            this.waitToDraw = true;
        }

        // 开始加载Image
        this.load();
    }

    setCallback(callback) {
        if (typeof (callback) === "function") {
            this.waitToDraw = true;
            this.imageLoadedCallback = callback;
        }
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
            this.image_.src = this.isLoadImage_ === true ? this.src_ : this.blankTile.src;
        }
    };

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
            if (typeof (this.imageLoadedCallback) === "function") {
                this.imageLoadedCallback(this.image_);
            }
        }
    }

    /**
     * 切片装入失败事件 
     */
    onerror() {
        this.state = ImageState.ERROR;
    }
}

/**
 * 位图Load对象，用于加载图片，加载完成后执行回调。当重复加载同一图片时，图片只会加载一次，所有callback均会执行，最后执行finishCallback
 * @private
 */
class ImageLoader {
    constructor() {
    }
    static ImageCollection = new Map();

    /**
     * 加载图片
     * @param {String} src 
     * @param {Function} callback 位图对象加载之后的回调
     * @param {Function} finishCallback 位图对象加载完成，且回调执行完成后执行的函数
     */
    static load(src, callback, finishCallback) {
        let that = this;
        let img = this.ImageCollection.get(src);
        if (img == null) {
            let image = new window.Image();
            image.onload = function () {
                that._loaded(src, image);
            }
            image.src = src;
            this.ImageCollection.set(src, { "imageLoadedCallback": [callback], "finishCallback": finishCallback });
        } else {
            img.imageLoadedCallback.push(callback);
        }
    }

    /**
     * 如果多次load同一个位图，则合并这些位图的
     * @param {*} src 
     * @param {*} image 
     */
    static _loaded(src, image) {
        let cs = this.ImageCollection.get(src);
        cs.imageLoadedCallback.forEach(call => {
            call(image);
        });
        cs.finishCallback();
        this.ImageCollection.delete(src);
    }
}

export { ImageObject, ImageState, ImageLoader };

export default ImageObject;
