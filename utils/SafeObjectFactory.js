'use strict';

class SafeObjectFactory {
    static create() {
        return new Proxy({}, {
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
