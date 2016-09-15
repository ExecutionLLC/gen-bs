'use strict';

const _ = require('lodash');
const async = require('async');

const Knex = require('knex');
const KnexTransaction = require('./KnexTransaction');

const knexDataToSql = (data) => {
    let counter = 0;
    return data.sql.replace(/\?/g, function() {
        const obj = data.bindings[counter++];
        return (obj instanceof Object) ? JSON.stringify(obj) : obj;
    });
};

class KnexWrapper {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;

        const databaseSettings = config.database;
        const knexConfig = {
            client: databaseSettings.client,
            connection: {
                host: databaseSettings.host,
                port: databaseSettings.port,
                user: databaseSettings.user,
                password: databaseSettings.password,
                database: databaseSettings.databaseName
            }
        };

        this.knexConfig = knexConfig;
        this.knex = new Knex(knexConfig);

        this.knex.on('query', (data) => {
            this.logger.trace("EXECUTING ON " + this.knexConfig.connection.database + " : " + knexDataToSql(data));
        });
    }

    asCallback(query, callback) {
        query(this.knex, callback);
    }

    /**
     * @param callback (error, transactionWrapper, knex)
     * */
    beginTransaction(callback) {
        const trx = new KnexTransaction(this.knex, this.logger);
        trx.openTransaction((error, knex) => {
            callback(error, trx, knex);
        });
    }

    /**
     * @param trx Transaction as result of beginTransaction method.
     * @param error Error, if any, occurred in transaction body.
     * @param data Result of the transaction.
     * @param callback (error, data)
     * */
    endTransaction(trx, error, data, callback) {
        trx.complete(error, new Error().stack, data, callback);
    }

    transactionally(query, callback) {
        if (typeof callback !== 'function') {
            throw new Error('callback is not a function');
        }
        const originalStack = new Error().stack;
        async.waterfall([
            (callback) => {
                // 1. Create transaction
                // 2. Open transaction
                this.beginTransaction(callback);
            },
            (trx, knex, callback) => {
                // 3. Execute query with the transaction
                query(knex, (error, data) => callback(null, trx, error, data));
            },
            (trx, error, data, callback) => {
                // 4. Complete transaction
                trx.complete(error, originalStack, data, callback);
            }
        ], callback);
    }

    transactionallyAsync(queryAsync) {
        const originalStack = new Error().stack;
        return new Promise((resolve, reject) => {
            async.waterfall([
                (callback) => {
                    // 1. Create transaction
                    // 2. Open transaction
                    this.beginTransaction(callback);
                },
                (trx, knex, callback) => {
                    // 3. Execute query with the transaction
                    queryAsync(knex)
                        .then((data) => callback(null, trx, null, data))
                        .catch((error) => callback(null, trx, error, null));
                },
                (trx, error, data, callback) => {
                    // 4. Complete transaction
                    trx.complete(error, originalStack, data, callback);
                }
            ], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = KnexWrapper;
