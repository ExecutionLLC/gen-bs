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
            (callback) => {
                this._fetchUserFiles(userId, callback);
            },
            (filesData, callback) => {
                async.map(filesData, (fileData, callback) => {
                    callback(null, this._mapColumns(fileData));
                }, callback);
            }
        ], callback);
    }

    findMany(userId, fileIds, callback) {
        async.waterfall([
            (callback) => { this._fetchSavedFiles(fileIds, callback); },
            (filesData, callback) => {
                if ((filesData.length == fileIds.length) && (_.every(filesData, 'isDeleted', false))) {
                    callback(null, filesData);
                } else {
                    callback('Some saved files not found: ' + fileIds + ', userId: ' + userId);
                }
            },
            (filesData, callback) => {
                if (_.every(filesData, 'creator', userId)) {
                    callback(null, filesData);
                } else {
                    callback('Unauthorized access to saved files: ' + fileIds + ', userId: ' + userId);
                }
            },
            (filesData, callback) => {
                async.map(filesData, (fileData, callback) => {
                    callback(null, this._mapColumns(fileData));
                }, callback);
            }
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
            (callback) => {
                this._fetchSavedFile(fileId, callback);
            },
            (fileData, callback) => {
                const secureInfo = {userId: userId};
                this._secureCheck(fileData, secureInfo, callback);
            }
        ], callback);
    }

    _fetchSavedFile(fileId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .where('id', fileId)
                .asCallback((error, fileData) => {
                    if (error || !fileData.length) {
                        callback(error || new Error('Item not found: ' + fileId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(fileData[0]));
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
                .asCallback((error, filesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filesData));
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
                .asCallback((error, filesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filesData));
                    }
                });
        }, callback);
    }
}

module.exports = SavedFileModel;