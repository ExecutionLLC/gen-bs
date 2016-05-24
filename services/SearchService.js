'use strict';

const _ = require('lodash');
const async = require('async');

const ServiceBase = require('./ServiceBase');
const EventProxy = require('../utils/EventProxy');
const RESULT_TYPES = require('./external/applicationServer/AppServerResultTypes');

const EVENTS = {
    onDataReceived: 'onDataReceived'
};

class SearchService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this._onSearchDataReceived = this._onSearchDataReceived.bind(this);

        this.eventEmitter = new EventProxy(EVENTS);
        this.searchKeyFieldName = this.services.redis.getSearchKeyFieldName();
        this._subscribeToRPCEvents();
    }

    registeredEvents() {
        return EVENTS;
    }

    on(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }

    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }

    sendSearchRequest(user, sessionId, languageId, sampleId, viewId, filterId, limit, offset, callback) {
        const hasUndefOrNullParam = _.some([languageId, viewId, filterId, sampleId, limit, offset], (param) => {
            return _.isUndefined(param) || _.isNull(param);
        });

        if (hasUndefOrNullParam) {
            callback(new Error('One of required params is not set. Params: ' + JSON.stringify({
                    languId: languageId || 'undefined',
                    viewId: viewId || 'undefined',
                    filterId: filterId || 'undefined',
                    sampleId: sampleId || 'undefined',
                    limit: _.isNumber(limit) ? limit : 'undefined',
                    offset: _.isNumber(offset) ? offset : 'undefined'
                }, null, 2)));
        } else {
            async.waterfall([
                (callback) => this.services.queryHistory.add(user, languageId, sampleId, viewId, filterId,
                    (error) => callback(error)),
                (callback) => {
                    this.services.sessions.findById(sessionId, callback);
                },
                (sessionId, callback) => {
                    this._createAppServerSearchParams(sessionId, user, languageId, sampleId, viewId, filterId, limit, offset, callback);
                },
                (appServerRequestParams, callback) => {
                    this._validateAppServerSearchParams(appServerRequestParams, callback);
                },
                (appServerRequestParams, callback) => {
                    this.services.applicationServer.requestOpenSearchSession(appServerRequestParams.sessionId,
                        appServerRequestParams, callback);
                }
            ], callback);
        }
    }

    searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues, sortValues, limit, offset, callback) {
        const sessions = this.services.sessions;
        async.waterfall([
            (callback) => {
                sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                this._createAppServerSearchInResultsParams(sessionId, operationId, globalSearchValue,
                    fieldSearchValues, sortValues, limit, offset, callback);
            },
            (appServerParams, callback) => {
                this.services.applicationServer.requestSearchInResults(sessionId, operationId, appServerParams, (error) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, operationId);
                    }
                });
            }
        ], callback);
    }

    loadResultsPage(user, sessionId, operationId, limit, offset, callback) {
        this.services.applicationServer.loadResultsPage(user, sessionId, operationId, limit, offset, callback);
    }

    _subscribeToRPCEvents() {
        const events = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(events.onSearchDataReceived, this._onSearchDataReceived.bind(this));
    }

    _onSearchDataReceived(message) {
        const fieldIdToValueArray = message.result.fieldIdToValueHash;
        // For search requests there is only one session.
        const sessionId = _.first(message.sessionIds);

        async.waterfall([
            (callback) =>
                this.services.sessions.findSessionUserId(
                    sessionId,
                    (error, userId) => callback(error, userId)
                ),
            // TODO: Store languId from request in the session to use here.
            (userId, callback) => this.services.users.find(userId, (error, user) => callback(error, user)),
            (user, callback) => this._loadRowsComments(user.id, user.language, fieldIdToValueArray, callback),
            (searchKeyToCommentsArrayHash, callback) => {
                // Transform fields to the client representation.
                const rows = _.map(fieldIdToValueArray, fieldIdToValueHash => {
                    const fieldValueObjects = _(fieldIdToValueHash)
                        .keys()
                        .filter(key => key != this.searchKeyFieldName)
                        .map(fieldId => {
                            return {
                                fieldId,
                                value: fieldIdToValueHash[fieldId]
                            }
                        })
                        .value();
                    const searchKey = fieldIdToValueHash[this.searchKeyFieldName];
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
                result: Object.assign({}, message.result, {
                    data: convertedRows
                })
            });
        }
        this.eventEmitter.emit(EVENTS.onDataReceived, clientMessage);
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
        const searchKeys = _.map(redisRows, row => row[this.searchKeyFieldName]);

        async.waterfall([
            // Load comments for all search keys.
            (callback) => this.models.comments.findAllBySearchKeys(userId, languId, searchKeys, callback),

            // Group comments by search key.
            (comments, callback) => {
                const searchKeyToCommentHash = _.reduce(comments, (result, comment) => {
                    const searchKey = comment.searchKey;
                    if (!result[searchKey]) {
                        result[searchKey] = [];
                    }
                    result[searchKey].push(comment);
                    return result;
                }, {});
                callback(null, searchKeyToCommentHash);
            }
        ], callback);
    }

    _createAppServerSearchInResultsParams(sessionId, operationId, globalSearchValue,
                                          fieldSearchValues, sortValues, limit, offset, callback) {
        async.parallel({
            fieldSearchValues: (callback) => {
                this._createAppServerFieldSearchValues(fieldSearchValues, callback);
            },
            sortValues: (callback) => {
                this._createAppServerSortValues(sortValues, callback);
            }
        }, (error, result) => {
            callback(error, {
                sessionId,
                operationId,
                globalSearchValue,
                fieldSearchValues: result.fieldSearchValues,
                sortValues: result.sortValues,
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
                        value: fieldSearchValue.value
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
                        sortDirection: sortValue.direction
                    });
                }
            ], callback);
        },
        callback);
    }

    _createAppServerSearchParams(sessionId, user, languId, sampleId, viewId, filterId, limit, offset, callback) {
        async.parallel({
            langu: (callback) => {
                this.services.langu.find(languId, callback);
            },
            sample: (callback) => {
                this.services.samples.find(user, sampleId, callback);
            },
            filter: (callback) => {
                // TODO: Made filters not required.
                // The error should be raised here later in case user didn't choose any filter.
                if (filterId) {
                    this.services.filters.find(user, filterId, callback);
                } else {
                    callback(null, null);
                }

            },
            fieldsMetadata: (callback) => {
                async.waterfall([
                    (callback) => {
                        // Load sample metadata
                        this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, callback);
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
            }
        }, (error, result) => {
            if (error) {
                callback(error);
            } else {
                const appServerSearchParams = {
                    sessionId,
                    langu: result.langu,
                    userId: user.id,
                    view: result.view,
                    filter: result.filter,
                    sample: result.sample,
                    fieldsMetadata: result.fieldsMetadata,
                    limit,
                    offset
                };
                callback(null, appServerSearchParams);
            }
        });
    }

    _validateAppServerSearchParams(appServerRequestParams, callback) {
        const userId = appServerRequestParams.userId;
        const sample = appServerRequestParams.sample;
        const filter = appServerRequestParams.filter;
        const view = appServerRequestParams.view;
        async.each([sample, filter, view], (item, callback) => {
            this.services.users.ensureUserHasAccessToItem(userId, item.type, callback)
        }, (error) => {
            callback(error, appServerRequestParams);
        });
    }
}

module.exports = SearchService;
