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
const AppSearchInResultUtils = require('../../../utils/AppServerSearchInResultUtils');

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
            (operation, callback) => this._rpcSend(session, operation, method, searchDataRequest, null, callback)
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
        const {fieldsMetadata, userId, view, samples, filter, model, limit, offset} = params;
        const fieldIdToFieldMetadata = CollectionUtils.createHash(fieldsMetadata, fieldMetadata => fieldMetadata.id);
        const sample = samples[0];
        const method = METHODS.openSearchSession;
        const sampleIds = _.map(samples, sample => sample.id);
        const viewId = view.id;
        const appServerSampleIds = _.map(samples, sample => {
            return {
                sample: this._getAppServerSampleId(sample),
                type: sample.sampleType,
                genotype: sample.genotypeName
            }
        });
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
            (operation, callback) => this._rpcSend(session, operation, method, searchSessionRequest, null, callback)
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
                const {
                    samples,
                    fieldsMetadata,
                    globalSearchValue: {
                        filter
                    },
                    fieldSearchValues,
                    sortValues,
                    offset,
                    limit
                } = params;
                const setFilterRequest = this._createSearchInResultsParams(
                    samples, fieldsMetadata, filter, fieldSearchValues, sortValues, offset, limit
                );
                this._rpcSend(session, operation, METHODS.searchInResults, setFilterRequest, null,
                    (error) => callback(error, operation)
                );
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
    _fetch(searchData, userId, sampleIds, viewId, callback) {
        const mainSampleId = sampleIds[0];
        async.waterfall([
            (callback) => {
                this.services.users.find(userId, (error, user) => {
                    callback(error, {
                        user,
                        rowData: searchData
                    });
                });
            },
            ({rowData, user}, callback) => async.waterfall(
                [
                    (callback) => this.services.views.find(user, viewId, callback),
                    (view, callback) => async.parallel({
                            samples: (callback) => this.services.samples.findMany(
                                user,
                                sampleIds,
                                (error, samples) => {
                                    const resultSamples = _.map(
                                        sampleIds, sampleId => _.find(samples, sample => sample.id == sampleId)
                                    );
                                    callback(error, resultSamples)
                                }
                            ),
                            viewFields: (callback) => this.services.fieldsMetadata.findMany(
                                _.map(view.viewListItems, item => item.fieldId),
                                callback
                            ),
                            samplesFields: (callback) => this.services.fieldsMetadata.findByUserAndSampleIds(user, sampleIds, callback),
                        },
                        (error, {samples, viewFields, samplesFields}) => callback(error, {
                            rowData,
                            user,
                            samples,
                            view,
                            samplesFields,
                            viewFields
                        })
                    ),
                ], callback
            ),
            ({rowData, user, samples, view, viewFields, samplesFields}, callback) => {
                const searchKeyFields = _.filter(samplesFields, samplesField => {
                    return _.includes(AppServerUtils.getSearchKeyFieldsColumnNames(), samplesField.name)
                });
                const mainSample = _.find(samples, sample => sample.id == mainSampleId);
                async.parallel({
                    data: (callback) => this._convertFields(rowData, user, samples, mainSample, viewFields, searchKeyFields, callback),
                    header: (callback) => this._createDataHeader(view, viewFields, samples, callback),
                }, callback)
            }
        ], (error, tableData) => {
            callback(error, tableData);
        });
    }

    _createDataHeader(view, viewFields, samples, callback) {
        const viewListItems = view.viewListItems;
        const viewFieldsOrdered = _.map(viewListItems, viewListItem => _.find(
            viewFields, fieldIdToMetadata =>fieldIdToMetadata.id == viewListItem.fieldId
            )
        );
        const notDuplicatedColumnNames = AppServerUtils.getNotDuplicatedColumnNames(viewFields);
        const resultHeader = [];
        _.forEach(viewFieldsOrdered, viewField => {
            if (viewField.sourceName !== 'sample') {
                resultHeader.push({
                    fieldId: viewField.id,
                    exist: true,
                    unique: true
                });
            } else {
                if (_.some(notDuplicatedColumnNames, notDuplicatedColumnName => notDuplicatedColumnName === viewField.name)) {
                    const exist = _.some(samples[0].sampleFields, field => field.fieldId == viewField.id);
                    resultHeader.push({
                        fieldId: viewField.id,
                        sampleId: samples[0].id,
                        exist,
                        unique: true
                    });
                } else {
                    _.forEach(samples, sample => {
                        const exist = _.some(sample.sampleFields, field => field.fieldId == viewField.id);
                        resultHeader.push({
                            fieldId: viewField.id,
                            sampleId: sample.id,
                            exist,
                            unique: false
                        });
                    })
                }
            }
        });
        callback(null, resultHeader);
    }

    // TODO: Check more carefully
    _convertFields(asData, user, samples, mainSample, viewFields, searchKeyFields, callback) {
        async.waterfall([
            (callback) => {
                // Get all fields we will need
                const totalFields = _.union(viewFields, searchKeyFields);
                // Split them by source.
                // TODO: It is better to create hashes here instead of arrays for fields here,
                // to avoid re-filtering and hashing of the arrays below.
                const sourcesFields = _.filter(totalFields, totalField => totalField.sourceName != 'sample');
                const samplesFields = _.filter(totalFields, totalField => totalField.sourceName == 'sample');
                // Create array of objects containing sources' info and their fields, make them look like samples
                // with sampleId = 'source'.
                const sourceFieldsMapArray = _.map(
                    _.groupBy(sourcesFields, 'sourceName'),
                    (sourceFields, sourceName) => ({
                        sampleId: 'source',
                        sampleName: sourceName,
                        fields: sourceFields
                    })
                );
                // Create array of objects containing samples' info and it's fields.
                const sampleFieldMapArray = _.map(samples, sample => {
                    const sampleFieldIds = _.map(sample.sampleFields, fieldValue => fieldValue.fieldId);
                    const sampleFields = _.filter(samplesFields, sampleField => {
                        return _.some(sampleFieldIds, sampleFieldId => {
                            return sampleFieldId === sampleField.id
                        })
                    });
                    // TODO: It would be better to keep genotypeName as genotypeName here,
                    // instead of making the reader to remember that sampleName is equal
                    // to genotypeName for samples.
                    return {
                        sampleId: sample.id,
                        sampleName: sample.genotypeName,
                        fields: sampleFields
                    }
                });
                // Join all the data about fields.
                // TODO: here we have created a custom rule for sources (source <==> sampleId == 'source')
                // using the existing rule (sourceName !== 'sample'). It would be better to keep the old one.
                const samplesData = _.union(sourceFieldsMapArray, sampleFieldMapArray);
                callback(null, {
                    samplesData,
                    samples
                });
            },
            ({samplesData, samples}, callback) => {
                // TODO: It seems we can create the right structure at the previous step.
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
                const searchKeyFieldName = AppServerUtils.getSearchKeyFieldName();
                const fieldsWithIdArray = _.map(asData, (rowObject) => {
                    const mappedRowObject = _.flatMap(rowObject, rowField => {
                        if (rowField.fieldName !== searchKeyFieldName) {
                            const currentSampleFieldHashes = _.filter(samplesFieldHashArray, sampleFieldHash => sampleFieldHash.appServerSampleId == rowField.fieldSource);
                            return _.map(currentSampleFieldHashes, currentSampleFieldHash => {
                                const fieldMetadata = currentSampleFieldHash.sampleFieldHash[rowField.fieldName];
                                if (fieldMetadata) {
                                    return {
                                        fieldId: fieldMetadata.id,
                                        fieldValue: this._convertVcfValue(rowField.fieldValue),
                                        sampleId: currentSampleFieldHash.sampleId == 'source' ? null : currentSampleFieldHash.sampleId
                                    };
                                } else {
                                    missingFieldsSet.add(rowField.fieldName);
                                    return null;
                                }
                            });
                        } else {
                            return {
                                fieldId: rowField.fieldName,
                                fieldValue: rowField.fieldValue
                            };
                        }
                    });
                    const existingFieldsRowObject = _.filter(mappedRowObject, rowFields => {
                        return !_.isNull(rowFields);
                    });
                    const mandatoryFields = {};
                    _.forEach(searchKeyFields, searchKeyField => {
                        const fieldRowObj = _.find(existingFieldsRowObject, rowObj => {
                            return rowObj.fieldId == searchKeyField.id && rowObj.sampleId == mainSample.id
                        });
                        mandatoryFields[searchKeyField.name] = fieldRowObj.fieldValue;
                    });
                    return {
                        viewData: existingFieldsRowObject,
                        mandatoryFields
                    };
                });
                const missingFields = [...missingFieldsSet];
                missingFields.length && this.logger.error(`The following fields were not found: ${missingFields}`);
                callback(null, fieldsWithIdArray);
            }
        ], callback);
    }

    // converts VCF specific values into a human-readable form.
    _convertVcfValue(actualFieldValue) {
        if (actualFieldValue === 'nan') { // This is VCF way to mark empty field values.
            return '.';
        } else {
            return actualFieldValue.replace(/\\x2c/g, ','); // replace '\x2c' -> ','
        }
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

    _createSearchInResultsParams(samples, fieldsMetadata, globalSearchValue, fieldSearchValues, sortParams, offset, limit) {
        const globalFilter = AppSearchInResultUtils.createAppGlobalFilter(globalSearchValue, samples, fieldsMetadata);
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
        const mainSampleMetadata = _.map(sample.sampleFields, field => fieldIdToMetadata[field.fieldId]);
        const sourceMetadata = _.filter(fieldIdToMetadata, metaData => metaData.sourceName != 'sample');
        const availableMetadata = mainSampleMetadata.concat(sourceMetadata);
        const availableFieldIdToMetadata = CollectionUtils.createHash(availableMetadata, fieldMetadata => fieldMetadata.id);
        const viewListItems = _.filter(view.viewListItems, listItem => availableFieldIdToMetadata[listItem.fieldId]);

        // Get all items which specify sort order.
        const sortItems = _.filter(viewListItems, listItem => !!listItem.sortOrder);

        // Sort items by specified order.
        const sortedSortItems = _.sortBy(sortItems, listItem => listItem.sortOrder);

        //noinspection UnnecessaryLocalVariableJS leaved for debug.
        const appServerSortOrder = _.map(sortedSortItems, listItem => {
            const field = availableFieldIdToMetadata[listItem.fieldId];
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
            sample.fileName : sample.vcfFileId;
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
