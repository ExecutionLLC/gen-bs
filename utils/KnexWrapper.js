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
                port: databaseSettings.port,
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
            (callback) => {
                // 1. Create transaction
                // 2. Open transaction
                const trx = new KnexTransaction(this.knex, this.logger);
                trx.openTransaction((error, knex) => {
                    callback(error, trx, knex);
                });
            },
            (trx, knex, callback) => {
                // 3. Execute query with the transaction
                query(knex, (error, data) => callback(null, trx, error, data));
            },
            (trx, error, data, callback) => {
                // 4. Complete transaction
                trx.complete(error, data, callback);
            }
        ], callback);
    }
}

module.exports = KnexWrapper;
