import { GGeometryType, Geometry } from "../geom/index.js";
import QuadTree from "../spatial/quadtree.js";
import Extent from "../spatial/extent.js";
import ImageCache from "../basetype/cache.js";
import { default as ImageObject, ImageState } from "../basetype/image.js";
import { default as BaseSource, IMAGE_CACHE_SIZE } from "./base.js";
import { default as FeatureFormat, GeometryFormat, createGeom } from "../format/feature.js";
import Counter from "../util/counter.js";
import EventType from "../basetype/event.type.js";
import { default as AjaxUtil } from "../util/ajax.js";

/**
 * 矢量数据数据源
 */
class VectorSource extends BaseSource {
    /**
     * 构造函数
     * @param {Object} options {data, projection, fileUrl, format, extent}
     */
    constructor(options = {}) {
        super(options);
        /**
         * 四叉树索引
         */
        this.quadTree = null;

        /**
         * 数据对象顺序号
         */
        this.seqId = 0;

        /**
         * 解析格式对象
         */
        this.format = options.format || new GeometryFormat();

        /**
         * 数据坐标范围
         */
        this.extent = options.extent;

        /**
         * 下载数据时的数据格式
         */
        this.dataType = options.dataType || "json";

        /**
         * 投影
         */
        this.projection = options.projection;

        // 加载数据
        if (options.data != null) {
            this.loadData(options.data);
        } else if (options.fileUrl != null) {
            this.loadFile(options.fileUrl, options.callback);
        }

        /**
         * 图片缓存
         */
        this.imageCache = new ImageCache(IMAGE_CACHE_SIZE);
        this._canCache = true;
    }

    /**
     * 从文件中读取矢量数据
     */
    loadFile(fileUrl, success, failure) {
        let that = this;
        AjaxUtil.get({
            url: fileUrl,
            dataType: this.dataType,
            success: function (features) {
                if (that.format != null && that.format instanceof FeatureFormat) {
                    let listData = that.format.readFeatures(features, that.projection)
                    // 加载数据
                    that.add(listData);
                } else {
                    throw new Error("source initialize error : format is not specifal")
                }
                // 触发事件
                that.triggerEvent(EventType.Loader, { "source": this });

                // 建立空间索引
                that.buildIndex();
                // 数据渲染
                if (that.getLayer() != null && that.getLayer().getGraph() != null) {
                    that.getLayer().getGraph().render();
                }
                if (typeof (success) === "function") {
                    success(features);
                }
            },
            error: function (res) {
                if (typeof (failure) === "function") {
                    failure(res);
                } else {
                    console.error("load file error", res);
                }
            }
        });
    }

    /**
     * 装载Geomtory数据至数据源中
     * features: [GeometryObject, GeometryObject]
     */
    loadData(features) {
        let listData;

        // 格式化数据
        if (this.format != null && this.format instanceof FeatureFormat) {
            listData = this.format.readFeatures(features, this.projection)
            // 加载数据
            this.add(listData);
        } else {
            throw new Error("source initialize error : format is not specifal")
        }

        // 建立空间索引
        // this.buildIndex();

        return listData;
    }

    /**
     * 增加矢量数据至数据源中
     */
    add(geomList) {
        let that = this;
        if (Array.isArray(geomList)) {
            geomList.forEach(function (geom) {
                if (geom instanceof Geometry) {
                    that._add(geom);
                } else {
                    //console.debug("add()参数错误", geomList);
                    that._add(createGeom(geom));
                }
            })
        } else {
            if (geomList instanceof Geometry) {
                that._add(geomList);
            } else {
                //console.debug("add()参数错误", geomList);
                that._add(createGeom(geomList));
            }
        }
        if (this.getLayer() && this.getLayer().getGraph()) {
            this.getLayer().getGraph().render();
        }
        return geomList;
    }

