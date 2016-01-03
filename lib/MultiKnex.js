'use strict';

const _ = require('lodash');
const async = require('async');

const Knex = require('knex');
const MultiTransaction = require('./MultiTransaction');

const knexDataToSql = (data) => {
    let counter = 0;
    return data.sql.replace(/\?/g, function() {
        const obj = data.bindings[counter++];
        return (obj instanceof Object) ? JSON.stringify(obj) : obj;
    });
};

const adler32 = (data) => {
    var base = 4096;
    var chunk = 1024;

    var len = data.length;
    var sum = 1;
    var int1 = sum & 0xFFFF;
    var int2 = sum >> 16;
    var i = -1;
    while (len > 0) {
        var n = chunk > len ? len : chunk;
        len -= n;
        while (n-- >= 0) {
            int1 = int1 + data.charCodeAt(i++) & 0xFF;
            int2 = int2 + int1;
        }
        int1 %= base;
        int2 %= base;
    }
    return int1 << 16 | int2;
};

class MultiKnex {
    constructor(dbConfig, logger) {
        this.config = dbConfig;
        this.logger = logger;
        this.shards = this.shardClients(dbConfig);
        this.shardIds = Object.keys(this.shards);
        this.shardCount = this.shardIds.length;
    }

    shardClients(dbConfig) {
        return _.reduce(dbConfig.shards, (result, shard, shardId) => {
            result[shardId] = this.createKnexInstance(shard, this.logger);
            return result;
        }, {});
    }

    createKnexInstance(config, logger) {
        let instance = new Knex(config);
        instance.debug = false;

        instance.on('query', (data) => {
            logger.info("EXECUTING ON " + config.connection.database + " : " + knexDataToSql(data));
        });
        return instance;
    }

    shardFor(key) {
        return this.shardIds[adler32(key.toString()) % this.shardCount];
    }

    shardsForKeys(keys) {
        const shardIds = keys.map((key) => {
            return this.shardFor(key);
        }, this);
        return _.unique(shardIds);
    }

    using(key) {
        return this.shards[this.shardFor(key)];
    }

    usingShard(shardId) {
        return this.shards[shardId];
    }

    execForShard(shardId, query, callback) {
        query(this.shards[shardId], callback);
    }

    asCallback(query, callback) {
        this.execForShards(this.shardIds, query, callback);
    }

    execForShards(shardIds, query, callback) {
        const queriesByShards = shardIds.reduce((memo, shardId) => {
            memo[shardId] = query;
            return memo;
        }, {});

        this.execByShards(queriesByShards, callback);
    }

    execByShards(queriesByShards, callback) {
        async.map(Object.keys(queriesByShards), (shardId, cb) => {
            queriesByShards[shardId](self.shards[shardId], cb);
        }, (error, results) => {
            callback(error, results && [].concat.apply([], results));
        });
    }

    execForKeys(keys, query, callback) {
        this.execForShards(this.shardsForKeys(keys), query, callback);
    }

    execForKey(key, query, callback) {
        this.execForShard(this.shardFor(key), query, callback);
    }

    transactionalExecForShard(shardId, query, callback) {
        this.shards[shardId].transaction((trx) => {
            trx.shardId = shardId;
            query(trx, (error, result) => {
                if (error) {
                    this.logger.warn("ROLLING BACK TRANSACTION ON SHARD; SOURCE: " + shardId);
                    trx.rollback(error);
                } else {
                    this.logger.info("COMMITING TRANSACTION ON SHARD");
                    trx.commit();
                }
            });
        }).asCallback((error, result) => {
            callback(error, result);
        });
    }

    transactionalExecForShards(shardIds, query, callback) {
        const queriesByShards = shardIds.reduce((memo, shardId) => {
            memo[shardId] = query;
            return memo;
        }, {});

        this.transactionalExecByShards(queriesByShards, callback);
    }

    transactionalExecForKey(key, query, callback) {
        this.transactionalExecForShard(this.shardFor(key), query, callback);
    }

    transactionalExecForKeys(keys, query, callback) {
        this.transactionalExecForShards(this.shardsForKeys(keys), query, callback);
    }

    transactionalExec(query, callback) {
        this.transactionalExecForShards(this.shardIds, query, callback);
    }

    collectQueriesByShards(queriesByKeys) {
        const queryArraysByShards = queriesByKeys.reduce((memo, queryByKeys) => {
            this.shardsForKeys(queryByKeys.keys).forEach((shardId) => {
                memo[shardId] = memo[shardId] || [];
                memo[shardId].push(queryByKeys.query);
            });
            return memo;
        }, {});

        let queryByShards = {};
            _.each(queryArraysByShards, (queryArray, shardId) => {
                queryByShards[shardId] = (knex, callback) => {
                async.mapSeries(queryArray, (query, cb) => {
                    query(knex, cb);
                }, callback);
            };
        });

        return queryByShards;
    }

    transactionalExecByKeys(queriesByKeys, callback) {
        this.transactionalExecByShards(this.collectQueriesByShards(queriesByKeys), callback);
    }

    transaction(trxCallback, resultCallback) {
        var trx = new MultiTransaction(this, resultCallback);
        trxCallback(trx);
    }

    transactionally(trxCallback, callback) {
        let result;
        this.transaction((trx) => {
            trxCallback(trx, (error, res) => {
                if (error) {
                    trx.rollback(error);
                } else {
                    result = res;
                    trx.commit();
                }
            });
        }, (error) => {
            callback(error, result);
        });
    }

    transactionalExecByShards(queriesByShards, callback) {
        var transactions = {};
        var waitCount = 0;
        var trxError = null;

        var shardCount = Object.keys(queriesByShards).length;

        var wait = (shardId, error) => {
            trxError = trxError || error;
            if (++waitCount == shardCount) {
                if (trxError) {
                    this.logger.warn("ROLLING BACK TRANSACTION ON SHARDS; SOURCE: " + shardId);
                    _.each(transactions, (t) => { t.rollback(trxError.toString()); });
                } else {
                    this.logger.info("COMMITING TRANSACTION ON SHARDS");
                    _.each(transactions, (t) => { t.commit(); });
                }
            }
        };

        async.map(Object.keys(queriesByShards), (shardId, cb) => {
            let transactionalResult;
            this.shards[shardId].transaction((trx) => {
                transactions[shardId] = trx;
                trx.shardId = shardId;
                queriesByShards[shardId](trx, (error, result) => {
                    transactionalResult = result;
                    wait(shardId, error);
                });
            }).asCallback((error, result) => {
                cb(error, transactionalResult);
            });
        }, (error, results) => {
            callback(error, results && [].concat.apply([], results));
        });
    }

    appendQuery(query, append) {
        if (!query) {
            return append;
        }
        return (knex, cb) => {
            query(knex, (error, result) => {
                if (error) {
                    return cb(error, result);
                }
                append(knex, cb);
            });
        };
    }

    prependQuery(query, prepend) {
        if (!query) {
            return prepend;
        }
        return (knex, cb) => {
            prepend(knex, (error, result) => {
                if (error) {
                    return cb(error, result);
                }
                query(knex, cb);
            });
        };
    }
}

module.exports = MultiKnex;