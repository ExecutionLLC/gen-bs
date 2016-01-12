'use strict';

class KnexTransaction {
    constructor(knex, logger) {
        this.knex = knex;
        this.logger = logger;
        this.transaction = null;
    };

    openTransaction(callback) {
        this.knex.transaction((trx) => {
            this.transaction = trx;
            callback(null, trx);
        });
    }

    complete(error, data, callback) {
        if (error) {
            this.logger.warn("ROLLING BACK TRANSACTION: " + error);
            this.transaction
                .rollback()
                .asCallback(error => {
                    callback(error);
                });
        } else {
            this.logger.info("COMMITING TRANSACTION");
            this.transaction
                .commit()
                .asCallback((error) => {
                    callback(error, data);
                });
        }
    }
}

module.exports = KnexTransaction;