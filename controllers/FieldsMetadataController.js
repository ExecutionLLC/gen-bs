'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class FieldsMetadataController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    getSampleMetadata(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }
        const user = request.user;
        const sampleId = request.params.sampleId;

        this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, (error, fieldsMetadata) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, fieldsMetadata);
            }
        });
    }

    getSourcesMetadata(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        this.services.fieldsMetadata.findSourcesMetadata((error, fieldsMetadata) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, fieldsMetadata);
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/sources', this.getSourcesMetadata.bind(this));
        router.get('/:sampleId', this.getSampleMetadata.bind(this));

        return router;
    }
}

module.exports = FieldsMetadataController;
