'use strict';

class ReflectionUtils {
    static isSubclassOf(obj, cls) {
        return obj && obj.constructor
            && obj.constructor.prototype instanceof cls;
    }
}

module.exports = ReflectionUtils;
