'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class FieldsMetadataController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    getSampleMetadata(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => {
                const user = request.user;
                const sampleId = request.params.sampleId;

                this.services.fieldsMetadata.findByUserAndSampleId(user, sampleId, callback);
            }
        ], (error, fieldsMetadata) => {
            this.sendErrorOrJson(response, error, fieldsMetadata);
        });
    }

    getSourcesMetadata(request, response) {
        if (!this.checkUserIsDefined(request, response)) {
            return;
        }

        this.services.fieldsMetadata.findSourcesMetadata((error, fieldsMetadata) => {
            this.sendErrorOrJson(response, error, fieldsMetadata);
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
