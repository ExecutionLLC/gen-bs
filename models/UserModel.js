'use strict';

const _ = require('lodash');
const async = require('async');

const ExtendedModelBase = require('./ExtendedModelBase');

const mappedColumns = ['id', 'number_paid_samples', 'email', 'default_langu_id'];

class UserModel extends ExtendedModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    add(user, languId, callback) {
        let _user = this._init(languId, user);
        this.db.knex.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(_user, trx, cb);
                },
                (userId, cb) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: _user.name,
                        lastName: _user.last_name,
                        speciality: _user.speciality
                    }
                    this._insertUserText(dataToInsert, trx, (error) => {
                        cb(error, userId);
                    });
                }
            ], cb);
        }, callback);
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: id,
            numberPaidSamples: data.numberPaidSamples,
            email: data.email,
            defaultLanguId: data.defaultLanguId
        }
        super._insert(dataToInsert, trx, callback);
    }

    _insertUserText(data, trx, callback) {
        this._insertTable('user_text', data, trx, callback);
    }
}

module.exports = UserModel;