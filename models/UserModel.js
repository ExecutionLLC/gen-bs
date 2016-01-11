'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ExtendedModelBase = require('./ExtendedModelBase');

const mappedColumns = [
    'id',
    'number_paid_samples',
    'is_deleted',
    'email',
    'default_langu_id',
    'langu_id',
    'name',
    'last_name',
    'speciality'
];

class UserModel extends ExtendedModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    add(user, languId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
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
                    this._insertTable('user_text', dataToInsert, trx, (error) => {
                        cb(error, userId);
                    });
                }
            ], cb);
        }, callback);
    }

    update(userId, languId, user, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToUpdate = {
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        isDeleted: user.isDeleted,
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

    _updateUserText(userId, dataToUpdate, trx, callback) {
        trx.asCallback((knex, cb) => {
            knex('user_text')
                .where('user_id', userId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
                .asCallback((error) => {
                    cb(error, userId);
                });
        }, callback);
    }

    _fetch(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTable)
            .innerJoin('user_text', 'user_text.user_id', this.baseTable + '.id')
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