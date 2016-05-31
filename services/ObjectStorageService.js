'use strict';

const ServiceBase = require('./ServiceBase');

class ObjectStorageService extends ServiceBase {
    constructor(services) {
        super(services);
        this.objectService = this._getActualObjectService();
    }

    uploadObject(keyName, fileStream, callback) {
        this.objectService.uploadObject(keyName, fileStream, callback);
    }

    createObjectStream(keyName, callback) {
        this.objectService.createObjectStream(keyName, callback);
    }

    _getActualObjectService() {
        const savedFilesUpload = this.config.savedFilesUpload;
        const storageType = savedFilesUpload.objectStorageType;

        if (storageType === 's3') {
            return this.services.amazonS3;
        } else if (storageType === 'oss') {
            return this.services.oss;
        } else {
            throw new Error('Unsupported object storage type: ' + storageType);
        }
    }
}

module.exports = ObjectStorageService;
