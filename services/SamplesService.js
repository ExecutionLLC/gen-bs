'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const FieldsMetadataService = require('./FieldsMetadataService.js');
const EditableFields = require('../database/defaults/templates/metadata/editable-metadata.json');
const CollectionUtils = require('../utils/CollectionUtils');
const {SAMPLE_UPLOAD_STATUS} = require('../utils/Enums');
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
            (operationId, callback) => this._createHistoryEntry(
                user,
                operationId,
                sampleId,
                localFileInfo.originalFileName,
                (error) => callback(error, operationId)
            ),
            (operationId, callback) => this._loadAndVerifyPriority(
                user,
                (error, priority) => callback(error, operationId, priority)
            ),
            (operationId, priority, callback) => this.services.applicationServer.requestSampleProcessing(session,
                operationId, sampleId, priority, (error) => callback(error, operationId))
        ], callback);
    }

    createMetadataForUploadedSample(user, sampleId, sampleFileName, sampleReference,
                                    appServerSampleFields, genotypes,
                                    asGenotypesFieldsNames, callback) {
        // Map AS fields metadata format into local.
        const sampleFields = _.map(appServerSampleFields,
            asField => FieldsMetadataService.createFieldMetadata(null, true, asField));

        const sample = {
            id: sampleId,
            fileName: sampleFileName,
            hash: null
        };

        this.theModel.addSamplesWithFields(user.id, user.language, sample, sampleFields, genotypes, callback);
    }

    makeSampleIsAnalyzedIfNeeded(userId, sampleId, callback) {
        if (!this.services.config.disableMakeAnalyzed) {
            this.theModel.makeSampleIsAnalyzedIfNeeded(userId, sampleId, callback);
        } else {
            callback(null, false);
        }
    }

    _loadAndVerifyPriority(user, callback) {
        async.waterfall([
            (callback) => this.services.sampleUploadHistory.countActive(user.id, callback),
            (activeCount, callback) => {
                const {maxCountPerUser} = this.config.samplesUpload;
                if (activeCount < maxCountPerUser) {
                    // More uploads - lower priority.
                    callback(null,  maxCountPerUser - activeCount);
                } else {
                    callback(new Error(`Too many uploads for user ${user.id} (${user.email})`));
                }
            }
        ], callback);
    }

    _createHistoryEntry(user, operationId, sampleId, fileName, callback) {
        this.services.sampleUploadHistory.add(user, user.language, {
            id: operationId,
            sampleId,
            fileName,
            userId: user.id,
            status: SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
            progress: 0
        }, callback);
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
                const onlyEditableHaveValues = _.every(
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
