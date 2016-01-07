'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');

class SearchService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    sendSearchRequest(user, sessionId, sampleId, viewId, filterIds, limit, offset, callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                // TODO: Add filters here.
                this._createAppServerSearchParams(sessionId, user, viewId, sampleId, limit, offset, callback);
            },
            // TODO: Complete existing search operation here (now it is done inside AS Service.
            (appServerRequestParams, callback) => {
                this.services.applicationServer.requestOpenSearchSession(appServerRequestParams.sessionId,
                    appServerRequestParams, callback);
            }
        ], callback);
    }

    searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues, limit, offset, callback) {
        const sessions = this.services.sessions;
        async.waterfall([
            (callback) => {
                sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                this._createAppServerSearchInResultsParams(sessionId, operationId, globalSearchValue,
                    fieldSearchValues, limit, offset, callback);
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

    _createAppServerSearchInResultsParams(sessionId, operationId, globalSearchValue, fieldSearchValues, limit, offset, callback) {
        async.map(fieldSearchValues, (fieldSearchValue, callback) => {
            async.waterfall([
                (callback) => {
                    this.services.fieldsMetadata.find(fieldSearchValue.id, callback);
                },
                (fieldMetadata, callback) => {
                    callback(null, {
                        fieldMetadata,
                        value: fieldSearchValue.value
                    });
                }
            ], callback);
        }, (error, result) => {
            if (error) {
                callback(error);
            } else {
                callback(null, {
                    sessionId,
                    operationId,
                    globalSearchValue,
                    fieldSearchValues: result,
                    limit,
                    offset
                });
            }
        });
    }

    _createAppServerSearchParams(sessionId, user, viewId, sampleId, limit, offset, callback) {
        async.parallel({
            sample: (callback) => {
                this.services.samples.find(user, sampleId, callback);
            },
            fieldsMetadata: (callback) => {
                // TODO: Add source field metadata here.
                this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, callback);
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
                    view: result.view,
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
