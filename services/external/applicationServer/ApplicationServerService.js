'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('../../ServiceBase');
const RPCProxy = require('../../../utils/RPCProxy');

const AppServerViewUtils = require('../../../utils/AppServerViewUtils');
const AppServerFilterUtils = require('../../../utils/AppServerFilterUtils');
const AppServerUploadUtils = require('../../../utils/AppServerUploadUtils');

const METHODS = require('./ApplicationServerMethods');

/**
 * This service sends requests to AS.
 * Replies to these requests are handled
 * by the separate ApplicationServerReplyService.
 * */
class ApplicationServerService extends ServiceBase {
    constructor(services) {
        super(services);

        this.requestSourcesList = this.requestSourcesList.bind(this);
        this.requestSourceMetadata = this.requestSourceMetadata.bind(this);
        this.requestCloseSession = this.requestCloseSession.bind(this);
        this.requestOpenSearchSession = this.requestOpenSearchSession.bind(this);
        this.requestSearchInResults = this.requestSearchInResults.bind(this);
        this._requestOperations = this._requestOperations.bind(this);
        this.requestOperationState = this.requestOperationState.bind(this);

        this._rpcReply = this._rpcReply.bind(this);

        this.host = this.services.config.applicationServer.host;
        this.port = this.services.config.applicationServer.port;

        this.rpcProxy = new RPCProxy(this.host, this.port, this.logger, this._requestOperations, null, this._rpcReply);
    }

    registeredEvents() {
        return METHODS;
    }

    isRPCConnected() {
        return this.rpcProxy.isConnected();
    }

