'use strict';

const _ = require('lodash');
const async = require('async');
const Promise = require('bluebird');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const RemovableModelBase = require('./RemovableModelBase');
const UserModelError = require('../utils/errors/UserModelError');

const mappedColumns = [
    'id',
    'firstName',
    'lastName',
    'defaultLanguId',
    'isDeleted',
    'email',
    'gender',
    'phone',
    'loginType',
    'password',
    'numberPaidSamples',
    'language',
    'speciality',
    'company'
];

class UserModel extends RemovableModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    findIdByEmail(email, callback) {
        this.db.transactionally((trx, callback) => {
            this._findUserAsync(trx, null, email, null)
                .then((user) => user.id)
                .asCallback(callback);
        }, callback);
    }

    findIdByEmailPassword(email, passwordHash, callback) {
        this.db.transactionally((trx, callback) => {
            this._findUserAsync(trx, null, email, passwordHash)
                .then((user) => user.id)
                .asCallback(callback);
        }, callback);
    }

    update(userId, languId, user, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                //(callback) => this._checkFieldsUnique(user, trx, callback),
                (callback) => {
                    const dataToUpdate = {
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        defaultLanguId: languId,
                        isDeleted: false,
                        gender: user.gender,
                        phone: user.phone,
                        loginType: user.loginType,
                        password: user.password
                    };
                    this._unsafeUpdate(userId, dataToUpdate, trx, callback);
                },
                (id, callback) => {
                    const dataToUpdate = {
                        userId: id,
                        languId: languId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        speciality: user.speciality,
                        company: user.company
                    };
                    this._updateUserText(id, dataToUpdate, trx, callback);
                }
            ], callback);
        }, (error, id) => {
            if (error) {
                callback(error);
            } else {
                this._fetch(id, callback)
            }
        });
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

    _add(user, languId, shouldGenerateId, callback) {
        this._addAsync(user, languId, shouldGenerateId)
            .asCallback(callback);
    }

    _addAsync(user, languId, shouldGenerateId) {
        const idToInsert = shouldGenerateId ? this._generateId() : user.id;
        return this.db.transactionallyAsync((trx) => {
            return Promise.resolve()
                .then(() => this._checkEmailUniqueAsync(user, trx))
                .then(() => {
                    const dataToInsert = {
                        id: idToInsert,
                        numberPaidSamples: user.numberPaidSamples,
                        email: user.email,
                        defaultLanguId: languId,
                        isDeleted: false,
                        gender: user.gender,
                        phone: user.phone,
                        loginType: user.loginType,
                        password: user.password
                    };
                    return this._insertAsync(dataToInsert, trx)
                        .then((userId) => {
                            const dataToInsert = {
                                userId: userId,
                                languId: languId,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                speciality: user.speciality,
                                company: user.company
                            };
                            return this._unsafeInsertAsync('user_text', dataToInsert, trx).then(() => userId);
                        });
                })
        });
    }

    _updateUserText(userId, dataToUpdate, trx, callback) {
        trx('user_text')
            .where('user_id', userId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, userId);
            });
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
                    delete data.languId;
                    delete data.userId;
                    callback(null, data);
                }
            });
        }, callback);
    }

    _findUserAsync(trx, userIdOrNull, emailOrNull, passwordOrNull) {
        let query = trx
            .select('*')
            .from('user')
            .leftJoin('user_text', 'user_text.user_id', 'user.id')
            .whereRaw('1 = 1');

        if (userIdOrNull) {
            query = query.andWhere('user.id', userIdOrNull);
        }

        if (emailOrNull) {
            query = query.andWhere('user.email', emailOrNull);
        }

        if (passwordOrNull) {
            query = query.andWhere('user.password', passwordOrNull);
        }

        return query
            .then((users) => {
                if (!users || users.length !== 1) {
                    return Promise.reject(new Error('User is not found'))
                }
                return users;
            })
            .then((users) => users[0])
            .then((user) => ChangeCaseUtil.convertKeysToCamelCase(user))
            .then((user) => {
                user.language = user.defaultLanguId;
                return this._mapColumns(user);
            });
    }

    /**
     * Checks that unique fields, ex. email, are unique across users collection.
     * */
    _checkFieldsUnique(user, trx, callback) {
        const {email} = user;
        Promise.all([
            this._findUserAsync(trx, null, email, null)
                .then(() => Promise.reject(new UserModelError('Duplicate e-mail.')))
                .catch((error) => {
                    if(error instanceof UserModelError){
                        return Promise.reject(error);
                    }
                    return Promise.resolve();
                })
        ])
            .then(() => callback(null))
            .catch((error) => callback(error))
    }

    _checkEmailUniqueAsync(user, trx) {
        const {email} = user;
        return new Promise((resolve, reject) => {
            this._findUserAsync(trx, null, email, null)
                .catch((error) => resolve())
                .then(() => reject(new Error('Duplicate e-mail.')))
        });
    }
}

module.exports = UserModel;