/*----------------------------------------------------------------------------
|  抽象数据类型
|        版本: V2.0    2023-05-31  hjq
|
|  Stack          栈（先进后出）
|  Queue          队列（先进先出）
|  PriorityQueue  优先队列（先进先出）
|  LinkList       链表
|  Set            集合
|  Dictionay      字典
|  Graph          图
|  Collection     集合
|
|-----------------------------------------------------------------------------
|  Copyright (c) 1993 - 2023 雅都软件
|----------------------------------------------------------------------------*/

/**
 * 栈类（先进后出）
 */
class Stack {
    constructor() {
        this.data = [];
    }

    /**
     * 压栈操作
     */
    push(obj) {
        this.data.push(obj);
    }

    /**
     * 出栈操作
     */
    pop() {
        return this.data.pop();
    }

    /**
     * peek操作
     */
    peek() {
        return this.data[this.data.length - 1];
    }

    /**
     * 判断栈中的元素是否为空
     */
    isEmpty() {
        return this.data.length == 0;
    }

    /**
     * 获取栈中元素的个数
     */
    size() {
        return this.data.length;
    }

    /**
     * 清空栈
     */
    clear() {
        this.data = [];
    }
}

/**
 * 队列(先进先出)
 */
class Queue {
    constructor() {
        this.data = [];
    }

    /**
     * 入队
     */
    enqueue(obj) {
        this.data.push(obj)
    }

    /**
     *  出队
     */
    dequeue() {
        var obj = this.data.shift();
        return obj;
    }

    /**
     * 队列是否为空
     */
    isEmpty() {
        return this.data.length == 0;
    }

    /**
     * 返回队列长度
     */
    size() {
        return this.data.length;
    }

    /**
     * 清空队列
     */
    clear() {
        this.data = [];
    }

    /**
     * 返回队列
     */
    toArray() {
        return this.data;
    }

    /**
     * 返回队列中第一个对象值
     */
    front() {
        return this.data[0];
    }
}

/**
 * 优先级队列
 */
class PriorityQueue extends Queue {
    constructor() {
        super();
    }

    /**
     * 添加对象(优先级为数字类型，数字越小, 优先级越高)
     */
    enqueue(obj, priority = 100) {
        // 1.根据传入的元素, 创建新的QueueElement
        const element = { obj, priority };

        // 2.获取传入元素应该在正确的位置
        if (this.isEmpty()) {
            this.data.push(element);
        } else {
            var added = false;
            for (var i = 0; i < items.length; i++) {
                if (element.priority < items[i].priority) {
                    this.data.splice(i, 0, element);
                    added = true;
                    break;
                }
            }

            // 遍历完所有的元素, 优先级都大于新插入的元素时, 就插入到最后
            if (!added) {
                this.data.push(element);
            }
        }
    }
}

/*
 * 普通集合
 */
class Set {
    constructor() {
        this.data = [];
    }

    /**
     * 增加一个对象至集合中
     */
    append(obj) {
        if (obj === undefined || this.has(obj)) {
            return false;
        } else {
            this.data.push(obj);
            return true;
        }
    }

    /**
     * 从集合中删除某对象
     */
    remove(obj) {
        let idx = this.data.indexOf(obj);
        if (idx >= 0) {
            this.data.splice(idx, 1);
            return true;
        } else {
            return false;
        };
    }

    /**
     * 检测对象是否存在
     */
    has(obj) {
        return this.data.indexOf(obj) >= 0;
    }

    /**
     * 返回集合的长度
     */
    size() {
        return this.data.length;
    }

    /**
     * 清空数组
     */
    clear() {
        this.data = [];
    }

    /**
     * 转化成输出结果
     */
    toString() {
        return this.data.join(",");
    }

    /**
     * 返回队列
     */
    toArray() {
        return this.data;
    }
};

/**
 * 封装一个Node类, 用于保存每个节点信息
 */
class LinkListNode {
    constructor(element) {
        this.element = element;
        this.next = null;
        this.prev = null;
    }
}

