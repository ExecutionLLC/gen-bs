'use strict';

var _ = require('lodash');

var util = require('util');

var EventEmitter = require('events').EventEmitter;

class MultiTransaction {
    constructor(knexWrapper, completeHandler) {
        this.knexWrapper = knexWrapper;
        this.completeHandler = completeHandler;
        this.transaction = null;
        this.openingTransactions = false;
        this.completeCount = 0;
        this.openCount = 0;
        this.trxError = null;
        util.inherits(this, EventEmitter);
    }

    completedTransactions(error) {
        this.completeCount++;
        if (error) {
            this.trxError = this.trxError || error;
        } else {
            if (this.completeCount == this.openCount) {
                this.complete();
            }
        }
    }

    openTransaction() {
        this.openingTransactions = true;
        this.knexWrapper.transaction((trx) => {
            this.transaction = trx;
            this.openCount++;
            this.emit('open', trx);
        }).exec((error) => {
            this.completedTransactions(error);
        });
    }

    ensureTransaction(callback) {
        if (this.transaction) {
            return callback(this.transaction);
        }
        if (!this.openingTransactions) {
            this.openTransaction();
        }
        this.on('open', function(trx) {
            callback(trx);
        });
    }

    commit() {
        this.transaction.commit();
    }

    complete() {
        this.removeAllListeners();
        this.completeHandler(this.trxError);
    }

    rollback(error) {
        this.trxError = this.trxError || error || "Explicit rollback";
        this.transaction.rollback();
    }

    exec(query, callback) {
        this.ensureTransaction((trx) => {
            query(trx, (error, result) => {
               callback(error, result);
            });
        });
    }
}

module.exports = MultiTransaction;