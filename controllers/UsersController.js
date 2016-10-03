'use strict';

const Express = require('express');
const async = require('async');
const ControllerBase = require('./base/ControllerBase');

class UsersController extends ControllerBase {
    constructor(services) {
        super(services);
        console.log('UsersController()');
    }

    add(request, response) {
        async.waterfall([
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const languId = request.languId;
                this.services.users.add(languId, item, callback);
            }
        ], (error, insertedItem) => {
            this.sendErrorOrJson(response, error, insertedItem);
        });
    }

    createRouter() {
        const router = new Express();
        router.post('/', this.add.bind(this));
        return router;
    }
}

module.exports = UsersController;