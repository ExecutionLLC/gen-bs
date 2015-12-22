'use strict';

const ServiceBase = require('./ServiceBase');

class UserEntityServiceBase extends ServiceBase {
    constructor(services, models, theModel) {
        super(services, models);

        this.theModel = theModel;
    }

    add(user, item, callback) {
        this.theModel.add(user.id, item, callback);
    }

    update(user, item, callback) {
        this.theModel.update(user.id, item, callback);
    }

    find(user, itemId, callback) {
        this.theModel.find(user.id, itemId, callback);
    }

    findAll(user, callback) {
        if (!this._checkUserIsSet(user, callback)) {
            return;
        }

        if (user) {
            this.theModel.findAll(user.id, callback);
        } else {
            callback(new Error('User cannot be undefined here.'));
        }
    }
}

module.exports = UserEntityServiceBase;
