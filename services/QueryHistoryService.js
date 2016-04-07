'use strict';

const async = require('async');
const _ = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class QueryHistoryService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.queryHistory);
    }

    findAll(user, limit, offset, callback) {
        if (this.services.users.isDemoUserId(user.id)) {
            // Demo users have no history.
            callback(null, []);
        } else {
            this.models.queryHistory.findAll(user.id, limit, offset, callback);
        }
    }

    add(user, languageId, sampleId, viewId, filterId, callback) {
        if (this.services.users.isDemoUserId(user.id)) {
            return callback(null, null);
        }
        const query = {
            sampleId,
            viewId,
            totalResults: 0,
            filterIds: [filterId]
        };
        async.waterfall([
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
        async.waterfall([
                (callback) => this.models.queryHistory.getLastInsertedId(user.id, callback),
                (historyItemId, callback) => {
                    if (!historyItemId) {
                        callback(null, false);
                    } else {
                        async.waterfall([
                                (callback) => this.models.queryHistory.find(user.id, historyItemId, callback),
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
        return query1.sampleId === query2.sampleId &&
            query1.viewId === query2.viewId &&
            _.isEmpty(_.difference(query1.filterIds, query2.filterIds)) &&
            _.isEmpty(_.difference(query2.filterIds, query1.filterIds))
    }
}

module.exports = QueryHistoryService;