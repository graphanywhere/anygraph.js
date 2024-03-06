/**
 * 雅都动态投影
 */
class DynamicTransform {
    constructor() {
    }

    /**
     * 视点变化时，初始化动态投影参数
     */
    static resetParaForExtent(extent) {
        var centerX = (extent[0] + extent[2]) / 2;
        var centerY = (extent[1] + extent[3]) / 2;
        this._resetPara(centerX, centerY);
    }

    /**
     * 视点变化时，初始化动态投影参数
     */
    static _resetPara(ref_x, ref_y) {
        var j, w, rw, s, t, m;
        this.m_ref_x = ref_x;
        this.m_ref_y = ref_y;
        j = 0.01 * ref_x + 104;
        w = 0.01 * ref_y + 36;
        this.m_ori_rj = 0.017453292519943 * j;
        rw = 0.017453292519943 * w;
        this.m_ori_n = Math.sin(rw);
        s = 0.081819191 * this.m_ori_n;
        t = Math.tan((1.57079632679490 - rw) * 0.5) / Math.pow((1 - s) / (1 + s), 0.040909596);
        m = Math.cos(rw) / (this.m_ori_n * Math.sqrt(1 - s * s));
        this.m_ori_r = m * 6378.137;
        this.m_ori_af = this.m_ori_r / Math.pow(t, this.m_ori_n);

        //console.dir({"m_ref_x":m_ref_x, "m_ref_y":m_ref_y, "m_ori_rj":m_ori_rj, "m_ori_n":m_ori_n, "m_ori_r":m_ori_r, "m_ori_af":m_ori_af});
    }

    /*
     * 求动态投影X坐标
     */
    static projToWorld(coord) {
        if(isNaN(this.m_ref_x) && isNaN(this.m_ref_y)) return coord;

        let [x, y] = coord;
        if (this.m_ori_af == null) return x;
        var j, w, rj, rw, s, r, t, a;

        j = 0.01 * x + 104;
        w = 0.01 * y + 36;
        rj = 0.017453292519943 * j;
        rw = 0.017453292519943 * w;
        s = 0.081819191 * Math.sin(rw);
        t = Math.tan((1.57079632679490 - rw) * 0.5) / Math.pow((1 - s) / (1 + s), 0.040909596);
        r = this.m_ori_af * Math.pow(t, this.m_ori_n);
        a = this.m_ori_n * (rj - this.m_ori_rj);
        x = this.m_ref_x + r * Math.sin(a);
        y = this.m_ref_y + this.m_ori_r - r * Math.cos(a);

        return [x, y];
    }

    /**
     * WGS84坐标转动态投影坐标
     * @param {Array} coord 
     * @returns Coord
     */
    static BLH84ToXY(coord) {
        let [lat, lon] = coord;
        var x = 100 * (lat - 104);
        var y = 100 * (lon - 36);
        return [x, y];
    }
}

DynamicTransform.m_ref_x = NaN;    // 窗口中心点X坐标值
DynamicTransform.m_ref_y = NaN;    // 窗口中心点Y坐标值
DynamicTransform.m_ori_rj = NaN;   // 窗口中心点经度（弧度）
DynamicTransform.m_ori_n = NaN;    //
DynamicTransform.m_ori_r = NaN;    //
DynamicTransform.m_ori_af = NaN;   //

export default DynamicTransform;
