'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const USER_METADATA = require('../test_data/user_metadata.json');
const ServiceBase = require('./ServiceBase');

class UserService extends ServiceBase {
    constructor(services) {
        super(services);

        this.users = USER_METADATA;
        this.tokens = {};
    }

    login(userName, password, callback) {
        const loggedInUser = _.find(this.users,
            user => user.login === userName && user.password === password);
        if (loggedInUser) {
            this._createUserToken(loggedInUser, callback);
        } else {
            callback(new Error('User not found'));
        }
    }

    logout(token, callback) {
        if (this.tokens[token]) {
            delete this.tokens[token];
            callback(null);
        } else {
            callback(new Error('Invalid token'));
        }
    }

    findByToken(userToken, callback) {
        if (userToken) {
            const tokenDescriptor = this.tokens[userToken];
            if (tokenDescriptor) {
                const user = _.find(this.users, u => u.id === tokenDescriptor.userId);
                callback(null, user);
            } else {
                callback(new Error('Token is not found'));
            }
        } else {
            console.error('Token is null, consider the first user for testing.');
            const user = this.users[0];
            callback(null, user);
        }
    }

    _createUserToken(user, callback) {
        const tokenDescriptor = {
            token: Uuid.v4(),
            userId: user.id,
            timestamp: Date.now()
        };

        this.tokens[tokenDescriptor.token] = tokenDescriptor;
        callback(null, tokenDescriptor);
    }
}

module.exports = UserService;