/**
 * 单向链表
 */
class LinkedList {
    constructor() {
        // 链表中的属性
        this.length = 0;
        this.head = null;
    }

    /**
     * 链表尾部追加元素方法
     */
    append(element) {
        // 1.根据新元素创建节点
        let newNode = new LinkListNode(element);

        // 2.判断原来链表是否为空
        if (this.head === null) { // 链表尾空
            this.head = newNode;
        } else { // 链表不为空
            // 2.1.定义变量, 保存当前找到的节点
            var current = this.head;
            while (current.next) {
                current = current.next;
            }

            // 2.2.找到最后一项, 将其next赋值为node
            current.next = newNode;
        }

        // 3.链表长度增加1
        this.length++;
    }

    /**
     * 在特点位置增加元素
     */
    insert(position, element) {
        // 1.检测越界问题: 越界插入失败
        if (position < 0 || position > this.length) return false;

        // 2.定义变量, 保存信息
        var newNode = new LinkListNode(element);
        var current = this.head;
        var previous = null;
        index = 0

        // 3.判断是否列表是否在第一个位置插入
        if (position == 0) {
            newNode.next = current;
            this.head = newNode;
        } else {
            while (index++ < position) {
                previous = current;
                current = current.next;
            }
            newNode.next = current;
            previous.next = newNode;
        }

        // 4.length+1
        this.length++;

        return true;
    }

    /**
     * 根据元素删除信息
     */
    remove(element) {
        var index = this.indexOf(element);
        return this.removeAt(index);
    }

    /**
     * 根据位置移除节点
     */
    removeAt(position) {
        // 1.检测越界问题: 越界移除失败, 返回null
        if (position < 0 || position >= this.length) return null;

        // 2.定义变量, 保存信息
        var current = this.head;
        var previous = null;
        var index = 0;

        // 3.判断是否是移除第一项
        if (position === 0) {
            ;
            this.head = current.next;
        } else {
            while (index++ < position) {
                previous = current;
                current = current.next;
            }

            previous.next = current.next;
        }

        // 4.length-1
        this.length--;

        // 5.返回移除的数据
        return current.element;
    }

    /**
     * 根据元素获取链表中的位置
     */
    indexOf(element) {
        // 1.定义变量, 保存信息
        var current = this.head;
        index = 0;

        // 2.找到元素所在的位置
        while (current) {
            if (current.element === element) {
                return index;
            }
            index++;
            current = current.next;
        }

        // 3.来到这个位置, 说明没有找到, 则返回-1
        return -1;
    }

    // 判断链表是否为空
    isEmpty() {
        return this.length == 0;
    }

    // 获取链表的长度
    size() {
        return this.length;
    }

    // 获取第一个节点
    getFirst() {
        return this.head.element;
    }

    /**
     *  链表的toString方法
     */
    toString() {
        // 1.定义两个变量
        var current = this.head;
        var listString = "";

        // 2.循环获取链表中所有的元素
        while (current) {
            listString += "," + current.element;
            current = current.next;
        }

        // 3.返回最终结果
        return listString.slice(1);
    }
}

/**
 * 字典
 */ 
class Dictionay {

    constructor() {
        // 字典属性
        this.items = {}
    }

    /**
     * 添加键值对
     */ 
    set(key, value) {
        this.items[key] = value;
    }

    /**
     * 判断字典中是否有某个key
     */ 
    has(key) {
        return this.items.hasOwnProperty(key);
    }

    /**
     * 从字典中移除元素
     */ 
    remove(key) {
        // 1.判断字典中是否有这个key
        if (!this.has(key)) return false;

        // 2.从字典中删除key
        delete this.items[key];
        return true;
    }

    /**
     * 根据key去获取value
     */ 
    get(key) {
        return this.has(key) ? this.items[key] : undefined;
    }

    /**
     * 获取所有的keys
     */ 
    keys() {
        return Object.keys(this.items);
    }

