'use strict';

const _ = require('lodash');

const MOCKED_USERS = require('./mock-users.json');

class MockUserModel {
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
        return _.find(MOCKED_USERS, predicate);
    }

    _callbackUserNotFound(callback) {
        callback(new Error('User not found'));
    }
}

module.exports = MockUserModel;
