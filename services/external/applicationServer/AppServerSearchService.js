'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
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
    }

    /**
     * Parses RPC message for the 'open_session' method calls.
     * */
    processSearchResult(operation, message, callback) {
        if (!message || !message.result || !message.result.sessionState) {
            this.logger.warn('Incorrect RPC message come, ignore request. Message: ' + JSON.stringify(message, null, 2));
            callback(null, {
                result: message,
                shouldCompleteOperation: false,
                eventName: EVENTS.onOperationResultReceived
            });
        } else {
            const sessionState = message.result.sessionState;

            const sampleId = operation.getSampleId();
            const userId = operation.getUserId();
            const limit = operation.getLimit();
            const offset = operation.getOffset();

            // If not ready, just send the progress up
            if (sessionState.status !== SESSION_STATUS.READY) {
                callback(null, {
                    status: sessionState.status,
                    progress: sessionState.progress,
                    shouldCompleteOperation: false,
                    eventName: EVENTS.onOperationResultReceived
                });
            } else {
                // Get data from Redis
                const redisInfo = sessionState.redisDb;
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
                        this._storeRedisParamsInOperation(redisParams, operation, callback);
                    },
                    (callback) => {
                        this.services.redis.fetch(redisParams, callback);
                    }
                ], (error) => {
                    // Redis will fire data event by itself, so send null as result to distinguish cases.
                    callback(error, null);
                });
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
