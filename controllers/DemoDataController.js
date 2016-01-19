'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');
const getUserDataResult = require('../test_data/get_user_data-result.json');

/**
 * Contains logic of obtaining data for demo mode.
 * Expects the demo user to be set as part of the request.
 * */
class DemoDataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getDemoUserData = this.getDemoUserData.bind(this);
        this.getFieldsMetadata = this.getFieldsMetadata.bind(this);
    }

    getDemoUserData(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        // TODO: Combine and send back the demo user data.
        this.sendJson(response, getUserDataResult);
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
        router.get('/', this.getDemoUserData);
        return router;
    }
}

module.exports = DemoDataController;