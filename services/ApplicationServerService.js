'use strict';

const _ = require('lodash');
var events = require('events');

const ServiceBase = require('./ServiceBase');
const RPCProxy = require('../utils/RPCProxy');

const FIELDS_METADATA = require('../test_data/fields_metadata.json');

const REGISTERED_EVENTS = {
    sourcesList: {
        event: 'sourcesListRecieved',
        error: 'sourcesListError'
    },
    sourceMetadata: {
        event: 'sourceMetadataRecieved',
        error: 'sourceMetadataError'
    },
    openSearchSession: {
        event: 'openSearchSessionRecieved',
        error: 'openSearchSessionError'
    },
    searchInResults: {
        event: 'searchInResultsRecieved',
        error: 'searchInResultsError'
    },
    uploadFile: {
        event: 'uploadFileRecieved',
        error: 'uploadFileError'
    }
};

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this._requestOperations = this._requestOperations.bind(this);
        this._requestOperationState = this._requestOperationState.bind(this);

        this._rpcReply = this._rpcReply.bind(this);

        this.host = this.services.config.applicationServer.host;
        this.port = this.services.config.applicationServer.port;

        this.eventEmitter = new events.EventEmitter();
        this.rpcProxy = new RPCProxy(this.host, this.port, this._requestOperations, null, this._rpcReply);
    }

    registeredEvents() {
        return REGISTERED_EVENTS;
    }

    requestSourcesList(callback) {
        const method = 'v1.get_sources';
        const operationId = this.services.sessionService.addSystemOperation(method);
        this._rpcSend(operationId, method, null, callback);
    }

    requestSourceMetadata(source, callback) {
        const method = 'v1.get_source_metadata';
        const operationId = this.services.sessionService.addSystemOperation(method);
        this._rpcSend(operationId, method, source, callback);
    }

    /**
     * Opens a new search session.
     * @param operationId Id of the search operation which will be used as AS session id.
     * @param params All the params necessary to open search session.
     * */
    requestOpenSearchSession(operationId, params, callback) {
        const method = 'v1.open_session';
        const searchSessionRequest = {
            view: params.view,
            filters: params.filters,
            globalSearchValue: params.globalSearchValue,
            fieldSearchValues: params.fieldSearchValues
        };
        this._rpcSend(operationId, method, searchSessionRequest, callback);
    }

    requestCloseSession(operationId, callback) {
        const method = 'v1.close_session';
        this._rpcSend(operationId, method, null, callback);
    }

    requestSearchInResults(operationId, params, callback) {
        const method = 'v1.set_filters';
        const searchInResultsRequest = {
            globalSearchValue: params.globalSearchValue,
            fieldSearchValues: params.fieldSearchValues
        };
        this._rpcSend(operationId, method, searchInResultsRequest, callback);
    }

    _onData(operation, data) {
        const methodName = operation.method;
        switch (methodName) {
            case 'v1.get_sources':
                this.eventEmitter.emit(REGISTERED_EVENTS.sourcesList.event, data);
                break;
            case 'v1.get_source_metadata':
                this.eventEmitter.emit(REGISTERED_EVENTS.sourceMetadata.event, data);
                break;
            default:
                console.log('Unknown method call: ' + methodName, data);
                break;
        }
    }

    _onError(operation, error) {
        const methodName = operation.method;
        switch (methodName) {
            case 'v1.get_sources':
                this.eventEmitter.emit(REGISTERED_EVENTS.sourcesList.error, error);
                break;
            case 'v1.get_source_metadata':
                this.eventEmitter.emit(REGISTERED_EVENTS.sourceMetadata.error, error);
                break;
            default:
                console.log('Unknown method call: ' + methodName, error);
                break;
        }
    }

    _rpcReply(error, message) {
        // TODO: add log event here
        console.log('RPC REPLY: ', error, message);

        const operationId = message.id;
        const operation = this.services.sessionService.findOperation(operationId);
        if (operation) {
            if (error) {
                this._onError(operation, error)
            } else {
                this._onData(operation, message.result);
            }
            this.services.sessionService.deleteOperation(operationId);
        } else {
            // TODO: add log event
            console.log('Operation not found: ' + operationId, error, message);
        }
    }

    registerEvent(event, callback) {
        this.eventEmitter.on(event, callback);
    }

    unregisterEvent(event, callback) {
        this.eventEmitter.removeListener(event, callback);
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params);
        // TODO: add log event
        console.log('RPC SEND: ', operationId, method, params);
        callback(null, operationId);
    }

    _requestOperationState(operationId, callback) {
        this._rpcSend(operationId, 'v1.get_session_state', {session_id: operationId}, callback);
    }

    _requestOperations() {
        console.log('Requesting operations...');
        this.services.sessions.findAll((error, sessionIds) => {
            _.each(sessionIds, sessionId => {
                this.services.sessions.findOperationIds(sessionId, (error, operationIds) => {
                    _.each(operationIds, operationId => {
                        this._requestOperationState(operationId, (error) => {
                            if (error) {
                                console.error('Error requesting operation state: ' + error);
                            }
                        });
                    });
                });
            });
        });
    }

    getFieldsMetadata(user, callback) {
        callback(null, FIELDS_METADATA);
    }
}

module.exports = ApplicationServerService;