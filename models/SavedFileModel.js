'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'viewId',
    'vcfFileSampleVersionId',
    'name',
    'url',
    'totalResults',
    'isDeleted',
    'languId',
    'description'
];

class SavedFileModel extends SecureModelBase {
    constructor(models) {
        super(models, 'saved_file', mappedColumns);
    }

    findAll(userId, callback) {
        async.waterfall([
            (callback) => this._fetchUserFiles(userId, callback),
            (files, callback) => this._mapItems(files, callback)
        ], callback);
    }

    findMany(userId, fileIds, callback) {
        async.waterfall([
            (callback) => this._fetchSavedFiles(fileIds, callback),
            (files, callback) => this._ensureAllItemsFound(files, fileIds, callback),
            (files, callback) => async.map(files, (file, callback) => {
                this._ensureItemNotDeleted(file, callback);
            }, callback),
            (files, callback) => async.map(files, (file, callback) => {
                this._checkUserIsCorrect(userId, file, callback);
            }, callback),
            (files, callback) => this._mapItems(files, callback)
        ], callback);
    }

    /**
     * Inserts metadata into database and calls back with state
     * which should be used to either commit or rollback the action.
     *
     * @param userId Id of the user uploading file.
     * @param languId Current language.
     * @param fileMetadata Metadata of the exported file.
     * @param callback (error, fileId, transactionState)
     * */
    startAddition(userId, languId, fileMetadata, callback) {
        async.waterfall([
            (callback) => this.db.beginTransaction(callback),
            (transactionWrapper, knexTransaction, callback) => this._insertFileMetadata(userId, languId, fileMetadata, true,
                knexTransaction, (error, fileId) => callback(error, transactionWrapper, fileId)),
            (transactionWrapper, fileId, callback) => {
                const transactionState = {
                    _transactionWrapper: transactionWrapper
                };
                callback(null, fileId, transactionState);
            }
        ], callback);
    }

    completeAddition(transactionState, error, fileId, callback) {
        const trx = transactionState._transactionWrapper;
        this.db.endTransaction(trx, error, fileId, callback);
    }

    _insertFileMetadata(userId, languId, fileMetadata, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : fileMetadata.id,
                    creator: userId,
                    viewId: fileMetadata.viewId,
                    vcfFileSampleVersionId: fileMetadata.vcfFileSampleVersionId,
                    name: fileMetadata.name,
                    url: fileMetadata.url,
                    totalResults: fileMetadata.totalResults
                };
                this._insert(dataToInsert, trx, callback);
            },
            // TODO: Insert filters to 'saved_file_filter'.
            (fileId, callback) => {
                const dataToInsert = {
                    commentId: fileId,
                    languId: languId,
                    description: fileMetadata.description
                };
                this._unsafeInsert('saved_file_text', dataToInsert, trx, (error) => {
                    callback(error, fileId);
                });
            }
        ], callback);
    }

    _add(userId, languId, file, shouldGenerateId, callback) {
        this.db.transactionally(
            (trx, callback) =>
                this._insertFileMetadata(userId, languId, file, shouldGenerateId, trx, callback),
            callback
        );
    }

    _update(userId, file, fileToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToUpdate = {
                        viewId: fileToUpdate.viewId,
                        vcfFileSampleVersionId: fileToUpdate.vcfFileSampleVersionId,
                        name: fileToUpdate.name,
                        url: fileToUpdate.url,
                        totalResults: fileToUpdate.totalResults
                    };
                    this._unsafeUpdate(file.id, dataToUpdate, trx, callback);
                },
                (fileId, callback) => {
                    const dataToUpdate = {
                        languId: file.languId,
                        description: fileToUpdate.description
                    };
                    this._updateSavedFileText(fileId, dataToUpdate, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _updateSavedFileText(fileId, dataToUpdate, trx, callback) {
        trx('comment_text')
            .where('saved_file_id', fileId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, fileId);
            });
    }

    _fetch(userId, fileId, callback) {
        async.waterfall([
            (callback) => this._fetchSavedFile(fileId, callback),
            (file, callback) => this._checkUserIsCorrect(userId, file, callback)
        ], callback);
    }

    _fetchSavedFile(fileId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .where('id', fileId)
                .asCallback((error, file) => {
                    if (error || !file.length) {
                        callback(error || new Error('Item not found: ' + fileId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(file[0]));
                    }
                });
        }, callback);
    }

    _fetchUserFiles(userId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, files) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(files));
                    }
                });
        }, callback);
    }

    _fetchSavedFiles(fileIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .whereIn('id', fileIds)
                .asCallback((error, files) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(files));
                    }
                });
        }, callback);
    }
}

module.exports = SavedFileModel;