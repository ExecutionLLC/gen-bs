'use strict';

const Uuid = require('node-uuid');
const Promise = require('bluebird');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');


class UserRequestModel extends ModelBase {
    constructor(db, logger) {
        super(db, logger, 'user_request', [
            'id',
            'isActivated',
            'activatedTimestamp',
            'speciality',
            'email',
            'firstName',
            'lastName',
            'telephone',
            'company',
            'loginType',
            'password',
            'gender',
            'createdTimestamp'
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
                        return Promise.reject('User is already activated');
                    }
                    return item;
                } else {
                    return Promise.reject('User is not found.');
                }
            });
    }

    activateAsync(id, email, trx) {
        return this.findInactiveAsync(id, trx)
            .then((item) => trx(this.baseTableName)
                .where('id', item.id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    isActivated: true,
                    activatedTimestamp: new Date()
                })));
    }

    createAsync(userInfo, trx) {
        return trx(this.baseTableName)
            .insert(
                ChangeCaseUtil.convertKeysToSnakeCase(
                    Object.assign({}, userInfo, {id: Uuid.v4(), isActivated: false}))
                );
    }
}

module.exports = UserRequestModel;
