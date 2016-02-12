'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');
const RPCProxy = require('../utils/RPCProxy');

const AppServerViewUtils = require('../utils/AppServerViewUtils');
const AppServerFilterUtils = require('../utils/AppServerFilterUtils');
const AppServerUploadUtils = require('../utils/AppServerUploadUtils');

const METHODS = {
    getSourcesList: 'v1.get_sources',
    getSourceMetadata: 'v1.get_source_metadata',
    openSearchSession: 'v1.open_session',
    closeSearchSession: 'v1.close_session',
    searchInResults: 'v1.search_in_results',
    uploadSample: 'v1.upload_file',
    processSample: 'v1.convert_file'
};

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
        this.requestCloseSearchSession = this.requestCloseSearchSession.bind(this);
        this.requestOpenSearchSession = this.requestOpenSearchSession.bind(this);
        this.requestSearchInResults = this.requestSearchInResults.bind(this);
        this._requestOperations = this._requestOperations.bind(this);
        this._requestOperationState = this._requestOperationState.bind(this);

        this._rpcReply = this._rpcReply.bind(this);

        this.host = this.services.config.applicationServer.host;
        this.port = this.services.config.applicationServer.port;

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

        const operationTypes = this.services.operations.operationTypes();
        this._closePreviousSearchIfAny(sessionId, (error) => {
            if (error) {
                callback(error);
            } else {
                const operationData = {
                    sampleId: params.sample.id,
                    userId: params.userId,
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

    /**
     * Sends specified file sample to application server.
     *
     * @param sessionId Id of the session to which the file belongs.
     * @param user Session owner
     * @param sampleLocalPath Full local path to the sample file
     * @param callback (error, operationId)
     * */
    uploadSample(sessionId, user, sampleLocalPath, sampleFileName, callback) {
        const operationTypes = this.services.operations.operationTypes();
        const sampleId = Uuid.v4();
        const operationData = {
            sampleId,
            sampleFileName
        };
        async.waterfall([
            (callback) => this.services.operations.add(sessionId, operationTypes.UPLOAD, METHODS.uploadSample, operationData, callback),
            (operation, callback) => {
                const config = this.services.config;
                const url = AppServerUploadUtils.createUploadUrl(
                    config.applicationServer.host,
                    config.applicationServer.port,
                    sampleId,
                    operation.id
                );
                AppServerUploadUtils.uploadFile(url, sampleLocalPath, (error) => callback(error, operation.id));
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
            (callback) => this.services.operations.find(sessionId, operationId, callback),
            (operation, callback) => {
                const method = METHODS.processSample;
                this._rpcSend(operationId, method, null, callback);
            }
        ], callback);
    }

    requestCloseSearchSession(sessionId, operationId, callback) {
        this.services.operations.find(sessionId, operationId, (error, operation) => {
            if (error) {
                callback(error);
            } else {
                const method = METHODS.closeSearchSession;
                this._rpcSend(operation.id, method, null, callback);
            }
        });
    }

    requestSearchInResults(sessionId, operationId, params, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                // save necessary data to the operation to be able to fetch required amount of data.
                const operationData = _.cloneDeep(operation.data);
                operationData.limit = params.limit;
                operationData.offset = params.offset;
                this.services.operations.setData(sessionId, operationId, operationData, (error) => {
                    callback(error, operation);
                });
            },
            (operation, callback) => {
                const setFilterRequest = this._createSearchInResultsParams(params.globalSearchValue,
                    params.fieldSearchValues, params.sortValues);
                this._rpcSend(operationId, METHODS.searchInResults, setFilterRequest, (error) => callback(error, operation));
            }
        ], callback);
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

    _createSearchInResultsParams(globalSearchValue, fieldSearchValues, sortParams) {
        const sortedParams = _.sortBy(sortParams, sortParam => sortParam.sortOrder);
        return {
            globalFilter: globalSearchValue,
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
        const viewListItems = view.viewListItems;

        // Get all items which specify sort order.
        const sortItems = _.filter(viewListItems, listItem => !!listItem.sortOrder);

        // Sort items by specified order.
        const sortedSortItems = _.sortBy(sortItems, listItem => listItem.sortOrder);

        //noinspection UnnecessaryLocalVariableJS leaved for debug.
        const appServerSortOrder = _.map(sortedSortItems, listItem => {
            const field = fieldIdToMetadata[listItem.fieldId];
            return {
                columnName: field.name,
                isAscendingOrder: (listItem.sortDirection && listItem.sortDirection === 'asc')? true : false
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
                sample.fileName : sample.id;
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
                    this.services.operations.remove(sessionId, searchOperation.id, callback);
                }
            }
        });
    }

    _rpcReply(rpcError, rpcMessage) {
        console.log('RPC REPLY, error: ', JSON.stringify(rpcError, null, 2), ', message: ', JSON.stringify(rpcMessage, null, 2));
        this.services.applicationServerReply.onRpcReplyReceived(rpcError, rpcMessage, (error) => {
            if (error) {
                console.error('Error processing RPC reply', error);
            }
        });
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