'use strict';

const Express = require('express');
const async = require('async');
const AsyncLock = require('async-lock');

const lock = new AsyncLock();
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
                const {user, session, languageId} = request;
                const {analysis, limit, offset} = body;
                lock.acquire(session.id, (callback) => {
                    this.services.search
                        .sendSearchRequest(
                            user, session, languageId, analysis, limit, offset, callback
                        );
                }, callback);

            }
        ], (error, result) => {
            this.sendErrorOrJson(response, error, result);
        });
    }

    searchInResults(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (body, callback) => {
                const {user, session, params: {operationId}} = request;
                const {topSearch: globalSearchValue, search: fieldSearchValues, sort: sortValues, limit, offset} = body;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified.'));
                } else {
                    this.services.search.searchInResults(user, session, operationId,
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
                const {user, session, params: {operationId}, query: {limit, offset}} = request;
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
