'use strict';

const Express = require('express');
const async = require('async');
const ControllerBase = require('./base/ControllerBase');

const ADD_USER_KEY = 'b5b7a458-693c-4a8d-845b-7b9a1295a15b';

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
                const {user, key} = item;
                if (key === ADD_USER_KEY) {
                    this.services.users.add(languId, user, callback);
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