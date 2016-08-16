'use strict';

const async = require('async');
const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

class RegistrationCodesModel extends ModelBase {
    constructor(models) {
        super(models, 'registration_model', [
            'id',
            'description',
            'isActivated',
            'email'
        ]);
    }

    findInactive(id, trx, callback) {
        async.waterfall([
            (callback) => trx.select()
                .from(this.baseTableName)
                .where('id', id)
                .asCallback(callback),
            (items, callback) => callback(null, items[0]),
            (item, callback) => callback(null, this._mapColumns(item)),
            (item, callback) => item.isActivated ?
                callback(new Error('Code is already activated')) : callback(null, item)
        ], callback);
    }

    activate(id, email, trx, callback) {
        async.waterfall([
            (callback) => this.findInactive(id, trx, callback),
            (item, callback) => trx(this.baseTableName)
                .where('id', item.id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    isActivated: true,
                    email
                }))
                .asCallback((error) => callback(error))
        ], callback);
    }

    createMany(count, language, speciality, description, numberOfPaidSamples, trx, callback) {
        const items = new Array(count)
            .fill(null)
            .map(() => ChangeCaseUtil.convertKeysToSnakeCase({
                id: Uuid.v4(),
                speciality,
                language,
                description,
                numberOfPaidSamples,
                isActivated: false
            }));
        const itemIds = items.map(item => item.id);
        trx.batchInsert(this.baseTableName, items)
            .asCallback((error) => callback(error, itemIds));
    }
}

module.exports = RegistrationCodesModel;
