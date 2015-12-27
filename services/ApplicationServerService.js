'use strict';

const _ = require('lodash');
var events = require('events');

const ServiceBase = require('./ServiceBase');
const RPCProxy = require('../utils/RPCProxy');

const FIELDS_METADATA = require('../test_data/fields_metadata.json');

const REGISTERED_EVENTS = {
    sourcesList: {
        data: 'sourcesList.data',
        error: 'sourcesList.error'
    },
    sourceMetadata: {
        data: 'sourceMetadata.data',
        error: 'sourceMetadata.error'
    },
    openSearchSession: {
        data: 'openSearchSession.data',
        error: 'openSearchSession.error'
    },
    searchInResults: {
        data: 'searchInResults.data',
        error: 'searchInResults.error'
    },
    uploadFile: {
        data: 'uploadFile.data',
        error: 'uploadFile.error'
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
        const operationId = this.services.sessions.addSystemOperation(method);
        this._rpcSend(operationId, method, null, callback);
    }

    requestSourceMetadata(source, callback) {
        const method = 'v1.get_source_metadata';
        const operationId = this.services.sessions.addSystemOperation(method);
        this._rpcSend(operationId, method, source, callback);
    }

    /**
     * Opens a new search session.
     * @param sessionId Id of the session in which the operation should be opened.
     * @param params All the params necessary to open search session.
     * @param callback callback
     * */
    requestOpenSearchSession(sessionId, params, callback) {
        const method = 'v1.open_session';
        const searchSessionRequest = {
            view: params.view,
            filters: params.filters,
            globalSearchValue: params.globalSearchValue,
            fieldSearchValues: params.fieldSearchValues
        };

        const operationTypes = this.services.operations.operationTypes();
        this._closePreviousSearchIfAny(sessionId, (error) => {
            if (error) {
                callback(error);
            } else {
                this.services.operations.add(sessionId, operationTypes.SEARCH, method, (error, operation) => {
                    if (error) {
                        callback(error);
                    } else {
                        this._rpcSend(operation.id, method, searchSessionRequest, callback);
                    }
                });
            }
        });
    }

    requestCloseSearchSession(sessionId, operationId, callback) {
        this.services.sessions.remove(sessionId, operationId, (error, operation) => {
            if (error) {
                callback(error);
            } else {
                const method = 'v1.close_session';
                this._rpcSend(operationId, method, null, callback);
            }
        });
    }

    requestSearchInResults(sessionId, operationId, params, callback) {
        this.services.operations.find(sessionId, operationId, (error, operation) => {
           if (error) {
               callback(error);
           } else {
               const method = 'v1.set_filters';
               const searchInResultsRequest = {
                   globalSearchValue: params.globalSearchValue,
                   fieldSearchValues: params.fieldSearchValues
               };
               this._rpcSend(operationId, method, searchInResultsRequest, callback);
           }
        });
    }

    _closePreviousSearchIfAny(sessionId, callback) {
        const operationTypes = this.services.operations.operationTypes();
        this.services.operations.findAllByType(sessionId, operationTypes.SEARCH, (error, operations) => {
            if (error) {
                callback(error);
            } else {
                if (_.isEmpty(operations)) {
                    callback(null);
                } else {
                    // Expect the inly search operation here.
                    const searchOperation = operations[0];
                    this.requestCloseSearchSession(searchOperation.id, (error) => {
                       callback(null);
                    });
                }
            }
        });
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

    _rpcReply(rpcError, rpcMessage) {
        console.log('RPC REPLY: ', rpcError, rpcMessage);
        const operationTypes = this.services.operations.operationTypes();

        const operationId = rpcMessage.id;
        this.services.operations.find(operationId, (error, operation) => {
            if (error) {
                // Log and do nothing as we don't have information about the operation.
                console.error(error);
                console.log('Error finding operation when receiving RPC reply from AS. See the error description above. Do nothing.');
            } else {
                // Forget all operations done except search. Search operations will be reused.
                if (operation.type !== operationTypes.SEARCH) {
                    this.services.operations.remove(sessionId, operation.id, (error) => {
                        if (error) {
                            console.error(error);
                            console.error('Error removing operation, see above');
                        }
                        // We have anything needed to continue, so going on.
                        if (rpcError) {
                            this._onError(operation, rpcError);
                        } else {
                            this._onData(operation, rpcMessage.result);
                        }
                    });
                }
            }
        });
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