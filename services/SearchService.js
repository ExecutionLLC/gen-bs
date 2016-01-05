'use strict';

const async = require('async');

const ServiceBase = require('./ServiceBase');

class SearchService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    sendSearchRequest(user, sessionId, sampleId, viewId, filterIds, callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                // TODO: Add filters here.
                this._createAppServerSearchParams(sessionId, user, viewId, sampleId, callback);
            },
            (appServerRequestParams, callback) => {
                this.services.applicationServer.requestOpenSearchSession(appServerRequestParams.sessionId,
                    appServerRequestParams, callback);
            }
        ], callback);
    }

    searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues, callback) {
        const sessions = this.services.sessions;
        async.waterfall([
            (callback) => {
                sessions.findById(sessionId, callback);
            },
            (sessionId, callback) => {
                const params = {
                    globalSearchValue: globalSearchValue,
                    fieldSearchValues: fieldSearchValues
                };
                this.services.applicationServer.requestSearchInResults(sessionId, operationId, params, (error) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, operationId);
                    }
                });
            }
        ], callback);
    }

    _createAppServerSearchParams(sessionId, user, viewId, sampleId, callback) {
        async.parallel({
            sessionId: (callback) => {
                callback(null, sessionId);
            },
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
                    sessionId: result.sessionId,
                    view: result.view,
                    sample: result.sample,
                    fieldsMetadata: result.fieldsMetadata
                };
                callback(null, appServerSearchParams);
            }
        });
    }
}

module.exports = SearchService;
