'use strict';

const _ = require('lodash');

class MockModelBase {
    constructor(defaultData, mockUserId) {
        this.hash = {};

        _.forEach(defaultData, item => {
            this.hash[item.id] = {
                userId: mockUserId,
                item: item
            };
        });
    }

    add(userId, item, callback) {
        item.id = Uuid.v4();

        this.hash[item.id] = {
            userId: userId,
            item: item
        };

        callback(null, item);
    }

    update(userId, item, callback) {
        if (!this._checkUserIdSet(userId)) {
            return;
        }
        if (!this._checkItemIdSet(item, callback)) {
            return;
        }
        const existingItem = this.hash[item.id];
        if (!existingItem) {
            callback(new Error('Item is not found'));
        } else {
            this.hash[item.id] = item;
            callback(null, item);
        }
    }

    remove(userId, item, callback) {
        if (!this._checkUserIdSet(userId, callback)) {
            return;
        }
        if (!this._checkItemIdSet(item, callback)) {
            return;
        }
        const existingItem = this.hash[item.id];

        if (!existingItem) {
            callback(new Error('Item is not found'));
        }

        delete this.hash[item.id];
        callback(null, item);
    }

    findById(userId, itemId, callback) {
        if (!this._checkUserIdSet(userId, callback)) {
            return;
        }

        const userItem = _.filter(this.hash, descriptor => descriptor.userId === userId
            && descriptor.item.id === itemId)
            .first();

        if (!userItem) {
            callback(new Error('Item not found by id ' + itemId));
        } else {
            callback(null, userItem);
        }
    }

    findAll(userId, callback) {
        if (!this._checkUserIdSet(userId, callback)) {
            return;
        }
        const userItems = _.filter(this.hash, descriptor => descriptor.userId === userId)
            .map(descriptor => descriptor.item);
        callback(null, userItems);
    }

    _checkItemIdSet(item, callback) {
        if (!item.id) {
            callback(new Error('Item id is not set'));
            return false;
        }
        return true;
    }

    _checkUserIdSet(userId, callback) {
        if (!userId) {
            callback(new Error('User id is undefined'));
            return false;
        }
        return true;
    }
}

module.exports = MockModelBase;
