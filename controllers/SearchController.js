'use strict';

const Express = require('express');
const _ = require('lodash');

const ControllerBase = require('./ControllerBase');

class SearchController extends ControllerBase {
    constructor(services) {
        super(services);

        this.analyze = this.analyze.bind(this);
    }

    analyze(request, response) {
        const user = request.user;
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const jsonBody = request.body;
        if (!jsonBody) {
            this.sendInternalError(response, 'Body is empty');
            return;
        }
        const sessionId = 'session-id-should-be-loaded-here';
        const viewId = jsonBody.view_id;
        const filterIds = jsonBody.filter_ids;
        const globalSearchValue = jsonBody.global_search_value;
        const fieldSearchValues = jsonBody.field_search_values;
        const limit = jsonBody.limit;
        const offset = jsonBody.offset;
    };

    createRouter() {
        const router = new Express();

        router.post('/', this.analyze);

        return router;
    }
}

module.exports = SearchController;