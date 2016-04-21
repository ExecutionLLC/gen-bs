'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class DataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getData = this.getData.bind(this);
    }

    getData(request, response) {
        const user = request.user;
        const sessionId = request.sessionId;
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.services.userData.getUserData(user, sessionId, callback)
        ], (error, results) => {
            this.sendErrorOrJson(response, error, results);
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.getData);
        return router;
    }
}

module.exports = DataController;
