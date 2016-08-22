'use strict';

const _ = require('lodash');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

class SampleUploadHistoryModel extends ModelBase {
    constructor(models) {
        super(models, 'sample_upload_history', null);
    }

    add(historyEntry, callback) {
        this.db.transactionally((trx, callback) => {
            trx(this.baseTableName)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase(historyEntry))
                .asCallback(callback);
        }, callback);
    }

    find(userId, entryId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, [entryId], userId, false, null)
                .then((entries) => _.first(entries))
                .asCallback(callback);
        });
    }

    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, true, null)
                .asCallback(callback);
        }, callback);
    }

    /**
     * Gets number of active uploads for the specified user.
     * */
    countActive(userId, callback) {
        this.db.transactionally((trx, callback) => {
            trx.count('id')
                .from(this.baseTableName)
                .where(ChangeCaseUtil.convertKeysToSnakeCase({
                    userId,
                    isActive: true
                }))
                // In Postgres count returns BigInt which becomes string in JS.
                // We know that the number of active uploads is not so big, so
                // convert it here.
                .then((countString) => +countString)
                .asCallback(callback);
        }, callback);
    }

    findActive(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, true, true)
                .asCallback(callback);
        }, callback);
    }

    update(userId, entryId, entry, callback) {
        this.db.transactionally((trx, callback) => {
            trx(this.baseTableName)
                .where(ChangeCaseUtil.convertKeysToSnakeCase({
                    id: entryId
                }))
                .update(ChangeCaseUtil.convertKeysToSnakeCase(entry))
                .then(() => this._findEntriesAsync(trx, [entryId], userId, false))
                .then((entries) => _.first(entries))
                .asCallback(callback);
        }, callback);
    }

    remove(userId, entryId, callback) {
        this.update(userId, entryId, {isDeleted: true}, callback);
    }

    _findEntriesAsync(trx, entryIdsOrNull, userIdOrNull, excludeDeleted, isActiveOrNull) {
        let query = trx.select()
            .from(this.baseTableName)
            .whereRaw('1 = 1');
        if (entryIdsOrNull) {
            query = query.andWhere('id', 'in', entryIdsOrNull);
        }

        if (userIdOrNull) {
            query = query.andWhere('user_id', userIdOrNull);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (isActiveOrNull != null) {
            query = query.andWhere('is_active', isActiveOrNull);
        }

        return query
            .then((entries) => this._ensureAllItemsFoundAsync(entries, entryIdsOrNull));
    }
}

module.exports = SampleUploadHistoryModel;
