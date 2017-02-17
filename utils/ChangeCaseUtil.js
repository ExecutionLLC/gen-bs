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
            return _.map(obj, item => ChangeCaseUtil._processObjectKeys(item, mutatorFunc));
        } else  if (_.isObject(obj) && !_.isFunction(obj) && !(obj instanceof Date)) {
            const result = {};
            _.keys(obj)
                .forEach(key => {
                    const value = obj[key];
                    const newValue = ChangeCaseUtil._processObjectKeys(value, mutatorFunc);
                    if (/[^a-zA-Z\d_]/.test(key)) {
                        // keep the old key and process it's values
                        result[key] = newValue;
                    } else {
                        const mutatedKey = mutatorFunc(key);
                        result[mutatedKey] = newValue;
                    }
                });
            return result;
        } else {
            return obj;
        }
    }
}

module.exports = ChangeCaseUtil;