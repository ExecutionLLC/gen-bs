'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'vcf_file_sample_version_id',
    'view_id',
    'total_results'
];

class QueryHistoryModel extends SecureModelBase {
    constructor(models) {
        super(models, 'query_history', mappedColumns);
    }

    add(userId, query, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        viewId: query.viewId,
                        vcfFileSampleVersionId: query.vcfFileSampleVersionId,
                        totalResults: query.totalResults
                    };
                    this._insert(dataToInsert, trx, cb);
                }
            ], cb);
        }, callback);
    }

    update(userId, queryId, query, callback) {
        this._fetch(userId, queryId, (error) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToUpdate = {
                                viewId: query.viewId,
                                vcfFileSampleVersionId: query.vcfFileSampleVersionId,
                                totalResults: query.totalResults
                            };
                            this._update(queryId, dataToUpdate, trx, cb);
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, queryId, callback) {
        this._fetch(userId, queryId, (error, queryData) => {
            callback(error, this._mapColumns(queryData));
        });
    }

    // Собирает все comments для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserQueries(userId, (error, queriesData) => {
            if (error) {
                callback(error);
            } else {
                async.map(queriesData, (queryData, cb) => {
                    cb(null, this._mapColumns(queryData));
                }, callback);
            }
        });
    }

    findMany(userId, queryIds, callback) {
        async.waterfall([
            (cb) => { this._fetchQueries(queryIds, cb); },
            (queriesData, cb) => {
                if (queriesData.length == queryIds.length) {
                    cb(null, queriesData);
                } else {
                    cb('Inactive queries found: ' + queryIds + ', userId: ' + userId);
                }
            },
            (queriesData, cb) => {
                if (_.every(queriesData, 'creator', userId)) {
                    cb(null, queriesData);
                } else {
                    cb('Unauthorized queries: ' + queryIds + ', userId: ' + userId);
                }
            },
            (queriesData, cb) => {
                async.map(queriesData, (queryData, cb) => {
                    cb(null, this._mapColumns(queryData));
                }, cb);
            }
        ], callback);
    }

    _fetchUserQueries(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, queriesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(queriesData));
                    }
                });
        }, callback);
    }

    _fetchQueries(queryIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', queryIds)
                .asCallback((error, queriesData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(queriesData));
                    }
                });
        }, callback);
    }
}

module.exports = QueryHistoryModel;