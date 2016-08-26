'use strict';

const Uuid = require('node-uuid');

class KnexTransaction {
    constructor(knex, logger) {
        this.knex = knex;
        this.logger = logger;
        this.transaction = null;
        this.id = Uuid.v4();
    };

    openTransaction(callback) {
        this.knex.transaction((trx) => {
            this.logger.trace(`OPENING TRANSACTION ${this.id}`);
            if (this.transaction) {
                throw new Error('Transaction is already opened.');
            }
            this.transaction = trx;
            callback(null, trx);
        });
    }

    complete(error, originalStack, data, callback) {
        if (error) {
            this.logger.error(`ROLLING BACK TRANSACTION ${this.id}: ${error}\n${error.stack}`);
            this.logger.debug(`Original stack: ${originalStack}`);
            this.transaction
                .rollback()
                .asCallback((rollbackError) => {
                    this.transaction = null;
                    if (rollbackError) {
                        this.logger.error('ROLLBACK ERROR: ' + rollbackError);
                    }
                    callback(error);
                });
        } else {
            this.logger.trace('COMMITTING TRANSACTION ' + this.id);
            this.transaction
                .commit()
                .asCallback((error) => {
                    this.transaction = null;
                    callback(error, data);
                });
        }
    }
}

module.exports = KnexTransaction;
