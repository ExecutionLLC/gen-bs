'use strict';

const Express = require('express');
const async = require('async');
const ControllerBase = require('./base/ControllerBase');

class UsersController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    add(request, response) {
        async.waterfall([
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const languageId = request.languId;
                const {user, key} = item;
                if (key === this.config.regserver.ADD_USER_KEY) {
                    this.services.users.add(languageId, user, callback);
                } else {
                    callback('Invalid add user key');
                }
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