'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./base/ControllerBase');

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

                this.services.fields.findByUserAndSampleId(user, sampleId, callback);
            }
        ], (error, fieldsMetadata) => {
            this.sendErrorOrJson(response, error, fieldsMetadata);
        });
    }

    getAll(request, response) {
        async.waterfall([
            (callback) => this.checkUserIsDefined(request, callback),
            (callback) => this.services.fields.findAll(callback)
        ], (error, fieldsMetadata) => {
            this.sendErrorOrJson(response, error, fieldsMetadata);
        });
    }

    createRouter() {
        const router = new Express();

        router.get('/:sampleId', this.getSampleMetadata.bind(this));
        router.get('/', this.getAll.bind(this));

        return router;
    }
}

module.exports = FieldsMetadataController;
