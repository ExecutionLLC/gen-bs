'use strict';

const assert = require('assert');

/**
 * @typedef {Object}RpcCallParams
 * @property {String}method
 * @property {String}id
 * @property {Object|null}params
 * */

class RpcRouter {
    constructor() {
        /**
         * @type {Object}
         * */
        this.handlers = {};
    }

    /**
     * @param {RpcCallParams}callParams
     * @param {function(Object)}sendResultCallback
     * */
    handleCall(callParams, sendResultCallback) {
        assert.ok(callParams);
        assert.ok(sendResultCallback);
        const {id, method, params} = callParams;
        const handleCall = this.handlers[method];

        if (id && method && handleCall) {
            handleCall(id, method, params, (result) => sendResultCallback({id, result}), (error) => {
                if (error) {
                    console.error(error);
                }
            });
        } else {
            // TODO: Generate error.
            console.error(`Incorrect params: \nid: ${id}\nmethod: ${method}\nhandleCall: ${handleCall}`);
        }
    }

    registerHandler({methodName, handleCall}) {
        assert.ok(methodName);
        assert.ok(handleCall);
        this.handlers[methodName] = handleCall;
    }

    /**
     * @param {String}methodName
     * */
    unregisterHandler(methodName) {
        assert.ok(methodName);
        delete this.handlers[methodName];
    }
}

module.exports = RpcRouter;
