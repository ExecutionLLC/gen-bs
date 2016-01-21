'use strict';

const _ = require('lodash');
const async = require('async');

const FsUtils = require('../utils/FileSystemUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const FieldsMetadataService = require('../services/FieldsMetadataService');

/**
 * Imports initial data on the service start.
 * */
class InitialDataImportManager {
    constructor(models, config, logger) {
        this.models = models;
        this.config = config;
        this.logger = logger;
    }

    execute(callback) {
        const defaultsDir = './defaults';

        let result = {};
        async.waterfall([
            (cb) => {
                const languDir = defaultsDir + '/langu';
                this._importFiles(languDir, this._importLangu, cb);
            },
            (langu, cb) => {
                result.langu = langu;

                const usersDir = defaultsDir + '/users';
                this._importFiles(usersDir, this._importUsers, cb);
            },
            (users, cb) => {
                result.users = users;

                const keywordsDir = defaultsDir + '/keywords';
                this._importFiles(keywordsDir, this._importKeywords, cb);
            },
            (keywords, cb) => {
                result.keywords = keywords;

                const viewsDir = defaultsDir + '/views';
                this._importFiles(viewsDir, this._importViews, cb);
            },
            (views, cb) => {
                result.views = views;

                const metadataDir = defaultDir + '/metadata';
                this._importFiles(metadataDir, this._importFieldsMetadata, cb);
            },
            (metadata, cb) => {
                result.metadata = metadata;

                const samplesDir = defaultsDir + '/samples';
                this._importFiles(samplesDir, this._importSample, cb);
            },
            (samples, cb) => {
                result.samples = samples;

                console.log(result);
                cb(null, result);
            }
        ], callback);
    }

    _importFiles(importPath, importMethod, callback) {
        FsUtils.getAllFiles(importPath, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                async.map(files, (file, cb) => {
                    importMethod(file, cb);
                }, callback);
            }
        });
    }

    _importLangu(languFilePath, callback) {
        const languagesString = FsUtils.getFileContentsAsString(languFilePath);
        const languages = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(languagesString));
        async.map(languages, (langu, cb) => {
            this.models.langu.add(langu, cb)
        }, callback);
    }

    _importUsers(usersFilePath, callback) {
        const usersString = FsUtils.getFileContentsAsString(usersFilePath);
        const users = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(usersString));
        async.map(users, (user, cb) => {
            this.models.user.addWithId(user, user.defaultLanguId, cb)
        }, callback);
    }

    _importKeywords(keywordsFilePath, callback) {
        const keywordsString = FsUtils.getFileContentsAsString(keywordsFilePath);
        const keywords = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(keywordsString));
        async.map(keywords, (keyword, cb) => {
            this.models.keywords.addWithId(this.config.defaultLanguId, keyword, cb)
        }, callback);
    }

    _importViews(viewFilePath, callback) {
        const viewsString = FsUtils.getFileContentsAsString(viewFilePath);
        const views = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(viewsString));
        async.map(views, (view, cb) => {
            this.models.views.addWithId(null, this.config.defaultLanguId, view, cb)
        }, callback);
    }

    _importSample(sampleMetadataFilePath, callback) {
        const sampleId = this._getSampleIdFromFilePath(sampleMetadataFilePath);
        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(sampleFieldsString));

        const result = {};
        async.waterfall([
            (cb) => {
                this.models.samples.addWithId(null, this.config.defaultLanguId, sampleFields.sample, cb);
            },
            (id, cb) => {
                result.sample = id;
                this._importMetadata(sampleFields.fields, cb);
            },
            (fieldIds, cb) => {
                result.fields = fieldIds;
                cb(null, result);
            }
        ], callback);
    }

    _getSampleIdFromFilePath(sampleMetadataFilePath) {
        const prefix = 'metadata_';
        const sampleFileName = FsUtils.getFileName(sampleMetadataFilePath);
        return sampleFileName.startsWith(prefix) ? sampleFileName.substr(prefix.length) : sampleFileName;
    }

    _importFieldsMetadata(fieldMetadataFilePath, callback) {
        const fieldMetadataString = FsUtils.getFileContentsAsString(fieldMetadataFilePath);
        const metadata = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(fieldMetadataString));
        this._importMetadata(metadata, callback);
    }

    _importMetadata(fieldsMetadata, callback) {
        async.map(fieldsMetadata, (metadata, cb) => {
            this.models.fields.addWithId(this.config.defaultLanguId, metadata, cb)
        }, callback);
    }
}

module.exports = InitialDataImportManager;