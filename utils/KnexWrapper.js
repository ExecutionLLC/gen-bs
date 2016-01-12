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
            client: 'pg',
            connection: {
                host: databaseSettings.host,
                user: databaseSettings.user,
                password: databaseSettings.password,
                database: databaseSettings.databaseName
            }
        };

        this.knexConfig = knexConfig;
        this.knex = new Knex(knexConfig);

        this.knex.on('query', (data) => {
            this.logger.info("EXECUTING ON " + this.knexConfig.connection.database + " : " + knexDataToSql(data));
        });
    }

    asCallback(query, callback) {
        query(this.knex, callback);
    }

    transactionally(query, callback) {
        async.waterfall([
            (cb) => {
                // 1. Create transaction
                // 2. Open transaction
                let trx = new KnexTransaction(this.knex, this.logger);
                trx.openTransaction((error, knex) => {
                    cb(error, {
                        trx,
                        knex
                    });
                });
            },
            (result, cb) => {
                const trx = result.trx;
                // 3. Execute query with the transaction
                query(result.knex, (error, data) => {
                    cb(null, {
                        trx,
                        error,
                        data
                    });
                });
            },
            (result, cb) => {
                // 4. Complete transaction
                let trx = result.trx;
                trx.complete(result.error, result.data, cb);
            }
        ], callback);
    }
}

module.exports = KnexWrapper;
