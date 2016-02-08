'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'vcfFileSampleVersionId',
    'viewId',
    'totalResults'
];

class QueryHistoryModel extends SecureModelBase {
    constructor(models) {
        super(models, 'query_history', mappedColumns);
    }

    // Собирает все comments для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserQueries(userId, (error, queriesData) => {
            if (error) {
                callback(error);
            } else {
                async.map(queriesData, (queryData, callback) => {
                    callback(null, this._mapColumns(queryData));
                }, callback);
            }
        });
    }

    findMany(userId, queryIds, callback) {
        async.waterfall([
            (callback) => { this._fetchQueries(queryIds, callback); },
            (queriesData, callback) => {
                if (queriesData.length == queryIds.length) {
                    callback(null, queriesData);
                } else {
                    callback('Some queries not found: ' + queryIds + ', userId: ' + userId);
                }
            },
            (queriesData, callback) => {
                if (_.every(queriesData, 'creator', userId)) {
                    callback(null, queriesData);
                } else {
                    callback('Unauthorized access to queries: ' + queryIds + ', userId: ' + userId);
                }
            },
            (queriesData, callback) => {
                async.map(queriesData, (queryData, callback) => {
                    callback(null, this._mapColumns(queryData));
                }, callback);
            }
        ], callback);
    }

    // languId is used for interface compatibility
    _add(userId, languId, query, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : query.id,
                        creator: userId,
                        viewId: query.viewId,
                        vcfFileSampleVersionId: query.vcfFileSampleVersionId,
                        totalResults: query.totalResults
                    };
                    this._insert(dataToInsert, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _update(userId, query, queryToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToUpdate = {
                        viewId: queryToUpdate.viewId,
                        vcfFileSampleVersionId: queryToUpdate.vcfFileSampleVersionId,
                        totalResults: queryToUpdate.totalResults
                    };
                    this._unsafeUpdate(query.id, dataToUpdate, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _fetchUserQueries(userId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, queriesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(queriesData));
                    }
                });
        }, callback);
    }

    _fetchQueries(queryIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .whereIn('id', queryIds)
                .asCallback((error, queriesData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(queriesData));
                    }
                });
        }, callback);
    }
}

module.exports = QueryHistoryModel;