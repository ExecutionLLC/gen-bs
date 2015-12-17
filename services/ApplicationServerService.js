'use strict';

const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

const RPCProxy = require('../utils/RPCProxy');

const FIELDS_METADATA = require('../test_data/fields_metadata.json');

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this.registeredCallbacks = {};

        this.host = this.services.config.settings.rpc.host;
        this.port = this.services.config.settings.rpc.port;

        this.rpcProxy = new RPCProxy(this.host, this.port, this.rpcReply);


        //// test
        //this.rpcCall(1, 'echo', {text: 'text'}, (err, res) => {
        //    console.log('echo() called: ', err, res);
        //});


        //setInterval(this.requestOperations, 60000);
    }

    registerCallback(method, callback) {
        this.registeredCallbacks[method] = callback;
    }

    unregisterCallback(method) {
        if (this.registeredCallbacks[method]) {
            delete this.registeredCallbacks[method];
        }
    }

    rpcCall(sessionId, method, params, callback) {
        const operationId = this.services.sessionService.addOperation(sessionId, method);
        this.rpcSend(operationId, method, params, callback);
    }

    rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params);
        // TODO: add log event
        console.log('RPC SEND: ', operationId, method, params);
        callback(null, operationId);
    }

    rpcReply(err, message) {
        const operationId = message.operation_id;


        //console.log(this.services);


        const operation = this.services.sessionService.findOperation(operationId);
        if (operation && operation !== undefined) {
            const callback = this.registeredCallbacks[operation['method']];
            if (callback && callback !== undefined) {
                // TODO: add log event
                console.log('RPC REPLY: ', err, message);
                callback(err, message);
            } else {
                // TODO: add log event
                console.log('Unregistered callback: ' + operation['method']);
            }
        } else {
            // TODO: add log event
            console.log('Undefined operation: ' + operationId);
        }

        // remove operation from operations list
        this.services.sessionService.removeOperation(operationId);
    }

    requestOperationState(operationId, callback) {
        this.rpcSend(operationId, 'v1.get_session_state', {session_id: operationId}, callback);
    }

    // TODO:
    requestOperations() {
        var self = this;
        const sessions = this.services.sessionServices.sessions;
        _.each(sessions, function (session) {
            _.each(session, function (operation, operationId) {
                self.requestOperationState(operationId, function (err, res) {
                    console.log('Check operation: ' + res);
                })
            });
        });
    }

    getFieldsMetadata(user, callback) {
        callback(null, FIELDS_METADATA);
    }
}

module.exports = ApplicationServerService;