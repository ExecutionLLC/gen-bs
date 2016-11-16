'use strict';

const assert = require('assert');

const {OBJECT_STORAGE_TYPES} = require('../utils/Enums');
const ServiceBase = require('./ServiceBase');

class ObjectStorageService extends ServiceBase {
    constructor(services) {
        super(services);
        const storageType = this.config.objectStorage.type;
        const objectService = ObjectStorageService._getActualObjectService(storageType, services);
        const storageSettings = this.config.objectStorage[storageType];
        assert.ok(storageSettings);
        Object.assign(this, {objectService, storageSettings});
    }

    uploadObject(bucketName, keyName, fileStream, callback) {
        this.objectService.uploadObject(bucketName, keyName, fileStream, callback);
    }

    deleteObject(bucketName, keyName, callback) {
        this.objectService.deleteObject(bucketName, keyName, callback);
    }

    createObjectStream(bucketName, keyName, callback) {
        this.objectService.createObjectStream(bucketName, keyName, callback);
    }

    getStorageSettings() {
        return this.storageSettings;
    }

    static _getActualObjectService(storageType, services) {
        if (storageType === OBJECT_STORAGE_TYPES.S3) {
            return services.amazonS3;
        } else if (storageType === OBJECT_STORAGE_TYPES.OSS) {
            return services.oss;
        } else {
            throw new Error('Unsupported object storage type: ' + storageType);
        }
    }
}

module.exports = ObjectStorageService;
