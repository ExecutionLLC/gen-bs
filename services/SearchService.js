'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');
const CollectionUtils = require('../utils/CollectionUtils');
const AppServerUtils = require('../utils/AppServerUtils');
const RESULT_TYPES = require('./external/applicationServer/AppServerResultTypes');
const {SEARCH_SERVICE_EVENTS} = require('../utils/Enums');


class SearchService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this._onSearchDataReceived = this._onSearchDataReceived.bind(this);

        this.eventEmitter = new EventProxy(SEARCH_SERVICE_EVENTS.allValues);
    }

    init() {
        this.searchKeyFieldName = AppServerUtils.getSearchKeyFieldName();
        this._subscribeToRPCEvents();
    }

    registeredEvents() {
        return SEARCH_SERVICE_EVENTS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }

    sendSearchRequest(user, session, languageId, analysis, limit, offset, callback) {
        const {id, name, description, type, samples, modelId, viewId, filterId} = analysis;
        if (_.isEmpty(id)) {
            const hasUndefOrNullParam = _.some([languageId, viewId, filterId, name, description, type, samples, limit, offset], (param) => {
                return  _.isUndefined(param) || _.isNull(param);
            });
            if (hasUndefOrNullParam) {
                callback(new Error('One of required params is not set. Params: ' + JSON.stringify({
                        languId: languageId || 'undefined',
                        viewId: viewId || 'undefined',
                        filterId: filterId || 'undefined',
                        samples: samples || 'undefined',
                        name: name || 'undefined',
                        description: description || 'undefined',
                        type: type || 'undefined',
                        limit: _.isNumber(limit) ? limit : 'undefined',
                        offset: _.isNumber(offset) ? offset : 'undefined'
                    }, null, 2)));
            } else {
                async.waterfall([
                    (callback) => {
                        this.services.analysis.add(
                            user, languageId, name, description, type, viewId, filterId, modelId, samples, callback
                        );
                    },
                    (analysis, callback) => {
                        this._sendSearchRequest(
                            user, session, languageId, viewId, filterId, modelId, samples, limit, offset,
                            (error, operationId) => callback(error, {
                                operationId,
                                analysis
                            })
                        );
                    }
                ], callback);
            }
        }
        else {
            async.waterfall(
                [
                    (callback) => {
                        this.services.analysis.find(user, id, callback);
                    },
                    (analysis, callback) =>{
                        analysis.lastQueryDate = new Date();
                        this.services.analysis.update(user, analysis, callback);
                    },
                    (analysis, callback) => {
                        const {samples, modelId, viewId, filterId} = analysis;
                        this._sendSearchRequest(
                            user, session, languageId, viewId, filterId, modelId, samples, limit, offset,
                            (error, operationId) => callback(error ,  {operationId, analysis})
                        );
                    }
                ],
                callback
            );
        }
    }

    _sendSearchRequest(user, session, languageId, viewId, filterId, modelId, samples, limit, offset, callback) {
        async.waterfall([
            (callback) => this._createAppServerSearchParams(user, languageId, samples,
                viewId, filterId, modelId, limit, offset, callback),
            (appServerRequestParams, callback) => this._validateAppServerSearchParams(appServerRequestParams,
                callback
            ),
            (appServerRequestParams, callback) => {
                this.services.applicationServer.requestOpenSearchSession(session,
                    appServerRequestParams, callback);
            }
        ], callback);
    }

    searchInResults(user, session, operationId, globalSearchValue, fieldSearchValues, sortValues, limit, offset, callback) {
        async.waterfall([
            (callback) => this.services.operations.find(session, operationId, callback),
            (operation, callback) => this._validateAppServerSearchInParams(fieldSearchValues, sortValues, operation, callback),
            (operation, callback) => {
                this._createAppServerSearchInResultsParams(user, session.id, operationId, operation.getSampleIds(), operation.getViewId(), globalSearchValue,
                    fieldSearchValues, sortValues, limit, offset, callback);
            },
            (appServerParams, callback) => {
                this.services.applicationServer.requestSearchInResults(session, operationId, appServerParams, (error) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, operationId);
                    }
                });
            }
        ], callback);
    }

    loadResultsPage(user, session, operationId, limit, offset, callback) {
        this.services.applicationServer.loadResultsPage(user, session, operationId, limit, offset, callback);
    }

    _subscribeToRPCEvents() {
        const events = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(events.onSearchDataReceived, this._onSearchDataReceived);
    }

    _onSearchDataReceived(message) {
        const {session: {userId}, result: {tableData:{ header, data }}} = message;

        async.waterfall([
            (callback) => this.services.users.find(userId, (error, user) => callback(error, user)),
            (user, callback) => this._loadRowsComments(user.id, user.language, data, callback),
            (searchKeyToCommentsArrayHash, callback) => {
                // Transform fields to the client representation.
                const rows = _.map(data, rowData => {
                    const {viewData, mandatoryFields} = rowData;
                    const fieldValueHash = CollectionUtils.createHash(viewData,
                        (fieldData) => `${fieldData.fieldId}_${fieldData.sampleId || 'source'}`
                    );
                    const searchKeyObject = _.find(viewData, fieldWithId => {
                        return fieldWithId.fieldId === this.searchKeyFieldName
                    });
                    
                    const fieldValueObjects = _.map(header, headerObject => {
                        const fieldWithId = fieldValueHash[`${headerObject.fieldId}_${headerObject.sampleId || 'source'}`];
                        return fieldWithId ? fieldWithId.fieldValue: null
                    });
                    const searchKey = searchKeyObject.fieldValue;
                    const comments = _.map(searchKeyToCommentsArrayHash[searchKey], ({id, comment}) => ({id, comment}));

                    return {
                        searchKey,
                        comments,
                        fields: fieldValueObjects,
                        mandatoryFields
                    };
                });
                callback(null, rows);
            }
        ], (error, convertedRows) => this._emitDataReceivedEvent(error, message, convertedRows, header));
    }

    _emitDataReceivedEvent(error, message, convertedRows, header) {
        /**@type AppServerResult*/
        let clientMessage;
        if (error) {
            clientMessage = Object.assign({}, message, {
                resultType: RESULT_TYPES.ERROR,
                result: null,
                error
            });
        } else {
            clientMessage = Object.assign({}, message, {
                result: Object.assign({}, _.omit(message.result, ['tableData']), {
                    data: convertedRows,
                    header
                })
            });
        }
        this.eventEmitter.emit(SEARCH_SERVICE_EVENTS.onDataReceived, clientMessage);
    }

    /**
     * Loads comments for all rows into hash[searchKey] = commentsArray object.
     *
     * @param userId Id of the user results are for.
     * @param languId Language id.
     * @param redisRows Array of hash[fieldId] = fieldValue objects.
     * @param callback (error, hash[searchKey] = commentsArray)
     * */
    _loadRowsComments(userId, languId, redisRows, callback) {
        // Extract search keys from all rows.
        const searchKeys = _.map(redisRows, row => {
            const searchField = _.find(row.viewData, field => {
                return field.fieldId == this.searchKeyFieldName;
            });
            return searchField.fieldValue;
        });

        async.waterfall([
            // Load comments for all search keys.
            (callback) => this.models.comments.findAllBySearchKeys(userId, languId, searchKeys, callback),

            // Group comments by search key.
            (comments, callback) => {
                const searchKeyToCommentHash = CollectionUtils.createMultiValueHash(
                    comments, (comment) => comment.searchKey
                );
                callback(null, searchKeyToCommentHash);
            }
        ], callback);
    }

    _createAppServerSearchInResultsParams(user, sessionId, operationId, sampleIds, viewId, globalSearchValue,
                                          fieldSearchValues, sortValues, limit, offset, callback) {
        async.parallel({
            fields: (callback) => async.waterfall(
                [
                    (callback) => this.services.views.find(user, viewId, callback),
                    (view, callback) => this.services.fields.findMany(
                        _.map(view.viewListItems,item => item.fieldId),
                        callback
                    ),
                ], callback
            ),
            samples: (callback) => {
                this.services.samples.findMany(user, sampleIds, callback);
            }
        }, (error, {fields, samples}) => {
            callback(error, {
                sessionId,
                operationId,
                samples,
                fields,
                globalSearchValue,
                fieldSearchValues,
                sortValues,
                limit,
                offset
            });
        });
    }

    _transformCommasInRules(ruleObj) {
        if (ruleObj.rules && ruleObj.rules.length) {
            ruleObj.rules.forEach((part, index, theArray) => {
                this._transformCommasInRules(theArray[index]);
            });
        } else {
            const strOld = ruleObj.value;
            if (typeof strOld === 'string' && strOld) {
                ruleObj.value = strOld.replace(/,/g, '\\x2c');
            }
        }
    }

    _createAppServerSearchParams(user, languId, samples, viewId, filterId, modelId, limit, offset, callback) {
        const sampleIds = _.map(samples, (sample) => sample.id);
        async.parallel({
            langu: (callback) => {
                this.services.langu.find(languId, callback);
            },
            samples: (callback) => {
                async.waterfall([
                    (callback) => {
                        this.services.samples.findMany(user, sampleIds, callback);
                    },
                    (analysisSamples, callback) => {
                        const resultSamples = _.map(samples, (sample) => {
                            const resultSample = _.find(analysisSamples, {id: sample.id});
                            return Object.assign({}, resultSample, {
                                sampleType: sample.type
                            });
                        });
                        callback(null, resultSamples);
                    }
                ], callback);
            },
            filter: (callback) => {
                this.services.filters.find(user, filterId, callback);
            },
            fields: (callback) => {
                async.waterfall([
                    (callback) => {
                        // Load sample metadata
                        this.services.fields.findByUserAndSampleIds(user, sampleIds, callback);
                    },
                    (sampleMetadata, callback) => {
                        // Load sources metadata
                        this.services.fields.findSourcesFields((error, sourcesMetadata) => {
                            callback(error, {
                                sampleMetadata,
                                sourcesMetadata
                            });
                        });
                    },
                    (metadata, callback) => {
                        // Join metadata into one collection.
                        const sourcesMetadata = metadata.sourcesMetadata;
                        callback(null, sourcesMetadata.concat(metadata.sampleMetadata));
                    }
                ], callback);
            },
            view: (callback) => {
                this.services.views.find(user, viewId, callback);
            },
            model: (callback) => {
                if (modelId === null) {
                    callback(null, null)
                } else {
                    this.services.models.find(user, modelId, callback);
                }
            }
        }, (error, {langu, view, filter, model, samples, fields}) => {
            if (error) {
                callback(error);
            } else {
                this._transformCommasInRules(filter.rules);
                const appServerSearchParams = {
                    langu,
                    userId: user.id,
                    view,
                    filter,
                    samples,
                    fields,
                    model,
                    limit,
                    offset
                };
                callback(null, appServerSearchParams);
            }
        });
    }

    _validateAppServerSearchParams(appServerRequestParams, callback) {
        const userId = appServerRequestParams.userId;
        const model = appServerRequestParams.model;
        const filter = appServerRequestParams.filter;
        const view = appServerRequestParams.view;
        const samples = appServerRequestParams.samples;
        async.each([model, filter, view].concat(samples), (item, callback) => {
            if (item !== null) {
                this.services.users.ensureUserHasAccessToItem(userId, item.type, callback)
            } else {
                callback(null)
            }
        }, (error) => {
            callback(error, appServerRequestParams);
        });
    }

    _validateAppServerSearchInParams(fieldSearchValues, sortValues, operation, callback) {
        const operationSampleIds = operation.getSampleIds();
        const sortValuesSampleIds = _.flatMap(sortValues, sortValue => {
            if (sortValue.sampleId) {
                return [sortValue.sampleId];
            }
            return [];
        });
        const fieldSearchValuesSampleId = _.flatMap(fieldSearchValues, fieldSearchValue => {
            if (fieldSearchValue.sampleId) {
                return [fieldSearchValue.sampleId];
            }
            return [];
        });
        const isSearchSampleValid = _.every(sortValuesSampleIds.concat(fieldSearchValuesSampleId), sampleId => {
            return _.some(operationSampleIds, operationSampleId => operationSampleId === sampleId);
        });
        if (!isSearchSampleValid) {
            return callback(new Error('One of searchIn samples not in current operation samples'));
        }
        return callback(null, operation);
    }
}

module.exports = SearchService;
