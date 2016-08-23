'use strict';

const assert = require('assert');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.savedFiles);
    }

    init() {
        this.bucketName = this.services.objectStorage.getStorageSettings().savedFilesBucket;
        assert.ok(this.bucketName);
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this._createAndUploadFile(user, languId, fileMetadata, fileStream, callback),
            (fileId, callback) => this.find(user, fileId, callback)
        ], callback);
    }

    download(user, languId, fileId, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.models.savedFiles.find(user.id, fileId, (error) => callback(error)),
            (callback) => callback(null, this._generateBucketKeyForFile(fileId)),
            (keyName, callback) => this.services.objectStorage.createObjectStream(this.bucketName, keyName, callback)
        ], (error, readStream) => callback(error, readStream));
    }

    find(user, savedFileId, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => super.find(user, savedFileId, callback),
            (savedFile, callback) => this._loadAdditionalEntities(user, savedFile, callback)
        ], (error, savedFile) => callback(error, savedFile));
    }

    findAll(user, callback) {
        // Demo users currently don't have any access to saved files.
        if (this.services.users.isDemoUserId(user.id)) {
            callback(null, []);
            return;
        }

        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => super.findAll(user, callback),
            (savedFiles, callback) => {
                async.mapSeries(savedFiles, (savedFile, callback) => {
                    this._loadAdditionalEntities(user, savedFile, callback)
                }, callback);
            }
        ], callback);
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
                this.services.objectStorage.uploadObject(this.bucketName, keyName, fileStream,
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

    _loadAdditionalEntities(user, savedFile, callback) {
        async.waterfall([
            (callback) => {
                // Find the used entities themselves, as they may be absent on the frontend
                // (ex. deleted or have different versions)
                async.parallel({
                    savedFile: (callback) => callback(null, savedFile),
                    analysis: (callback) => this.services.analysis.find(user, savedFile.analysisId, callback)
                }, callback);
            },
            // Build saved file with view, filter and sample.
            (fileWithEntities, callback) => callback(null,
                Object.assign({}, fileWithEntities.savedFile, {
                    analysis: fileWithEntities.analysis
                }))
        ], callback);
    }
}

module.exports = SavedFilesService;
