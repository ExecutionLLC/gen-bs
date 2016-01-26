'use strict';

const ServiceBase = require('./ServiceBase');

const USER_UNDEFINED = 'User cannot be undefined here.';

class UserEntityServiceBase extends ServiceBase {
    constructor(services, models, theModel) {
        super(services, models);

        this.theModel = theModel;
    }

    add(user, languId, item, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            const actualLanguId = languId || user.languId;
            this.theModel.add(user.id, actualLanguId, item, callback);
        } else {
            callback(new Error(USER_UNDEFINED));
        }
    }

    update(user, item, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            this.theModel.update(user.id, item.id, item, callback);
        } else {
            callback(new Error(USER_UNDEFINED));
        }
    }

    find(user, itemId, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            this.theModel.find(user.id, itemId, callback);
        } else {
            callback(new Error(USER_UNDEFINED));
        }
    }

    findMany(user, itemIds, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            this.theModel.findMany(user.id, itemIds, callback);
        } else {
            callback(new Error(USER_UNDEFINED));
        }
    }

    findAll(user, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            this.theModel.findAll(user.id, callback);
        } else {
            callback(new Error(USER_UNDEFINED));
        }
    }

    remove(user, itemId, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        this.theModel.remove(user, itemId, callback);
    }
}

module.exports = UserEntityServiceBase;
