'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const FieldsService = require('./FieldsService.js');
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
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.services.applicationServer.uploadSample(session, user,
                localFileInfo.localFilePath, localFileInfo.originalFileName, callback),
            (operationId, callback) => this._createHistoryEntry(
                user,
                operationId,
                localFileInfo.originalFileName,
                (error) => callback(error, operationId)
            ),
            (operationId, callback) => this._loadAndVerifyPriority(
                user,
                (error, priority) => callback(error, operationId, priority)
            ),
            (operationId, priority, callback) => this.services.applicationServer.requestUploadProcessing(session,
                operationId, priority, (error) => callback(error, operationId))
        ], callback);
    }

    remove(user, itemId, callback) {
        async.waterfall([
            (callback) => this._checkUserIsSet(user, callback),
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.find(user, itemId, callback),
            (item, callback) => this.theModel.remove(user.id, itemId, (error) => callback(error, item)),
            (item, callback) => {
                this.theModel.findSamplesByVcfFileIds(
                    user.id,
                    [item.vcfFileId],
                    true,
                    (error, samples) => callback(error, samples, item));
            },
            (samples, item, callback) => {
                if (samples.length == 0) {
                    async.waterfall([
                        (callback) => this.services.sampleUploadHistory.find(user.id, item.vcfFileId, callback),
                        (history, callback) => {
                            this.services.sampleUploadHistory.remove(user, history.id, callback);
                        }
                    ], (error) => callback(error, item));
                } else {
                    callback(null, item);
                }
            },
        ], callback);
    }

    createMetadataForUploadedSample(user, vcfFileSampleId, appServerSampleFields, callback) {
        // Map AS fields metadata format into local.
        const sampleFields = _.map(appServerSampleFields,
            asField => FieldsService.createFieldMetadata(null, true, asField));
        this.theModel.attachSampleFields(user.id, user.language, vcfFileSampleId, sampleFields, callback);
    }

    initMetadataForUploadedSample(user, vcfFileId, vcfFileName, genotypes, callback) {
        const samples = _.map(genotypes, genotype => {
            return {
                id: Uuid.v4(),
                fileName: vcfFileName,
                vcfFileId,
                genotypeName: genotype
            }
        });
        this.theModel.addSamples(user.id, user.language, samples, callback);
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
                    callback(null, maxCountPerUser - activeCount);
                } else {
                    callback(new Error(`Too many uploads for user ${user.id} (${user.email})`));
                }
            }
        ], callback);
    }

    _createHistoryEntry(user, operationId, fileName, callback) {
        this.services.sampleUploadHistory.add(user, user.language, {
            id: operationId,
            fileName,
            creator: user.id,
            status: SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
            progress: 0
        }, callback);
    }
}

module.exports = SamplesService;
