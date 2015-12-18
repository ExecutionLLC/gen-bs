'use strict';

const _ = require('lodash');

const ServiceBase = require('./ServiceBase');

const RPCProxy = require('../utils/RPCProxy');

const FIELDS_METADATA = require('../test_data/fields_metadata.json');

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this.registeredCallbacks = {};

        this._requestOperations = this._requestOperations.bind(this);
        this._requestOperationState = this._requestOperationState.bind(this);
        this.rpcReply = this.rpcReply.bind(this);

        this.host = this.services.config.settings.rpc.host;
        this.port = this.services.config.settings.rpc.port;

        this.rpcProxy = new RPCProxy(this.host, this.port, null, this._requestOperations, this.rpcReply);
    }

    registerCallback(method, callback) {
        this.registeredCallbacks[method] = callback;
    }

    unregisterCallback(method) {
        if (this.registeredCallbacks[method]) {
            delete this.registeredCallbacks[method];
        }
    }

    rpcReply(err, message) {
        const operationId = message.operation_id;
        const operation = this.services.sessionService.findOperation(operationId);

        if (operation) {
            const callback = this.registeredCallbacks[operation['method']];
            if (callback) {
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

        // Remove operation from operations list
        this.services.sessionService.removeOperation(operationId);
    }

    _rpcCall(sessionId, method, params, callback) {
        const operationId = this.services.sessionService.addOperation(sessionId, method);
        this._rpcSend(operationId, method, params, callback);
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params);
        // TODO: add log event
        console.log('RPC SEND: ', operationId, method, params);
        callback(null, operationId);
    }

    _requestOperationState(operationId, callback) {
        this.rpcSend(operationId, 'v1.get_session_state', {session_id: operationId}, callback);
    }

    _requestOperations() {
        var self = this;
        console.log('Requesting operations...');
        const sessions = this.services.sessionService.sessions;
        _.each(sessions, function (session) {
            _.each(session, function (operation, operationId) {
                self._requestOperationState(operationId, function (err, res) {
                    console.log('Requesting operation ' + res);
                });
            });
        });
    }

    getFieldsMetadata(user, callback) {
        callback(null, FIELDS_METADATA);
    }
}

module.exports = ApplicationServerService;