'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

var events = require('events');

const ServiceBase = require('./ServiceBase');
const RPCProxy = require('../utils/RPCProxy');

const FIELDS_METADATA = require('../test_data/fields_metadata.json');

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this.registeredCallbacks = {};
        this._registerCallbacks();


        this._requestOperations = this._requestOperations.bind(this);
        this._requestOperationState = this._requestOperationState.bind(this);

        this._rpcCall = this._rpcCall.bind(this);
        this._rpcReply = this._rpcReply.bind(this);

        this.test = this.test.bind(this);

        this.host = this.services.config.applicationServer.host;
        this.port = this.services.config.applicationServer.port;

        this.eventEmitter = new events.EventEmitter();



        this.rpcProxy = new RPCProxy(this.host, this.port, this._requestOperations, null, this.rpcReply);
    }

    static registeredEvents = {
        sourcesListRecieved: 'sourcesListRecieved',
        sourcesListError: 'sourcesListError'
    }

    static registeredMethods = {

    }

    _registerCallbacks() {
        var self = this;
        this._registerCallback('v1.get_sources', function(err, res) {
            console.log(err, res);
            console.log(self.services.sessionService.sessions);
        });
    }

    _onData(operationId, message) {
        const operation = this.services.sessionService.findOperation(operationId);
        if (operation) {
            const methodName = operation.method;
            // TODO: проверка сущестования метожда
            this.eventEmitter.emit('', message);
        } else {
            // TODO: add log event
            console.log('Undefined operation: ' + operationId);
        }

        ///this.eventEmitter.emit('xfvlxdfksjljl', params)
    }

    _onError(operationId, error) {

    }

    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }

    off(event, callback) {
        this.eventEmitter.removeListener(event, callback);
    }

    _registerCallback(method, callback) {
        this.registeredCallbacks[method] = callback;
    }

    _unregisterCallback(method) {
        if (this.registeredCallbacks[method]) {
            delete this.registeredCallbacks[method];
        }
    }

    _rpcReply(error, message) {
        const operationId = message.id;
        if (error) {
            this.onError(message.id, error);
        } else {
            this.onData(operationId, message);
        }


        //const operation = this.services.sessionService.findOperation(operationId);
        //if (operation) {
        //
        //} else {
        //
        //}

        //const operation = this.services.sessionService.findOperation(operationId);
        //
        //if (operation) {
        //    const callback = this.registeredCallbacks[operation['method']];
        //    if (callback) {
        //        // TODO: add log event
        //        console.log('RPC REPLY: ', err, message);
        //        // Remove operation from operations list
        //        this.services.sessionService.removeOperation(operationId);
        //
        //
        //        // Callback call
        //        //callback(err, message);
        //    } else {
        //        // TODO: add log event
        //        console.log('Unregistered callback: ' + operation['method']);
        //    }
        //} else {
        //    // TODO: add log event
        //    console.log('Undefined operation: ' + operationId);
        //}
        //
        ////this.onDataReceived(error, message)
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

    test(callback) {
        //this._rpcCall(uuid.v4(), 'v1.get_sources', null, callback);
        this._rpcCall(uuid.v4(), 'v1.get_sources', {reference: 'ASDF'}, callback);
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