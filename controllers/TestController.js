'use strict';

const _ = require('lodash');
const async = require('async');
const Express = require('express');

const ControllerBase = require('./ControllerBase');

class TestController extends ControllerBase {
    constructor(services) {
        super(services);

        const serverReply = this.services.applicationServerReply;

        this.onSourcesListReceived = this.onSourcesListReceived.bind(this);

        this.onSourceMetadataReceived = this.onSourceMetadataReceived.bind(this);

        this.testSources = this.testSources.bind(this);
        this.testSearch = this.testSearch.bind(this);

        serverReply.on(serverReply.registeredEvents().getSourcesList, this.onSourcesListReceived);
        serverReply.on(serverReply.registeredEvents().getSourceMetadata, this.onSourceMetadataReceived);
    }

    onSourcesListReceived(operationResult) {
        console.log(operationResult);

        _.each(operationResult.result, (source) => {
            this.services.applicationServer.requestSourceMetadata(operationResult.sessionId, source, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            });
        });
    }

    onSourceMetadataReceived(operationResult) {
        console.log(operationResult);
    }

    testSources(request, response) {
        this.services.applicationServer.requestSourcesList(request.sessionId, (error, result) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, result);
            }
        });
    }

    testSearch(request, response) {
        const viewId = request.params.viewId || 'b7ead923-9973-443a-9f44-5563d31b5073';
        const sampleId = 'ce81aa10-13e3-47c8-bd10-205e97a92d69';
        const user = request.user;

        async.waterfall([
            (callback) => {
                this.services.sessions.startForUser('valarie', 'password', callback);
            },

            (sessionId, callback) => {
                this._createAppServerSearchParams(sessionId, user, viewId, sampleId, callback);
            },

            (appServerRequestParams, callback) => {
                this.services.applicationServer.requestOpenSearchSession(appServerRequestParams.sessionId, appServerRequestParams, callback);
            }
        ], (error, result) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    result: result
                });
            }
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/sources', this.testSources);
        router.get('/search/:viewId', this.testSearch);
        return router;
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

module.exports = TestController;