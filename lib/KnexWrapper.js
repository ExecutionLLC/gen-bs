'use strict';

const MultiKnex = require('./MultiKnex');

const accessKey = 'genomixdb';

class KnexWrapper {
    constructor(knexConfig, logger) {
        this.multiKnex = new MultiKnex({shards: {genomix: knexConfig}}, logger);
    }

    exec(query, callback) {
        this.multiKnex.execForKey(accessKey, query, (err, res) => {
            console.log(err, res);
            callback(err, res);
        });
    }

    transactionalExec(query, callback) {
        this.multiKnex.transactionalExecForKey(accessKey, query, callback);
    }

    transaction(trxCallback, resultCallback) {
        this.multiKnex.transaction(trxCallback, resultCallback);
    }

    transactionally(trxCallback, callback) {
        this.multiKnex.transctionally(trxCallback, resultCallback);
    }
}

module.exports = KnexWrapper;