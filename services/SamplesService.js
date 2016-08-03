'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const FieldsMetadataService = require('./FieldsMetadataService.js');
const EditableFields = require('./templates/metadata/editable-metadata.json');
const CollectionUtils = require('../utils/CollectionUtils');
const AppServerEvents = require('./external/applicationServer/AppServerEvents');

class SamplesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.samples);

        this.editableFields = CollectionUtils.createHashByKey(EditableFields, 'id');
    }

    add(user, languId, sample, callback) {
        callback(new Error('The method is not supported.'));
    }

    update(user, sample, callback) {
        async.waterfall([
            (callback) => this._ensureOnlyEditableFieldsHaveValues(sample, callback),
            (callback) => super.update(user, sample, callback)
        ], callback);
    }

    /**
     * Sends sample to application server for processing.
     * */
    upload(session, user, localFileInfo, callback) {
        this.logger.debug('Uploading sample: ' + JSON.stringify(localFileInfo, null, 2));
        const sampleId = Uuid.v4();
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.services.applicationServer.uploadSample(session, sampleId, user,
                localFileInfo.localFilePath, localFileInfo.originalFileName, callback),
            (operationId, callback) => this.services.applicationServer.requestSampleProcessing(session,
                operationId, sampleId, callback)
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

        this.theModel.addSampleWithFields(user.id, user.language, sample, fieldsMetadata, callback);
    }

    makeSampleIsAnalyzedIfNeeded(userId, sampleId, callback) {
        if (!this.services.config.disableMakeAnalyzed) {
            this.theModel.makeSampleIsAnalyzedIfNeeded(userId, sampleId, callback);
        } else {
            callback(null, false);
        }
    }

    _ensureOnlyEditableFieldsHaveValues(sample, callback) {
        const values = sample.values;
        async.waterfall([
            (callback) => {
                if (!values) {
                    callback(new Error('Sample metadata should have "values" property.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                const onlyEditableHaveValues = _.all(
                    values,
                    value => this.editableFields[value.fieldId] || !value.fieldValue
                );

                if (!onlyEditableHaveValues) {
                    callback(new Error('Only editable fields can have a value.'));
                } else {
                    callback(null);
                }
            }
        ], callback);

    }
}

module.exports = SamplesService;
