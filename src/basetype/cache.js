/**
 * 最近最少使用的缓存类
 * @description LRU是Least Recently Used的缩写,意思是最近最少使用，是一种Cache替换算法。
 * Cache的容量有限，因此当Cache的容量用完后，而又有新的内容需要添加进来时，就需要挑选并舍弃原有的部分内容，从而腾出空间来放新内容。
 * LRU Cache 的替换原则就是将最近最少使用的内容替换掉。其实，LRU译成最久未使用会更形象， 因为该算法每次替换掉的就是一段时间内最久没有使用过的内容。
 */
class LRUCache {
    /**
     * 构造函数
     */
    constructor() {
        /**
         * 缓存对象数
         * @private
         * @type {number} 
         */
        this.count_ = 0;

        /**
         * 缓存数据
         *  {
         *     key_ : key, 
         *     newer : null,
         *     older : this.newest_,     //比当前对象更老的对象
         *     value_ : value            //比当前对象更新的对象
         *   }
         * @private 
         * @type {Object}
         */
        this.entries_ = {};

        /**
         * 最先加入缓存的对象
         * @private 
         * @type {Object}
         */
        this.oldest_ = null;

        /**
         * 最后加入缓存的对象
         * @private 
         * @type {Object}
         */
        this.newest_ = null;
    }

    /**
     * 清除缓存
     */
    clear() {
        this.count_ = 0;
        this.entries_ = {};
        this.oldest_ = null;
        this.newest_ = null;
    }

    /**
     * 判断取缓存中是否包含某对象
     * @param {string} key Key. 
     * @return {boolean} Contains key.
     */
    containsKey(key) {
        return this.entries_.hasOwnProperty(key);
    }

    /**
     * 取缓存中的对象值
     * @param {string} key Key. 
     * @return {T} Value.
     */
    get(key) {
        var entry = this.entries_[key];
        if(entry == null) {
            return null;
        } else if (entry === this.newest_) {
            return entry.value_;
        } else if (entry === this.oldest_) {
            this.oldest_ = (this.oldest_.newer);
            this.oldest_.older = null;
        } else {
            entry.newer.older = entry.older;
            entry.older.newer = entry.newer;
        }
        entry.newer = null;
        entry.older = this.newest_;
        this.newest_.newer = entry;
        this.newest_ = entry;
        return entry.value_;
    }

    /**
     * 取缓存中的对象数量
     * @return {number} Count.
     */
    getCount() {
        return this.count_;
    }

    /**
     * 取缓存中所有对象的Key
     * @return {Array.<string>} Keys. 
     */
    getKeys() {
        var keys = new Array(this.count_);
        var i = 0;
        var entry;
        for (entry = this.newest_; entry; entry = entry.older) {
            keys[i++] = entry.key_;
        }
        return keys;
    }

    /**
     * 取缓存中所有对象的Value
     * @return {Array.<T>} Values. 
     */
    getValues() {
        var values = new Array(this.count_);
        var i = 0;
        var entry;
        for (entry = this.newest_; entry; entry = entry.older) {
            values[i++] = entry.value_;
        }
        return values;
    }

    /**
     * 取最老的缓存对象值
     * @return {T} Last value. 
     * 
     */
    peekLast() {
        return this.oldest_.value_;
    }

    /**
     * 取最老的缓存对象的Key值
     * @return {string} Last key.  
     */
    peekLastKey() {
        return this.oldest_.key_;
    }

    /**
     * 取最老的对象，并在缓存中删除该对象
     * @return {T} value Value.  
     */
    pop() {
        var entry = this.oldest_;
        delete this.entries_[entry.key_];
        if (entry.newer) {
            entry.newer.older = null;
        }
        this.oldest_ = (entry.newer);
        if (!this.oldest_) {
            this.newest_ = null;
        }
        --this.count_;
        return entry.value_;
    }

    /**
     * 更新缓存中指定Key的对应的缓存对象值
     * @param {string} key Key.
     * @param {T} value Value.
     */
    replace(key, value) {
        this.get(key); // update `newest_`
        this.entries_[key].value_ = value;
    }

    /**
     * 设置缓存中指定Key对应的缓存对象值
     * @param {string} key Key.
     * @param {T} value Value.
     */
    set(key, value) {
        var entry = {
            key_: key,
            newer: null,
            older: this.newest_,     //比当前对象更老的对象
            value_: value            //比当前对象更新的对象
        };
        if (!this.newest_) {
            this.oldest_ = entry;       // 最老的对象
        } else {
            this.newest_.newer = entry;
        }
        this.newest_ = entry;           // 最新的对象
        this.entries_[key] = entry;
        ++this.count_;
    }
}

/**
 * 图形缓存类
 */
class ImageCache extends LRUCache {
    /**
     * 构造函数
     */
    constructor(opt_highWaterMark) {
        super();
        this.highWaterMark_ = (opt_highWaterMark !== undefined) ? opt_highWaterMark : 1024;
    }

    /**
     * 是否能够缓存
     */
    canExpireCache() {
        return this.getCount() > this.highWaterMark_;
    }

    /**
     * 过期处理
     */
    expireCache(usedTiles) {
        let tileKey;
        while (this.canExpireCache()) {
            tileKey = this.peekLastKey();
            if (Array.isArray(usedTiles)) {
                if (usedTiles.indexOf(tileKey) >= 0) {  // 判断oldest对象是否在需保留的数组中
                    break;
                } else {
                    let expireObj = this.pop();
                    expireObj = null;
                }
            } else {
                let expireObj = this.pop();
                expireObj = null;
            }
        }
    }
}

export default ImageCache;
export {LRUCache};
