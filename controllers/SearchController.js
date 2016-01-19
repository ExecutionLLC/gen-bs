'use strict';

const Express = require('express');
const _ = require('lodash');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class SearchController extends ControllerBase {
    constructor(services) {
        super(services);

        this.analyze = this.analyze.bind(this);
        this.searchInResults = this.searchInResults.bind(this);
        this.getResultsPage = this.getResultsPage.bind(this);
    }

    analyze(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const body = this.getRequestBody(request, response);
        if (!body) {
            return;
        }

        const user = request.user;
        const sessionId = request.sessionId;

        const viewId = body.viewId;
        const filterId = body.filterId;
        const sampleId = body.sampleId;
        const limit = body.limit;
        const offset = body.offset;

        this.services.search
            .sendSearchRequest(user, sessionId, sampleId, viewId, filterId, limit, offset, (error, operationId) => {
                if (error) {
                    this.sendInternalError(response, error);
                } else {
                    this.sendJson(response, {
                        operationId: operationId
                    });
                }
            });
    }

    searchInResults(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const operationId = request.params.operationId;
        const sessionId = request.sessionId;
        const body = this.getRequestBody(request, response);
        if (!body) {
            return;
        }

        const globalSearchValue = body.topSearch;
        const fieldSearchValues = body.search;
        const sortValues = body.sort;
        const limit = body.limit;
        const offset = body.offset;

        this.services.search.searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues,
                sortValues, limit, offset, (error, operationId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    operationId: operationId
                });
            }
        });
    }

    getResultsPage(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        const operationId = request.params.operationId;
        const sessionId = request.sessionId;
        const limit = request.query.limit;
        const offset = request.query.offset;

        if (!limit || !offset) {
            this.sendInternalError(response, new Error('Please set "limit" and "offset" query parameters.'));
            return;
        }

        this.services.search.loadResultsPage(user, sessionId, operationId, limit, offset, (error) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                // The actual data will be sent by WebSocket connection.
                this.sendJson(response, {
                    operationId
                });
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.post('/', this.analyze);
        router.post('/:operationId', this.searchInResults);
        router.get('/:operationId', this.getResultsPage);

        return router;
    }
}

module.exports = SearchController;
