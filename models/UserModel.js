'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

class UserModel extends ModelBase {
    constructor(models) {
        super(models);
    }

    add(user, callback) {
        this.knex('user').insert(user)
            .then(() => {
                callback(null, user);
            })
            .catch((error) => {
                callback(error);
            });
    }
}

module.exports = UserModel;