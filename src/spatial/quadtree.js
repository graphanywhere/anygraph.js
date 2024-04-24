import Extent from "./extent.js";

/**
 * 四叉树空间索引类
 *
 * 象限索引编号如下：
 *  1  |  0
 * ----+----
 *  2  |  3
 */
class QuadTree {
    constructor(bbox, lvl, parent, idx = "0") {
        /**
         * 象限位置和大小
         */
        this.bounds = bbox || { x: 0, y: 0, width: 0, height: 0 };

        /**
         * 最大可包含的对象数量
         */
        this.maxObjects = 10;

        /**
         * 对象类型GeometryObject
         */
        this.objects = [];

        /**
         * 子象限
         */
        this.nodes = [];
        /**
         * 级别
         */
        this.level = lvl || 0;

        /**
         * 最大级别
         */
        this.maxLevels = 5;

        /**
         * 父节点
         */
        this.parent = parent;

        /**
         * 名称
         */
        this.name = (parent == null ? "" : (parent.name + "-")) + idx;
    }

    /*
     * 清除四叉树和对象的所有节点
     */
    clear() {
        this.objects = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }
        this.nodes = [];
    };

    /*
     * 返回树节点中所有对象
     */
    getAllObjects(objArray) {
        if (objArray == null) objArray = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(objArray);
        }
        for (let i = 0, len = this.objects.length; i < len; i++) {
            objArray.push(this.objects[i]);
        }
        return objArray;
    };

    /*
     * 返回对象可能碰撞的所有对象
     */
    findObjects(obj, objArray) {
        if (objArray == null) {
            objArray = [];
        }
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }
        let index = this.getIndex(obj.getBBox());
        if (index != -1 && this.nodes.length > 0) {
            this.nodes[index].findObjects(obj, objArray);
        }
        for (let i = 0, len = this.objects.length; i < len; i++) {
            objArray.push(this.objects[i]);
        }
        return objArray;
    };

    /**
     * 根据extent获取数据
     * @param {*} obj 
     * @returns Array
     */
    getObjects(extent) {
        let qd = this.getQuadTree(extent);
        let result = [];

        // 分析该四叉树中的所有对象
        let inList = qd.getAllObjects();
        let area = extent.slice();
        for (let i = 0, ii = inList.length; i < ii; i++) {
            let objExtent = inList[i].getBBox();
            if (Extent.containsExtent(area, objExtent) || Extent.intersects(area, objExtent)) {
                result.push(inList[i]);
            }
        }

        // 分析该四叉树父节点中的所有对象
        let pqd = qd.parent;
        while (pqd != null) {
            for (let i = 0, ii = pqd.objects.length; i < ii; i++) {
                let objExtent = pqd.objects[i].getBBox();
                if (Extent.containsExtent(area, objExtent) || Extent.containsExtent(objExtent, area) || Extent.intersects(area, objExtent)) {
                    result.push(pqd.objects[i]);
                }
            }
            pqd = pqd.parent;
        }

        return result;
    }

    /*
     * 返回obj所在的GQuadTree节点
     */
    getQuadTree(extent) {
        if (typeof extent === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }
        let index = this.getIndex(extent);
        if (index != -1 && this.nodes.length > 0) {
            return this.nodes[index].getQuadTree(extent);
        } else {
            return this;
        }
    };

    /*
     * 将对象插入到四叉树中。如果树超出了容量，它将拆分所有对象并将其添加到相应的节点。
     */
    insert(obj) {
        if (typeof obj === "undefined") {
            return;
        }

        if (obj instanceof Array) {
            for (let i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }
            return;
        }

        if (this.nodes.length > 0) {
            let index = this.getIndex(obj.getBBox());
            // 只有当对象可以完全容纳在一个子节点中时，才将其添加到子节点 
            if (index != -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }

        this.objects.push(obj);
        // 防止无限分割
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes[0] == null) {
                this.split();
            }
            let i = 0;
            while (i < this.objects.length) {
                let index = this.getIndex(this.objects[i].getBBox());
                if (index != -1) {
                    this.nodes[index].insert((this.objects.splice(i, 1))[0]);
                } else {
                    i++;
                }
            }
        }
    };

    /*
     * 删除指定节点
     */
    delete(obj) {
        let qd = this.getQuadTree(obj.getBBox());
        if (qd != null) {
            for (let i = 0; i < qd.objects.length; i++) {
                if (qd.objects[i] == obj) {
                    qd.objects.splice(i, 1);
                    return;
                }
            }
        }
        //万一obj的Bbox已经发生变化，上面可能删除失败
        for (let j = 0; j < this.nodes.length; j++) {
            let qd = this.nodes[j];
            if (qd != null) {
                for (let i = 0; i < qd.objects.length; i++) {
                    if (qd.objects[i] == obj) {
                        qd.objects.splice(i, 1);
                        return;
                    }
                }
            }
        }
    }

    /*
     * 确定对象属于哪个节点。-1表示对象不能完全适应节点，并且是当前节点的一部分
     */
    getIndex(extent) {
        let index = -1;

        // 构造对象的x,y,width, height属性
        // let extent = obj.getBBox();
        let objPos = { x: extent[0], y: extent[1], width: extent[2] - extent[0], height: extent[3] - extent[1] };

        let verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        let horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        // 对象可以完全放在顶部象限内
        let topQuadrant = (objPos.y < horizontalMidpoint && objPos.y + objPos.height < horizontalMidpoint);
        // 对象可以完全放在底部量块内
        let bottomQuadrant = (objPos.y > horizontalMidpoint);

        // 对象可以完全放在左侧象限内
        if (objPos.x < verticalMidpoint && objPos.x + objPos.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            } else if (bottomQuadrant) {
                index = 2;
            }
        } else if (objPos.x > verticalMidpoint) {  // 对象可以在正确的范围内完全修复
            if (topQuadrant) {
                index = 0;
            } else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };

    /*
     * 将节点拆分为4个子节点
     */
    split() {
        let subWidth = (this.bounds.width / 2) | 0;
        let subHeight = (this.bounds.height / 2) | 0;
        this.nodes[0] = new QuadTree({ x: this.bounds.x + subWidth, y: this.bounds.y, width: subWidth, height: subHeight }, this.level + 1, this, 0);
        this.nodes[1] = new QuadTree({ x: this.bounds.x, y: this.bounds.y, width: subWidth, height: subHeight }, this.level + 1, this, 1);
        this.nodes[2] = new QuadTree({ x: this.bounds.x, y: this.bounds.y + subHeight, width: subWidth, height: subHeight }, this.level + 1, this, 2);
        this.nodes[3] = new QuadTree({ x: this.bounds.x + subWidth, y: this.bounds.y + subHeight, width: subWidth, height: subHeight }, this.level + 1, this, 3);
    };

    print(opt = { total: 0, num: 0, includeChid: true }) {
        opt.num += 1;
        opt.total += this.objects.length;
        let space = "";
        for (let i = 0; i < this.level; i++) {
            space = space + "    ";
        }

        console.info("%slevel:%d, name:%s, extent:%d,%d,%d,%d, objCount:%d", space,
            this.level, this.name, this.bounds.x, this.bounds.y, this.bounds.x + this.bounds.width, this.bounds.y + this.bounds.height, this.objects.length);

        if (opt.includeChid == true) {
            for (let idx in this.nodes) {
                this.nodes[idx].print(opt);
            }
        }
        return opt;
    }
}

export default QuadTree;
