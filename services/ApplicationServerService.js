'use strict';

const _ = require('lodash');
const async = require('async');
const EventEmitter = require('events').EventEmitter;

const ServiceBase = require('./ServiceBase');
const RPCProxy = require('../utils/RPCProxy');

const METHODS = {
    getSourcesList: 'v1.get_sources',
    getSourceMetadata: 'v1.get_source_metadata',
    openSearchSession: 'v1.open_session',
    closeSearchSession: 'v1.close_session',
    setFilters: 'v1.set_filters'
};

class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this.requestSourcesList = this.requestSourcesList.bind(this);
        this.requestSourceMetadata = this.requestSourceMetadata.bind(this);
        this.requestCloseSearchSession = this.requestCloseSearchSession.bind(this);
        this.requestOpenSearchSession = this.requestOpenSearchSession.bind(this);
        this.requestSearchInResults = this.requestSearchInResults.bind(this);
        this._requestOperations = this._requestOperations.bind(this);
        this._requestOperationState = this._requestOperationState.bind(this);

        this._rpcReply = this._rpcReply.bind(this);

        this.host = this.services.config.applicationServer.host;
        this.port = this.services.config.applicationServer.port;

        this.eventEmitter = new EventEmitter();
        this.rpcProxy = new RPCProxy(this.host, this.port, this._requestOperations, null, this._rpcReply);
    }

    registeredEvents() {
        return METHODS;
    }

    requestSourcesList(sessionId, callback) {
        const operationTypes = this.services.operations.operationTypes();
        const method = METHODS.getSourcesList;
        this.services.operations.add(sessionId, operationTypes.SYSTEM, method, (error, operation) => {
            this._rpcSend(operation.id, method, null, callback);
        });
    }

    requestSourceMetadata(sessionId, sourceName, callback) {
        const method = METHODS.getSourceMetadata;
        const operationTypes = this.services.operations.operationTypes();
        this.services.operations.add(sessionId, operationTypes.SYSTEM, method, (error, operation) => {
            this._rpcSend(operation.id, method, sourceName, callback);
        });
    }

    /**
     * Opens a new search session.
     * @param sessionId Id of the session in which the operation should be opened.
     * @param params All the params necessary to open search session.
     * @param callback callback
     * */
    requestOpenSearchSession(sessionId, params, callback) {
        const method = METHODS.openSearchSession;
        const appServerSampleId = this._getAppServerSampleId(params.sample);
        const appServerView = this._createAppServerView(params.view, params.fieldsMetadata);

        const searchSessionRequest = {
            sample: appServerSampleId,
            view_structure: appServerView,
            view_filter: params.filters || {}
        };

        const operationTypes = this.services.operations.operationTypes();
        this._closePreviousSearchIfAny(sessionId, (error) => {
            if (error) {
                callback(error);
            } else {
                const operationData = {
                    offset: params.offset,
                    limit: params.limit
                };
                this.services.operations.add(sessionId, operationTypes.SEARCH, method, operationData, (error, operation) => {
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
                const method = METHODS.closeSearchSession;
                this._rpcSend(operationId, method, null, callback);
            }
        });
    }

    requestSearchInResults(sessionId, operationId, params, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                const method = METHODS.setFilters;
                const searchInResultsRequest = this._createSetFilterParams(params.globalSearchValue, params.fieldSearchValues);
                this._rpcSend(operationId, method, searchInResultsRequest, callback);
            },
            (operationId, callback) => {
                // Store information about the desired limits after the operation call is successful.
                this.services.operations.setData(sessionId, operationId, {
                    offset: params.offset,
                    limit: params.limit
                }, callback);
            }
        ], callback);
    }

    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }

    off(event, callback) {
        this.eventEmitter.removeListener(event, callback);
    }

    _requestOperationState(operationId, callback) {
        this._rpcSend(operationId, 'v1.get_session_state', {session_id: operationId}, callback);
    }

    _requestOperations() {
        console.log('Requesting operations...');
        this.services.sessions.findAll((error, sessionIds) => {
            _.each(sessionIds, sessionId => {
                this.services.operations.findAll(sessionId, (error, operationIds) => {
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

    _createSetFilterParams(globalSearchValue, fieldSearchValues) {
        return {
            global_search: globalSearchValue,
            filters: _.map(fieldSearchValues, fieldSearchValue => {
                return {
                    column_name: fieldSearchValue.fieldMetadata.name,
                    column_filter: fieldSearchValue.value
                };
            })
        };
    }

    _createAppServerView(view, fieldMetadata) {
        const idToFieldMetadata = _.indexBy(fieldMetadata, 'id');
        return {
            sample_columns: _.map(view.viewListItems, (viewListItem) => {
                const field = idToFieldMetadata[viewListItem.fieldId];
                return {
                    name: field.name,
                    filter: [] // TODO: List of resolved keyword values.
                };
            }),
            sources: []
        };
    }

    /**
     * For default samples file name should be used.
     * For user samples sample id is file name.
     * */
    _getAppServerSampleId(sample) {
        return sample.sampleType === 'standard'
        || sample.sampleType === 'advanced' ?
            sample.fileName : sample.id;
    }

    _completeOperationIfNeeded(operationId, operationResult, callback) {
        // TODO: Here we should analyze the response and operation method
        // TODO: and decide should we remove the operation or not.
        // Currently just complete all non-search operations.
        const operations = this.services.operations;
        operations.findInAllSessions(operationId, (error, operation) => {
            if (error) {
                callback(error);
            } else {
                if (operation.type !== operations.operationTypes().SEARCH) {
                    operations.remove(operation.sessionId, operation.id, callback);
                } else {
                    callback(null, operation);
                }
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
                    // Expect the only search operation here.
                    const searchOperation = operations[0];
                    this.requestCloseSearchSession(searchOperation.id, callback);
                }
            }
        });
    }

    _rpcReply(rpcError, rpcMessage) {
        console.log('RPC REPLY', JSON.stringify(rpcError, null, 2), JSON.stringify(rpcMessage, null, 2));
        if (rpcError && !rpcMessage) {
            console.error('RPC request error! %s', rpcError);
            console.log('The RPC event will be ignored, as there is no message received, only error.');
        } else {
            const operationId = rpcMessage.id;
            const operationResult = {
                operationId: operationId,
                result: rpcMessage.result,
                error: rpcError
            };
            this._completeOperationIfNeeded(operationId, operationResult, (error, operation) => {
                if (error) {
                    console.error('Error when trying to complete operation: %s. Do nothing.', error);
                } else {
                    const methodName = operation.method;
                    operationResult.sessionId = operation.sessionId;
                    const haveEventHandlers = this.eventEmitter.emit(methodName, operationResult);
                    if (!haveEventHandlers) {
                        console.error('No handler is registered for event ' + methodName);
                    }
                }
            });
        }
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params, (error) => {
            if (error) {
                callback(error);
            } else {
                console.log('RPC SEND: ', operationId, method);
                console.log('Params:', JSON.stringify(params, null, 2));
                callback(null, operationId);
            }
        });
    }
}

module.exports = ApplicationServerService;