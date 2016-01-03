'use strict';

const changeCase = require('change-case');
const _ = require('lodash');

class ChangeCaseUtil {
  static convertKeysToCamelCase(obj) {
      return ChangeCaseUtil._processObjectKeys(obj, changeCase.camelCase);
  }

  static convertKeysToSnakeCase(obj) {
      return ChangeCaseUtil._processObjectKeys(obj, changeCase.snakeCase);
  }

  static _processObjectKeys(obj, mutatorFunc) {
    if (!obj) {
        return obj;
    }

    if (_.isArray(obj)) {
        const arr = obj;
        return _.map(arr, item => ChangeCaseUtil._processObjectKeys(item, mutatorFunc));
    } else if (_.isObject(obj)) {
        const clone = _.cloneDeep(obj);
        _.keys(clone)
        .forEach(key => {
            const mutatedKey = mutatorFunc(key);
            const value = clone[key];
            delete clone[key];
            clone[mutatedKey] = ChangeCaseUtil._processObjectKeys(value, mutatorFunc);
        });
        return clone;
    } else {
        return obj;
    }
  }
}

module.exports = ChangeCaseUtil;