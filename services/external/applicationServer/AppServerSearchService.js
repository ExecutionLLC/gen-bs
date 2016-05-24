'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const RESULT_TYPES = require('./AppServerResultTypes');
const ErrorUtils = require('../../../utils/ErrorUtils');
const EventEmitter = require('../../../utils/EventProxy');
const AppServerViewUtils = require('../../../utils/AppServerViewUtils');
const AppServerFilterUtils = require('../../../utils/AppServerFilterUtils');

const SESSION_STATUS = {
    LOADING: 'loading',
    FILTERING: 'filtering',
    READY: 'ready'
};

class AppServerSearchService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);
        
        this.eventEmitter = new EventEmitter(EVENTS);
    }

    loadResultsPage(user, sessionId, operationId, limit, offset, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                const redisData = operation.getRedisParams();
                const userId = user.id;
                const redisParams = {
                    sessionId,
                    operationId,
                    host: redisData.host,
                    port: redisData.port,
                    sampleId: redisData.sampleId,
                    userId,
                    databaseNumber: redisData.databaseNumber,
                    dataIndex: redisData.dataIndex,
                    limit,
                    offset
                };
                this.services.redis.fetch(redisParams, (error, hash) => callback(error, operation, hash));
            },
            (operation, fieldIdToValueHash, callback) => {
                this._createSearchDataResult(null, operation, fieldIdToValueHash, callback);
            },
            (operationResult, callback) => {
                this.services.applicationServerReply.processLoadNextPageResult(operationResult, callback);
            }
        ], callback);
    }

    /**
     * Parses RPC message for the 'open_session' method calls.
     * @param {OperationBase}operation
     * @param {Object}message
     * @param {function(Error, AppServerOperationResult)} callback
     * */
    processSearchResult(operation, message, callback) {
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                operation, 
                EVENTS.onOperationResultReceived, 
                false, 
                ErrorUtils.createAppServerInternalError(message), 
                callback
            );
        } else {
            const sessionState = message.result.sessionState;

            if (sessionState.status !== SESSION_STATUS.READY) {
                this._processProgressMessage(operation, message, callback);
            } else {
                this._processSearchResultMessage(operation, message, callback);
            }
        }
    }

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

    _processSearchResultMessage(operation, message, callback) {
        const sessionState = message.result.sessionState;

        const sampleId = operation.getSampleId();
        const userId = operation.getUserId();
        const limit = operation.getLimit();
        const offset = operation.getOffset();

        // Get data from Redis
        const redisInfo = sessionState.redisDb;
        // TODO: Seems session, operation, user id and sample id shall be removed from below.
        const redisParams = {
            host: redisInfo.host,
            port: redisInfo.port,
            sampleId,
            userId,
            operationId: operation.getId(),
            sessionId: operation.getSessionId(),
            databaseNumber: redisInfo.number,
            dataIndex: redisInfo.resultIndex,
            offset,
            limit
        };
        async.waterfall([
            (callback) => {
                // Store params to be able to retrieve next page by user requests.
                this._storeRedisParamsInOperation(redisParams, operation, callback);
            },
            (callback) => {
                this.services.redis.fetch(redisParams, callback);
            }
        ], (error, fieldIdToValueHash) => {
            this._createSearchDataResult(error, operation, fieldIdToValueHash, callback);
        });
    }

    _createSearchDataResult(error, operation, fieldIdToValueHash, callback) {
        /**
         * @type AppServerOperationResult
         * */
        const result = {
            operation,
            shouldCompleteOperation: false,
            error,
            resultType: (error)? RESULT_TYPES.ERROR : RESULT_TYPES.SUCCESS,
            eventName: EVENTS.onSearchDataReceived,
            result: {
                progress: 100,
                status: SESSION_STATUS.READY,
                sampleId: operation.getId(),
                limit: operation.getLimit(),
                offset: operation.getOffset(),
                fieldIdToValueHash
            }
        };
        callback(null, result);
    }

    /**
     * @param {OperationBase}operation
     * @param {Object}message
     * @param {function(Error, AppServerOperationResult)}callback
     * */
    _processProgressMessage(operation, message, callback) {
        /**
         * @type {{status:string, progress: number}}
         * */
        const sessionState = message.result.sessionState;

        /**
         * @type AppServerOperationResult
         * */
        const result = {
            operation,
            eventName: EVENTS.onOperationResultReceived,
            shouldCompleteOperation: false,
            resultType: RESULT_TYPES.SUCCESS,
            result: {
                status: sessionState.status,
                progress: sessionState.progress
            }
        };
        callback(null, result);
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
                    isAscendingOrder: sortedParam.sortDirection === 'asc'
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

    _storeRedisParamsInOperation(redisParams, operation, callback) {
        // Store Redis information in the operation.
        // This is done to be able to fetch another page later.
        const params = {
            host: redisParams.host,
            port: redisParams.port,
            databaseNumber: redisParams.databaseNumber,
            dataIndex: redisParams.dataIndex,
            sampleId: redisParams.sampleId
        };

        operation.setRedisParams(params);
        callback(null);
    }
}

module.exports = AppServerSearchService;
