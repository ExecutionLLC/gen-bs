'use strict';

const _ = require('lodash');

const {SAMPLE_UPLOAD_STATUS} = require('../utils/Enums');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ModelBase = require('./ModelBase');

class SampleUploadHistoryModel extends ModelBase {
    constructor(models) {
        super(models, 'sample_upload_history', null);
    }

    add(user, languId, historyEntry, callback) {
        this.db.transactionally((trx, callback) => {
            trx(this.baseTableName)
                .insert(ChangeCaseUtil.convertKeysToSnakeCase(historyEntry))
                .asCallback(callback);
        }, callback);
    }

    find(userId, entryId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, [entryId], userId, false, null, null, null, null)
                .then((entries) => _.first(entries))
                .asCallback(callback);
        }, callback);
    }

    findAll(userId, limit, offset, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, true, null, null, limit, offset)
                .asCallback(callback);
        }, callback);
    }

    findBySampleId(userId, sampleId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, false, null, sampleId, null, null)
                .asCallback(callback);
        }, (error, result) =>{
            callback(error, result[0]);
        });
    }

    findNotFinishedUploads(userId, limit, offset, callback) {
        const statusesToShow = [SAMPLE_UPLOAD_STATUS.IN_PROGRESS, SAMPLE_UPLOAD_STATUS.ERROR];
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, true, statusesToShow, null, limit, offset)
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
                    status: SAMPLE_UPLOAD_STATUS.IN_PROGRESS
                }))
                // In Postgres count returns BigInt which becomes string in JS.
                // We know that the number of active uploads is not so big, so
                // convert it here.
                .then((countStrings) => +countStrings[0].count)
                .asCallback(callback);
        }, callback);
    }

    findActive(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, null, userId, true, [SAMPLE_UPLOAD_STATUS.IN_PROGRESS], null, null, null)
                .asCallback(callback);
        }, callback);
    }

    findActiveForAllUsers(entryId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findEntriesAsync(trx, [entryId], null, true, [SAMPLE_UPLOAD_STATUS.IN_PROGRESS], null, null, null)
                .then((entries) => _.first(entries))
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
                .then(() => this._findEntriesAsync(trx, [entryId], userId, false, null, null, null, null))
                .then((entries) => _.first(entries))
                .asCallback(callback);
        }, callback);
    }

    remove(userId, entryId, callback) {
        this.update(userId, entryId, {isDeleted: true}, callback);
    }

    _findEntriesAsync(trx, entryIdsOrNull, userIdOrNull, excludeDeleted,
                      statusesOrNull, samplesOrNull, limitOrNull, offsetOrNull) {
        let query = trx.select()
            .from(this.baseTableName)
            .whereRaw('1 = 1');
        if (entryIdsOrNull) {
            query = query.andWhere('id', 'in', entryIdsOrNull);
        }

        if (userIdOrNull) {
            query = query.andWhere('user_id', userIdOrNull);
        }

        if (samplesOrNull) {
            query = query.andWhere('sample_id', samplesOrNull);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (statusesOrNull) {
            query = query.andWhere('status', 'in', statusesOrNull);
        }

        if (limitOrNull != null) {
            query = query.limit(limitOrNull);
        }

        if (offsetOrNull != null) {
            query = query.offset(offsetOrNull);
        }

        return query
            .then((entries) => {
                if (entryIdsOrNull) {
                    return this._ensureAllItemsFoundAsync(entries, entryIdsOrNull);
                }
                return entries;
            })
            .then((entries) => this._toCamelCaseAsync(entries));
    }
}

module.exports = SampleUploadHistoryModel;
