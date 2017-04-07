'use strict';

const Express = require('express');
const async = require('async');
const _ = require('lodash');
const ControllerBase = require('./base/ControllerBase');

class UsersController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    add(request, response) {
        async.waterfall([
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                const languageId = request.languageId;
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

    update(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.getRequestBody(request, callback),
            (item, callback) => {
                if ('user' in item && 'key' in item) { // full access to perform update action
                    if (item.key === this.config.regserver.ADD_USER_KEY) {
                        callback(null, item.user);
                    } else {
                        callback('Invalid update user key');
                    }
                } else {
                    if (request.session.type === 'DEMO') {
                        callback('You cannot change the DEMO user data');
                    } else if (request.user.id !== item.id) {
                        callback('Insufficient rights to perform action');
                    } else { // user tries to update himself
                        async.waterfall([
                            (callback) => this.services.users.find(item.id, callback),
                            (existingUser, callback) => {
                                if (!_.isEqual(
                                    _.omit(existingUser, ['defaultLanguageId']), _.omit(item, ['defaultLanguageId']))) {
                                    callback('Cannot update other fields! Only defaultLanguageId is allowed.')
                                } else {
                                    callback(null, item);
                                }
                            }
                            ], callback);
                    }
                }
            },
            (userData, callback) => {
                this.services.users.update(userData.id, request.languageId, userData, callback);
            }
        ], (error, updatedItem) => {
            this.sendErrorOrJson(response, error, updatedItem);
        });
    }

    createRouter() {
        const router = new Express();
        router.post('/', this.add.bind(this));
        router.put('/', this.update.bind(this));
        return router;
    }
}

module.exports = UsersController;