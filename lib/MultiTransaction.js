'use strict';

const _ = require('lodash');
const async = require('async');

const EventEmitter = require('events').EventEmitter;

class MultiTransaction {
    constructor(multiKnex, completeHandler) {
        this.multiKnex = multiKnex;
        this.transactions = {};
        this.openingTransactions = {};
        this.completeCount = 0;
        this.openCount = 0;
        this.trxError = null;
        this.completeHandler = completeHandler;
        this.eventEmitter = new EventEmitter();
    };

    completedTransactions(shardId, error) {
        this.completeCount++;
        if (error) {
            this.trxError = this.trxError || {shard: shardId, err: error};
        }
        if (this.completeCount == this.openCount) {
            this.complete();
        }
    };

    openTransaction(shardId, callback) {
        this.openingTransactions[shardId] = true;
        this.multiKnex.shards[shardId].transaction((trx) => {
            trx.shardId = shardId;
            this.transactions[shardId] = trx;
            this.openCount++;
            this.eventEmitter.emit('open', trx);
        }).asCallback((err) => {
            this.completedTransactions(shardId, err);
        });
    };

    ensureTransaction(shardId, callback) {
        if (this.transactions[shardId]) {
            return callback(this.transactions[shardId]);
        }
        if (!this.openingTransactions[shardId]) {
            this.openTransaction(shardId);
        }
        this.eventEmitter.on('open', (trx) => {
            if (trx.shardId === shardId) {
                callback(trx);
            }
        });
    };

    commit() {
        this.multiKnex.logger.info("COMMITTING TRANSACTION");
        _.each(this.transactions, (t) => { t.commit(); });
    };

    complete() {
        this.eventEmitter.removeAllListeners();
        this.completeHandler(this.trxError);
    };

    rollback(error) {
        this.trxError = this.trxError || error || "Explicit rollback";
        this.multiKnex.logger.warn("ROLLING BACK TRANSACTION: " + this.trxError);
        _.each(this.transactions, (t) => { t.rollback(); });
    };

    shardFor(key) {
        return this.multiKnex.shardFor(key);
    };

    asCallback(query, callback) {
        this.execForShards(this.multiKnex.shardIds, query, callback);
    };

    transactionalExec(query, callback) {
        this.asCallback(query, callback);
    };

    execForShards(shardIds, query, callback) {
        var queriesByShards = shardIds.reduce((memo, shardId) => {
            memo[shardId] = query;
            return memo;
        }, {});

        this.execByShards(queriesByShards, callback);
    };

    transactionalExecForShards (shardIds, query, callback) {
        this.execForShards(shardIds, query, callback);
    };

    execByShards(queriesByShards, callback) {
        async.map(Object.keys(queriesByShards), (shardId, cb) => {
            this.execForShard(shardId, queriesByShards[shardId], cb);
        }, (error, results) => {
            callback(error, results && [].concat.apply([], results));
        });
    };

    transactionalExecByShards(queriesByShards, callback) {
        this.execByShards(queriesByShards, callback);
    };

    execForKeys(keys, query, callback) {
        this.execForShards(this.multiKnex.shardsForKeys(keys), query, callback);
    };

    transactionalExecForKeys(keys, query, callback) {
        this.execForKeys(keys, query, callback);
    };

    execForKey(key, query, callback) {
        this.execForShard(this.multiKnex.shardFor(key), query, callback);
    };

    transactionalExecForKey(key, query, callback) {
        this.execForKey(key, query, callback);
    };

    execForShard(shardId, query, callback) {
        this.ensureTransaction(shardId, (trx) => {
            query(trx, (error, result) => {
                callback(error, result);
            });
        });
    };
}

module.exports = MultiTransaction;