'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./base/ControllerBase');

class SearchController extends ControllerBase {
    constructor(services) {
        super(services);

        this.analyze = this.analyze.bind(this);
        this.searchInResults = this.searchInResults.bind(this);
        this.getResultsPage = this.getResultsPage.bind(this);
    }

    analyze(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (body, callback) => {
                const {user, session, languId:languageId} = request;

                //noinspection UnnecessaryLocalVariableJS
                const {sampleId, viewId, filterId, limit, offset} = body;
                this.services.search
                    .sendSearchRequest(user, session, languageId,
                        sampleId, viewId, filterId, limit, offset, callback);
            }
        ], (error, operationId) => {
            this.sendErrorOrJson(response, error, {operationId});
        });
    }

    searchInResults(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (body, callback) => {
                const user = request.user;
                const operationId = request.params.operationId;
                const sessionId = request.sessionId;
                const globalSearchValue = body.topSearch;
                const fieldSearchValues = body.search;
                const sortValues = body.sort;
                const limit = body.limit;
                const offset = body.offset;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified.'));
                } else {
                    this.services.search.searchInResults(user, sessionId, operationId,
                        globalSearchValue, fieldSearchValues, sortValues, limit, offset, callback);
                }
            }
        ], (error, operationId) => {
            this.sendErrorOrJson(response, error, {operationId});
        });
    }

    getResultsPage(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const {user, session, params:{operationId}, query:{limit, offset}} = request;
                if (!limit || !offset || isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Please set "limit" and "offset" query parameters to valid numbers.'));
                } else {
                    this.services.search.loadResultsPage(user, session, operationId,
                        parseInt(limit), parseInt(offset), (error) => callback(error, operationId));
                }
            }
        ], (error, operationId) => {
            this.sendErrorOrJson(response, error, {operationId});
        });
    }

    createRouter() {
        const router = new Express();

        const analyzeLimiter = this.createLimiter({
            delayWindowMs: 10 * 1000,
            noDelayCount: 1,
            maxCallCountBeforeBlock: 3,
            delayMs: 2 * 1000,
            keyGenerator: (request) => {
                return request.session.id;
            }
        });

        router.post('/', analyzeLimiter, this.analyze);
        router.post('/:operationId', this.searchInResults);
        router.get('/:operationId', this.getResultsPage);

        return router;
    }
}

module.exports = SearchController;
