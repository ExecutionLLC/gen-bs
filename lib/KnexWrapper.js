'use strict';

var knex = require('knex');

var MultiTransaction = require('./MultiTransaction');

const expand = function(data) {
    var counter = 0;
    return data.sql.replace(/\?/g, function() {
        var obj = data.bindings[counter++];
        return (obj instanceof Object) ? JSON.stringify(obj) : obj;
    });
};

class KnexWrapper {
    constructor(knex) {
        this.knex = knex;

        this.knex.on('query', function(data) {
            console.log("EXECUTING: " + expand(data));
        });
    }

    exec(query, callback) {
        query(callback);
    }

    transactionalExec(query, callback) {
        this.transaction((trx) => {
            query(trx, (error, result) => {
                if (error) {
                    console.log('ROLLING BACK TRANSACTION');
                    trx.rollback(error);
                } else {
                    console.log('COMMITING TRANSACTION')
                    trx.commit();
                }
            });
        }).exec((error, result) => {
            callback(error, result);
        });
    }

    transaction(trxCallback, resultCallback) {
        let trx = new MultiTransaction(this, resultCallback);
        trxCallback(trx);
    }

    transactionally(trxCallback, callback) {
        let result;
        this.transaction((trx) => {
            trxCallback(trx, (err, res) => {
                if(err) {
                    trx.rollback(err);
                } else {
                    result = res;
                    trx.commit();
                }
            });
        }, (err) =>{
           callback(err, result);
        });
    }

    appendQuery(query, append) {
        if (!query) {
            return append;
        }
        return function(knex, callback) {
            query(knex, function(error, result) {
                if (error) {
                    return callback(error, result);
                }
                append(knex, callback);
            });
        };
    }

    prependQuery(query, prepend) {
        if (!query) {
            return prepend;
        }
        return function(knex, callback) {
            prepend(knex, function(error, result) {
                if (error) {
                    return callback(error, result);
                }
                query(knex, callback);
            });
        };
    }
}

module.exports = KnexWrapper;