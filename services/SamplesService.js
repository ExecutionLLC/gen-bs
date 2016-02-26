'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const FieldsMetadataService = require('./FieldsMetadataService.js');

class SamplesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.samples);
    }

    /**
     * Sends sample to application server for processing.
     * */
    upload(sessionId, user, localFileInfo, callback) {
        this.services.logger.info('Uploading sample: ' + JSON.stringify(localFileInfo, null, 2));
        const sampleId = Uuid.v4();
        async.waterfall([
            (callback) => this.services.applicationServer.uploadSample(sessionId, sampleId, user,
                localFileInfo.localFilePath, localFileInfo.originalFileName, callback),
            (operationId, callback) => this.services.applicationServer.requestSampleProcessing(sessionId, operationId, callback)
        ], callback);
    }

    createMetadataForUploadedSample(user, sampleId, sampleFileName, sampleReference, applicationServerFieldsMetadata, callback) {
        // Map AS fields metadata format into local.
        const fieldsMetadata = _.map(applicationServerFieldsMetadata,
            appServerFieldMetadata => FieldsMetadataService.createFieldMetadata(sampleId, true, appServerFieldMetadata));

        const sample = {
            id: sampleId,
            fileName: sampleFileName,
            hash: null
        };

        this.models.samples.addSampleWithMetadata(user.id, user.language, sample, fieldsMetadata, callback);
    }
}

module.exports = SamplesService;
