import EventTarget from "../basetype/event.target.js";

/**
 * 常量：缓存位图文件数量
 */
const IMAGE_CACHE_SIZE = 1000;

/**
 * 数据源基础类
 */
class BaseSource extends EventTarget {
    constructor(options) {
        super();

        /**
         * 数据集合
         */
        this.dataBuffer = [];

        /**
         * 图像集合
         */
        this.imageBuffer = [];

        /**
         * 图层
         */
        this.layer = null;

        /**
         * 最后一次的屏幕范围
         */
        this.lasterExtent = [];
    }

    /**
     * 清除已有数据
     */
    clearData(id) {
        //savaData(this.dataBuffer);   // 在清除数据之前，将该数据存储起来，可方便调试
        if (id == null) {
            this.dataBuffer = [];
        } else {
            // 移除指定ID的dataBuffer
            for (let i = this.dataBuffer.length - 1, ii = 0; i >= ii; i--) {
                let obj = this.dataBuffer[i];
                if (obj.getUid() == id) {
                    this.dataBuffer.splice(i, 1);
                }
            }
        }
    }

    /**
     * 读取数据
     */
    getData(id) {
        if (this.dataBuffer.length > 0) {
            if (id == null) {
                return this.dataBuffer;
            } else {
                let datas = [];
                // 按ID进行过滤
                for (let i = 0, ii = this.dataBuffer.length; i < ii; i++) {
                    let obj = this.dataBuffer[i];
                    if (obj.properties != null && obj.properties.id == id) {
                        datas.push(obj);
                    }
                }
                return datas;
            }
        } else {
            return [];
        }
    }

    /**
     * 增加数据
     */
    add(data, isTop) {
        if (isTop === true) {
            if (data.length > 0) {
                this.dataBuffer = data.concat(this.dataBuffer);
            } else {
                this.dataBuffer.unshift(data);
            }
        } else {
            if (data.length > 0) {
                this.dataBuffer = this.dataBuffer.concat(data);
            } else {
                this.dataBuffer.push(data);
            }
        }
    }

    /**
     * 取图层
     */
    getLayer() {
        return this.layer;
    }

    /**
     * 设置图层
     * 初始化Layer对象时，将会调用此方法
     */
    setLayer(layer) {
        this.layer = layer;
    }
}

export default BaseSource;
export { IMAGE_CACHE_SIZE };
