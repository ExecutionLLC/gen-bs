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

    // Collets all saved files for user
    findAll(userId, callback) {
        async.waterfall([
            (callback) => this._fetchUserFiles(userId, callback),
            (files, callback) => this._mapItems(files, calback)
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

    _add(userId, languId, file, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : file.id,
                        creator: userId,
                        viewId: file.viewId,
                        vcfFileSampleVersionId: file.vcfFileSampleVersionId,
                        name: file.name,
                        url: file.url,
                        totalResults: file.totalResults
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (fileId, callback) => {
                    const dataToInsert = {
                        commentId: fileId,
                        languId: languId,
                        description: file.description
                    };
                    this._unsafeInsert('saved_file_text', dataToInsert, trx, (error) => {
                        callback(error, commentId);
                    });
                }
            ], callback);
        }, callback);
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