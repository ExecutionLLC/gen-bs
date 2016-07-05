'use strict';

const assert = require('assert');

const PRIVATE_QUEUE_MESSAGE_TYPES = ['v1.search_in_results'];

/**
 * @typedef {Object}RpcCallParams
 * @property {string}method
 * @property {(string|null)}replyTo
 * @property {string}id
 * @property {Object|null}params
 * */

class RpcRouter {
    constructor() {
        this.handlers = Object.create(null);
    }

    /**
     * @param {RpcCallParams}callParams
     * @param {boolean}isFromPrivateQueue
     * @param {function(Object)}sendResultCallback
     * */
    handleCall(callParams, isFromPrivateQueue, sendResultCallback) {
        assert.ok(callParams);
        assert.ok(sendResultCallback);
        const {id, method, params} = callParams;
        const handleCall = this.handlers[method];
        if (isFromPrivateQueue && !_.includes(PRIVATE_QUEUE_MESSAGE_TYPES, method)) {
            throw new Error(`Unexpected message with method ${method}`);
        }
        if (id && method && handleCall) {
            handleCall(id, method, params, (result) => sendResultCallback({id, result}), (error) => {
                if (error) {
                    console.error(error);
                }
            });
        } else {
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
