'use strict';

const Express = require('express');
const _ = require('lodash');

const ControllerBase = require('./ControllerBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

class SearchController extends ControllerBase {
    constructor(services) {
        super(services);

        this.analyze = this.analyze.bind(this);
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
        const filterIds = body.filterIds;
        const sampleId = body.sampleId;
        const limit = body.limit;
        const offset = body.offset;

        this.services.search
            .sendSearchRequest(user, sessionId, sampleId, viewId, filterIds, limit, offset, (error, operationId) => {
            this.sendJson(response, {
              operationId: operationId
            });
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
        const limit = body.limit;
        const offset = body.offset;

        this.services.search.searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues,
                limit, offset, (error, operationId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    operationId: operationId
                });
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.post('/', this.analyze);
        router.post('/:operationId', this.searchInResults);

        return router;
    }
}

module.exports = SearchController;
