'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.amazonBucket = this.config.upload.amazonS3BucketName;
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        async.waterfall([
            (callback) => this.models.savedFiles.startAddition(user.id, languId, fileMetadata, callback),
            (fileId, transaction, callback) => {
                const keyName = this._generateBucketKeyForFile(fileId);
                this.services.amazonS3.uploadObject(this.amazonBucket, keyName, fileStream,
                    (error) => callback(error, fileId, transaction));
            }
        ], (error, fieldId, transaction) => {
            if (transaction) {
                this.models.savedFiles.completeAddition(transaction, error, fieldId, callback)
            }
        });
    }

    update() {
        throw new Error('Operation is not supported');
    }

    _generateBucketKeyForFile(fileId) {
        return 'saved_file_' + fileId;
    }
}

module.exports = SavedFilesService;
