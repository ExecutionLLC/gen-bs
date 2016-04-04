'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class QueryHistoryController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    getQueryHistories(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (body, callback) => {
                const user = request.user;
                const limit = body.limit;
                const offset = body.offset;
                this.services.queryHistory.findQueryHistories(user, limit, offset,
                    (error, result)=>callback(error, result, user)
                );
            },
            (queryHistories, user, callback) => {
                const viewIds = _.map(
                    queryHistories, queryHistory => queryHistory.viewId
                );
                const vcfFileSampleVersionIds = _.map(
                    queryHistories, queryHistory => queryHistory.vcfFileSampleVersionId
                );
                const filtersIds = [];
                _.forEach(queryHistories, queryHistory => {
                    _.forEach(queryHistory.filters, filter=> {
                        filtersIds.push(filter);
                    })
                });
                async.parallel(
                    {
                        samples: (callback) => {
                            this.services.samples.findMany(user, _.uniq(vcfFileSampleVersionIds), callback);
                        },
                        views: (callback) => {
                            this.services.views.findMany(user, _.uniq(viewIds), callback);
                        },
                        filters: (callback) => {
                            this.services.filters.findMany(user, _.uniq(filtersIds), callback);
                        }
                    }, (error, result)=> {
                        callback(error, result.samples, result.views, result.filters, queryHistories);
                    }
                );
            },
            (samples, views, filters, queryHistories, callback)=> {
                const resultQueryHistory = [];
                _.forEach(queryHistories, queryHistory=> {
                    resultQueryHistory.push(
                        {
                            id: queryHistory.id,
                            timestamp: queryHistory.timeStamp,
                            view: _.find(views, view => view.id = queryHistory.viewId),
                            filters: _.filter(filters, filter => {
                                    _.includes(queryHistory.filters, filter.id);
                                }
                            ),
                            sample: samples[queryHistory.vcfFileSampleVersionId]
                        }
                    );
                });
                callback(null, resultQueryHistory);
            }
        ], (error, result) => {
            this.sendErrorOrJson(response, error, {result});
        });
    }

    createRouter() {
        const router = new Express();

        router.post('/', this.getQueryHistories.bind(this));

        return router;
    }
}

module.exports = QueryHistoryController;