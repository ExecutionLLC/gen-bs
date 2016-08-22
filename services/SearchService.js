'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');
const CollectionUtils = require('../utils/CollectionUtils');
const RESULT_TYPES = require('./external/applicationServer/AppServerResultTypes');
const {SEARCH_SERVICE_EVENTS} = require('../utils/Enums');


class SearchService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this._onSearchDataReceived = this._onSearchDataReceived.bind(this);

        this.eventEmitter = new EventProxy(SEARCH_SERVICE_EVENTS.allValues);
    }

    init() {
        this.searchKeyFieldName = this.services.applicationServerSearch.getSearchKeyFieldName();
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
        if (_.isUndefined(id) || _.isNull(id)) {
            // this._sendSearchRequest(
            //     languageId, viewId, filterId, name, description, type, samples, limit, offset, callback, user, session
            // );
            const hasUndefOrNullParam = _.some([languageId, viewId, filterId, name, description, type, samples, limit, offset], (param) => {
                return _.isUndefined(param) || _.isNull(param);
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
                async.waterfall(
                    [
                        (callback) => {
                            this.services.analysis.add(
                                user, languageId, name, description, type, viewId, filterId, modelId, samples, callback
                            );
                        },
                        (analysis, callback) => {
                            this._sendSearchRequest(
                                user, session, languageId, analysis.id, viewId, filterId, modelId, samples, limit, offset, callback
                            );
                        }
                    ],
                    callback
                );
            }
        }
        else {
            async.waterfall(
                [
                    (callback) => {
                        this.services.analysis.find(user, id, callback);
                    },
                    (analysis, callback) => {
                        const {samples, modelId, viewId, filterId} = analysis;
                        this._sendSearchRequest(
                            user, session, languageId, analysis.id, viewId, filterId, modelId, samples, limit, offset, callback
                        );
                    }
                ],
                callback
            );
        }
    }

    _sendSearchRequest(user, session, languageId, analysisId, viewId, filterId, modelId, samples, limit, offset, callback) {
        async.waterfall([
            (callback) => this._createAppServerSearchParams(user, languageId, analysisId, samples,
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
            (operation, callback) => this.services.analysis.find(user, operation.getAnalysisId(), callback),
            (analysis, callback) => {
                this._createAppServerSearchInResultsParams(user, session.id, operationId, analysis, globalSearchValue,
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
        const {session: {userId}, result: {fieldsWithIdArray}} = message;

        async.waterfall([
            (callback) => this.services.users.find(userId, (error, user) => callback(error, user)),
            (user, callback) => this._loadRowsComments(user.id, user.language, fieldsWithIdArray, callback),
            (searchKeyToCommentsArrayHash, callback) => {
                // Transform fields to the client representation.
                const rows = _.map(fieldsWithIdArray, fieldsWithId => {
                    const nonSearchKeyObjects = _.filter(fieldsWithId, fieldWithId => {
                        return fieldWithId.fieldName !== this.searchKeyFieldName
                    });
                    const searchKeyObject = _.find(fieldsWithId, fieldWithId => {
                        return fieldWithId.fieldName === this.searchKeyFieldName
                    });
                    const fieldValueObjects = _.map(nonSearchKeyObjects, fieldWithId => {
                        return {
                            fieldId: fieldWithId.fieldId,
                            value: fieldWithId.fieldValue
                        }
                    });
                    const searchKey = searchKeyObject.fieldValue;
                    const comments = _.map(searchKeyToCommentsArrayHash[searchKey], comment => {
                        return {
                            id: comment.id,
                            comment: comment.comment
                        };
                    });

                    return {
                        searchKey,
                        comments,
                        fields: fieldValueObjects
                    };
                });
                callback(null, rows);
            }
        ], (error, convertedRows) => this._emitDataReceivedEvent(error, message, convertedRows));
    }

    _emitDataReceivedEvent(error, message, convertedRows) {
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
                result: {
                    data: convertedRows
                }
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
            const searchField = _.find(row, field => {
                field.fieldName = this.searchKeyFieldName
            });
            return searchField.fieldValue
        });

        async.waterfall([
            // Load comments for all search keys.
            (callback) => this.models.comments.findAllBySearchKeys(userId, languId, searchKeys, callback),

            // Group comments by search key.
            (comments, callback) => {
                const searchKeyToCommentHash = CollectionUtils.createMultiValueHash(comments,
                    (comment) => comment.searchKey);
                callback(null, searchKeyToCommentHash);
            }
        ], callback);
    }

    _createAppServerSearchInResultsParams(user, sessionId, operationId, analysis, globalSearchValue,
                                          fieldSearchValues, sortValues, limit, offset, callback) {
        const sampleIds = _.map(analysis.samples, (sample) => sample.id);
        const excludedFieldIds = globalSearchValue.excludedFields;
        const sortFieldIds = _.map(sortValues, sortValue => sortValue.fieldId);
        const searchFieldIds = _.map(fieldSearchValues, fieldSearchValue => fieldSearchValue.fieldId);
        const searchInResultMetadataIds = _.union(sortFieldIds, searchFieldIds, excludedFieldIds);
        async.parallel({
            fieldsMetadata: (callback) => {
                this.services.fieldsMetadata.findMany(searchInResultMetadataIds, callback)
            },
            samples: (callback) => {
                this.services.samples.findMany(user, sampleIds, callback);
            }
        }, (error, {fieldsMetadata, samples}) => {
            callback(error, {
                sessionId,
                operationId,
                samples,
                fieldsMetadata,
                globalSearchValue,
                fieldSearchValues,
                sortValues,
                limit,
                offset
            });
        });
    }

    _createAppServerFieldSearchValues(fieldSearchValues, callback) {
        async.map(fieldSearchValues, (fieldSearchValue, callback) => {
            async.waterfall([
                (callback) => {
                    this.services.fieldsMetadata.find(fieldSearchValue.fieldId, callback);
                },
                (fieldMetadata, callback) => {
                    callback(null, {
                        fieldMetadata,
                        value: fieldSearchValue.value,
                        sampleId: fieldSearchValue.sampleId
                    });
                }
            ], callback);
        }, callback);
    }

    _createAppServerSortValues(sortValues, callback) {
        async.map(sortValues, (sortValue, callback) => {
                async.waterfall([
                    callback => {
                        this.services.fieldsMetadata.find(sortValue.fieldId, callback);
                    },
                    (fieldMetadata, callback) => {
                        callback(null, {
                            fieldMetadata,
                            sortOrder: sortValue.order,
                            sortDirection: sortValue.direction,
                            sampleId: sortValue.sampleId
                        });
                    }
                ], callback);
            },
            callback);
    }

    _createAppServerSearchParams(user, languId, analysisId, samples, viewId, filterId, modelId, limit, offset, callback) {
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
            fieldsMetadata: (callback) => {
                async.waterfall([
                    (callback) => {
                        // Load sample metadata
                        this.services.fieldsMetadata.findByUserAndSampleIds(user, sampleIds, callback);
                    },
                    (sampleMetadata, callback) => {
                        // Load sources metadata
                        this.services.fieldsMetadata.findSourcesMetadata((error, sourcesMetadata) => {
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
        }, (error, {langu, view, filter, model, samples, fieldsMetadata}) => {
            if (error) {
                callback(error);
            } else {
                const appServerSearchParams = {
                    langu,
                    userId: user.id,
                    analysisId,
                    view,
                    filter,
                    samples,
                    fieldsMetadata,
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
}

module.exports = SearchService;
