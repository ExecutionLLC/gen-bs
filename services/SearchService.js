'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');

class SearchService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    sendSearchRequest(user, sessionId, languId, keywordId, sampleId, viewId, filterId, limit, offset, callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                this._createAppServerSearchParams(sessionId, user, languId, keywordId, sampleId, viewId, filterId, limit, offset, callback);
            },
            (appServerRequestParams, callback) => {
                this.services.applicationServer.requestOpenSearchSession(appServerRequestParams.sessionId,
                    appServerRequestParams, callback);
            }
        ], callback);
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
        // The actual data or error should go to web socket for convenience.
        async.waterfall([
            (callback) => {
                this.services.operations.find(sessionId, operationId, callback);
            },
            (operation, callback) => {
                const redisData = operation.data.redis;
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
                this.services.redis.fetch(redisParams, callback);
            },
            (results, callback) => {
                // Results have already been sent by the Redis service through web socket.
                callback(null, operationId);
            }
        ], callback);
    }

    _createAppServerSearchInResultsParams(sessionId, operationId, globalSearchValue, fieldSearchValues, sortValues, limit, offset, callback) {
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
                        order: sortValue.order,
                        direction: sortValue.direction
                    });
                }
            ], callback);
        },
        callback);
    }

    _createAppServerSearchParams(sessionId, user, languId, keywordId, sampleId, viewId, filterId, limit, offset, callback) {
        async.parallel({
            langu: (callback) => {
                this.services.langu.find(languId, callback);
            },
            keyword: (callback) => {
                this.services.keywords.find(keywordId, callback);
            },
            sample: (callback) => {
                this.services.samples.find(user, sampleId, callback);
            },
            filter: (callback) => {
                // Filters are not required.
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
                    userId: user.id,
                    keyword: result.keyword,
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
}

module.exports = SearchService;
