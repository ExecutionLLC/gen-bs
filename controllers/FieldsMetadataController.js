'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class FieldsMetadataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getFieldsMetadata = this.getFieldsMetadata.bind(this);
    }

    getFieldsMetadata(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }
        const user = request.user;
        const sampleId = 'get-sample-id-from-request';

        this.services.fieldsMetadata.findForUserBySampleId(user, sampleId, (error, fieldsMetadata) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                response.json(fieldsMetadata);
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/', this.getFieldsMetadata);

        return router;
    }
}

module.exports = FieldsMetadataController;
