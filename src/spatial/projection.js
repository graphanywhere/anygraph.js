import MathUtil from "../util/math.js";

const LatLngType = {
    GPS: 1,
    GCJ02: 2,
    BD09: 3
}

/**
 * 坐标投影转换类
 */
class Projection {
    constructor() {
    }

    /**
     * 地理坐标转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project([lng, lat]) { return []; }

    /**
     * 平面坐标转地理坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @return {number} 经纬度
     */
    unproject([x, y], original = false) { return []; }

    /**
     * 投影后的平面坐标范围
     */
    get bound() { return null; }
}

/**
 * 球体墨卡托
 */
class WebMercator extends Projection {
    constructor() {
        super();
        /**
         * 地球半径
         */
        GCJ02.R = 6378137;
    }

    /**
     * 投影后的平面坐标范围
     */
    get bound() {
        return new Bound(-Math.PI * GCJ02.R, Math.PI * GCJ02.R, Math.PI * GCJ02.R, -Math.PI * GCJ02.R);
    }

    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project(coords) {
        //from leaflet & wiki
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                let [lng, lat] = coords;
                const d = Math.PI / 180, sin = Math.sin(lat * d);
                return [MathUtil.toFixed(GCJ02.R * lng * d, 2), MathUtil.toFixed(GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2, 2)];
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [lng, lat] = coords[i];
                    const d = Math.PI / 180, sin = Math.sin(lat * d);
                    coordList.push([MathUtil.toFixed(GCJ02.R * lng * d, 2), MathUtil.toFixed(GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2, 2)]);
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }

