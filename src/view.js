import Extent from "./spatial/extent.js";
import MathUtil from "./util/math.js";

/**
 * View是Graph对象的一个属性，其作用包括：<br>
 * 1、当前视图信息：中心点Center、 分辨率resolution、坐标范围 Extent、 zoom<br>
 * 2、可允许的视图信息：最大分辨率、 最小分辨率、 分辨率层级、 minZoom、 maxZoom<br>
 * 3、通过改变view属性中的center和resolution实现Graph图形的缩放、漫游等功能<br>
 * 4、视图限制、例如限制缩放比例，限制视点范围等<br>
 * <br>
 * 分辨率的确定规则：<br>
 * 1、手动指定<br>
 * 2、自动计算（根据图形的最大范围进行计算，默认为15个级别）<br>
 */
class View {
    /**
     * 构造函数
     * @param {Object} options
     * options: <br>
     * 1、指定各级分辨率：{resolutions, center, resolutionScaleConstrain, resolution/zoom}<br>
     * 2、根据extent和canvasSize计算各级率：{extent, canvasSize, center, resolutionScaleConstrain, resolution/zoom, zoomFactor, maxResolution, minResolution }
     */
    constructor(options = {}) {
        // 允许最大和最小的缩放倍率
        this.resolutionScaleConstrain = options.resolutionScaleConstrain || 50;
        // 初始化
        this.initialize(options);
    }

    /**
     * 完善信息
     * @param {Object} options 
     */
    initialize(options) {
        // 分辨率选项
        let info = this._getResolutionOptions(options);
        this.maxResolution = info.maxResolution;
        this.minResolution = info.minResolution;
        this.zoomFactor_ = info.zoomFactor;

        // 中心点坐标
        this.center = (this.center == null && options.center == null ? info.center : (this.center == null ? options.center : this.center));

        // 图形尺寸
        this.viewPortSize = info.canvasSize;

        // 约束范围
        this.extentConstrain = options.extentConstrain || [-Infinity, -Infinity, Infinity, Infinity];

        // 约束分辨率显示倍率
        if (options.resolutionScaleConstrain != null) {
            this.resolutionScaleConstrain = options.resolutionScaleConstrain;
        }

        // 各级分辨率
        this.resolutions_ = options.resolutions;

        // 当前分辨率
        if (this.resolution == null || isNaN(this.resolution)) {
            if (options.resolution !== undefined) {
                this.resolution = options.resolution;
            } else if (options.zoom !== undefined) {
                this.setZoom(options.zoom);
            } else {
                this.resolution = this.maxResolution;
            }
        }
    }

    /**
     * 视图是否可用
     */
    isDef() {
        return !!this.getCenter() && this.getResolution() !== undefined && !isNaN(this.getResolution());
    }

    /**
     * 获取中心点坐标
     */
    getCenter() {
        return this.center;
    }

    /**
     * 获取最大层级的分辨率
     */
    getMaxResolution() {
        return this.maxResolution;
    }

    /**
     * 获取最小层级的分辨率
     */
    getMinResolution() {
        return this.minResolution;
    }

    /**
     * 返回当前的分辨率
     */
    getResolution() {
        return this.resolution;
    }

    /**
     * 返回当前视图的分辨率数组
     */
    getResolutions() {
        return this.resolutions_;
    }

    /**
     * 获取图形显示范围
     * @returns Extent
     */
    getExtent() {
        let size = this.viewPortSize;
        let extent = [
            this.center[0] - this.resolution * size.width / 2,
            this.center[1] - this.resolution * size.height / 2,
            this.center[0] + this.resolution * size.width / 2,
            this.center[1] + this.resolution * size.height / 2
        ];
        return extent;
    }

    /**
     * 取视图状态.
     */
    getState(isMore = false) {
        let center = this.getCenter();
        let resolution = this.getResolution();
        if (isMore === true) {
            return ({
                center: center.slice(),
                resolution: resolution,
            });
        } else {
            return ({
                center: center.slice(),
                resolution: resolution,
                zoom: this.getZoom()
            });
        }
    }

