'use strict';

const oss = require('ali-oss');
const fs = require('fs');
const co = require('co');
const genbind = require('generator-bind');

const ServiceBase = require('../ServiceBase');

class AliyunOSSService extends ServiceBase {
    constructor(services) {
        super(services);

        this.store = this._createStore();
    }

    uploadObject(keyName, fileStream, callback) {
        co(genbind(this, function*() {
            return yield this.store.put(
                keyName,
                fileStream.path,
                null
            )
        })).then(() => {
            callback(null);
        }).catch((error) => {
            callback(error);
        })
    }

    createObjectStream(keyName, callback) {
        // Dirty hack because the getStream function doesn't work.
        // Here we consider we can delete a file with read stream opened on it.
        const fileName = this.config.savedFilesUpload.path + '/' + keyName;
        co(genbind(this, function*() {
            yield this.store.get(keyName, fileName);
        })).then(() => callback(null, fs.createReadStream(fileName)))
            .then(() => fs.unlinkSync(fileName))
            .catch((error) => callback(error));
    }

    _createStore() {
        const ossSettings = this.config.savedFilesUpload.oss;
        return oss({
            bucket: ossSettings.ossBucketName,
            accessKeyId: ossSettings.ossAccessKeyId,
            accessKeySecret: ossSettings.ossAccessKeySecret,
            region: ossSettings.ossRegionName
        });
    }
}

module.exports = AliyunOSSService;