    requestSourcesList(callback) {
        const method = METHODS.getSourcesList;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, null, callback)
        ], callback);
    }

    requestSourceMetadata(sourceNames, callback) {
        const method = METHODS.getSourceMetadata;
        async.waterfall([
            (callback) => this.services.operations.addSystemOperation(method, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, _.map(sourceNames, (sourceName) => {
                return sourceName + '.h5'
            }), callback)
        ], callback);
    }

    requestKeepOperationAlive(sessionId, searchOperationId, callback) {
        const method = METHODS.keepAlive;
        const operationTypes = this.services.operations.operationTypes();
        async.waterfall([
            (callback) => this.services.operations.ensureOperationOfType(sessionId, searchOperationId, operationTypes.SEARCH, callback),
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (sessionId, callback) => this.services.operations.addKeepAliveOperation(sessionId, searchOperationId, callback),
            (operation, callback) => this._rpcSend(operation.getId(), method, {sessionId: searchOperationId}, callback)
        ], callback);
    }

    /**
     * Opens a new search session.
     * @param sessionId Id of the session in which the operation should be opened.
     * @param params All the params necessary to open search session.
     * @param callback (error, operationId)
     * */
    requestOpenSearchSession(sessionId, params, callback) {
        const fieldIdToFieldMetadata = _.indexBy(params.fieldsMetadata, fieldMetadata => fieldMetadata.id);

        const method = METHODS.openSearchSession;
        const appServerSampleId = this._getAppServerSampleId(params.sample);
        const appServerView = AppServerViewUtils.createAppServerView(params.view, fieldIdToFieldMetadata);
        const appServerFilter = AppServerFilterUtils.createAppServerFilter(params.filter, fieldIdToFieldMetadata);
        const appServerSortOrder = this._createAppServerViewSortOrder(params.view, fieldIdToFieldMetadata);

        const searchSessionRequest = {
            sample: appServerSampleId,
            viewStructure: appServerView,
            viewFilter: appServerFilter,
            viewSortOrder: appServerSortOrder
        };

        async.waterfall([
            (callback) => this._closePreviousSearchIfAny(sessionId, (error) => callback(error)),
            (callback) => {
                this.services.operations.addSearchOperation(sessionId, method, callback);
            },
            (operation, callback) => {
                operation.setSampleId(params.sample.id);
                operation.setUserId(params.userId);
                operation.setOffset(params.offset);
                operation.setLimit(params.limit);
                callback(null, operation);
            },
            (operation, callback) => this.services.samples.makeSampleIsAnalyzedIfNeeded(params.userId, params.sample.id, (error) => {
                callback(error, operation);
            }),
            (operation, callback) => this._rpcSend(operation.getId(), method, searchSessionRequest, callback)
        ], callback);
    }

    /**
     * Sends specified file sample to application server.
     *
     * @param sessionId Id of the session to which the file belongs.
     * @param sampleId Id of the sample.
     * @param user Session owner.
     * @param sampleLocalPath Full local path to the sample file.
     * @param sampleFileName Original name of the sample file.
     * @param callback (error, operationId)
     * */
    uploadSample(sessionId, sampleId, user, sampleLocalPath, sampleFileName, callback) {
        async.waterfall([
            (callback) => this.services.operations.addUploadOperation(METHODS.uploadSample, user.id, callback),
            (operation, callback) => {
                operation.setSampleId(sampleId);
                operation.setSampleFileName(sampleFileName);
                callback(null, operation);
            },
            (operation, callback) => {
                const config = this.services.config;
                const url = AppServerUploadUtils.createUploadUrl(
                    config.applicationServer.host,
                    config.applicationServer.port,
                    sampleId,
                    operation.getId()
                );
                AppServerUploadUtils.uploadFile(url, sampleLocalPath, (error) => callback(error, operation.getId()));
            }
        ], callback);
    }

    /**
     * Sends request to process previously uploaded sample. Results will be sent by AS web socket.
     *
     * @param sessionId Id of the session the request is related to.
     * @param operationId Id of the upload operation.
     * @param callback (error, operationId)
     * */
    requestSampleProcessing(sessionId, operationId, callback) {
        async.waterfall([
            // Upload operations lay in the system session.
            (callback) => this.services.sessions.findSystemSessionId(callback),
            (systemSessionId, callback) => this.services.operations.find(systemSessionId, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                this._rpcSend(operationId, method, null, callback);
            }
        ], callback);
    }

    /**
     * Requests AS to close the specified operation.
     *
     * @param sessionId Id of the session the operation is related to.
     * @param operationId Id of the operation to close.
     * @param callback (error, operationId)
     * */
    requestCloseSession(sessionId, operationId, callback) {
        async.waterfall([
            (callback) => this.services.operations.find(sessionId, operationId, callback),
            (operation, callback) => {
                const method = METHODS.closeSession;
                this._rpcSend(operation.getId(), method, null, callback);
            }
        ], callback);
    }

    requestSearchInResults(sessionId, operationId, params, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                // save necessary data to the operation to be able to fetch required amount of data.
                operation.setLimit(params.limit);
                operation.setOffset(params.offset);
                callback(null, operation);
            },
            (operation, callback) => {
                this.services.fieldsMetadata.findMany(
                    params.globalSearchValue.excludedFields, (error, fields) => callback(error, fields, operation)
                );
            },
            (excludedFields, operation, callback)=> {
                const setFilterRequest = this._createSearchInResultsParams(params.globalSearchValue.filter,
                    excludedFields, params.fieldSearchValues, params.sortValues);
                this._rpcSend(operationId, METHODS.searchInResults, setFilterRequest, (error) => callback(error, operation));
            }
        ], callback);
    }

    requestOperationState(operationId, callback) {
        this._rpcSend(operationId, METHODS.checkSession, null, callback);
    }

    _requestOperations() {
        this.logger.info('Requesting operations...');
        this.services.sessions.findAll((error, sessionIds) => {
            _.each(sessionIds, sessionId => {
                this.services.operations.findAll(sessionId, (error, operationIds) => {
                    _.each(operationIds, operationId => {
                        this.requestOperationState(operationId, (error) => {
                            if (error) {
                                this.logger.error('Error requesting operation state: ' + error);
                            }
                        });
                    });
                });
            });
        });
    }

    _createSearchInResultsParams(globalSearchValue, excludedFields, fieldSearchValues, sortParams) {
        const sortedParams = _.sortBy(sortParams, sortParam => sortParam.sortOrder);
        return {
            globalFilter: {
                filter: globalSearchValue,
                excludedFields: _.map(
                    excludedFields, excludedField => {
                        return {
                            sourceName: excludedField.sourceName,
                            columnName: excludedField.name
                        }
                    }
                )
            },
            columnFilters: _.map(fieldSearchValues, fieldSearchValue => {
                return {
                    columnName: this._getPrefixedFieldName(fieldSearchValue.fieldMetadata),
                    columnFilter: fieldSearchValue.value
                };
            }),
            sortOrder: _.map(sortedParams, sortedParam => {
                return {
                    columnName: this._getPrefixedFieldName(sortedParam.fieldMetadata),
                    isAscendingOrder: (sortedParam.sortDirection === 'asc')
                };
            })
        };
    }

    _createAppServerViewSortOrder(view, fieldIdToMetadata) {
        // Keep only items whose fields exist in the current sample.
        const viewListItems = _.filter(view.viewListItems, listItem => fieldIdToMetadata[listItem.fieldId]);

        // Get all items which specify sort order.
        const sortItems = _.filter(viewListItems, listItem => !!listItem.sortOrder);

        // Sort items by specified order.
        const sortedSortItems = _.sortBy(sortItems, listItem => listItem.sortOrder);

        //noinspection UnnecessaryLocalVariableJS leaved for debug.
        const appServerSortOrder = _.map(sortedSortItems, listItem => {
            const field = fieldIdToMetadata[listItem.fieldId];
            const columnName = this._getPrefixedFieldName(field);
            const isAscendingOrder = listItem.sortDirection === 'asc';
            return {
                columnName,
                isAscendingOrder
            };
        });

        return appServerSortOrder;
    }

    /**
     * For default samples file name should be used.
     * For user samples sample id is file name.
     * */
    _getAppServerSampleId(sample) {
        return sample.type === 'standard' || sample.type === 'advanced' ?
            sample.fileName : sample.originalId;
    }

    _getPrefixedFieldName(fieldMetadata) {
        // We need sources' columns to be prefixed by source name.
        return fieldMetadata.sourceName === 'sample' ?
            fieldMetadata.name : fieldMetadata.sourceName + '_' + fieldMetadata.name;
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
                    this.services.operations.remove(sessionId, searchOperation.getId(), callback);
                }
            }
        });
    }

    _rpcReply(rpcError, rpcMessage) {
        this.logger.info('RPC REPLY, error: ' + JSON.stringify(rpcError, null, 2) + ', message: ' + JSON.stringify(rpcMessage, null, 2));
        this.services.applicationServerReply.onRpcReplyReceived(rpcError, rpcMessage, (error) => {
            if (error) {
                this.logger.error('Error processing RPC reply: ' + error);
            }
        });
    }

    _rpcSend(operationId, method, params, callback) {
        this.rpcProxy.send(operationId, method, params, (error) => {
            if (error) {
                callback(error);
            } else {
                this.logger.info('RPC SEND: ' + operationId + ' ' + method);
                this.logger.info('Params: ' + JSON.stringify(params, null, 2));
                callback(null, operationId);
            }
        });
    }
}

module.exports = ApplicationServerService;