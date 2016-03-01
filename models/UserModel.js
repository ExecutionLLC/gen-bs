'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const RemovableModelBase = require('./RemovableModelBase');

const mappedColumns = [
    'id',
    'name',
    'isDeleted',
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
            this._findIdsByEmailInTransaction(email, trx, (error, userIds) => {
                if (userIds.length > 1) {
                    callback(new Error('Too many users'));
                } else if (userIds.length) {
                    callback(null, userIds[0]);
                } else {
                    callback(new Error('User is not found'));
                }
            });
        }, callback);
    }

    update(userId, languId, user, callback) {
        const userToUpdate = _.cloneDeep(user);
        userToUpdate.id = userId;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._checkFieldsUnique(userToUpdate, trx, callback),
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

    appendPaidSamples(userId, samplesCount, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    this._getNumberPaidSamplesInTransaction(userId, trx, callback);
                },
                (currentPaidSamplesCount, callback) => {
                    const numberPaidSamples = currentPaidSamplesCount + samplesCount;
                    this._unsafeUpdate(userId, {numberPaidSamples}, trx, (error) => {
                        callback(error, numberPaidSamples);
                    });
                }
            ], callback);
        }, callback);
    }

    reduceForOnePaidSample(userId, trx, callback) {
        async.waterfall([
            (callback) => {
                this._getNumberPaidSamplesInTransaction(userId, trx, callback);
            },
            (currentPaidSamplesCount, callback) => {
                if (currentPaidSamplesCount > 0) {
                    const numberPaidSamples = currentPaidSamplesCount - 1;
                    this._unsafeUpdate(userId, {numberPaidSamples}, trx, (error) => {
                        callback(error, numberPaidSamples);
                    });
                } else {
                    callback(new Error('An insufficient paid samples count.'));
                }
            }
        ], callback);
    }

    _add(languId, user, shouldGenerateId, callback) {
        const userToInsert = _.cloneDeep(user);
        userToInsert.id = shouldGenerateId ? this._generateId() : user.id;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._checkFieldsUnique(userToInsert, trx, callback),
                (callback) => {
                    const dataToInsert = {
                        id: userToInsert.id,
                        numberPaidSamples: userToInsert.numberPaidSamples,
                        email: userToInsert.email,
                        defaultLanguId: languId
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (userId, callback) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: userToInsert.name,
                        lastName: userToInsert.lastName,
                        speciality: userToInsert.speciality
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

    /**
     * Tries to find users by specified email.
     * Returns empty array if no users found.
     * @param email Email to search for.
     * @param trx Knex transaction.
     * @param callback (error, userIds || [])
     * */
    _findIdsByEmailInTransaction(email, trx, callback) {
        async.waterfall([
            (callback) => trx.select('id')
                .from(this.baseTableName)
                .where('email', email)
                .asCallback(callback),
            (results, callback) => {
                if (results && results.length) {
                    callback(null, _.map(results, obj => obj.id));
                } else {
                    callback(null, []);
                }
            }
        ], callback);
    }

    _getNumberPaidSamplesInTransaction(userId, trx, callback) {
        trx.select('number_paid_samples')
            .from(this.baseTableName)
            .where('id', userId)
            .asCallback((error, itemData) => {
                if (error || !itemData.length) {
                    callback(error || new Error('User not found: ' + userId));
                } else {
                    callback(null, ChangeCaseUtil.convertKeysToCamelCase(itemData[0]).numberPaidSamples);
                }
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
    _checkFieldsUnique(user, trx, callback) {
        async.waterfall([
            (callback) => this._findIdsByEmailInTransaction(user.email, trx, (error, userIds) => {
                if (error) {
                    callback(error);
                } else if (userIds.length) {
                    callback(new Error('Duplicate e-mail.'));
                } else {
                    callback(null);
                }
            })
        ], callback);
    }
}

module.exports = UserModel;