    /**
     *  获取所有的value
     */
    values() {
        return Object.values(this.items);
    }

    /**
     * size方法
     */ 
    size() {
        return this.keys().length;
    }

    /**
     * clear方法
     */ 
    clear() {
        this.items = {};
    }
}

/**
 * 集合
 */
class Collection {

    /**
     * @param 构造集合时的数据
     * @param {Object}  {unique}
     */
    constructor(opt_array, opt_options) {
        const options = opt_options || {};

        /**
         * 集合中的对象是否不能重复
         */
        this.unique_ = !!options.unique;

        /**
         * 集合数据
         */
        this.array_ = opt_array ? opt_array : [];

        // 唯一性检查
        if (this.unique_) {
            for (let i = 0, ii = this.array_.length; i < ii; ++i) {
                this.assertUnique_(this.array_[i], i);
            }
        }
    }

    /**
     * 清空集合
     */
    clear() {
        while (this.getLength() > 0) {
            this.pop();
        }
    }

    /**
     * 将数组添加到集合中
     */
    extend(arr) {
        for (let i = 0, ii = arr.length; i < ii; ++i) {
            this.push(arr[i]);
        }
        return this;
    }

    /**
     * 遍历方法
     */
    forEach(callback) {
        const array = this.array_;
        for (let i = 0, ii = array.length; i < ii; ++i) {
            callback(array[i], i, array);
        }
    }

    /**
     * 返回数组对象
     */
    getArray() {
        return this.array_;
    }

    /**
     * 返回指定index的数据
     */
    item(index) {
        return this.array_[index];
    }

    /**
     * Get the length of this collection.
     * @return {number} The length of the array.
     */
    getLength() {
        return this.array_.length;
    }

    /**
     * Insert an element at the provided index.
     * @param {number} index Index.
     * @param {T} elem Element.
     */
    insertAt(index, elem) {
        if (this.unique_) {
            this.assertUnique_(elem);
        }
        this.array_.splice(index, 0, elem);
    }

    /**
     * Remove the last element of the collection and return it.
     * Return `undefined` if the collection is empty.
     * @return {T|undefined} Element.
     */
    pop() {
        return this.removeAt(this.getLength() - 1);
    }

    /**
     * Insert the provided element at the end of the collection.
     * @param {T} elem Element.
     * @return {number} New length of the collection.
     */
    push(elem) {
        if (this.unique_) {
            this.assertUnique_(elem);
        }
        const n = this.getLength();
        this.insertAt(n, elem);
        return this.getLength();
    }

    /**
     * Remove the first occurrence of an element from the collection.
     * @param {T} elem Element.
     * @return {T|undefined} The removed element or undefined if none found.
     */
    remove(elem) {
        const arr = this.array_;
        for (let i = 0, ii = arr.length; i < ii; ++i) {
            if (arr[i] === elem) {
                return this.removeAt(i);
            }
        }
        return undefined;
    }

    /**
     * Remove the element at the provided index and return it.
     * Return `undefined` if the collection does not contain this index.
     * @param {number} index Index.
     * @return {T|undefined} Value.
     */
    removeAt(index) {
        const prev = this.array_[index];
        this.array_.splice(index, 1);
        return prev;
    }

    /**
     * Set the element at the provided index.
     * @param {number} index Index.
     * @param {T} elem Element.
     */
    setAt(index, elem) {
        const n = this.getLength();
        if (index < n) {
            if (this.unique_) {
                this.assertUnique_(elem, index);
            }
            const prev = this.array_[index];
            this.array_[index] = elem;
        } else {
            for (let j = n; j < index; ++j) {
                this.insertAt(j, undefined);
            }
            this.insertAt(index, elem);
        }
    }

    /**
     * 唯一性检查
     */
    assertUnique_(elem, opt_except) {
        for (let i = 0, ii = this.array_.length; i < ii; ++i) {
            if (this.array_[i] === elem && i !== opt_except) {
                throw new AssertionError(58);
            }
        }
    }
}

/**
 * 图结构
 */