    /**
     * 返还当前的zoom level，如果初始化View时没有指定resolutions, 则该方法返回 undefined
     */
    getZoom() {
        let zoom;
        let resolution = this.getResolution();
        if (resolution !== undefined && resolution >= this.minResolution && resolution <= this.maxResolution) {
            let offset = 0;
            let max, zoomFactor;
            if (this.resolutions_) {
                let nearest = View.linearFindNearest(this.resolutions_, resolution, 1);
                offset += nearest;
                if (nearest == this.resolutions_.length - 1) {
                    return offset;
                }
                max = this.resolutions_[nearest];
                zoomFactor = max / this.resolutions_[nearest + 1];
            } else {
                max = this.maxResolution;
                zoomFactor = this.zoomFactor_;
            }
            zoom = offset + Math.log(max / resolution) / Math.log(zoomFactor);
        }
        return zoom;
    }

    /**
     * 根据锚点和分辨率计算中心点
     * @param {Number} resolution 
     * @param {PointCoord} anchor 
     * @returns center
     */
    calculateCenterZoom(resolution, anchor) {
        let center;
        let currentCenter = this.getCenter();
        let currentResolution = this.getResolution();
        if (currentCenter !== undefined && currentResolution !== undefined) {
            let x = anchor[0] - resolution * (anchor[0] - currentCenter[0]) / currentResolution;
            let y = anchor[1] - resolution * (anchor[1] - currentCenter[1]) / currentResolution;
            center = [x, y];
        }
        return center;
    }

    /**
     * 改变视图位置，根据四角坐标和窗口像素宽高。（开窗缩放）
     * GG图形中，在确定了extent后，访问此方法显示地图背景
     * @param {Extent} extent
     * @param {Object} size {width, height}
     */
    fill(extent, size) {
        // 计算分辨率
        let minResolution = 0;
        let resolution = this._getResolutionForExtent(extent, size);
        resolution = isNaN(resolution) ? minResolution : Math.max(resolution, minResolution);
        this.setResolution(resolution);

        // 计算中心点
        let centerX = (extent[0] + extent[2]) / 2;
        let centerY = (extent[1] + extent[3]) / 2;
        this.setCenter([centerX, centerY]);
    }

    /**
     * 取分辨率， 根据所提供的范围（以地图单位）和大小（以像素为单位）。 
     * @private
     */
    _getResolutionForExtent(extent, size) {
        let xResolution = Extent.getWidth(extent) / size.width;
        let yResolution = Extent.getHeight(extent) / size.height;
        return Math.max(xResolution, yResolution);
    }

    /**
     * 改变视图位置，将指定坐标显示在指定位置处
     */
    centerOn(coordinate, size, position) {
        let resolution = this.getResolution();
        let centerX = (size.width / 2 - position[0]) * resolution + coordinate[0];
        let centerY = (position[1] - size.height / 2) * resolution + coordinate[1];
        this.setCenter([centerX, centerY]);
    }

    /**
     * 设置中心点（改变视图位置）
     * @param {PointCoord} center 
     */
    setCenter(center) {
        this.center = center;
    }

    /**
     * 中心点约束
     * @param {Array} center 
     * @returns Array
     */
    constrainCenter(center) {
        if (center) {
            return [
                MathUtil.clamp(center[0], this.extentConstrain[0], this.extentConstrain[2]),
                MathUtil.clamp(center[1], this.extentConstrain[1], this.extentConstrain[3])
            ];
        } else {
            return undefined;
        }
    };

    /**
     * 设置当前分辨率（缩放视图）
     * @param {Number} resolution 
     */
    setResolution(resolution) {
        return this.constrainResolution(resolution);
    }

    /**
     * 分辨率约束
     * @param {*} resolution 
     * @returns float
     */
    constrainResolution(resolution) {
        let succ = false;
        let max = this.getMaxResolution() * this.resolutionScaleConstrain;
        let min = this.getMinResolution() / this.resolutionScaleConstrain / 2;

        if (resolution > max) {
            this.resolution = max;
        } else if (resolution < min) {
            this.resolution = min;
        } else {
            this.resolution = resolution;
            succ = true;
        }
        return succ;
    };

    /**
     *  设置当前层级（缩放视图）
     */
    setZoom(zoom) {
        let resolutions = this.getResolutions();
        let resolution;
        // 目前仅支持设置整数的层级，如需支持小数层级，可在此基础上进行线性处理
        zoom = Math.floor(zoom);
        if (resolutions == null) {
            resolution = this.maxResolution / Math.pow(this.zoomFactor_, zoom);
        } else {
            if (zoom >= 0 && zoom < resolutions.length) {
                resolution = resolutions[zoom];
            } else if (zoom < 0) {
                resolution = resolutions[0];
            } else {
                resolution = resolutions[resolutions.length - 1];
            }
        }
        this.setResolution(resolution);
    }

