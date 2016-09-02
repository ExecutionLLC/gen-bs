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
const AppServerUtils = require('../../../utils/AppServerUtils');
const AppServerModelUtils = require('../../../utils/AppServerModelUtils');
const AppSearchInResultUtils = require('../../../utils/AppSearchInResultUtils');

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
        const searchDataRequest = {offset, limit};
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
        const {userId, view, samples, filter, model, limit, offset} = params;
        const sample = samples[0];
        const method = METHODS.openSearchSession;
        const sampleIds = _.map(samples, sample => sample.id);
        const viewId = view.id;
        const appServerSampleIds = _.map(samples, sample => this._getAppServerSampleId(sample));
        const appServerView = AppServerViewUtils.createAppServerView(view, fieldIdToFieldMetadata, samples);
        const appServerFilter = AppServerFilterUtils.createAppServerFilter(filter, fieldIdToFieldMetadata, sample);
        const appServerSortOrder = this._createAppServerViewSortOrder(view, fieldIdToFieldMetadata, sample);
        const appServerModel = AppServerModelUtils.createAppServerModel(model, fieldIdToFieldMetadata, samples);

        const searchSessionRequest = {
            samples: appServerSampleIds,
            viewStructure: appServerView,
            viewFilter: appServerFilter,
            viewSortOrder: appServerSortOrder,
            viewModel: appServerModel,
            offset,
            limit
        };

        async.waterfall([
            (callback) => this._closePreviousSearchIfAny(session, callback),
            (callback) => this.services.operations.addSearchOperation(session, method, callback),
            (operation, callback) => {
                operation.setSampleIds(sampleIds);
                operation.setUserId(userId);
                operation.setViewId(viewId);
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
            (operation, callback)=> {
                const {samples, fieldsMetadata, globalSearchValue: {filter, excludedFields}, fieldSearchValues, sortValues, offset, limit} = params;
                const setFilterRequest = this._createSearchInResultsParams(samples, fieldsMetadata, filter, excludedFields,
                    fieldSearchValues, sortValues, offset, limit);
                this._rpcSend(session, operation, METHODS.searchInResults, setFilterRequest, (error) => callback(error, operation));
            }
        ], callback);
    }

    _processSearchResultMessage(session, operation, message, callback) {
        const sessionState = message.result.sessionState;

        const sampleIds = operation.getSampleIds();
        const userId = operation.getUserId();
        const viewId = operation.getViewId();

        async.waterfall([
            (callback) => {
                this._fetch(sessionState.data, userId, sampleIds, viewId, callback);
            }
        ], (error, fieldsWithIdArray) => {
            this._createSearchDataResult(error, session, operation, fieldsWithIdArray, callback);
        });
    }

    //TODO: move data methods to another class

    getSearchKeyFieldName() {
        return 'search_key';
    }

    _fetch(searchData, userId, sampleIds, viewId, callback) {
        async.waterfall([
            (callback) => {
                this.services.users.find(userId, (error, user) => {
                    callback(error, {
                        user,
                        rowData: searchData
                    });
                });
            },
            ({rowData, user}, callback) => async.parallel({
                    samples: (callback) => this.services.samples.findMany(user, sampleIds, callback),
                    view: (callback) => this.services.views.find(user, viewId, callback),
                    samplesFields: (callback) => this.services.fieldsMetadata.findByUserAndSampleIds(user, sampleIds, callback),
                    sourcesFields: (callback) => this.services.fieldsMetadata.findSourcesMetadata(callback)
                },
                (error, {samples, view, samplesFields, sourcesFields})=> callback(error, {
                    rowData,
                    user,
                    samples,
                    view,
                    samplesFields,
                    sourcesFields
                })
            ),
            ({rowData, user, samples, view, samplesFields, sourcesFields}, callback) => {
                async.parallel({
                    data: (callback) => this._convertFields(rowData, user, samples, view, samplesFields, sourcesFields, callback),
                    header: (callback) => this._createDataHeader(view, samplesFields, sourcesFields, samples, callback),
                }, callback)
            }
        ], (error, tableData) => {
            callback(error, tableData);
        });
    }

    _createDataHeader(view, samplesFields, sourcesFields, samples , callback) {
        const viewListItems = view.viewListItems;
        const viewFields = _.map(viewListItems, viewListItem => _.find(
                samplesFields, fieldIdToMetadata =>fieldIdToMetadata.id == viewListItem.fieldId
            ) || _.find(
                sourcesFields, fieldIdToMetadata =>fieldIdToMetadata.id == viewListItem.fieldId
            )
        );
        const noneDuplicatedColumnNames = AppServerUtils.getNoneDuplicatedColumnNames(viewFields);
        const resultHeader = [];
        _.forEach(viewFields, viewField => {
            if ( viewField.sourceName === 'sample'){
                resultHeader.push({
                    fieldId: viewField.id
                });
            }else {
                if (_.some(noneDuplicatedColumnNames, viewField.name)){
                    resultHeader.push({
                        fieldId: viewField.id,
                        sampleId: samples[0].id
                    });
                }else {
                    _.forEach(samples, sample => {
                        resultHeader.push({
                            fieldId: viewField.id,
                            sampleId: sample.id
                        });
                    })
                }
            }
        });
        callback(null, resultHeader);
    }

    //todo: Check more carefully
    _convertFields(asData, user, samples, view, samplesFields, sourcesFields, callback) {
        async.waterfall([
            (callback) => {
                const sourceFieldsMapArray = _.map(
                    _.groupBy(sourcesFields, 'sourceName'),
                    (sourceFields, sourceName)=> {
                        return {
                            sampleId: 'source',
                            sampleName: sourceName,
                            fields: sourceFields,
                        }
                    }
                );
                const sampleFieldMapArray = _.map(samples, sample => {
                    const sampleFieldIds = _.map(sample.values, fieldValue => fieldValue.fieldId);
                    const sampleFields = _.filter(samplesFields, sampleField => {
                        return _.some(sampleFieldIds, sampleFieldId => {
                            return sampleFieldId === sampleField.id
                        })
                    });
                    return {
                        sampleId: sample.id,
                        sampleName: sample.genotypeName,
                        fields: sampleFields
                    }
                });
                const samplesData = _.union(sourceFieldsMapArray, sampleFieldMapArray);
                callback(null,
                    {
                        samplesData,
                        samples
                    }
                );
            },
            ({samplesData, samples}, callback) => {
                const samplesFieldHashArray = _.map(samplesData, sampleData => {
                    const sampleFieldHash = CollectionUtils.createHash(sampleData.fields,
                        ({name}) => AppServerUtils.createColumnName(name, sampleData.sampleName)
                    );
                    if (sampleData.sampleId == 'source') {
                        return {
                            appServerSampleId: sampleData.sampleName,
                            sampleId: sampleData.sampleId,
                            sampleFieldHash
                        };
                    } else {
                        const sample = _.find(samples, sample => sample.id == sampleData.sampleId);
                        const appServerSampleId = this._getAppServerSampleId(sample);
                        return {
                            appServerSampleId,
                            sampleId: sampleData.sampleId,
                            sampleFieldHash
                        };
                    }
                });
                callback(null, samplesFieldHashArray);
            },
            (samplesFieldHashArray, callback) => {
                const missingFieldsSet = new Set();
                const fieldsWithIdArray = _.map(asData, (rowObject) => {
                    const searchKeyFieldName = this.getSearchKeyFieldName();
                    const mappedRowObject = _.map(rowObject, rowField => {
                        if (rowField.fieldName !== searchKeyFieldName) {
                            const currentSampleFieldHash = _.find(samplesFieldHashArray, sampleFieldHash => sampleFieldHash.appServerSampleId == rowField.fieldSource);
                            const fieldMetadata = currentSampleFieldHash.sampleFieldHash[rowField.fieldName];
                            if (fieldMetadata) {
                                return {
                                    fieldId: fieldMetadata.id,
                                    fieldValue: this._mapFieldValue(rowField.fieldValue),
                                    sampleId: currentSampleFieldHash.sampleId == 'source' ? null : currentSampleFieldHash.sampleId
                                }
                            }
                            else {
                                missingFieldsSet.add(rowField.fieldName);
                                return null
                            }
                        } else {
                            return {
                                fieldId: rowField.fieldName,
                                fieldValue: rowField.fieldValue
                            }
                        }
                    });
                    const existingFieldsRowObject = _.filter(mappedRowObject, rowFields => {
                        return !_.isNull(rowFields);
                    });
                    return existingFieldsRowObject;
                });
                const missingFields = [...missingFieldsSet];
                missingFields.length && this.logger.error(`The following fields were not found: ${missingFields}`);
                callback(null, fieldsWithIdArray);
            }
        ], callback);
    }

    _mapFieldValue(actualFieldValue) {
        // This is VCF way to mark empty field values.
        return (actualFieldValue !== 'nan') ? actualFieldValue : '.';
    }

    _createSearchDataResult(error, session, operation, tableData, callback) {
        super._createOperationResult(session, operation, session.id, session.userId, EVENTS.onSearchDataReceived, false, {
            progress: 100,
            status: SESSION_STATUS.READY,
            sampleIds: operation.getSampleIds(),
            limit: operation.getLimit(),
            offset: operation.getOffset(),
            tableData
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

    _createSearchInResultsParams(samples, fieldsMetadata, globalSearchValue, excludedFields, fieldSearchValues, sortParams, offset, limit) {
        const globalFilter = AppSearchInResultUtils.createAppGlobalFilter(globalSearchValue, excludedFields, samples, fieldsMetadata);
        const columnFilters = AppSearchInResultUtils.createAppColumnFilter(fieldSearchValues, samples, fieldsMetadata);
        const sortOrder = AppSearchInResultUtils.createAppSortOrder(sortParams, samples, fieldsMetadata);
        return {
            globalFilter,
            columnFilters,
            sortOrder,
            offset,
            limit
        };
    }

    _createAppServerViewSortOrder(view, fieldIdToMetadata, sample) {
        // Keep only items whose fields exist in the current sample.
        const viewListItems = _.filter(view.viewListItems, listItem => fieldIdToMetadata[listItem.fieldId]);

        // Get all items which specify sort order.
        const sortItems = _.filter(viewListItems, listItem => !!listItem.sortOrder);

        // Sort items by specified order.
        const sortedSortItems = _.sortBy(sortItems, listItem => listItem.sortOrder);

        //noinspection UnnecessaryLocalVariableJS leaved for debug.
        const appServerSortOrder = _.map(sortedSortItems, listItem => {
            const field = fieldIdToMetadata[listItem.fieldId];
            const columnName = field.sourceName === 'sample' ? AppServerUtils.createColumnName(field.name, sample.genotypeName) : field.name;
            const sourceName = field.sourceName === 'sample' ? AppServerUtils.createSampleName(sample) : field.sourceName;
            const isAscendingOrder = listItem.sortDirection === 'asc';
            return {
                columnName,
                sourceName,
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
