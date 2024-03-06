import MathUtil from "./math.js";

/**
 * 计数器工具类
 */
class Counter {
    constructor(name) {
        this.name = (name == null ? "globle" : name);
        this.counterVariable = {};
    }

    /**
     * 计数
     * @param {String} key 
     * @param {int} val 
     */
    add(key, val = 1) {
        let objVal = this.counterVariable[key];
        if (objVal == null) {
            objVal = { "times": 1, "sum": val, "last": val }
        } else {
            objVal = { "times": objVal.times + 1, "sum": objVal.sum + val, "last": val }
        }
        this.counterVariable[key] = objVal;
    }

    /**
     * 重置计数器
     */
    reset() {
        this.counterVariable = {};
        return true;
    }

    /**
     * 在控制台显示计数信息
     * @param {Boolean} isSimple 
     */
    print(isSimple = false) {
        let times = 0;
        let sum = 0;

        if (isSimple === true) {
            // 计算平均数
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                times += val.times;
                sum += val.sum;
            }

            // 仅显示大于平均数的项
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                if (val.sum / val.times > sum / times) {
                    if (val.times === val.sum) {
                        console.info("%s => %d", key, val.times);
                    } else {
                        console.info("%s => times:%d, last:%d, sum:%d, averageValue:%f", key, val.times, val.last, val.sum, MathUtil.toFixed(val.sum / val.times, 2));
                    }
                }
            }
        } else {
            console.info(this.name + " => " + Object.keys(this.counterVariable).join(","));
            // 显示全部
            for (let key in this.counterVariable) {
                let val = this.counterVariable[key];
                if (val.times === val.sum) {
                    console.info("%s => %d", key, val.times);
                } else {
                    console.info("%s => times:%d, last:%d, sum:%d, averageValue:%f", key, val.times, val.last, val.sum, MathUtil.toFixed(val.sum / val.times, 2));
                }
                times += val.times;
                sum += val.sum;
            }
            // 显示求和统计
            if (times === sum) {
                console.info("total:" + times);
            } else {
                console.info("total: times:%d, sum:%d, averageValue:%f", times, sum, MathUtil.toFixed(sum / times, 2));
            }
        }
        return true;
    }
}

export default Counter;