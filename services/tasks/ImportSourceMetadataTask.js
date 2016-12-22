'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');
const FieldsMetadataService = require('../FieldsService.js');

const TASK_NAME = 'importSourceMetadata';

class ImportSourceMetadataTask extends SchedulerTaskBase {
    constructor(services, models) {
        const isEnabled = services.config.scheduler.tasks[TASK_NAME].isEnabled;
        const taskTimeout = services.config.scheduler.tasks[TASK_NAME].taskTimeout;
        super(TASK_NAME, isEnabled, taskTimeout, services, models);

        const appServerReplyEvents = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(appServerReplyEvents.onSourcesListReceived, this._onSourcesListReceived.bind(this));
        this.services.applicationServerReply.on(appServerReplyEvents.onSourceMetadataReceived, this._onSourceMetadataReceived.bind(this));

        this._onSourcesListReceived = this._onSourcesListReceived.bind(this);
        this._onSourceMetadataReceived = this._onSourceMetadataReceived.bind(this);

        this.waitForConnection = false;
        this.completed = false;

        this.requestedSources = null;
        this.waitForConnectionTimeout = this.config.scheduler.tasks.importSourceMetadata.reconnectTimeout;
    }

    execute(callback) {
        async.waterfall([
            (callback) => {
                this.waitForConnection = !this.services.applicationServer.isRPCConnected();
                if (this.waitForConnection) {
                    callback(new Error('RPC is not connected.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this.services.applicationServer.requestSourcesList(callback);
            },
            (result, callback) => {
                this.onCompleteCallback = callback;
            }
        ], callback);
    }

    calculateTimeout() {
        if (this.waitForConnection) {
            this.logger.warn('Waiting web socket connection for ' + this.waitForConnectionTimeout + ' milliseconds...');
            return this.waitForConnectionTimeout; // waiting for reconnection
        } else {
            return super.calculateTimeout();
        }
    }

    _getMissingSourceNames(availableSourceNames, callback) {
        async.waterfall([
            (callback) => {
                this.models.fields.getExistingSourceNames(callback);
            },
            (existingSourceNames, callback) => {
                const missingSourceNames = _.xor(availableSourceNames, existingSourceNames);
                callback(null, missingSourceNames);
            }
        ], callback);
    }

    _onSourcesListReceived(reply) {
        async.waterfall([
            (callback) => {
                if (!_.isNull(this.requestedSources)) {
                    callback(new Error('Internal error: requested sources already defined.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                this.services.fields.addMissingSourceReferences(reply.result, callback);
            },
            (availableSources, callback) => {
                const availableSourceNames = _.map(availableSources, 'sourceName');
                this._getMissingSourceNames(availableSourceNames, callback);
            },
            (missingSourceNames, callback) => {
                if (missingSourceNames.length > 0) {
                    // Metadata will be received without source names in the same order,
                    // so save the list here to find the source name later.
                    this.logger.info('Importing sources ' + JSON.stringify(missingSourceNames, null, 2));
                    this.requestedSources = missingSourceNames;
                    this.services.applicationServer.requestSourceMetadata(missingSourceNames, callback);
                } else {
                    this.logger.debug('There are no sources to import.');
                    this.completed = true;
                    callback(null);
                }
            }
        ], (error) => {
            this._complete(error);
        });
    }

    _onSourceMetadataReceived(reply) {
        async.waterfall([
            (callback) => {
                if (_.isNull(this.requestedSources)) {
                    callback(new Error('Internal error: requested sources is not defined.'));
                } else {
                    callback(null);
                }
            },
            (callback) => {
                const {error, result} = reply;
                callback(error, result);
            },
            (sourcesMetadata, callback) => {
                // Indices of the returned sources are the same as in the requested sources array.
                const mappedSourcesMetadata = _.map(sourcesMetadata, (sourceMetadata, index) => {
                    const sourceName = this.requestedSources[index];
                    return {
                        sourceName,
                        fields: sourceMetadata.fields,
                        reference: sourceMetadata.reference
                    };
                });
                callback(null, mappedSourcesMetadata);
            },
            (mappedSourcesMetadata, callback) => {
                async.map(mappedSourcesMetadata, (sourceMetadata, callback) => {
                    const sourceName = sourceMetadata.sourceName;
                    this._processSourceMetadata(sourceName, sourceMetadata.fields, (error, result) => {
                        if (error) {
                            this.logger.error('Error import source ' + sourceName + ': ' + error);
                        } else {
                            this.logger.info('Source imported: ' + sourceName);
                        }
                        callback(error, result);
                    });
                }, callback);
            }
        ], (error) => {
            this.requestedSources = null;
            this.completed = true;
            this._complete(error);
        });
    }

    _complete(error) {
        if (this.completed || error) {
            this.completed = false;
            this.onCompleteCallback(error);
        }
    }

    _processSourceMetadata(sourceName, appServerFieldsMetadata, callback) {
        const fieldsMetadata = _.map(
            appServerFieldsMetadata,
            appServerFieldMetadata => FieldsMetadataService.createFieldMetadata(
                sourceName,
                false,
                appServerFieldMetadata
            )
        );
        this.services.fields.addSourceFields(this.config.defaultLanguId, fieldsMetadata, callback);
    }
}

module.exports = ImportSourceMetadataTask;