'use strict';

const MultiKnex = require('./MultiKnex');

const accessKey = 'genomixdb';

class KnexWrapper {
    constructor(knexConfig, logger) {
        this.multiKnex = new MultiKnex({shards: {genomix: knexConfig}}, logger);
    }

    asCallback(query, callback) {
        this.multiKnex.execForKey(accessKey, query, callback);
    }

    transactionalExec(query, callback) {
        this.multiKnex.transactionalExecForKey(accessKey, query, callback);
    }

    transaction(trxCallback, resultCallback) {
        this.multiKnex.transaction(trxCallback, resultCallback);
    }

    transactionally(trxCallback, resultCallback) {
        this.multiKnex.transactionally(trxCallback, resultCallback);
    }
}

module.exports = KnexWrapper;