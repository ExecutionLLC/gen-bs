'use strict';

const {OBJECT_STORAGE_TYPES} = require('../utils/Enums');
const ServiceBase = require('./ServiceBase');
const AmazonS3DataProvider = require('./storage/AmazonS3DataProvider');
const FileSystemDataProvider = require('./storage/FileSystemDataProvider');

class ObjectStorageService extends ServiceBase {
    constructor(services) {
        super(services);
        const storageType = this.config.objectStorage.type;
        this._dataProvider = ObjectStorageService._getActualDataProvider(storageType, services);
    }

    addSavedFile(fileName, fileStream, callback) {
        this._dataProvider.addSavedFile(fileName, fileStream, callback);
    }

    removeSampleFile(fileName, callback) {
        this._dataProvider.removeSampleFile(fileName, callback);
    }

    getSavedFile(fileName, callback) {
        this._dataProvider.getSavedFile(fileName, callback);
    }

    addSampleFile(fileName, fileStream, callback) {
        this._dataProvider.addSampleFile(fileName, fileStream, callback);
    }

    getSamplePath(fileName) {
        return this._dataProvider.getSamplePath(fileName);
    }

    static _getActualDataProvider(storageType, services) {
        const {config, logger} = services;
        if (storageType === OBJECT_STORAGE_TYPES.S3) {
            return new AmazonS3DataProvider(config, logger);
        } else if (storageType === OBJECT_STORAGE_TYPES.FILE) {
            return new FileSystemDataProvider(config, logger);
        } else {
            throw new Error('Unsupported object storage type: ' + storageType);
        }
    }
}

module.exports = ObjectStorageService;
