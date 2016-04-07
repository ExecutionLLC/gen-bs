'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class QueryHistoryController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    getQueryHistory(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const limit = request.query.limit;
                const offset = request.query.offset;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified or incorrect'));
                } else {
                    this.services.queryHistory.findQueryHistory(user, limit, offset,
                        (error, result) => callback(error, result, user)
                    );
                }
            },
            (queryHistory, user, callback) => {
                const viewIds = _.map(queryHistory,
                    (queryHistoryItem) => queryHistoryItem.viewId
                );
                const sampleIds = _.map(queryHistory,
                    (queryHistoryItem) => queryHistoryItem.sampleId
                );
                const filterIds = _(queryHistory)
                    .map(queryHistoryItem => queryHistoryItem.filterIds)
                    .flatten()
                    .value();

                async.parallel(
                    {
                        samples: (callback) => {
                            this.services.samples.findMany(user, _.uniq(sampleIds), callback);
                        },
                        views: (callback) => {
                            this.services.views.findMany(user, _.uniq(viewIds), callback);
                        },
                        filters: (callback) => {
                            this.services.filters.findMany(user, _.uniq(filterIds), callback);
                        }
                    }, (error, result)=> {
                        callback(error, result.samples, result.views, result.filters, queryHistory);
                    }
                );
            },
            (samples, views, filters, queryHistory, callback) => {
                // Create hashes.
                const samplesHash = _.reduce(samples, (result, sample) => {
                    result[sample.id] = sample;
                    return result;
                }, {});
                const filtersHash = _.reduce(filters, (result, filter) => {
                    result[filter.id] = filter;
                    return result;
                }, {});
                const viewsHash = _.reduce(views, (result, view) => {
                    result[view.id] = view;
                    return result;
                }, {});
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
        ], (error, result) => {
            this.sendErrorOrJson(response, error, {result});
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.getQueryHistory.bind(this));

        return router;
    }
}

module.exports = QueryHistoryController;