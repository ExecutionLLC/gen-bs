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

    add(userId, languId, file, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        viewId: file.viewId,
                        vcfFileSampleVersionId: file.vcfFileSampleVersionId,
                        name: file.name,
                        url: file.url,
                        totalResults: file.totalResults
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (fileId, cb) => {
                    const dataToInsert = {
                        commentId: fileId,
                        languId: languId,
                        description: file.description
                    };
                    this._insertIntoTable('saved_file_text', dataToInsert, trx, (error) => {
                        cb(error, commentId);
                    });
                }
            ], cb);
        }, callback);
    }

    update(userId, fileId, file, callback) {
        this._fetch(userId, fileId, (error, fileData) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToUpdate = {
                                viewId: file.viewId,
                                vcfFileSampleVersionId: file.vcfFileSampleVersionId,
                                name: file.name,
                                url: file.url,
                                totalResults: file.totalResults
                            };
                            this._update(fileId, dataToUpdate, trx, cb);
                        },
                        (fileId, cb) => {
                            const dataToUpdate = {
                                languId: fileData.languId,
                                description: file.description
                            };
                            this._updateSavedFileText(fileId, dataToUpdate, trx, cb);
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, fileId, callback) {
        this._fetch(userId, fileId, (error, fileData) => {
            callback(error, this._mapColumns(fileData));
        });
    }

    // Собирает все comments для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserFiles(userId, (error, filesData) => {
            if (error) {
                callback(error);
            } else {
                async.map(filesData, (fileData, cb) => {
                    cb(null, this._mapColumns(fileData));
                }, callback);
            }
        });
    }

    findMany(userId, fileIds, callback) {
        async.waterfall([
            (cb) => { this._fetchSavedFiles(fileIds, cb); },
            (filesData, cb) => {
                if (filesData.length == fileIds.length) {
                    cb(null, filesData);
                } else {
                    cb('Inactive saved files found: ' + fileIds + ', userId: ' + userId);
                }
            },
            (filesData, cb) => {
                if (_.every(filesData, 'creator', userId)) {
                    cb(null, filesData);
                } else {
                    cb('Unauthorized saved files: ' + fileIds + ', userId: ' + userId);
                }
            },
            (filesData, cb) => {
                async.map(filesData, (fileData, cb) => {
                    cb(null, this._mapColumns(fileData));
                }, cb);
            }
        ], callback);
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
        this._fetchSavedFile(fileId, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchSavedFile(fileId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .where('id', fileId)
                .asCallback((error, fileData) => {
                    if (error) {
                        cb(error);
                    } else {
                        if (fileData.length > 0) {
                            cb(null, ChangeCaseUtil.convertKeysToCamelCase(fileData[0]));
                        } else {
                            cb(new Error('Item not found: ' + fileId));
                        }
                    }
                });
        }, callback);
    }

    _fetchUserFiles(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, filesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(filesData));
                    }
                });
        }, callback);
    }

    _fetchSavedFiles(fileIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('saved_file_text', 'saved_file_text.saved_file_id', this.baseTableName + '.id')
                .whereIn('id', fileIds)
                .asCallback((error, filesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(filesData));
                    }
                });
        }, callback);
    }
}

module.exports = SavedFileModel;