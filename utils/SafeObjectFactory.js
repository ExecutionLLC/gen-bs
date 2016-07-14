'use strict';

class SafeObjectFactory {
    /**
     * Creates an object which throws when an undefined property value is accessed.
     * @param {Object}[content]
     * @return {Proxy}
     */
    static create(content) {
        return new Proxy(content || {}, {
            get: (target, key, receiver) => {
                if (key in target) {
                    return Reflect.get(target, key, receiver);
                }
                throw new Error(`${key} is expected to be defined here.`);
            }
        });
    }
}

module.exports = SafeObjectFactory;
