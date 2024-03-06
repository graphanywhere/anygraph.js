import Extent from "./extent.js";
import View from "../view.js";
import { ClassUtil } from "../util/index.js";

const defaultTileGridOption = {
    minZoom: 0,
    tileSize: 256
};

/*
 * 切片范围，样例[0,0,16,16]
 */
export class TileRange {
    /**
     * 构造函数
     */
    constructor(minX, maxX, minY, maxY) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }

    /**
     * 创建切片范围
     */
    static create(minX, maxX, minY, maxY) {
        return new TileRange(minX, maxX, minY, maxY);
    }

    /**
     * 判断是否包含某切片
     */
    contains(tileCoord) {
        return this.containsXY(tileCoord[1], tileCoord[2]);
    }

    /**
     * 判断是否包含某切片范围.
     */
    containsTileRange(tileRange) {
        return this.minX <= tileRange.minX && tileRange.maxX <= this.maxX && this.minY <= tileRange.minY && tileRange.maxY <= this.maxY;
    }

    /**
     * 判断是否包含某切片
     */
    containsXY(x, y) {
        return this.minX <= x && x <= this.maxX && this.minY <= y && y <= this.maxY;
    }

    /**
     * 判断是否相等
     */
    equals(tileRange) {
        return this.minX == tileRange.minX && this.minY == tileRange.minY && this.maxX == tileRange.maxX && this.maxY == tileRange.maxY;
    }

    /**
     * 扩展切片范围
     * @param {TileRange} tileRange 切片范围.
     */
    extend(tileRange) {
        if (tileRange.minX < this.minX) {
            this.minX = tileRange.minX;
        }
        if (tileRange.maxX > this.maxX) {
            this.maxX = tileRange.maxX;
        }
        if (tileRange.minY < this.minY) {
            this.minY = tileRange.minY;
        }
        if (tileRange.maxY > this.maxY) {
            this.maxY = tileRange.maxY;
        }
    }

    getWidth() {
        return this.maxX - this.minX + 1;
    }

    getHeight() {
        return this.maxY - this.minY + 1;
    }

    getSize() {
        return {"width": this.getWidth(), "height": this.getHeight()};
    }

    /**
     * 判断是否相交
     */
    intersects(tileRange) {
        return this.minX <= tileRange.maxX && this.maxX >= tileRange.minX && this.minY <= tileRange.maxY && this.maxY >= tileRange.minY;
    }
}

/*
 * 切片块（该切片块包含XYZ三个属性）
 */
export class TileCoord {
    /**
     * 构造函数
     */
    constructor() {
        this.coord = [0, 0, 0];
    }

    /**
     * Create Tile coordinate.
     */
    static create(z, x, y) {
        return [z, x, y];
    }

    /**
     * Key.
     */
    getKeyZXY(z, x, y) {
        return z + '/' + x + '/' + y;
    }

    /**
     * Hash.
     */
    hash(tileCoord) {
        return (tileCoord[1] << tileCoord[0]) + tileCoord[2];
    }
}

/**
 * 切片网格类，提供在不同的分辨率下所需使用的Level计算，切片的坐标计算，切片的下一层切片计算等方法
 */
export class TileGrid {
    /**
     * 构造函数
     */
    constructor(args) {
        let options = {};
        Object.assign(options, defaultTileGridOption, args);

        this.tileSize = options.tileSize;
        this.minZoom = options.minZoom;

        // 密度（数组，该值不可为空）
        ClassUtil.assert(options.resolutions !== undefined, 1040);
        this.resolutions = options.resolutions;
        this.maxZoom = this.resolutions.length - 1;

        // 范围（该值不可为空）
        ClassUtil.assert(options.extent !== undefined, 1040);
        this.extent = options.extent;
        if (options.origin !== undefined) {
            this.origin = options.origin;
        } else {
            this.origin = Extent.getTopLeft(this.extent);
        }
    }

    /**
     * 返回某一层的分辨率
     */
    getResolution(z) {
        ClassUtil.assert(this.minZoom <= z && z <= this.maxZoom, 'given z is not in allowed range (%s <= %s <= %s)', this.minZoom, z, this.maxZoom);
        return this.resolutions[z];
    }

    /**
     * 返回切片大小
     */
    getTileSize() {
        if(Array.isArray(this.tileSize)) {
            return this.tileSize;
        } else {
            return [this.tileSize, this.tileSize];
        }
    }

    /**
     * 返回原点位置
     */
    getOrigin() {
        return this.origin;
    }

    /**
     * 获取某切片块坐标范围
     */
    getTileCoordExtent(tileCoord) {
        let origin = this.getOrigin(tileCoord[0]);
        let resolution = this.getResolution(tileCoord[0]);
        let tileSize = this.getTileSize();
        let minX = origin[0] + tileCoord[1] * tileSize[0] * resolution;
        let minY = origin[1] + tileCoord[2] * tileSize[1] * resolution;
        let maxX = minX + tileSize[0] * resolution;
        let maxY = minY + tileSize[1] * resolution;
        return Extent.create(minX, minY, maxX, maxY);
    }

    /**
     * 根据坐标范围和分辨率取 切片块范围
     */
    getTileRangeForExtentAndResolution(extent, resolution) {
        let tileCoord = this.getTileCoordForXYAndResolution_(extent[0], extent[1], resolution, false);
        let minX = tileCoord[1];
        let minY = tileCoord[2];
        tileCoord = this.getTileCoordForXYAndResolution_(extent[2], extent[3], resolution, true);
        return TileRange.create(minX, tileCoord[1], minY, tileCoord[2]);
    }

    /**
     * 根据坐标和分辨率取 切片块
     */
    getTileCoordForXYAndResolution_(x, y, resolution, reverseIntersectionPolicy = 0) {
        let z = this.getZForResolution(resolution);
        let scale = resolution / this.getResolution(z);
        let origin = this.origin;
        let tileSize = this.getTileSize();

        let adjustX = reverseIntersectionPolicy ? 0.5 : 0;
        let adjustY = reverseIntersectionPolicy ? 0 : 0.5;

        let xFromOrigin = Math.floor((x - origin[0]) / resolution + adjustX);
        let yFromOrigin = Math.floor((y - origin[1]) / resolution + adjustY);

        let tileCoordX = scale * xFromOrigin / tileSize[0];
        let tileCoordY = scale * yFromOrigin / tileSize[1];

        if (reverseIntersectionPolicy) {
            tileCoordX = Math.ceil(tileCoordX) - 1;
            tileCoordY = Math.ceil(tileCoordY) - 1;
        } else {
            tileCoordX = Math.floor(tileCoordX);
            tileCoordY = Math.floor(tileCoordY);
        }

        return TileCoord.create(z, tileCoordX, tileCoordY);
    }

    /**
     * Get a tile coordinate given a map coordinate and zoom level.
     * @param {Coordinate} coordinate Coordinate.
     * @param {number} z Zoom level.
     * @param {TileCoord=} opt_tileCoord Destination TileCoord object.
     * @return {TileCoord} Tile coordinate.
     * @api
     */
    getTileCoordForCoordAndZ(coordinate, z, opt_tileCoord) {
        let resolution = this.getResolution(z);
        return this.getTileCoordForXYAndResolution_(coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
    }

    /**
     * 根据分辨率resolution寻找最靠近的Level
     */
    getZForResolution(resolution, opt_direction) {
        let z = View.linearFindNearest(this.resolutions, resolution, opt_direction || 0);
        return z;
    }
}
