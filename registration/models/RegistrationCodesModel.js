'use strict';

const Uuid = require('node-uuid');
const Promise = require('bluebird');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');


const REGCODE_MIN = 10000000;
const REGCODE_MAX = 99999999;

class RegistrationCodesModel extends ModelBase {
    constructor(db, logger) {
        super(db, logger, 'registration_code', [
            'id',
            'regcode',
            'description',
            'isActivated',
            'activatedTimestamp',
            'createdTimestamp',
            'language',
            'speciality',
            'numberOfPaidSamples',
            'email',
            'firstName',
            'lastName',
            'telephone',
            'company',
            'firstDate',
            'lastDate',
            'gender'
        ]);
    }

    findInactiveAsync(id, trx) {
        return trx.select()
            .from(this.baseTableName)
            .where('id', id)
            .map((item) => this._mapColumns(item))
            .then((items) => {
                if (items && items.length) {
                    const item = items[0];
                    if (item.isActivated) {
                        return Promise.reject('Code is already activated');
                    }
                    return item;
                } else {
                    return Promise.reject('Code is not found.');
                }
            });
    }

    findRegcodeAsync(regcode, trx) {
        return trx.select()
            .from(this.baseTableName)
            .where('regcode', regcode)
            .then((items) => items[0])
            .then((item) => {
                if (!item) {
                    throw new Error(`Regcode "${regcode}" not found`)
                }
                return item;
            })
            .then((item) => this._mapColumns(item));
    }

    findRegcodeIdAsync(regcodeId, trx) {
        return trx.select()
            .from(this.baseTableName)
            .where('id', regcodeId)
            .then((items) => items[0])
            .then((item) => {
                if (!item) {
                    throw new Error(`Regcode id "${regcodeId}" not found`)
                }
                return item;
            })
            .then((item) => this._mapColumns(item));
    }

    _generateRegcode() {
        return '' + Math.floor(REGCODE_MIN + Math.random() * (REGCODE_MAX - REGCODE_MIN));
    }

    _generateNextRegcode(regcode) {
        const incrementedRegcode = (+regcode + 1);
        if (incrementedRegcode > REGCODE_MAX) {
            return '' + REGCODE_MIN;
        } else {
            return '' + incrementedRegcode;
        }
    }

    _findValidRegcodeAsync(regcode, trx) {
        // Find unused regcode starting with given
        return new Promise((resolve) => {
            this.findRegcodeAsync(regcode, trx)
                // regcode found - we need to generate next one and repeat the search
                .then(() =>
                    this._findValidRegcodeAsync(this._generateNextRegcode(regcode), trx)
                        .then((regcode) => resolve(regcode)))
                // did not find regcode - let's return it to use
                .catch((err) => resolve(regcode));
        });
    }


    activateAsync(id, trx) {
        return this.findInactiveAsync(id, trx)
            .then((item) => trx(this.baseTableName)
                .where('id', item.id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    isActivated: true,
                    activatedTimestamp: new Date()
                })))
            .then(() =>
                this.findRegcodeIdAsync(id, trx)
            );
    }

    createRegcodeAsync(startingRegcode, language, speciality, description, numberOfPaidSamples, trx) {
        return this._findValidRegcodeAsync(startingRegcode ? '' + startingRegcode : this._generateRegcode(), trx)
            .then((regcode) => {
                if (!regcode) {
                    throw new Error('createRegcodeAsync fails: no valid regcode found');
                }
                const itemId = Uuid.v4();
                return {
                    id: itemId,
                    regcode,
                    speciality,
                    language,
                    description,
                    numberOfPaidSamples,
                    isActivated: false
                };
            })
            .then((returnedItem) =>
                trx(this.baseTableName)
                    .insert(ChangeCaseUtil.convertKeysToSnakeCase(returnedItem))
                    .then(() => returnedItem)
            );
    }

    createManyRegcodeAsync(count, startingRegcode, language, speciality, description, numberOfPaidSamples, trx) {
        // create empty array of desired size to map on it
        const items = new Array(count)
            .fill(null);

        // we'll generate regcodes one by one
        // because we need to check if next regcode is not createted before
        // store in this variable next desired regcode
        let currentRegcode = startingRegcode;

        return Promise.map(
            items,
            () => {
                return new Promise((resolve) => {
                    this.createRegcodeAsync(currentRegcode, language, speciality, description, numberOfPaidSamples, trx)
                        .then((regcodeInfo) => {
                            currentRegcode = currentRegcode && this._generateNextRegcode(regcodeInfo.regcode);
                            resolve(regcodeInfo);
                        });
                })
            },
            {concurrency: 1} // only one promise at a time will executed
        );
    }

    update(regcodeId, regcodeInfo, trx) {
        return trx(this.baseTableName)
            .where('id', regcodeId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(regcodeInfo));
    }

    updateFirstDate(regcodeId, regcodeInfo, trx) {
        if (regcodeInfo.firstDate) {
            return Promise.resolve();
        } else {
            return Promise.resolve()
                .then(() => {
                    const updatedItem = Object.assign({}, regcodeInfo, {firstDate: new Date()});
                    return this.update(regcodeId, updatedItem, trx);
                });
        }
    }

    updateLastDate(regcodeId, regcodeInfo, trx) {
        return Promise.resolve()
            .then(() => {
                const updatedItem = Object.assign({}, regcodeInfo, {lastDate: new Date()});
                return this.update(regcodeId, updatedItem, trx);
            });
    }

    getAllRegcodesAsync(trx) {
        return trx.select()
            .from(this.baseTableName)
            .map((item) => this._mapColumns(item));
    }
}

module.exports = RegistrationCodesModel;
