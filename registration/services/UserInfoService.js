'use strict';

class UserInfoService {
    /**@typedef {Object} UserInfoService
     * @property {KnexWrapper} db
     * @property {UserInfoModel} userInfoModel
     **/


    constructor(db, userInfoModel) {
        this.db = db;
        this.userInfoModel = userInfoModel;
    }

    findByRegcodeOrEmailAsync(regcode, email) {
        const {db, userInfoModel} = this;
        return db.transactionallyAsync((trx) =>
            userInfoModel.findByRegcodeOrEmailAsync(regcode, email, trx));
    }

    create(userInfo) {
        const {db, userInfoModel} = this;
        return db.transactionallyAsync((trx) =>
            userInfoModel.create(userInfo, trx));
    }

    update(userId, userInfo) {
        const {db, userInfoModel} = this;
        return db.transactionallyAsync((trx) =>
            userInfoModel.update(userId, userInfo, trx));
    }
}

module.exports = UserInfoService;
