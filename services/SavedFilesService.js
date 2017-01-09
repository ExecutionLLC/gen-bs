'use strict';

const assert = require('assert');
const async = require('async');
const _ = require('lodash');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class SavedFilesService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.savedFiles);
    }

    init() {
        this.bucketName = this.services.objectStorage.getStorageSettings().savedFilesBucket;
        assert.ok(this.bucketName);
    }

    add(user, languId, fileMetadata, fileStream, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this._createAndUploadFile(user, languId, fileMetadata, fileStream, callback),
            (fileId, callback) => this.find(user, fileId, callback)
        ], callback);
    }

    download(user, languId, fileId, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => this.models.savedFiles.find(user.id, fileId, (error) => callback(error)),
            (callback) => callback(null, this._generateBucketKeyForFile(fileId)),
            (keyName, callback) => this.services.objectStorage.createObjectStream(this.bucketName, keyName, callback)
        ], (error, readStream) => callback(error, readStream));
    }

    find(user, savedFileId, callback) {
        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => super.find(user, savedFileId, callback),
            (savedFile, callback) => this._loadAdditionalEntities(user, [savedFile], callback)
        ], (error, savedFile) => callback(error, savedFile[0]));
    }

    findAll(user, callback) {
        // Demo users currently don't have any access to saved files.
        if (this.services.users.isDemoUserId(user.id)) {
            callback(null, []);
            return;
        }

        async.waterfall([
            (callback) => this.services.users.ensureUserIsNotDemo(user.id, callback),
            (callback) => super.findAll(user, callback),
            (savedFiles, callback) =>  this._loadAdditionalEntities(user, savedFiles, callback)
        ], callback);
    }

    update() {
        throw new Error('Operation is not supported');
    }

    _createAndUploadFile(user, languId, fileMetadata, fileStream, callback) {
        let transactionState = null;
        async.waterfall([
            (callback) => this.models.savedFiles.startAddition(user.id, languId, fileMetadata, callback),
            (fileId, transaction, callback) => {
                transactionState = transaction;
                const keyName = this._generateBucketKeyForFile(fileId);
                this.services.objectStorage.uploadObject(this.bucketName, keyName, fileStream,
                    (error) => callback(error, fileId));
            }
        ], (error, fieldId) => {
            if (transactionState) {
                this.models.savedFiles.completeAddition(transactionState, error, fieldId, callback)
            } else {
                callback(error, fieldId);
            }
        });
    }

    _generateBucketKeyForFile(fileId) {
        return 'saved_file_' + fileId;
    }

    _loadAdditionalEntities(user, savedFiles, callback) {
        const analysisIds = _.uniq(_.map(savedFiles, savedFile => savedFile.analysisId));
        async.waterfall([
                (callback) => {
                    this.services.analysis.findMany(user, analysisIds, callback);
                },
                (analyses, callback) => {
                    const viewIds = _.uniq(_.map(analyses, analysis => analysis.viewId));
                    const filterIds = _.uniq(_.map(analyses, analysis => analysis.filterId));
                    const sampleIds = _.uniq(_.flatMap(analyses, analysis => {
                        return _.map( analysis.samples, sample => sample.id)
                    }));
                    const modelIds = _.filter(_.uniq(_.map(analyses, analysis => analysis.modelId)), modelId => !_.isNull(modelId));
                    async.parallel({
                            analyses: async.constant(analyses),
                            views: (callback) => this.services.views.findMany(user, viewIds, callback),
                            filters: (callback) => this.services.filters.findMany(user, filterIds, callback),
                            models: (callback) => this.services.models.findMany(user, modelIds, callback),
                            samples: (callback) => this.services.samples.findMany(user, sampleIds, callback)
                        },callback
                    );
                },
                // Build saved file with view, filter and sample.
                ({views, filters, models, samples, analyses}, callback) => {
                    callback(null,
                        _.map(savedFiles, savedFile => {
                            const analysis = _.find(analyses, analysis => analysis.id == savedFile.analysisId);
                            const view = _.find(views, view => view.id == analysis.viewId);
                            const filter = _.find(filters, filter => filter.id == analysis.filterId);
                            const model = _.find(models, model => model.id == analysis.modelId);
                            const savedFileSamples = _.map(analysis.samples, analysisSample => {
                                const sample = _.find(samples, sample => sample.id == analysisSample.id);
                                return {
                                    id: analysisSample.id,
                                    type: analysisSample.type,
                                    fileName: sample.fileName,
                                    genotypeName: sample.genotypeName
                                }
                            });
                            return {
                                id: savedFile.id,
                                name: savedFile.name,
                                totalResults: savedFile.totalResults,
                                timestamp: savedFile.timestamp,
                                view: {
                                    id: view.id,
                                    name: view.name
                                },
                                filter: {
                                    id: filter.id,
                                    name: filter.name
                                },
                                model: !model ? null : {
                                    id: model.id,
                                    name: model.name
                                },
                                analysis: {
                                    id: analysis.id,
                                    name: analysis.name
                                },
                                samples: savedFileSamples
                            }
                            console.log(savedFile);
                        })
                    )
                }
            ],
            (error, result) => callback(error, result));
    }
}

module.exports = SavedFilesService;
