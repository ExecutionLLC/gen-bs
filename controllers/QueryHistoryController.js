'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class QueryHistoryController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    findAll(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const limit = request.query.limit;
                const offset = request.query.offset;
                if (isNaN(limit) || isNaN(offset)) {
                    callback(new Error('Offset or limit are not specified or incorrect'));
                } else {
                    this.services.queryHistory.findAll(user, limit, offset, callback);
                }
            }
        ], (error, result) => {
            this.sendErrorOrJson(response, error, {result});
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.findAll.bind(this));

        return router;
    }
}

module.exports = QueryHistoryController;