'use strict';

const _ = require('lodash');
const async = require('async');

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const SearchOperation = require('../../operations/SearchOperation');
const METHODS = require('./AppServerMethods');
const EVENTS = require('./AppServerEvents');
const RESULT_TYPES = require('./AppServerResultTypes');
const ErrorUtils = require('../../../utils/ErrorUtils');
const EventEmitter = require('../../../utils/EventProxy');
const {ENTITY_TYPES} = require('../../../utils/Enums');
const AppServerViewUtils = require('../../../utils/AppServerViewUtils');
const AppServerFilterUtils = require('../../../utils/AppServerFilterUtils');
const CollectionUtils = require('../../../utils/CollectionUtils');

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

    loadResultsPage(user, session, operationId, limit, offset, callback) {
        const method = METHODS.getSearchData;
        const searchDataRequest = { offset, limit };
        async.waterfall([
            (callback) => {
                this.services.operations.find(session, operationId, callback);
            },
            (operation, callback) => this._rpcSend(session, operation, method, searchDataRequest, callback)
        ], callback);
    }

    /**
     * Parses RPC message for the 'open_session' method calls.
     * @param {ExpressSession}session
     * @param {OperationBase}operation
     * @param {Object}message
     * @param {function(Error, AppServerOperationResult)} callback
     * */
    processSearchResult(session, operation, message, callback) {
        if (this._isAsErrorMessage(message)) {
            this._createErrorOperationResult(
                session,
                operation,
                EVENTS.onOperationResultReceived,
                session.id,
                operation.getId(),
                false, 
                ErrorUtils.createAppServerInternalError(message), 
                callback
            );
        } else {
            const sessionState = message.result.sessionState;

            if (sessionState.status !== SESSION_STATUS.READY) {
                this._processProgressMessage(session, operation, message, callback);
            } else {
                this._processSearchResultMessage(session, operation, message, callback);
            }
        }
    }

    requestOpenSearchSession(session, params, callback) {
        const fieldIdToFieldMetadata = CollectionUtils.createHash(params.fieldsMetadata, fieldMetadata => fieldMetadata.id);
        const {userId, view, sample, filter, limit, offset} = params;
        const method = METHODS.openSearchSession;
        const appServerSampleId = this._getAppServerSampleId(sample);
        const appServerView = AppServerViewUtils.createAppServerView(view, fieldIdToFieldMetadata, sample.genotypeName);
        const appServerFilter = AppServerFilterUtils.createAppServerFilter(filter, fieldIdToFieldMetadata);
        const appServerSortOrder = this._createAppServerViewSortOrder(view, fieldIdToFieldMetadata);

        const searchSessionRequest = {
            sample: appServerSampleId,
            viewStructure: appServerView,
            viewFilter: appServerFilter,
            viewSortOrder: appServerSortOrder,
            offset,
            limit
        };

        async.waterfall([
            (callback) => this._closePreviousSearchIfAny(session, callback),
            (callback) => this.services.operations.addSearchOperation(session, method, callback),
            (operation, callback) => {
                operation.setSampleId(sample.id);
                operation.setUserId(userId);
                operation.setOffset(offset);
                operation.setLimit(limit);
                callback(null, operation);
            },
            (operation, callback) => this.services.samples.makeSampleIsAnalyzedIfNeeded(userId, sample.id, (error) => {
                callback(error, operation);
            }),
            (operation, callback) => this._rpcSend(session, operation, method, searchSessionRequest, callback)
        ], callback);
    }

    requestSearchInResults(session, operationId, params, callback) {
        async.waterfall([
            (callback) => {
                this.services.operations.find(session, operationId, callback);
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
                    excludedFields, params.fieldSearchValues, params.sortValues, params.offset, params.limit);
                this._rpcSend(session, operation, METHODS.searchInResults, setFilterRequest, (error) => callback(error, operation));
            }
        ], callback);
    }

    _processSearchResultMessage(session, operation, message, callback) {
        const sessionState = message.result.sessionState;

        const sampleId = operation.getSampleId();
        const userId = operation.getUserId();

        async.waterfall([
            (callback) => {
                this._fetch(sessionState.data, userId, sampleId, callback);
            }
        ], (error, fieldIdToValueHash) => {
            this._createSearchDataResult(error, session, operation, fieldIdToValueHash, callback);
        });
    }
    //TODO: move data methods to another class

    getSearchKeyFieldName() {
        return 'search_key';
    }

    _fetch(searchData, userId, sampleId, callback) {
        async.waterfall([
            (callback) => {
                const rowData = this._fetchData(searchData);
                this.services.users.find(userId, (error, user) => {
                    callback(error, {
                        user,
                        rowData
                    });
                });
            },
            ({rowData, user}, callback) => {
                this._convertFields(rowData, user, sampleId, callback);
            }
        ], (error, asData) => {
            callback(error, asData);
        });
    }

    _fetchData(data){
        return _.map(data, (fieldsArray) => _.reduce(fieldsArray, (result, {fieldName, fieldValue}) => {
            result[fieldName] = fieldValue;
            return result;
        }, {}));
    }

    _convertFields(asData, user, sampleId, callback) {
        async.waterfall([
            (callback) => async.series({
                sample: (callback) => this.services.samples.find(user, sampleId, callback),
                sampleFields: (callback) => this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, callback),
                sourcesFields: (callback) => this.services.fieldsMetadata.findSourcesMetadata(callback)
            }, callback),
            ({sample, sampleFields, sourcesFields}, callback) => {
                callback(null, {sample, fields: sampleFields.concat(sourcesFields)});
            },
            ({sample, fields}, callback) => {
                // will be matching fields by name, so create fieldName->field hash
                const fieldNameToFieldHash = CollectionUtils.createHash(fields,
                    // Source fields will be prepended by the source name, sample fields - will not.
                    (field) => {
                        const {sourceName, name} = field;
                        // Prefix source fields with the source name.
                        if (sourceName !== 'sample') {
                            return `${sourceName}_${name}`;
                        }
                        // Postfix genotype fields with genotype name.
                        if (name.startsWith(AppServerViewUtils.getGenotypeFieldsPrefix())) {
                            return `${name}_${sample.genotypeName}`;
                        }
                        return name;
                    }
                );
                callback(null, fieldNameToFieldHash);
            },
            (fieldNameToFieldHash, callback) => {
                const missingFieldsSet = new Set();
                const fieldIdToValueArray = _.map(asData, (rowObject) => {
                    const searchKeyFieldName = this.getSearchKeyFieldName();
                    const [fieldNames, missingFieldNames] = _(rowObject)
                        .keys()
                        // exclude search key
                        .filter(fieldName => fieldName !== searchKeyFieldName)
                        // group by existence
                        .partition(fieldName => !!fieldNameToFieldHash[fieldName])
                        .value();
                    missingFieldNames.forEach(missingFieldName => missingFieldsSet.add(missingFieldName));
                    // Map field names to field ids.
                    const mappedRowObject = CollectionUtils.createHash(fieldNames,
                        (fieldName) => fieldNameToFieldHash[fieldName].id,
                        (fieldName) => this._mapFieldValue(rowObject[fieldName])
                    );
                    // add search key value.
                    mappedRowObject[searchKeyFieldName] = rowObject[searchKeyFieldName];
                    return mappedRowObject;
                });
                const missingFields = [...missingFieldsSet];
                missingFields.length && this.logger.error(`The following fields were not found: ${missingFields}`);
                callback(null, fieldIdToValueArray);
            }
        ], callback);
    }

    _mapFieldValue(actualFieldValue) {
        // This is VCF way to mark empty field values.
        return (actualFieldValue !== 'nan') ? actualFieldValue : '.';
    }

    _createSearchDataResult(error, session, operation, fieldIdToValueArray, callback) {
        super._createOperationResult(session, operation, session.id, session.userId, EVENTS.onSearchDataReceived, false, {
            progress: 100,
            status: SESSION_STATUS.READY,
            sampleId: operation.getSampleId(),
            limit: operation.getLimit(),
            offset: operation.getOffset(),
            fieldIdToValueArray
        }, error, callback);
    }

    /**
     * @param {ExpressSession}session
     * @param {OperationBase}operation
     * @param {Object}message
     * @param {function(Error, AppServerOperationResult)}callback
     * */
    _processProgressMessage(session, operation, message, callback) {
        /**
         * @type {{status:string, progress: number}}
         * */
        const sessionState = message.result.sessionState;
        super._createOperationResult(session, operation, session.id, session.userId, EVENTS.onOperationResultReceived, false, {
            status: sessionState.status,
            progress: sessionState.progress
        }, null, callback);
    }

    _createSearchInResultsParams(globalSearchValue, excludedFields, fieldSearchValues, sortParams, offset, limit) {
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
            }),
            offset,
            limit
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
        return _.includes(ENTITY_TYPES.defaultTypes, sample.type) ?
            sample.fileName : sample.originalId;
    }

    _getPrefixedFieldName(fieldMetadata) {
        // We need sources' columns to be prefixed by source name.
        return fieldMetadata.sourceName === 'sample' ?
            fieldMetadata.name : fieldMetadata.sourceName + '_' + fieldMetadata.name;
    }

    _closePreviousSearchIfAny(session, callback) {
        this.services.operations.findAllByClass(session, SearchOperation, (error, operations) => {
            if (error) {
                callback(error);
            } else {
                if (_.isEmpty(operations)) {
                    callback(null);
                } else {
                    // Expect the only search operation here.
                    const searchOperation = operations[0];
                    this.services.operations.remove(session, searchOperation.getId(), (error) => callback(error));
                }
            }
        });
    }
}

module.exports = AppServerSearchService;
