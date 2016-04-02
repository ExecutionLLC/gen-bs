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

const QueryHistoryTableNames = {
    QueryHistory: 'query_history',
    Filters: 'query_history_filter'
};

class QueryHistoryModel extends SecureModelBase {

    constructor(models) {
        super(models, QueryHistoryTableNames.QueryHistory, mappedColumns);
    }

    _findHistoryById(queryHistoryId, callback) {
        this.db.asCallback((trx, callback) => {
            trx.select()
                .from(this.baseTableName)
                .innerJoin(QueryHistoryTableNames.Filters,
                    QueryHistoryTableNames.Filters + '.query_history_id',
                    this.baseTableName + '.id'
                )
                .where('id', queryHistoryId)
                .asCallback((error, filterData) => {
                    if (error || !filterData.length) {
                        callback(error || new Error('Item not found: ' + queryHistoryId));
                    } else {
                        const query_history = this._extractQueryHistory(filterData);
                        callback(null, query_history);
                    }
                });
        }, (error, result) => callback(error, result));
    }

    _extractQueryHistory(filterData) {
        const camelcaseFilterData = ChangeCaseUtil.convertKeysToCamelCase(filterData);
        const id = camelcaseFilterData[0].id;
        const totalResults = camelcaseFilterData[0].totalResults;
        const vcfFileSampleVersionId = camelcaseFilterData[0].vcfFileSampleVersionId;
        const viewId = camelcaseFilterData[0].viewId;
        const filters = [];
        _.forEach(camelcaseFilterData, (data) => {
                filters.push(data.filterId);
            }
        );
        return {
            id: id,
            totalResults: totalResults,
            vcfFileSampleVersionId: vcfFileSampleVersionId,
            viewId: viewId,
            filters: filters
        };
    };

    getLastInsertedId(userId, callback) {
        this.db.asCallback(
            (trx, callback) => {
                trx.select('id')
                    .from(this.baseTableName)
                    .where('creator', userId)
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .asCallback(
                        (error, result) => callback(error, result)
                    );
            }, (error, ids) => {
                const lastInsertedId = !_.isEmpty(ids) ? ids[0].id : null;
                callback(error, lastInsertedId)
            }
        );
    }

    _add(userId, languageId, query, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            this._addInTransaction(userId, query, shouldGenerateId, trx, callback);
        }, callback);
    }

    _addInTransaction(userId, query, shouldGenerateId, trx, callback) {
        async.waterfall([
            (callback) => {
                const dataToInsert = this._createDataToInsert(userId, query, shouldGenerateId);
                this._insert(dataToInsert, trx, callback);
            },
            (queryHistoryId, callback) => {
                _.forEach(query.filters, (filterId) => {
                        this._addNewQueryHistoryFilter(queryHistoryId, filterId, trx, callback);
                    }
                );
                callback(null, queryHistoryId);
            }
        ], callback);
    }

    _addNewQueryHistoryFilter(queryHistoryId, filterId, trx, callback) {
        const dataToInsert = {
            queryHistoryId: queryHistoryId,
            filterId: filterId
        };
        this._unsafeInsert(QueryHistoryTableNames.Filters, dataToInsert, trx, callback);
    }

    _createDataToInsert(userId, query, shouldGenerateId) {
        return {
            id: shouldGenerateId ? this._generateId() : query.id,
            creator: userId,
            vcfFileSampleVersionId: query.vcfFileSampleVersionId,
            viewId: query.viewId,
            totalResults: query.totalResults
        };
    }

    findQueryHistories(userId, limit, offset, callback) {
        async.waterfall(
            [
                (callback) => this._findQueryHistoriesIds(userId, limit, offset, callback),
                (queryHistoryIds, callback) => this._findQueryHistoriesByIds(queryHistoryIds, callback)
            ], callback
        );
    }

    _findQueryHistoriesIds(userId, limit, offset, callback) {
        this.db.asCallback(
            (trx, callback) => {
                trx.select('id')
                    .from(this.baseTableName)
                    .where('creator', userId)
                    .orderBy('timestamp', 'desc')
                    .offset(offset)
                    .limit(limit)
                    .asCallback(
                        (error, result) => callback(error, _.map(result, (item) => {
                            return item.id;
                        }))
                    );
            }, callback
        );
    }

    _findQueryHistoriesByIds(queryHistoryIds, callback) {
        this.db.asCallback((trx, callback) => {
            trx.select()
                .from(this.baseTableName)
                .innerJoin(QueryHistoryTableNames.Filters,
                    QueryHistoryTableNames.Filters + '.query_history_id',
                    this.baseTableName + '.id'
                )
                .whereIn('id', queryHistoryIds)
                .asCallback((error, result) => {
                    const filterData = _.map(_.groupBy(result, 'id'), this._extractQueryHistory);
                    callback(null, filterData)
                });
        }, callback);
    }


}

module.exports = QueryHistoryModel;