    /**
     * 增加Geomtory对象至数据源中
     */
    _add(geom) {
        if (geom instanceof Geometry) {
            geom.innerSeqId = this._getNextSeq();
            this.dataBuffer.push(geom);
            if (geom.getType() === GGeometryType.MARK) {
                this.add2Cache(geom.filePath);
            } else if (geom.getType() === GGeometryType.IMAGE) {
                if (geom.src != null) {
                    this.add2Cache(geom.src);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * 是否进行切片缓存
     */
    canCache() {
        return this._canCache;
    }

    /**
     * 清除指定ID数据，如果ID为空则清除数据源中所有数据
     */
    clearData(id) {
        super.clearData(id);
        this.imageCache.expireCache();
        this.quadTree = null;
    }

    /**
     * 根据ID获取对应的Geom对象
     */
    queryDataById(id) {
        for (let i = this.dataBuffer.length - 1; i >= 0; i--) {
            let geom = this.dataBuffer[i];
            if (geom.uid === id) {
                return geom;
            }
        }
        return null;
    }

    /**
     * 清除指定类型的数据
     */
    clearTypeData(type) {
        for (let i = this.dataBuffer.length - 1; i >= 0; i--) {
            let geom = this.dataBuffer[i];
            if (geom.getType() === type) {
                this.dataBuffer.splice(i, 1);
            }
        }
    }

    /**
     * 获取内部ID，用于空间索引内部使用
     */
    _getNextSeq() {
        this.seqId++;
        return this.seqId;
    }

    /**
     * 设置格式对象
     */
    setFormat(format) {
        this.format = format;
    }

    /**
     * 获取格式对象
     */
    getFormat() {
        return this.format;
    }

    /**
     * 将图片数据加至缓存中
     * filePath:可为string，或者为array
     */
    add2Cache(filePath, imageUid) {
        if (imageUid == null) imageUid = filePath;
        if (filePath == null) return;
        if (Array.isArray(filePath)) {
            let images = [];
            for (let i = 0; i < filePath.length; i++) {
                let url = filePath[i];
                if (!this.imageCache.containsKey(url)) {
                    images.push(this.add2Cache(url));
                }
            }
            return images;
        } else {
            // 缓存数据
            if (!this.imageCache.containsKey(filePath)) {
                let image = new ImageObject(filePath);
                this.imageCache.set(imageUid, image);
                return image;
            } else {
                return null;
            }
        }
    }

    /**
     * 从缓存中获取Image对象
     * @param {*} src 
     */
    getImageFromCache(src) {
        if (this.imageCache.containsKey(src)) {
            return this.imageCache.get(src);
        } else {
            return null;
        }
    }

    /**
     * 加载Image对象
     * @param {String} src 位图的url或base64内容
     * @param {Function} callback 如果位图已经准备好，则执行该回调
     * @param {Function} asyncCallback 如果位图没有准备好，则load完成之后执行该回调
     */
    loadImage(src, callback, asyncCallback) {
        let imageObj = this.getImageFromCache(src);
        if (imageObj == null) {
            imageObj = this.add2Cache(src)
            imageObj.setCallback(asyncCallback);
        } else {
            if (imageObj.getState() === ImageState.LOADED) {
                callback(imageObj.getImage());
            } else {
                imageObj.setCallback(asyncCallback);
            }
        }
    }

    /**
     * 构建四叉树索引
     */
    buildIndex() {
        if (!this.getLayer() || !this.getLayer().isUsePixelCoord()) {
            let maxExtent = this.extent == null ? this.getBBox() : this.extent;
            if ( this.quadTree ) {
            	this.quadTree.clear();
            	delete this.quadTree;
            }
            this.quadTree = new QuadTree({ x: maxExtent[0], y: maxExtent[1], width: maxExtent[2] - maxExtent[0], height: maxExtent[3] - maxExtent[1] });
            this.quadTree.insert(this.dataBuffer);
        }
    }

    /**
     * 获取指定范围内的数据
     */
    getExtentData(extent) {
        if (this.quadTree == null) {
            return this.getData();
        } else {
            let data = this.quadTree.getObjects(extent);
            data.sort(function (obj1, obj2) {
                return obj1.innerSeqId - obj2.innerSeqId;
            })
            // console.info("getExtentData(), count=" + data.length);
            return data;
        }
    }

    /**
     * 获取数据源中的最大空间范围
     */
    getBBox() {
        let bbox = Extent.createEmpty();
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            if (geom instanceof Geometry) {
                let obbox = geom.getBBox();
                bbox = Extent.merge(obbox, bbox);
            }
        }
        return bbox;
    }

    /**
     * @deprecated
     */
    getMaxExtent() {
        console.info("该方法已更名为getBBox(), 请使用新的名称！")
        return this.getBBox();
    }

    /**
     * 在控制台打印几何数据对象信息（调试用）
     */
    print() {
        let counter = new Counter("source: " + this.getLayer().getFullName());
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            counter.add(geom.getType(), geom.getCoord().length);
        }
        counter.print();
    }

    /**
     * 将数据源转换为GeoJSON格式
     * @returns GeoJSON
     */
    toGeoJSON() {
        let features = [];
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            features.push(geom.toGeoJSON());
        }
        return { features }
    }

    /**
     * 以矢量数据格式返回当前数据源中的数据
     */
    toData(options = {}) {
        let features = [];
        for (let i = 0; i < this.dataBuffer.length; i++) {
            let geom = this.dataBuffer[i];
            if (options.string === true) {
                features.push(JSON.stringify(geom.toData(options)));
            } else {
                features.push(geom.toData(options));
            }
        }
        return features;
    }
}

export default VectorSource;
