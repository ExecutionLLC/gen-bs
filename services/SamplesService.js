'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');
const fs = require('fs');

const UserEntityServiceBase = require('./UserEntityServiceBase');
const FieldsService = require('./FieldsService.js');
const EditableFields = require('../database/defaults/templates/metadata/editable-metadata.json');
const CollectionUtils = require('../utils/CollectionUtils');
const {
    SAMPLE_UPLOAD_STATUS,
    WS_SAMPLE_UPLOAD_STATE
} = require('../utils/Enums');
const AppServerEvents = require('./external/applicationServer/AppServerEvents');
const ErrorUtils = require('../utils/ErrorUtils');

class SamplesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.samples);

        this.editableFields = CollectionUtils.createHashByKey(EditableFields, 'id');
    }

    add(user, languageId, sample, callback) {
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
    upload(user, localFileInfo, fileId, sampleList, callback) {
        this.logger.debug('Uploading sample: ' + JSON.stringify(localFileInfo, null, 2));
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this._uploadSample(localFileInfo.localFilePath, fileId, callback),
            (fileId, callback) => {
                if (!sampleList || !sampleList.length) {
                    sampleList = [null]; // add null item to create single unnamed sample in case when VCF is valid and contains no genotype name
                }
                this.initMetadataForUploadedSample(user, fileId, localFileInfo.originalFileName, sampleList, null, (error, sampleIds) => {
                    callback(error, fileId, sampleIds);
                });
            },
            (fileId, sampleIds, callback) => this.services.applicationServer.uploadSample(user,
                fileId, localFileInfo.originalFileName, (error, operationId) => {
                    callback(error, operationId, sampleIds);
                }),
            (operationId, sampleIds, callback) => this._loadAndVerifyPriority(
                user,
                (error, priority) => callback(error, operationId, sampleIds, priority)
            ),
            (operationId, sampleIds, priority, callback) => this.services.applicationServer.requestUploadProcessing(user.id,
                operationId, priority, (error) => callback(error, operationId, sampleIds))
        ], callback);
    }

    _uploadSample(sampleLocalPath, fileId, callback) {
        const fileStream = fs.createReadStream(sampleLocalPath);
        this.services.objectStorage.addSampleFile(fileId, fileStream,
            (error, result) => callback(error, fileId)
        );
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
            }
        ], callback);
    }

    createMetadataForUploadedSample(user, vcfFileSampleId, appServerSampleFields, callback) {
        // Map AS fields metadata format into local.
        const sampleFields = _.map(appServerSampleFields,
            asField => this.services.fields.createFieldMetadata(null, true, asField));
        this.theModel.attachSampleFields(user.id, user.language, vcfFileSampleId, sampleFields, callback);
    }

    initMetadataForUploadedSample(user, vcfFileId, vcfFileName, genotypes, uploadState, callback) {
        const samples = _.map(genotypes, genotype => {
            return {
                id: Uuid.v4(),
                fileName: vcfFileName,
                vcfFileId,
                genotypeName: genotype,
                uploadState: uploadState || WS_SAMPLE_UPLOAD_STATE.UNCONFIRMED
            };
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

    /**
     * This function updates the list of samples that are in the VCF file being uploaded.
     * Before this call, the DB may contain samples that was received by trivial VCF-header parsing on WS.
     * If the DB contains entries that are not in {sampleNames}, they are considered wrong and will
     * be marked as NOT_FOUND.
     * If the {sampleNames} contains entries that are not in the DB yet, they will be added to DB.
     *
     * @param {Object} user - Current user object.
     * @param {number} vcfFileId - Id of the VCF file currently being uploaded.
     * @param {string} vcfFileName - VCF file name
     * @param {Array} sampleNames - Array of the sample names that was received after analysis from AS.
     * @param {Function} callback - callback (error, samples)
     */
    updateSamplesForVcfFile(user, vcfFileId, vcfFileName, sampleNames, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.theModel.findSamplesByVcfFileIds(user.id, [vcfFileId], true,
                (error, existingSamples) => callback(error, existingSamples)),
            (existingSamples, callback) => {
                const samplesWithNewState = _.map(existingSamples, (sample) => {
                    return Object.assign({}, sample, {
                        uploadState: _.includes(sampleNames, sample.genotypeName)
                            ? WS_SAMPLE_UPLOAD_STATE.COMPLETED
                            : WS_SAMPLE_UPLOAD_STATE.NOT_FOUND
                    });
                });
                async.map(samplesWithNewState, (sample, callback) => {
                    return this.update(user, sample, callback);
                }, (error, result) => callback(error, result));
            },
            (items, callback) => this.theModel.findSamplesByVcfFileIds(user.id, [vcfFileId], true,
                (error, existingSamples) => callback(error, existingSamples)),
            (existingSamples, callback) => {
                const newSamples = _.filter(sampleNames, newSample => !_.some(existingSamples, ['genotypeName', newSample]));
                if (newSamples.length) {
                    this.initMetadataForUploadedSample(user, vcfFileId, vcfFileName, newSamples,
                        WS_SAMPLE_UPLOAD_STATE.COMPLETED, (error, sampleIds) => callback(error));
                } else {
                    callback(null);
                }
            },
            (callback) => this.theModel.findSamplesByVcfFileIds(user.id, [vcfFileId], true,
                (error, samples) => callback(error, samples))
        ], callback);
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

    createHistoryEntry(user, fileName, error, callback) {
        const id = Uuid.v4();
        this.services.sampleUploadHistory.add(user, user.language, {
            id,
            fileName,
            creator: user.id,
            status: error ? SAMPLE_UPLOAD_STATUS.ERROR : SAMPLE_UPLOAD_STATUS.IN_PROGRESS,
            progress: 0,
            error: error ? ErrorUtils.createInternalError(error) : null
        }, (error) => callback(error, id));
    }
}

module.exports = SamplesService;
