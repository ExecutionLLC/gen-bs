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

        this._importFiles = this._importFiles.bind(this);
        this._importLangu = this._importLangu.bind(this);
        this._importUsers = this._importUsers.bind(this);
        this._importFieldsMetadata = this._importFieldsMetadata.bind(this);
        this._importMetadata = this._importMetadata.bind(this);
        this._importKeywords = this._importKeywords.bind(this);
        this._importViews = this._importViews.bind(this);
        this._importFilters = this._importFilters.bind(this);
        this._importSample = this._importSample.bind(this);
        this._makeSampleValues = this._makeSampleValues.bind(this);
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

                const fieldsDir = defaultsDir + '/fields';
                this._importFiles(fieldsDir, this._importFieldsMetadata, cb);
            },
            (fields, cb) => {
                result.fields = fields;

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

                const samplesDir = defaultsDir + '/samples';
                this._importFiles(samplesDir, this._importSample, cb);
            },
            (samples, cb) => {
                result.samples = samples;

                const filtersDir = defaultsDir + '/filters';
                this._importFiles(filtersDir, this._importFilters, cb);
            },
            (filters, cb) => {
                result.filters = filters;

                console.log(JSON.stringify(result, null, 2));
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
            this.models.users.addWithId(user, user.language, cb)
        }, callback);
    }

    _importKeywords(keywordsFilePath, callback) {
        const keywordsString = FsUtils.getFileContentsAsString(keywordsFilePath);
        const keywords = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(keywordsString));
        async.map(keywords, (keyword, cb) => {
            this.models.keywords.addWithId(keyword, this.config.defaultLanguId, cb);
        }, callback);
    }

    _importViews(viewsFilePath, callback) {
        const viewsString = FsUtils.getFileContentsAsString(viewsFilePath);
        const views = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(viewsString));
        async.map(views, (view, cb) => {
            this.models.views.internalAdd(null, this.config.defaultLanguId, view, cb);
        }, callback);
    }

    _importFilters(filtersFilePath, callback) {
        const filtersString = FsUtils.getFileContentsAsString(filtersFilePath);
        const filters = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(filtersString));
        async.map(filters, (filter, cb) => {
            this.models.filters.internalAdd(null, this.config.defaultLanguId, filter, cb);
        }, callback);
    }

    _importSample(sampleMetadataFilePath, callback) {
        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(sampleFieldsString));

        let sample = sampleFields.sample;
        sample.values = this._makeSampleValues(sampleFields.fieldIds);
        this.models.samples.internalAdd(null, this.config.defaultLanguId, sampleFields.sample, callback);
    }

    _makeSampleValues(fieldIds) {
        return _.map(fieldIds, (fieldId) => {
            return {
                fieldId: fieldId,
                values: null
            };
        });
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
        async.map(fieldsMetadata, (fieldMetadata, cb) => {
            this.models.fields.addWithId(this.config.defaultLanguId, fieldMetadata, cb)
        }, callback);
    }
}

module.exports = InitialDataImportManager;