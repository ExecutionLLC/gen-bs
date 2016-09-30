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
    'numberPaidSamples'
];

class UserModel extends RemovableModelBase {
    constructor(models) {
        super(models, 'user', mappedColumns);
    }

    findIdByEmail(email, callback) {
        this.db.transactionally((trx, callback) => {
            this._findUserAsync(trx, null, email, null, null)
                .then((user) => user.id)
                .asCallback(callback);
        }, callback);
    }

    findIdByLoginPassword(login, passwordHash, callback) {
        this.db.transactionally((trx, callback) => {
            this._findUserAsync(trx, null, null, login, passwordHash)
                .then((user) => user.id)
                .asCallback(callback);
        }, callback);
    }

    update(userId, languId, user, callback) {
        const userToUpdate = _.cloneDeep(user);
        userToUpdate.id = userId;
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                //(callback) => this._checkFieldsUnique(userToUpdate, trx, callback),
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

    _add(user, languId, shouldGenerateId, callback) {
        this._addAsync(user, languId, shouldGenerateId)
            .asCallback(callback);
    }

    _addAsync(user, languId, shouldGenerateId) {
        const idToInsert = shouldGenerateId ? this._generateId() : user.id;

        // TODO: add (callback) => this._checkFieldsUnique(userToInsert, trx, callback),

        return this.db.transactionallyAsync((trx) => {
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
                    callback(null, data);
                }
            });
        }, callback);
    }

    _findUserAsync(trx, userIdOrNull, emailOrNull, loginOrNull, passwordHashOrNull) {
        let query = trx
            .select('*')
            .from('user')
            .innerJoin('user_text', 'user_text.user_id', 'user.id')
            .leftJoin('user_password', 'user.id', 'user_password.user_id')
            .whereRaw('1 = 1');

        if (userIdOrNull) {
            query = query.where('user.id', userIdOrNull);
        }

        if (emailOrNull) {
            query = query
                .where('user.email', emailOrNull);
        }

        if (loginOrNull) {
            query = query.where('user_password.login', loginOrNull);
        }

        if (passwordHashOrNull) {
            query = query.where('user_password.password_hash', passwordHashOrNull);
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
        const {email, login} = user;
        Promise.all([
            this._findUserAsync(trx, null, email, null, null)
                .then(() => Promise.reject(new UserModelError('Duplicate e-mail.')))
                .catch((error) => {
                    if(error instanceof UserModelError){
                        return Promise.reject(error);
                    }
                    return Promise.resolve();
                }),
            this._findUserAsync(trx, null, null, login, null)
                .then(() => Promise.reject(new UserModelError('Duplicate login.')))
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
}

module.exports = UserModel;