'use strict';

const ServiceBase = require('./ServiceBase');

class UserEntityServiceBase extends ServiceBase {
    constructor(services, models, theModel) {
        super(services, models);

        this.theModel = theModel;
    }

    add(user, languId, item, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        const actualLanguId = languId || user.languId;
        this.theModel.add(user.id, actualLanguId, item, callback);
    }

    update(user, item, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.update(user.id, item.id, item, callback);
    }

    find(user, itemId, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.find(user.id, itemId, callback);
    }

    findMany(user, itemIds, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.findMany(user.id, itemIds, callback);
    }

    findAll(user, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.findAll(user.id, callback);
    }

    remove(user, itemId, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.remove(user, itemId, callback);
    }
}

module.exports = UserEntityServiceBase;