    /**
     * 获取视图选项
     * @private
     * @param {Object} options {resolutions, extent, canvasSize, zoomFactor, maxResolution, minResolution}
     * @return {Object} {maxResolution, minResolution, zoomFactor}
     */
    _getResolutionOptions(options) {
        let maxResolution;
        let minResolution;

        // 各层之间的宽高比，缺省值为2，说明上层的宽是下层宽的2倍，上层的高是下层高的2倍，即上层的分辨率是下层分辨率的4倍
        let defaultZoomFactor = 2;
        let zoomFactor = options.zoomFactor !== undefined ? options.zoomFactor : defaultZoomFactor;
        let defaultMaxZoom = 5;
        let center = null;
        let canvasSize = options.canvasSize;

        // 1、指定各级分辨率：{resolutions}
        if (options.resolutions != null) {
            let resolutions = options.resolutions;
            maxResolution = resolutions[0];
            minResolution = resolutions[resolutions.length - 1];
        } else if (options.extent != null && options.canvasSize != null) {
            // 2、根据extent和canvasSize计算各级率：{extent, canvasSize, zoomFactor, maxResolution, minResolution }
            let extent = options.extent;
            center = Extent.getCenter(extent);

            // 根据extent计算最大最小resolution
            let widthResolution = Extent.getWidth(extent) / canvasSize.width;
            let heightResolution = Extent.getHeight(extent) / canvasSize.height;
            let defaultMaxResolution = Math.max(widthResolution, heightResolution);
            let defaultMinResolution = defaultMaxResolution / Math.pow(zoomFactor, defaultMaxZoom);

            // 优先使用options中的maxResolution
            maxResolution = options.maxResolution;
            if (maxResolution === undefined) {
                maxResolution = defaultMaxResolution;
            }
            // 优先使用options中的minResolution
            minResolution = options.minResolution;
            if (minResolution === undefined) {
                minResolution = defaultMinResolution;
            }
        } else {
            // 允许在初始化View时，仅指定resolution，而在后续脚本中补充更多信息
            // throw new Error("初始化View参数错误.")
        }
        return { maxResolution, minResolution, zoomFactor, center, canvasSize };
    }

    /**
     * 从数组中查找与target最接近的值的索引
     * @param {Array} arr 从大到小排序的数组
     * @param {Number} target 
     * @param {int} direction 
     * @returns 数组索引
     */
    static linearFindNearest(arr, target, direction) {
        let n = arr.length;
        if (arr[0] <= target) {
            return 0;
        } else if (target <= arr[n - 1]) {
            return n - 1;
        } else {
            let i;
            if (direction > 0) {
                for (i = 1; i < n; ++i) {
                    if (arr[i] < target) {
                        return i - 1;
                    }
                }
            } else if (direction < 0) {
                for (i = 1; i < n; ++i) {
                    if (arr[i] <= target) {
                        return i;
                    }
                }
            } else {
                for (i = 1; i < n; ++i) {
                    if (arr[i] == target) {
                        return i;
                    } else if (arr[i] < target) {
                        if (arr[i - 1] - target < target - arr[i]) {
                            return i - 1;
                        } else {
                            return i;
                        }
                    }
                }
            }
            return n - 1;
        }
    }

    // /**
    //  * 通过范围计算得到地图分辨率数组
    //  * @param {Extent} extent
    //  * @param {Size} size 
    //  * @returns Array
    //  */
    // static getResolutions(extent, size) {
    //     let widthResolution = Extent.getWidth(extent) / size.width;
    //     let heightResolution = Extent.getHeight(extent) / size.height;
    //     let maxResolution = Math.max(widthResolution, heightResolution);

    //     var resolutions = new Array(10);
    //     var z;
    //     for (var z = 0; z < resolutions.length; z++) {
    //         resolutions[z] = maxResolution / Math.pow(2, z);
    //     }
    //     // 返回分辩率数组resolutions
    //     return resolutions;
    // }
}

export default View;
