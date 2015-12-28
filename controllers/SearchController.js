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
        const user = request.user;
        const sessionId = request.sessionId;
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const jsonBody = ChangeCaseUtil.convertKeysToCamelCase(request.body);
        if (!jsonBody) {
            this.sendInternalError(response, 'Body is empty');
            return;
        }

        const viewId = jsonBody.viewId;
        const filterIds = jsonBody.filterIds;
        const sampleId = jsonBody.sampleId;
        const limit = jsonBody.limit;
        const offset = jsonBody.offset;

        this.services.search
            .sendSearchRequest(user, sessionId, sampleId, viewId, filterIds, limit, offset, (error, operationId) => {
            this.sendJson(response, {
              operationId: operationId
            });
          });
    };

    createRouter() {
        const router = new Express();

        router.post('/', this.analyze);

        return router;
    }
}

module.exports = SearchController;
