'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const RemovableModelBase = require('./RemovableModelBase');

const mappedColumns = [
    'id',
    'number_paid_samples',
    'is_deleted',
    'email',
    'default_langu_id',
    'name',
    'last_name',
    'speciality'
];

class UserModel extends RemovableModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    add(user, languId, callback) {
        this._add(user, languId, false, callback);
    }

    addWithId(user, languId, callback) {
        this._add(user, languId, true, callback);
    }

    update(userId, languId, user, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToUpdate = {
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        defaultLanguId: languId
                    };
                    this._update(userId, dataToUpdate, trx, cb);
                },
                (id, cb) => {
                    const dataToUpdate = {
                        languId: languId,
                        name: user.name,
                        lastName: user.lastName,
                        speciality: user.speciality
                    };
                    this._updateUserText(userId, dataToUpdate, trx, cb);
                }
            ], cb);
        }, callback);
    }

    _add(user, languId, withId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: (withId ? user.id : this._generateId()),
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        defaultLanguId: languId
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (userId, cb) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: user.name,
                        lastName: user.lastName,
                        speciality: user.speciality
                    };
                    this._insertIntoTable('user_text', dataToInsert, trx, (error) => {
                        cb(error, userId);
                    });
                }
            ], cb);
        }, callback);
    }

    _updateUserText(userId, dataToUpdate, trx, callback) {
        trx('user_text')
            .where('user_id', userId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, userId);
            });
    }

    _fetch(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTableName)
            .innerJoin('user_text', 'user_text.user_id', this.baseTableName + '.id')
            .where('id', userId)
            .asCallback((error, data) => {
                if (error) {
                    cb(error);
                } else {
                    if (data.length > 0) {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(data[0]));
                    } else {
                        cb(new Error('Item not found: ' + id));
                    }
                }
            });
        }, callback);
    }
}

module.exports = UserModel;