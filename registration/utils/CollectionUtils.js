'use strict';

const _ = require('lodash');

class CollectionUtils {
    static createHash(collection, hashKeyFunc, hashValueFunc = _.identity) {
        return _.reduce(collection, (result, item) => {
            const key = hashKeyFunc(item);
            result[key] = hashValueFunc(item);
            return result;
        }, Object.create(null));
    }

    static createMultiValueHash(collection, hashKeyFunc, hashValueFunc = _.identity) {
        return _.reduce(collection, (result, item) => {
            const key = hashKeyFunc(item);
            const value = hashValueFunc(item);
            if (result[key]) {
                result[key].push(value);
            } else {
                result[key] = [value];
            }
            return result;
        }, Object.create(null));
    }

    static createHashByKey(collection, itemKeyName) {
        return CollectionUtils.createHash(collection, (item) => item[itemKeyName]);
    }
}

module.exports = CollectionUtils;