class Graph {

    constructor() {
        //存储顶点
        this.vertexes = [];
        //存储边
        this.edges = {};

    }

    //添加顶点
    addVertex(v) {
        if (!this.vertexes.includes(v)) {
            this.vertexes.push(v);
            this.vertexes[v] = [];
        }
    }

    //添加边
    addEdge(a, b) {
        if (this.vertexes.includes(a) && this.vertexes.includes(b)) {
            if (!this.vertexes[a].includes(b)) {
                this.vertexes[a].push(b);
                this.vertexes[b].push(a);
            }
        }
    }

    //打印邻接表
    print() {
        this.vertexes.forEach(element => {
            let s = element + " => ";
            this.vertexes[element].forEach(element2 => {
                s += element2;
            });
            console.log(s);
        });
    }

    //广度优先遍历
    //用颜色标记状态 white -> 未探索  grey -> 已发现  black -> 已探索
    bfs(v, callback) {
        if(!this.vertexes.includes(v)) {
            return;
        }

        //初始化颜色
        let color = this._initColor();
        //创建队列
        let queue = new Queue();
        queue.enqueue(v);

        while (!queue.isEmpty()) {
            // 正在遍历的顶点now
            let now = queue.dequeue();
            // 增加回调函数，从而可在回调中判断是否停止或退出等判断
            if (callback) {
                let rtn = callback(now);
                if(rtn === -1) {                 // 退出遍历
                    break;
                } else if(rtn === 1) {           // 不遍历该对象连接的其他对象
                    continue;
                }
            }
            // 遍历now相连的每个顶点
            this.vertexes[now].forEach(element => {
                if (color[element] === 'white') {
                    queue.enqueue(element);
                    color[element] = 'grey';
                }
            });
            color[now] = 'black';
        }
    }

    //广度优先遍历需要用到的函数，将每个顶点颜色初始化为white
    _initColor() {
        let color = {};
        this.vertexes.forEach(element => {
            color[element] = 'white';
        });
        return color;
    }


    //获取最短路径
    shortestPath(from, to) {
        //路径栈，从to不断寻找回溯点，在寻找过程中推进栈，最后后进先出拿出来
        let path = new CBStack();
        //包含 pre 回溯点 和 d 距离 的对象obj
        let obj = this.BFS(from);

        while (to !== from) {
            path.push(to);
            to = obj.pre[to];
        }
        path.push(to);

        let s = path.pop();
        while (!path.isEmpty()) {
            s += ' => ';
            s += path.pop();
        }
        return s;
    }

    //获取最短路径需要用到的改良的广度优先算法
    //回溯点 pre
    //距离   d
    BFS(v, callback) {
        //初始化颜色
        let color = this._initColor();
        //创建队列
        let queue = new Queue();
        queue.enqueue(v);

        let d = {}, pre = {};
        //初始化d和pre
        this.vertexes.forEach(element => {
            d[element] = 0;
            pre[element] = null;
        });

        while (!queue.isEmpty()) {
            //正在遍历的顶点now
            let now = queue.dequeue();
            //遍历now相连的每个顶点
            this.vertexes[now].forEach(element => {
                if (color[element] === 'white') {
                    queue.enqueue(element);
                    color[element] = 'grey';

                    pre[element] = now;
                    d[element] = d[now] + 1;
                }
            });
            color[now] = 'black';
            if (callback) {
                callback(now);
            }
        }
        return {
            pre: pre,
            d: d
        };
    }

    //深度优先遍历
    dfs(v, callback) {
        let color = this._initColor();
        this._dfsFun(v, color, callback);
    }

    //深度优先遍历需要用到的遍历函数
    _dfsFun(v, color, callback) {
        color[v] = 'grey';
        this.vertexes[v].forEach(element => {
            if (color[element] === 'white') {
                this._dfsFun(element, color, callback);
            }
        });
        color[v] = 'black';
        if (callback) {
            callback(v);
        }
    }
}

export {Graph, Stack}
