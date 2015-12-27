'use strict';

const _ = require('lodash');
const Express = require('express');

const ControllerBase = require('./ControllerBase');

class TestController extends ControllerBase {
    constructor(services) {
        super(services);

        const server = this.services.applicationServer;

        this.onSourcesListReceived = this.onSourcesListReceived.bind(this);
        this.sourcesListError = this.sourcesListError.bind(this);

        this.onSourceMetadataReceived = this.onSourceMetadataReceived.bind(this);
        this.sourceMetadataError = this.sourceMetadataError.bind(this);

        this.test = this.test.bind(this);

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

    sourcesListError(error) {
        console.log(error);
    }

    sourceMetadataError(error) {
        console.log(error);
    }

    test(request, response) {
        this.services.applicationServer.requestSourcesList(request.sessionId, (error, result) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, result);
            }
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.test);
        return router;
    }
}

module.exports = TestController;