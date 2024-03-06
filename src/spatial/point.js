/**
 * 点坐标处理类
 */
class PointClass {  
    constructor(x, y) {  
        const base = { x: 0, y: 0 }

        // ensure source as object
        const source = Array.isArray(x) ? { x: x[0], y: x[1] } : typeof x === 'object' ? { x: x.x, y: x.y } : { x: x, y: y }

        // merge source
        this.x = source.x == null ? base.x : source.x
        this.y = source.y == null ? base.y : source.y
    }  
      
    getX() {  
        return this.x;  
    }  
      
    getY() {  
        return this.y;  
    }

    toArray() {
        return [this.x, this.y]
    }

    // Clone point
    clone() {
        return new PointClass(this)
    }
}

export default PointClass;
