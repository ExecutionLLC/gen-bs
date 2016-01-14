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
                this._importLangFiles(languDir, cb);
            },
            (langu, cb) => {
                result.langu = langu;

                const usersDir = defaultsDir + '/users';
                this._importUserFiles(usersDir, cb);
            },
            (users, cb) => {
                result.users = users;

                const viewsDir = defaultsDir + '/views';
                this._importViewFiles(viewsDir, cb);
            },
            (views, cb) => {
                result.views = views;

                const samplesDir = defaultsDir + '/samples';
                this._importSamples(samplesDir, cb);
            },
            (samples, cb) => {
                result.samples = samples;

                console.log(result);
                cb(null, result);
            }
        ], callback);
    }

    _importLangFiles(languDir, callback) {
        FsUtils.getAllFiles(languDir, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                async.map(files, (file, cb) => {
                    this._importLangu(file, cb);
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

    _importUserFiles(userDir, callback) {
        FsUtils.getAllFiles(userDir, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                async.map(files, (file, cb) => {
                    this._importUsers(file, cb);
                }, callback);
            }
        });
    }

    _importUsers(usersFilePath, callback) {
        const usersString = FsUtils.getFileContentsAsString(usersFilePath);
        const users = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(usersString));
        async.map(users, (user, cb) => {
            this.models.user.addWithId(user, user.defaultLanguId, cb)
        }, callback);
    }

    _importViewFiles(viewsDir, callback) {
        FsUtils.getAllFiles(viewsDir, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                async.map(files, (file, cb) => {
                    this._importViews(file, cb);
                }, callback);
            }
        });
    }

    _importViews(viewFilePath, callback) {
        const viewsString = FsUtils.getFileContentsAsString(viewFilePath);
        const views = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(viewsString));
        async.map(views, (view, cb) => {
            this.models.views.addWithId(null, this.config.defaultLanguId, view, cb)
        }, callback);
    }

    _importSamples(samplesDir, callback) {
        FsUtils.getAllFiles(samplesDir, '.json', (error, files) => {
            if (error) {
                callback(error);
            } else {
                async.map(files, (file, cb) => {
                    this._importSample(file, cb);
                }, callback);
            }
        });
    }

    _importSample(sampleMetadataFilePath, callback) {
        const sampleId = this._getSampleIdFromFilePath(sampleMetadataFilePath);
        const sampleFieldsString = FsUtils.getFileContentsAsString(sampleMetadataFilePath);
        const sampleFields = ChangeCaseUtil.convertKeysToCamelCase(JSON.parse(sampleFieldsString));

        const result = {};
        async.waterfall([
            (cb) => {
                this.models.samples.addWithId(null, sampleFields.sample, cb);
            },
            (id, cb) => {
                result.sample = id;
                async.map(sampleFields.fields, (metadata, cb) => {
                    this.models.fields.addWithId(this.config.defaultLanguId, metadata, cb);
                }, cb);
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
}

module.exports = InitialDataImportManager;