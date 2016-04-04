'use strict';

const async = require('async');
const _ = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class QueryHistoryService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.queryHistory);
    }

    findQueryHistories(user, limit, offset, callback) {
        async.waterfall(
            [
                (callback) => this.models.queryHistory.findQueryHistories(user.id, limit, offset, callback)
            ], callback
        );
    }

    add(user, languageId, query, callback) {
        async.waterfall(
            [
                (callback) => this._isLastInserted(user, query, callback),
                (isLastInserted, callback) => {
                    if (!isLastInserted) {
                        super.add(user, languageId, query, callback)
                    } else {
                        callback(null, null);
                    }
                }
            ], callback
        );
    }

    _isLastInserted(user, query, callback) {
        async.waterfall(
            [
                (callback) => this.models.queryHistory.getLastInsertedId(user.id, callback),
                (id, callback) => {
                    if (id == null) {
                        callback(null, false);
                    } else {
                        async.waterfall(
                            [
                                (callback) => this.models.queryHistory._findHistoryById(id, callback),
                                (queryHistory, callback) => {
                                    const isLastInserted = QueryHistoryService.isQueriesEquals(queryHistory, query);
                                    callback(null, isLastInserted)
                                }
                            ], callback
                        );
                    }
                }
            ], callback
        );
    }

    static isQueriesEquals(query1, query2) {
        return query1.vcfFileSampleVersionId == query2.vcfFileSampleVersionId &&
            query1.viewId == query2.viewId &&
            _.isEmpty(_.difference(query1.filters, query2.filters)) &&
            _.isEmpty(_.difference(query2.filters, query1.filters))
    }
}

module.exports = QueryHistoryService;