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

    findIdByEmail(email, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => trx.select('id')
                    .from(this.baseTableName)
                    .where('email', email)
                    .asCallback(callback),
                (results, callback) => {
                    if (results && results.length) {
                        if (results.length > 1) {
                            callback(new Error('Too many users found'));
                        } else {
                            callback(null, results[0].id);
                        }
                    } else {
                        callback(new Error('User is not found'));
                    }
                }
            ], callback);
        }, callback);
    }

    add(user, languId, callback) {
        this._add(user, languId, true, callback);
    }

    addWithId(user, languId, callback) {
        this._add(user, languId, false, callback);
    }

    update(userId, languId, user, callback) {
        const userToUpdate = _.cloneDeep(user);
        userToUpdate.id = userId;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._checkFieldsUnique(userToUpdate, callback),
                (callback) => {
                    const dataToUpdate = {
                        numberPaidSamples: userToUpdate.numberPaidSamples,
                        email: userToUpdate.email,
                        defaultLanguId: languId
                    };
                    this._unsafeUpdate(userToUpdate.id, dataToUpdate, trx, callback);
                },
                (id, callback) => {
                    const dataToUpdate = {
                        languId: languId,
                        name: userToUpdate.name,
                        lastName: userToUpdate.lastName,
                        speciality: userToUpdate.speciality
                    };
                    this._updateUserText(userToUpdate.id, dataToUpdate, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _add(user, languId, shouldGenerateId, callback) {
        const userToInsert = _.cloneDeep(user);
        userToInsert.id = shouldGenerateId ? this._generateId() : user.id;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._checkFieldsUnique(userToInsert, callback),
                (callback) => {
                    const dataToInsert = {
                        id: user.id,
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        defaultLanguId: languId
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (userId, callback) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: user.name,
                        lastName: user.lastName,
                        speciality: user.speciality
                    };
                    this._unsafeInsert('user_text', dataToInsert, trx, (error) => {
                        callback(error, userId);
                    });
                }
            ], callback);
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
        this.db.asCallback((knex, callback) => {
            knex.select()
            .from(this.baseTableName)
            .innerJoin('user_text', 'user_text.user_id', this.baseTableName + '.id')
            .where('id', userId)
            .asCallback((error, userData) => {
                if (error || !userData.length) {
                    callback(error || new Error('Item not found: ' + userId));
                } else {
                    let data = ChangeCaseUtil.convertKeysToCamelCase(userData[0]);
                    data.language = data.defaultLanguId;
                    callback(null, data);
                }
            });
        }, callback);
    }

    /**
     * Checks that unique fields, ex. email, are unique across users collection.
     * */
    _checkFieldsUnique(user, callback) {
        async.waterfall([
            (callback) => this.findIdByEmail(user.email, (error, userId) => {
                if (error || userId === user.id) {
                    callback(null);
                } else {
                    callback(new Error('Duplicate e-mail.'));
                }
            })
        ], callback);
    }
}

module.exports = UserModel;