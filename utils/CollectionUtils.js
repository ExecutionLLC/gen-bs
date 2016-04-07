'use strict';

const _ = require('lodash');

class CollectionUtils {
    static createHash(collection, hashKeyFunc) {
        return _.reduce(collection, (result, item) => {
            const key = hashKeyFunc(item);
            result[key] = item;
            return result;
        }, {});
    }

    static createHashByKey(collection, itemKeyName) {
        return CollectionUtils.createHash(collection, (item) => item[itemKeyName]);
    }
}

module.exports = CollectionUtils;