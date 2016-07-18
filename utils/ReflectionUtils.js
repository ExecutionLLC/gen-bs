'use strict';

const CollectionUtils = require('./CollectionUtils');

class ReflectionUtils {
    static isSubclassOf(obj, cls) {
        return obj && obj.constructor
            && obj.constructor.prototype instanceof cls;
    }

    static serialize(obj) {
        const objectContent = JSON.parse(JSON.stringify(obj));
        objectContent.__className__ = this.getObjectClassName(obj);
        return JSON.stringify(objectContent);
    }

    static deserialize(objectString, expectedClasses) {
        const nameToExpectedClassHash = CollectionUtils.createHash(expectedClasses, (cls) => this.getClassName(cls));
        const content = JSON.parse(objectString);
        const className = content.__className__;
        delete content.__className__;
        const ObjectClass = nameToExpectedClassHash[className];
        if (!ObjectClass) {
            throw new Error(`Unexpected object class name: ${className}`);
        }
        const obj = new ObjectClass();
        Object.assign(obj, content);
        return obj;
    }

    static getObjectClassName(obj) {
        if (obj && obj.constructor) {
            return obj.constructor.name;
        }
        return undefined;
    }

    static getClassName(cls) {
        if (cls) {
            return cls.name;
        }

        return undefined;
    }
}

module.exports = ReflectionUtils;
