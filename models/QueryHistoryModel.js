'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const CollectionUtils = require('../utils/CollectionUtils');
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

    find(userId, historyItemId, callback) {
        async.waterfall([
            (callback) => this._findQueryHistoryByIds(userId, [historyItemId], callback),
            (historyItems, callback) => {
                if (historyItems && historyItems.length) {
                    callback(null, historyItems[0])
                } else {
                    callback(new Error('History item is not found: ' + historyItemId))
                }
            }
        ], (error, historyItem) => callback(error, historyItem));
    }

    findAll(userId, limit, offset, callback) {
        async.waterfall([
            (callback) => this._findQueryHistoryIds(userId, limit, offset, callback),
            (queryHistoryIds, callback) => this._findQueryHistoryByIds(userId, queryHistoryIds, callback),
            (queryHistoryItems, callback) => {
                const viewIds = _.map(queryHistoryItems,
                    (queryHistoryItem) => queryHistoryItem.viewId
                );
                const sampleIds = _.map(queryHistoryItems,
                    (queryHistoryItem) => queryHistoryItem.sampleId
                );
                const filterIds = _(queryHistoryItems)
                    .map(queryHistoryItem => queryHistoryItem.filterIds)
                    .flatten()
                    .value();

                async.parallel({
                    samples: (callback) => {
                        this.models.samples.findMany(userId, _.uniq(sampleIds), callback);
                    },
                    views: (callback) => {
                        this.models.views.findMany(userId, _.uniq(viewIds), callback);
                    },
                    filters: (callback) => {
                        this.models.filters.findMany(userId, _.uniq(filterIds), callback);
                    }
                }, (error, result)=> {
                    callback(error, result.samples, result.views, result.filters, queryHistoryItems);
                });
            },
            (samples, views, filters, queryHistory, callback) => {
                // Create hashes.
                const samplesHash = CollectionUtils.createHashByKey(samples, 'id');
                const filtersHash = CollectionUtils.createHashByKey(filters, 'id');
                const viewsHash = CollectionUtils.createHashByKey(views, 'id');
                // Create resulting object.
                const resultQueryHistory = _.map(queryHistory, query => {
                    return {
                        id: query.id,
                        timestamp: query.timestamp,
                        view: viewsHash[query.viewId],
                        filters: _.map(query.filterIds, filterId => filtersHash[filterId]),
                        sample: samplesHash[query.sampleId]
                    };
                });
                callback(null, resultQueryHistory);
            }
        ], (error, historyItems) => {
            callback(error, historyItems);
        });
    }

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
                _.forEach(query.filterIds, (filterId) => {
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
            vcfFileSampleVersionId: query.sampleId,
            viewId: query.viewId,
            totalResults: query.totalResults
        };
    }

    _findQueryHistoryIds(userId, limit, offset, callback) {
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

    _findQueryHistoryByIds(userId, queryHistoryIds, callback) {
        this.db.asCallback((trx, callback) => {
            trx.select()
                .from(this.baseTableName)
                .innerJoin(QueryHistoryTableNames.Filters,
                    QueryHistoryTableNames.Filters + '.query_history_id',
                    this.baseTableName + '.id'
                )
                .whereIn('id', queryHistoryIds)
                .andWhere('creator', userId)
                .orderBy('timestamp', 'desc')
                .asCallback((error, result) => {
                    const queryHistory = _.map(_.groupBy(result, 'id'), this._prepareQueryHistory);
                    callback(null, queryHistory)
                });
        }, callback);
    }

    _prepareQueryHistory(rawQueryHistory) {
        const camelcaseRawQueryHistory = ChangeCaseUtil.convertKeysToCamelCase(rawQueryHistory);

        const id = camelcaseRawQueryHistory[0].id;
        const filterIds = _.map(camelcaseRawQueryHistory,
            (rawQueryHistoryItem) => {
                return rawQueryHistoryItem.filterId;
            }
        );
        const sampleId = camelcaseRawQueryHistory[0].vcfFileSampleVersionId;
        const timestamp = camelcaseRawQueryHistory[0].timestamp;
        const totalResults = camelcaseRawQueryHistory[0].totalResults;
        const viewId = camelcaseRawQueryHistory[0].viewId;

        return {
            id,
            filterIds,
            sampleId,
            timestamp,
            totalResults,
            viewId
        };
    };
}

module.exports = QueryHistoryModel;