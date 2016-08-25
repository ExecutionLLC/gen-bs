'use strict';

const async = require('async');
const _ = require('lodash');

const MOCKED_USERS = require('./mock-users.json');

class MockUserModel {
    constructor() {
        this.users = [...MOCKED_USERS];
    }

    add(user, defaultLanguage, callback) {
        async.waterfall([
            (callback) => this.findIdByEmail(user.email, (error) => callback(null, !error)),
            (isFound, callback) => {
                if (isFound) {
                    callback(new Error('User already exists'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this.users.push(user);
                callback(null, user);
            }
        ], callback);
    }

    findIdByEmail(email, callback) {
        const user = this._findUser(user => user.email === email);
        if (user) {
            callback(null, user.id);
        } else {
            this._callbackUserNotFound(callback);
        }
    }

    find(id, callback) {
        const user = this._findUser((user) => user.id === id);
        if (user) {
            callback(null, user);
        } else {
            this._callbackUserNotFound(callback);
        }
    }

    _findUser(predicate) {
        return _.find(this.users, predicate);
    }

    _callbackUserNotFound(callback) {
        callback(new Error('User not found'));
    }
}

module.exports = MockUserModel;