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
                (files, callback) => this._ensureAllItemsFound(files, fileIds, callback),
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
                if (!fileMetadata.filterIds) {
                    callback(new Error('No filters specified for the exported file.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                // Insert file metadata.
                const dataToInsert = {
                    id: shouldGenerateId ? this._generateId() : fileMetadata.id,
                    creator: userId,
                    viewId: fileMetadata.viewId,
                    vcfFileSampleVersionId: fileMetadata.sampleId,
                    name: fileMetadata.name,
                    url: fileMetadata.url,
                    totalResults: fileMetadata.totalResults
                };
                this._insert(dataToInsert, trx, callback);
            },
            (fileId, callback) => {
                // Insert filters.
                async.eachSeries(fileMetadata.filterIds, (filterId, callback) => {
                    const dataToInsert = {
                        savedFileId: fileId,
                        filterId
                    };
                    this._unsafeInsert(SavedFileTables.Filters, dataToInsert, trx, callback);
                }, (error) => callback(error, fileId));
            },
            (fileId, callback) => {
                // Insert translated description.
                const dataToInsert = {
                    savedFileId: fileId,
                    languId: languId,
                    description: fileMetadata.description
                };
                this._unsafeInsert(SavedFileTables.Texts, dataToInsert, trx, (error) => {
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
            (callback) => baseQuery.asCallback((error, files) => callback(error, files)),
            (files, callback) => this._toCamelCase(files, callback),
            (files, callback) => {
                const fileIds = _.pluck(files, 'id');
                this._findSavedFilesFilters(trx, fileIds,
                    (error, fileIdToFilterIdsHash) => callback(error, files, fileIdToFilterIdsHash))
            },
            (files, fileIdToFilterIdsHash, callback) => {
                // Transform objects loaded from database.
                const mappedFiles = _.map(files, file => {
                    const fileWithFilters = _.cloneDeep(file);

                    // Will be using sample version as sample id in the services layer.
                    fileWithFilters.sampleId = file.vcfFileSampleVersionId;
                    delete fileWithFilters.vcfFileSampleVersionId;

                    fileWithFilters.filterIds = fileIdToFilterIdsHash[file.id];
                    return fileWithFilters;
                });

                callback(null, mappedFiles);
            }
        ], callback);
    }

    /**
     * @param trx Knex transaction
     * @param fileIds Ids of the saved files to find filters for.
     * @param callback (error, hash[fileId] = [filterIds]).
     * */
    _findSavedFilesFilters(trx, fileIds, callback) {
        async.waterfall([
            (callback) => trx.select('saved_file_id', 'filter_id')
                .from(SavedFileTables.Filters)
                .whereIn('saved_file_id', fileIds)
                .asCallback((error, rows) => callback(error, rows)),
            (rows, callback) => this._toCamelCase(rows, callback),
            (rows, callback) => {
                const hash = _.reduce(rows, (result, row) => {
                    if (!result[row.savedFileId]) {
                        result[row.savedFileId] = [];
                    }
                    result[row.savedFileId].push(row.filterId);
                    return result;
                }, {});
                callback(null, hash);
            }
        ], callback);
    }
}

module.exports = SavedFileModel;