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
            this.logger.info('OPENING TRANSACTION ' + this.id);
            if (this.transaction) {
                throw new Error('Transaction is already opened. No subtransaction support is implemented in wrapper.');
            }
            this.transaction = trx;
            callback(null, trx);
        });
    }

    complete(error, data, callback) {
        if (error) {
            this.logger.warn('ROLLING BACK TRANSACTION ' + this.id +': ' + error);
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
            this.logger.info('COMMITING TRANSACTION ' + this.id);
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