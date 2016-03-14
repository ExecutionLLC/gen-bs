'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.savedFiles);

        this.config = this.services.config;
        this.amazonBucket = this.config.savedFilesUpload.amazonS3BucketName;
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        async.waterfall([
            (callback) => this._createAndUploadFile(user, languId, fileMetadata, fileStream, callback),
            (fileId, callback) => this.find(user, fileId, callback)
        ], callback);
    }

    download(user, languId, fileId, callback) {
        async.waterfall([
            (callback) => this.models.savedFiles.find(user.id, fileId, (error) => callback(error)),
            (callback) => callback(null, this._generateBucketKeyForFile(fileId)),
            (keyName, callback) => this.services.amazonS3.createObjectStream(this.amazonBucket, keyName, callback)
        ], (error, readStream) => callback(error, readStream));
    }

    update() {
        throw new Error('Operation is not supported');
    }

    _createAndUploadFile(user, languId, fileMetadata, fileStream, callback) {
        let transactionState = null;
        async.waterfall([
            (callback) => this.models.savedFiles.startAddition(user.id, languId, fileMetadata, callback),
            (fileId, transaction, callback) => {
                transactionState = transaction;
                const keyName = this._generateBucketKeyForFile(fileId);
                this.services.amazonS3.uploadObject(this.amazonBucket, keyName, fileStream,
                    (error) => callback(error, fileId));
            }
        ], (error, fieldId) => {
            if (transactionState) {
                this.models.savedFiles.completeAddition(transactionState, error, fieldId, callback)
            } else {
                callback(error, fieldId);
            }
        });
    }

    _generateBucketKeyForFile(fileId) {
        return 'saved_file_' + fileId;
    }
}

module.exports = SavedFilesService;
