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
        let userData = this._init(languId, user);

        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    this._insert(userData, trx, cb);
                },
                (userId, cb) => {
                    const dataToInsert = {
                        userId: userId,
                        languId: languId,
                        name: userData.name,
                        lastName: userData.lastName,
                        speciality: userData.speciality
                    };
                    this._insertUserText(dataToInsert, trx, (error) => {
                        cb(error, userId);
                    });
                }
            ], cb);
        }, callback);
    }

    _insert(data, trx, callback) {
        const dataToInsert = {
            id: data.id,
            numberPaidSamples: data.numberPaidSamples,
            email: data.email,
            defaultLanguId: data.defaultLanguId
        }
        super._insert(dataToInsert, trx, callback);
    }

    _insertUserText(data, trx, callback) {
        this._insertTable('user_text', data, trx, callback);
    }

    _fetch(id, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
            .from(this.baseTable)
            .innerJoin('user_text', 'user_text.user_id', this.baseTable + '.id')
            .where('id', id)
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