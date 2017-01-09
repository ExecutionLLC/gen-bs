'use strict';

const _ = require('lodash');
const Express = require('express');
const async = require('async');

const ControllerBase = require('./base/ControllerBase');
const WSController = require('./WSController');

class DataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getData = this.getData.bind(this);
    }

    getData(request, response) {
        const {user} = request;
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.services.userData.getUserData(user, callback)
        ], (error, userData) => {
            this.sendErrorOrJson(response, error, userData);
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.getData);
        return router;
    }
}

module.exports = DataController;
