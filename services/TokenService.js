'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const USER_METADATA = require('../test_data/user_metadata.json');
const ServiceBase = require('./ServiceBase');

/**
 * Maintains user tokens. Tokens are connected to the session,
 * and should be destroyed along with it.
 * */
class TokenService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.users = USER_METADATA;
        this.tokens = {};
    }

    login(userName, password, callback) {
        const loggedInUser = _.find(this.users,
            user => user.login === userName && user.password === password);
        if (loggedInUser) {
            this._getUserToken(loggedInUser, callback);
        } else {
            callback(new Error('Login failed. User name or password is incorrect.'));
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

    findUserIdByToken(token, callback) {
        const tokenDescriptor = this.tokens[token];
        if (tokenDescriptor) {
            callback(null, tokenDescriptor.userId);
        } else {
            callback(new Error('Invalid token'));
        }
    }

    _getUserToken(user, callback) {
        const tokenDescriptor = {
            token: Uuid.v4(),
            userId: user.id
        };

        this.tokens[tokenDescriptor.token] = tokenDescriptor;
        callback(null, tokenDescriptor.token);
    }
}

module.exports = TokenService;