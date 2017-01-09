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
            'createdTimestamp',
            'emailConfirmUuid',
            'emailConfirmSendTimestamp',
            'emailConfirmed',
            'emailConfirmedTimestamp'
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

    activateAsync(id, trx) {
        return this.findInactiveAsync(id, trx)
            .then((item) => trx(this.baseTableName)
                .where('id', item.id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    isActivated: true,
                    activatedTimestamp: new Date()
                })));
    }

    createAsync(userInfo, trx) {
        const userToInsert = Object.assign({}, userInfo, {
            id: Uuid.v4(),
            isActivated: false,
            emailConfirmUuid: Uuid.v4(),
            emailConfirmed: false
        });
        return trx(this.baseTableName)
            .insert(
                ChangeCaseUtil.convertKeysToSnakeCase(userToInsert)
            )
            .then(() => userToInsert);
    }

    emailConfirmSentAsync(id, trx) {
        return this.findInactiveAsync(id, trx)
            .then((item) => trx(this.baseTableName)
                .where('id', id)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({
                    emailConfirmSendTimestamp: new Date()
                })));
    }

    emailConfirmReceivedAsync(confirmUUID, trx) {
        return trx.select()
            .from(this.baseTableName)
            .where('email_confirm_uuid', confirmUUID)
            .map((item) => this._mapColumns(item))
            .then((items) => {
                if (items && items.length) {
                    return items[0];
                } else {
                    return Promise.reject('Confirm id not found.');
                }
            })
            .then((item) =>
                Promise.resolve()
                    .then(() => trx(this.baseTableName)
                        .where('id', item.id)
                        .update(ChangeCaseUtil.convertKeysToSnakeCase({
                            emailConfirmed: true,
                            emailConfirmedTimestamp: new Date()
                        })))
                    .then(() => item)
            );
    }

    getAllRequestsAsync(trx) {
        return trx.select()
            .from(this.baseTableName)
            .map((item) => this._mapColumns(item));
    }
}

module.exports = UserRequestModel;
