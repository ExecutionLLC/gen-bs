'use strict';

const _ = require('lodash');
const Express = require('express');

const ControllerBase = require('./ControllerBase');

class TestController extends ControllerBase {
    constructor(services) {
        super(services);

        const server = this.services.applicationServer;

        this.onSourcesListReceived = this.onSourcesListReceived.bind(this);

        this.onSourceMetadataReceived = this.onSourceMetadataReceived.bind(this);

        this.testSources = this.testSources.bind(this);
        this.testSearch = this.testSearch.bind(this);

        server.on(server.registeredEvents().getSourcesList, this.onSourcesListReceived);
        server.on(server.registeredEvents().getSourceMetadata, this.onSourceMetadataReceived);
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

        this.services.sessions.startForUser('valarie', 'password', (error, sessionId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.services.samples.find(sampleId, (error, sample) => {
                    if (error) {
                        this.sendInternalError(response, error);
                    } else {
                        this.services.views.find(viewId, (error, view) => {
                            if (error) {
                                this.sendInternalError(response, error);
                            } else {
                                this.services.applicationServer.requestOpenSearchSession(sessionId, {

                                }, (error) => {
                                    this.sendInternalError(response, error);
                                });
                            }
                        });
                    }
                });
            }
        });

        this.sendJson(response, {status: 'OK'});
    }

    createRouter() {
        const router = new Express();
        router.get('/sources', this.testSources);
        router.get('/search/:viewId', this.testSearch);
        return router;
    }
}

module.exports = TestController;