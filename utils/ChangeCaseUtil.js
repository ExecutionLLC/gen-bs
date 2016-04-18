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

      if (_.isObject(obj) && !_.isFunction(obj)) {
          const clone = _.cloneDeep(obj);
          _.keys(clone)
            .forEach(key => {
                if (_.every(key, ChangeCaseUtil._isAlphanumericOrDash)) {
                    const mutatedKey = mutatorFunc(key);
                    const value = clone[key];
                    delete clone[key];
                    clone[mutatedKey] = ChangeCaseUtil._processObjectKeys(value, mutatorFunc);
                } else {
                    // keep the old key and process it's values
                    const value = clone[key];
                    clone[key] = ChangeCaseUtil._processObjectKeys(value, mutatorFunc);
                }
            });
          return clone;
      } else if (_.isArray(obj)) {
          const arr = obj;
          return _.map(arr, item => ChangeCaseUtil._processObjectKeys(item, mutatorFunc));
      } else {
          return obj;
      }
  }

  static _isAlphanumericOrDash(char) {
    const code = (char) => char.charCodeAt(0);
    const charCode = code(char);
    return char === '_'
        || (charCode >= code('a') && charCode <= code('z'))
        || (charCode >= code('A') && charCode <= code('Z'))
        || (charCode >= code('0') && charCode <= code('9'));
  }
}

module.exports = ChangeCaseUtil;