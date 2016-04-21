'use strict';

const _ = require('lodash');

/**
 * request-limiter library is intended to work with Redis.
 * This small class emulates the methods needed before
 * Redis is used on WebServer to store session information.
 * */
class RequestLimiterStorage {
    constructor(logger) {
        this.logger = logger;
        this.storage = {};

        // Rotate keys, but only once per 10 seconds.
        this.throttledRotate = _.throttle(() => this.rotateKeys(), 10000);
    }

    get(key, callback) {
        this.throttledRotate();
        this._removeIfExpired(key);
        if (this.storage[key]) {
            callback(null, this.storage[key].value)
        } else {
            callback(new Error('Key not found: ' + key));
        }
    }

    set(key, valueString, expireTimeFormat, expireTime, callback) {
        this.throttledRotate();
        this.storage[key] = {
            value: valueString,
            expireTime,
            expireTimeFormat,
            createdAt: _.now()
        };
        callback(null);
    }

    rotateKeys() {
        Object.keys(this.storage)
            .forEach(key => this._removeIfExpired(key));
    }

    _removeIfExpired(key) {
        const storageValue = this.storage[key];
        const expireTime = storageValue.expireTime;
        const expireTimeFormat = storageValue.expireTimeFormat;
        let actualExpireTimeMs = 0;
        // Simulate Redis time parameters for keys.
        switch (expireTimeFormat) {
            case 'PX': // Milliseconds
                actualExpireTimeMs = expireTime;
                break;
            case 'EX': // Seconds
                actualExpireTimeMs = expireTime * 1000;
                break;
            default:
                this.logger.error('Expiration period units are unsupported: ' + expireTimeFormat);
                break;
        }
        if ((_.now() - storageValue.createdAt) > actualExpireTimeMs) {
            delete this.storage[key];
        }
    }
}

module.exports = RequestLimiterStorage;