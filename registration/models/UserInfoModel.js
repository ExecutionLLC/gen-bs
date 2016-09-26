'use strict';

const Uuid = require('node-uuid');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

class UserInfoModel extends ModelBase {
    constructor(db, logger) {
        super(db, logger, 'user_info', [
            'id',
            'regcode',
            'email',
            'firstName',
            'lastName',
            'speciality'
        ]);
    }

    findByRegcodeIdAsync(regcodeId, trx) {
        return trx
            .select()
            .from(this.baseTableName)
            .where('id', regcodeId)
            .then((items) => items[0])
            .then((item) => {
                if (!item) {
                    throw new Error(`User not found for regcodeId "${regcodeId}"`);
                }
                return item;
            })
            .then((item) => this._mapColumns(item));
    }

    findByRegcodeOrEmailAsync(regcode, email, trx) {
        if (!regcode && !email) {
            return Promise.reject('User not found for no regcode and email');
        }
        let query = trx
            .select()
            .from(this.baseTableName);
        if (regcode) {
            query = query.where('regcode', regcode);
        } else {
            query = query.where('email', email);
        }
        return query
            .then((items) => items[0])
            .then((item) => {
                if (!item) {
                    if (regcode) {
                        throw new Error(`User not found for regcode "${regcode}"`);
                    } else {
                        throw new Error(`User not found for email "${email}"`);
                    }
                }
                return item;
            })
            .then((item) => this._mapColumns(item));
    }

    create(userInfo, trx) {
        if (!userInfo.regcode && !userInfo.email) {
            throw new Error('Created user must contain regcode or email');
        }
        const userId = Uuid.v4();
        const itemToInsert = ChangeCaseUtil.convertKeysToSnakeCase({
            id: userId,
            regcode: userInfo.regcode || null,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            speciality: userInfo.speciality
        });
        return trx(this.baseTableName)
            .insert(itemToInsert)
            .then(() => itemToInsert)
    }

    update(userId, userInfo, trx) {
        return trx(this.baseTableName)
            .where('id', userId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(userInfo));
    }
}

module.exports = UserInfoModel;