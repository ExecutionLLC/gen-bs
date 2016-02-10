'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

/**
 * Contains logic of obtaining data for demo mode.
 * Expects the demo user to be set as part of the request.
 * */
class DemoDataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getFieldsMetadata = this.getFieldsMetadata.bind(this);
    }

    getFieldsMetadata(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        const user = request.user;
        this.services.applicationServer.getSampleMetadata(user, (error, fieldsMetadata) => {
            if (error) {
                this.sendError(response, error);
            } else {
                this.sendJson(response, fieldsMetadata);
            }
        });
    }

    createRouter() {
        const router = new Express();
        router.get('/', this.getFieldsMetadata);
        return router;
    }
}

module.exports = DemoDataController;