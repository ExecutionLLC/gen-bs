'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const RemovableModelBase = require('./RemovableModelBase');

const mappedColumns = [
    'id',
    'name',
    'lastName',
    'email',
    'language',
    'numberPaidSamples',
    'speciality'
];

class UserModel extends RemovableModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    add(user, languId, callback) {
        this._add(user, languId, true, callback);
    }

    addWithId(user, languId, callback) {
        this._add(user, languId, false, callback);
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
                    this._unsafeUpdate(userId, dataToUpdate, trx, cb);
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

    _add(user, languId, shouldGenerateId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : user.id,
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
            .asCallback((error, userData) => {
                if (error || !userData.length) {
                    cb(error || new Error('Item not found: ' + userId));
                } else {
                    let data = userData[0];
                    data.language = data.defaultLanguId;
                    cb(null, ChangeCaseUtil.convertKeysToCamelCase(data));
                }
            });
        }, callback);
    }
}

module.exports = UserModel;