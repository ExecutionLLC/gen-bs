'use strict';

const _ = require('lodash');
const async = require('async');

const CollectionUtils = require('../utils/CollectionUtils');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'viewId',
    'vcfFileSampleVersionId',
    'name',
    'url',
    'totalResults',
    'isDeleted',
    'languageId',
    'description'
];

const SavedFileTables = {
    SavedFiles: 'saved_file',
    Filters: 'saved_file_filter',
    Texts: 'saved_file_text'
};

class SavedFileModel extends SecureModelBase {
    constructor(models) {
        super(models, SavedFileTables.SavedFiles, mappedColumns);
    }

    find(userId, fileId, callback) {
        this.db.transactionally((trx, callback) => {
            const fileIds = [fileId];
            async.waterfall([
                (callback) => this._fetchSavedFiles(trx, fileIds, userId, false, callback),
                (files, callback) => callback(null, files[0])
            ], callback);
        }, callback);
    }

    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._fetchSavedFiles(trx, null, userId, true, callback);
        }, callback);
    }

    findMany(userId, fileIds, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._fetchSavedFiles(trx, fileIds, userId, true, callback),
                (files, callback) => this._ensureAllItemsFound(files, fileIds, callback),
                (files, callback) => this._mapItems(files, callback)
            ], callback);
        }, callback);
    }

    /**
     * Inserts metadata into database and calls back with state
     * which should be used to either commit or rollback the action
     * using completeAddition() method.
     *
     * @param userId Id of the user uploading file.
     * @param languageId Current language.
     * @param fileMetadata Metadata of the exported file.
     * @param callback (error, fileId, transactionState)
     * */
    startAddition(userId, languageId, fileMetadata, callback) {
        async.waterfall([
            (callback) => this.db.beginTransaction(callback),
            (transactionWrapper, knexTransaction, callback) => this._insertFileMetadata(userId, languageId, fileMetadata, true,
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

    _insertFileMetadata(userId, languageId, fileMetadata, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                if (!fileMetadata.analysisId) {
                    callback(new Error('No analysis specified for the exported file.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                // Insert file metadata.
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : fileMetadata.id,
                    creator: userId,
                    analysisId: fileMetadata.analysisId,
                    name: fileMetadata.name,
                    url: fileMetadata.url,
                    totalResults: fileMetadata.totalResults
                };
                this._insert(dataToInsert, trx, callback);
            },
            (fileId, callback) => {
                // Insert translated description.
                const dataToInsert = {
                    savedFileId: fileId,
                    languageId,
                    description: fileMetadata.description
                };
                this._unsafeInsert(SavedFileTables.Texts, dataToInsert, trx, (error) => {
                    callback(error, fileId);
                });
            }
        ], callback);
    }

    _add(userId, languageId, file, shouldGenerateId, callback) {
        this.db.transactionally(
            (trx, callback) =>
                this._insertFileMetadata(userId, languageId, file, shouldGenerateId, trx, callback),
            callback
        );
    }

    _fetchSavedFiles(trx, fileIdsOrNull, userId, shouldExcludeDeletedEntries, callback) {
        let baseQuery = trx.select()
            .from(this.baseTableName)
            .innerJoin(SavedFileTables.Texts, SavedFileTables.Texts + '.saved_file_id', this.baseTableName + '.id')
            .where('creator', userId);

        if (fileIdsOrNull) {
            baseQuery = baseQuery.andWhere('id', 'in', fileIdsOrNull);
        }

        if (shouldExcludeDeletedEntries) {
            baseQuery = baseQuery.andWhere('is_deleted', false);
        }
        async.waterfall([
            callback => baseQuery.asCallback(callback),
            (files, callback) => this._toCamelCase(files, callback),
            (files, callback) => {
                if (fileIdsOrNull) {
                    this._ensureAllItemsFound(files, fileIdsOrNull, callback);
                } else {
                    callback(null, files);
                }
            }
        ], callback);
    }
}

module.exports = SavedFileModel;