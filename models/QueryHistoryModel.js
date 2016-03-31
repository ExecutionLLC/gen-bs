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


}

module.exports = QueryHistoryModel;