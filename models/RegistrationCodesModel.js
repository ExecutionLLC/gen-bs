'use strict';

const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

class RegistrationCodesModel extends ModelBase {
    constructor(models) {
        super(models, 'registration_code', [
            'id',
            'description',
            'isActivated',
            'activatedTimestamp',
            'language',
            'speciality',
            'numberOfPaidSamples',
            'email'
        ]);
    }

    findInactiveAsync(id, trx) {
        return trx.select()
            .from(this.baseTableName)
            .where('id', id)
            .map((item) => this._mapColumns(item))
            .then((items) => {
                const item = items[0];
                if (item.isActivated) {
                    return Promise.reject('Code is already activated');
                }
                return item;
            });
    }

    activateAsync(id, email, trx) {
        return this.findInactiveAsync(id, trx)
            .then((item) => trx(this.baseTableName)
                .where('id', item.id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    isActivated: true,
                    email
                })));
    }

    createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx) {
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
        const promises = items.map((item) => trx(this.baseTableName)
                .insert(item));
        return Promise.all(promises)
            .then(() => itemIds);
    }

    findInactive(id, trx, callback) {
        this.findInactiveAsync(id, trx)
            .then((item) => callback(null, item))
            .catch((error) => callback(error));
    }

    activate(id, email, trx, callback) {
        this.activateAsync(id, email, trx)
            .then(() => callback(null))
            .catch((error) => callback(error));
    }

    createMany(count, language, speciality, description, numberOfPaidSamples, trx, callback) {
        this.createManyAsync(count, language, speciality, description, numberOfPaidSamples, trx)
            .then((ids) => callback(null, ids))
            .catch((error) => callback(error));
    }
}

module.exports = RegistrationCodesModel;
