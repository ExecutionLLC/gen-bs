'use strict';

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
                this.services.queryHistories.findQueryHistories(user, limit, offset, callback);
            }
        ], (error, queryHistories) => {
            this.sendErrorOrJson(response, error, {queryHistories});
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.getQueryHistories.bind(this));

        return router;
    }
}

module.exports = QueryHistoryController;