    /**
     * 平面坐标转经纬度
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @return {number} 经纬度
     */
    unproject(coords) {
        const d = 180 / Math.PI;
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                let [x, y] = coords;
                return [MathUtil.toFixed(x * d / GCJ02.R, 6), MathUtil.toFixed((2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d, 6)];
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    let [x, y] = coords[i];
                    coordList.push([MathUtil.toFixed(x * d / GCJ02.R, 6), MathUtil.toFixed((2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d, 6)]);
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }
}

/**
 * 带国测局02偏移的球体墨卡托投影
 * @remarks https://github.com/wandergis/coordtransform
 */
class GCJ02 extends Projection {
    /**
     * 创建带国测局02偏移的球体墨卡托投影
     * @remarks 参考经纬度坐标类型，不同类型走不同数据处理流程
     * @param {LatLngType} type - 经纬度坐标类型
     */
    constructor(type = LatLngType.GPS) {
        super();
        this._type = type;
    }
    /**
     * 投影后的平面坐标范围
     */
    get bound() {
        return new Bound(-Math.PI * GCJ02.R, Math.PI * GCJ02.R, Math.PI * GCJ02.R, -Math.PI * GCJ02.R);
    }
    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    _project([lng, lat]) {
        if (this._type == LatLngType.GPS) {
            [lng, lat] = GCJ02.wgs84togcj02(lng, lat);
        }
        //from leaflet & wiki
        const d = Math.PI / 180, sin = Math.sin(lat * d);
        return [GCJ02.R * lng * d, GCJ02.R * Math.log((1 + sin) / (1 - sin)) / 2];
    }

    /**
     * 经纬度转平面坐标
     * @remarks 地理平面坐标 单位米
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @return {number} 地理平面坐标
     */
    project(coords) {
        if (typeof (coords) === "object" && coords.length > 0) {
            if (typeof (coords[0]) === "number") {
                return this._project(coords)
            } else {
                let coordList = [];
                for (let i = 0, ii = coords.length; i < ii; i++) {
                    coordList.push(this._project(coords[i]));
                }
                return coordList;
            }
        } else {
            throw Error("参数错误");
        }
    }

    /**
     * 平面坐标转经纬度
     * @remarks 地理平面坐标 单位米
     * @param {number} x - 地理平面坐标x
     * @param {number} y - 地理平面坐标y
     * @param {boolean} original - 是否转换回偏移前经纬度坐标
     * @return {number} 经纬度
     */
    unproject([x, y], original = false) {
        const d = 180 / Math.PI;
        let [lng, lat] = [x * d / GCJ02.R, (2 * Math.atan(Math.exp(y / GCJ02.R)) - (Math.PI / 2)) * d];
        if (original) {
            if (this._type == LatLngType.GPS) {
                [lng, lat] = GCJ02.gcj02towgs84(lng, lat);
            }
        }
        return [lng, lat];
    }
    /**
     * WGS-84 转 GCJ-02
     * @remarks https://github.com/wandergis/coordtransform
     * @param {number} lng
     * @param {number} lat
     * @returns {number} 经纬度
     */
    static wgs84togcj02(lng, lat) {
        let dlat = this._transformlat(lng - 105.0, lat - 35.0);
        let dlng = this._transformlng(lng - 105.0, lat - 35.0);
        let radlat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radlat);
        magic = 1 - GCJ02.ee * magic * magic;
        let sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((GCJ02.R * (1 - GCJ02.ee)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (GCJ02.R / sqrtmagic * Math.cos(radlat) * Math.PI);
        let mglat = lat + dlat;
        let mglng = lng + dlng;
        return [mglng, mglat];
    }

    /**
     * GCJ-02 转换为 WGS-84
     * @remarks https://github.com/wandergis/coordtransform
     * @param {number} lng
     * @param {number} lat
     * @returns {number} 经纬度
     */
    static gcj02towgs84(lng, lat) {
        let dlat = this._transformlat(lng - 105.0, lat - 35.0);
        let dlng = this._transformlng(lng - 105.0, lat - 35.0);
        let radlat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radlat);
        magic = 1 - GCJ02.ee * magic * magic;
        let sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((GCJ02.R * (1 - GCJ02.ee)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (GCJ02.R / sqrtmagic * Math.cos(radlat) * Math.PI);
        let mglat = lat + dlat;
        let mglng = lng + dlng;
        return [lng * 2 - mglng, lat * 2 - mglat];
    }

    static _transformlat(lng, lat) {
        let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    static _transformlng(lng, lat) {
        let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
        ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    }

    /**
     * 判断是否在国内，不在国内则不做偏移
     * @remarks 此判断欠妥，暂不采用！
     * @param {number} lng
     * @param {number} lat
     * @returns {boolean} 是否在中国范围内
     */
    static out_of_china(lng, lat) {
        // 纬度 3.86~53.55, 经度 73.66~135.05
        return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
    }
}

export default WebMercator;

/**
 * 地球半径
 */
GCJ02.R = 6378137.0;

/**
 * 不知含义的常数，用于WGS-84 与 GCJ-02 之间的转换
 */
GCJ02.ee = 0.00669342162296594323;

// let coord1 = [113.280637, 23.125178];
// let proj = new GCJ02();
// console.info(proj.project(coord1));
// // console.info(proj.unproject([12610342.827577665, 2647163.834986297]));
// console.info(proj.unproject([12610937.84124525, 2646841.2784741865]));


// https://www.cnblogs.com/fwc1994/p/5884115.html
// 火星坐标的真实名称应该是GCJ-02坐标。最近在知乎上看到关于火星坐标的话题都是充满争议的（点我跳转到知乎），感兴趣的同学可以去详细了解一下。
// 基本上所有的国内的电子地图采用的都是火星坐标系甚至Google地图中国部分都特意为中国政府做了偏移。

// 百度坐标
// 火星坐标是在国际标准坐标WGS-84上进行的一次加密，由于国内的电子地图都要至少使用火星坐标进行一次加密，百度直接就任性一些，直接自己又研究了一套加密算法，来了个
// 二次加密，这就是我们所熟知的百度坐标(BD-09)，不知道以后其他的公司还会不会有三次加密，四次加密。。。
// 当然只有百度地图使用的是百度坐标
// WGS-84坐标
// WGS-84坐标是一个国际的标准，一般卫星导航，原始的GPS设备中的数据都是采用这一坐标系。
// 国外的Google地图、OSM等采用的都是这一坐标。
// 坐标转换
// 在网上能找到很多关于坐标转化的代码，我把它们整理了一下并改成了JavaScript版本的。

// /*百度坐标转火星坐标*/
// x_pi=3.14159265358979324 * 3000.0 / 180.0;
// function baiduTomars(baidu_point){
//     let mars_point={lon:0,lat:0};
//     let x=baidu_point.lon-0.0065;
//     let y=baidu_point.lat-0.006;
//     let z=Math.sqrt(x*x+y*y)- 0.00002 * Math.sin(y * x_pi);
//     let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
//     mars_point.lon=z * Math.cos(theta);
//     mars_point.lat=z * Math.sin(theta);
//     return mars_point;
// }

// //火星坐标转百度坐标
// x_pi=3.14159265358979324 * 3000.0 / 180.0;
// function marsTobaidu(mars_point){
//     let baidu_point={lon:0,lat:0};
//     let x=mars_point.lon;
//     let y=mars_point.lat;
//     let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
//     let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
//     baidu_point.lon = z * Math.cos(theta) + 0.0065;
//     baidu_point.lat = z * Math.sin(theta) + 0.006;
//     return baidu_point;
// }

// //地球坐标系(WGS-84)转火星坐标系(GCJ)
// let pi = 3.14159265358979324;
// let a = 6378245.0;
// let ee = 0.00669342162296594323;
// /*判断是否在国内，不在国内则不做偏移*/
// function outOfChina(lon, lat)
// {
//     if ((lon < 72.004 || lon > 137.8347)&&(lat < 0.8293 || lat > 55.8271)){
//         return true;
//     }else {
//         return false;
//     }
// }
// function transformLat(x,y)
// {
//     let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
//     ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
//     ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
//     ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
//     return ret;
// }

// function transformLon(x,y)
// {
//     let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
//     ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
//     ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
//     ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
//     return ret;
// }


// function transform(wgLat,wgLon)
// {
//     let mars_point={lon:0,lat:0};
//     if (outOfChina(wgLat, wgLon))
//     {
//         mars_point.lat = wgLat;
//         mars_point.lon = wgLon;
//         return;
//     }
//     let dLat = transformLat(wgLon - 105.0, wgLat - 35.0);
//     let dLon = transformLon(wgLon - 105.0, wgLat - 35.0);
//     let radLat = wgLat / 180.0 * pi;
//     let magic = Math.sin(radLat);
//     magic = 1 - ee * magic * magic;
//     let sqrtMagic = Math.sqrt(magic);
//     dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
//     dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
//     mars_point.lat = wgLat + dLat;
//     mars_point.lon = wgLon + dLon;
// }

// /*经纬度转墨卡托投影坐标*/
// function lonlatTomercator(lonlat) {
//     let mercator={x:0,y:0};
//     let x = lonlat.x *20037508.34/180;
//     let y = Math.log(Math.tan((90+lonlat.y)*Math.PI/360))/(Math.PI/180);
//     y = y *20037508.34/180;
//     mercator.x = x;
//     mercator.y = y;
//     return mercator ;
// }
// /*墨卡托投影坐标转经纬度坐标*/
// function mercatorTolonlat(mercator){
//     let lonlat={x:0,y:0};
//     let x = mercator.x/20037508.34*180;
//     let y = mercator.y/20037508.34*180;
//     y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
//     lonlat.x = x;
//     lonlat.y = y;
//     return lonlat;
// }


function toRadians(x) {
    return x * Math.PI / 180;
}

const VincentyConstants = {
    a: 6378137,
    b: 6356752.3142,
    f: 1 / 298.257223563
};

/**
 * 计算两个点（经纬度）之间的距离 <br>
 * Given two objects representing points with geographic coordinates, this calculates the distance between those points on the surface of an ellipsoid.
 * @param {Object} p1 {lon, lat}
 * @param {Object} p2 {lon, lat}
 * @returns {Float} The distance (in km) between the two input points as measured on an
 *     ellipsoid.  Note that the input point objects must be in geographic
 *     coordinates (decimal degrees) and the return distance is in kilometers.
 * @private
 */
function distVincenty(p1, p2) {
    var ct = VincentyConstants;
    var a = ct.a, b = ct.b, f = ct.f;

    var L = toRadians(p2.lon - p1.lon);
    var U1 = Math.atan((1 - f) * Math.tan(toRadians(p1.lat)));
    var U2 = Math.atan((1 - f) * Math.tan(toRadians(p2.lat)));
    var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
    var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
    var lambda = L, lambdaP = 2 * Math.PI;
    var iterLimit = 20;
    while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
        var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
        var sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) +
            (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
        if (sinSigma == 0) {
            return 0;  // co-incident points
        }
        var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
        var sigma = Math.atan2(sinSigma, cosSigma);
        var alpha = Math.asin(cosU1 * cosU2 * sinLambda / sinSigma);
        var cosSqAlpha = Math.cos(alpha) * Math.cos(alpha);
        var cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
        var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
        lambdaP = lambda;
        lambda = L + (1 - C) * f * Math.sin(alpha) *
            (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    }
    if (iterLimit == 0) {
        return NaN;  // formula failed to converge
    }
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
    var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
        B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    var s = b * A * (sigma - deltaSigma);
    var d = s.toFixed(3) / 1000; // round to 1mm precision
    return d;
};

/**
 * 在给定起点纬度/经度（数字度数）、方位（数字度）和距离（以米为单位）的情况下计算终点。
 * Calculate destination point given start point lat/long (numeric degrees), bearing (numeric degrees) & distance (in m).
 * Adapted from Chris Veness work, see
 * http://www.movable-type.co.uk/scripts/latlong-vincenty-direct.html
 * @param {Object} lonlat {lon, lat}
 * @param {Float} brng The bearing (degrees).
 * @param {Float} dist The ground distance (meters).
 * @returns {Object} The destination point.
 * @private
 */
function destinationVincenty(lonlat, brng, dist) {
    var ct = VincentyConstants;
    var a = ct.a, b = ct.b, f = ct.f;

    var lon1 = lonlat.lon;
    var lat1 = lonlat.lat;

    var s = dist;
    var alpha1 = toRadians(brng);
    var sinAlpha1 = Math.sin(alpha1);
    var cosAlpha1 = Math.cos(alpha1);

    var tanU1 = (1 - f) * Math.tan(toRadians(lat1));
    var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1;
    var sigma1 = Math.atan2(tanU1, cosAlpha1);
    var sinAlpha = cosU1 * sinAlpha1;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    var sigma = s / (b * A), sigmaP = 2 * Math.PI;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
        var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
        var sinSigma = Math.sin(sigma);
        var cosSigma = Math.cos(sigma);
        var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
            B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
        sigmaP = sigma;
        sigma = s / (b * A) + deltaSigma;
    }

    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
    var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
        (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    var L = lambda - (1 - C) * f * sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));

    var revAz = Math.atan2(sinAlpha, -tmp);  // final bearing

    return new { "lon": lon1 + toDegrees(L), "lat": toDegrees(lat2) };
};

// console.info(distVincenty({ "lon": 125.3234, "lat": 38.23423 }, { "lon": 125.8234, "lat": 38.33423 }))
