'use strict';

const _ = require('lodash');
const Express = require('express');

const ControllerBase = require('./ControllerBase');

class TestController extends ControllerBase {
    constructor(services) {
        super(services);

        const server = this.services.applicationServer;

        this.sourcesListRecieved = this.sourcesListRecieved.bind(this);
        this.sourcesListError = this.sourcesListError.bind(this);

        this.sourceMetadataRecieved = this.sourceMetadataRecieved.bind(this);
        this.sourceMetadataError = this.sourceMetadataError.bind(this);

        this.test = this.test.bind(this);

        server.registerEvent(server.registeredEvents().sourcesList.event, this.sourcesListRecieved);
        server.registerEvent(server.registeredEvents().sourcesList.error, this.sourcesListError);

        server.registerEvent(server.registeredEvents().sourceMetadata.event, this.sourceMetadataRecieved);
        server.registerEvent(server.registeredEvents().sourceMetadata.error, this.sourceMetadataError);
    }

    sourcesListRecieved(data) {
        console.log(data);

        _.each(data, (source) => {
            this.services.applicationServer.requestSourceMetadata(source, (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                }
            }, this);
        });
    }

    sourceMetadataRecieved(data) {
        console.log(data);
    }

    sourcesListError(error) {
        console.log(error);
    }

    sourceMetadataError(error) {
        console.log(error);
    }

    test(request, response) {
        this.services.applicationServer.requestSourcesList((error, result) => {
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