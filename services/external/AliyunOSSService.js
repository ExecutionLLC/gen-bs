'use strict';

const oss = require('ali-oss');
const fs = require('fs');
const co = require('co');
const genbind = require('generator-bind');

const ServiceBase = require('../ServiceBase');

class AliyunOSSService extends ServiceBase {
    constructor(services) {
        super(services);

        this.regionName = this.config.objectStorage.oss.regionName;
        this.store = this._createStore();
    }

    uploadObject(bucketName, keyName, fileStream, callback) {
        co(genbind(this, function*() {
            yield this.store.useBucket(bucketName, this.regionName);
            return yield this.store.put(
                keyName,
                fileStream.path,
                null
            );
        })).then(() => {
            callback(null);
        }).catch((error) => {
            callback(error);
        })
    }

    createObjectStream(bucketName, keyName, callback) {
        // Dirty hack because the getStream function doesn't work.
        // Here we consider we can delete a file with read stream opened on it.
        const fileName = this.config.savedFilesUpload.path + '/' + keyName;
        co(genbind(this, function*() {
            yield this.store.useBucket(bucketName, this.regionName);
            yield this.store.get(keyName, fileName);
        })).then(() => callback(null, fs.createReadStream(fileName)))
            .then(() => fs.unlinkSync(fileName))
            .catch((error) => callback(error));
    }

    _createStore() {
        const {accessKeyId, accessKeySecret, regionName: region} = this.config.objectStorage.oss;
        return oss({accessKeyId, accessKeySecret, region});
    }
}

module.exports = AliyunOSSService;
