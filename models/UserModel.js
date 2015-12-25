'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'number_paid_samples', 'email', 'default_langu_id'];

class UserModel extends ModelBase {
    constructor(models) {
        super(models, 'user');
    }

    add(user, callback) {
        this.knex(this.baseTable).insert(user)
            .then(() => {
                callback(null, user);
            })
            .catch((error) => {
                callback(error);
            });
    }

    find(userId, callback) {
        this._getUser(userId, (error, userData) => {
            if (error) {
                callback(error);
            } else {
                if (userData) {
                    callback(null, this._compileUser(userData));
                } else {
                    callback();
                }
            }
        });
    }

    _getUser(userId, callback) {
        this.knex.select()
            .from(this.baseTable)
            .where('id', userId)
            .then((userData) => {
                if (userData.length > 0) {
                    callback(null, userData[0]);
                }
                else {
                    callback();
                }
            })
            .catch((error) => {
                callback(error);
            });
    }

    _compileUser(userData) {
        return _.reduce(mappedColumns, (memo, column) => {
            memo[column] = userData[column];
            return memo;
        }, {});
    }
}

module.exports = UserModel;