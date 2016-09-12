'use strict';

const async = require('async');

const {ENTITY_TYPES} = require('../utils/Enums');
const ServiceBase = require('./ServiceBase');

class UserEntityServiceBase extends ServiceBase {
    constructor(services, models, theModel) {
        super(services, models);

        this.theModel = theModel;
    }

    add(user, languId, item, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.theModel.add(user.id, languId, item, callback)
        ], callback);
    }

    update(user, item, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.theModel.update(user.id, item.id, item, callback)
        ], callback);
    }

    find(user, itemId, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.theModel.find(user.id, itemId, callback)
        ], callback);
    }

    findMany(user, itemIds, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.theModel.findMany(user.id, itemIds, callback)
        ], callback);
    }

    findAll(user, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.theModel.findAll(user.id, callback)
        ], callback);
    }

    remove(user, itemId, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.find(user, itemId, callback),
            (item, callback) => this.theModel.remove(user.id, itemId, (error) => callback(error, item))
        ], callback);
    }

    _ensureItemOfUserType(item, callback) {
        if (item.type === ENTITY_TYPES.USER) {
            callback(null, item);
        } else {
            callback(new Error('Default items cannot be changed.'));
        }
    }
}

module.exports = UserEntityServiceBase;
