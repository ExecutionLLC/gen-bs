'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'importSourceMetadata';
const AS_DISCONNECTED_TIMEOUT = 5000;

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
        this.requestedSources = null;
    }

    execute(callback) {
        async.waterfall([
            (callback) => {
                this.waitForConnection = !this.services.applicationServer.isRPCConnected();
                if (this.waitForConnection) {
                    callback(new Error('RPC is not connected.'));
                } else {
                    this.services.sessions.findSystemSession(callback);
                }
            },
            (systemSession, callback) => {
                this.services.applicationServer.requestSourcesList(systemSession.id, callback);
            },
            (result, callback) => {
                this.onCompleteCallback = callback;
            }
        ], callback);
    }

    calculateTimeout() {
        if (this.waitForConnection) {
            this.logger.warn('Waiting web socket connection for 5 seconds...');
            return AS_DISCONNECTED_TIMEOUT; // waiting for reconnection
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
                this._getMissingSourceNames(reply.result.sourcesList, callback);
            },
            (missingSourceNames, callback) => {
                if (missingSourceNames.length > 0) {
                    async.waterfall([
                        (callback) => {
                            this.services.sessions.findSystemSession(callback);
                        },
                        (systemSession, callback) => {
                            // Metadata will be received without source names in the same order,
                            // so save the list here to find the source name later.
                            this.requestedSources = missingSourceNames;
                            this.services.applicationServer.requestSourceMetadata(systemSession.id, missingSourceNames, callback);
                        }
                    ], callback);
                } else {
                    this.logger.info('There are no sources to import.');
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
                const sourcesMetadata = reply.result.sourcesMetadata;
                if (sourcesMetadata.error) {
                    callback(sourcesMetadata.error);
                } else {
                    callback(null, sourcesMetadata);
                }
            },
            (sourcesMetadata, callback) => {
                async.map(sourcesMetadata, (sourceMetadata, callback) => {
                    async.waterfall([
                        (callback) => {
                            if (_.isNull(this.requestedSources)) {
                                callback(new Error('Internal error: requested sources is not defined.'));
                            } else {
                                const sourceName = this.requestedSources[sourcesMetadata.indexOf(sourceMetadata)];
                                callback(null, sourceName);
                            }
                        },
                        (sourceName, callback) => {
                            this._processSourceMetadata(sourceName, sourceMetadata, (error, result) => {
                                if (error) {
                                    this.logger.error('Error import source ' + sourceName + ': ' + error)
                                } else {
                                    this.logger.info('Source imported: ' + sourceName);
                                }
                                callback(error, result);
                            });
                        }
                    ], callback);
                }, callback);
            }
        ], (error) => {
            this._complete(error);
        });
    }

    _complete(error) {
        this.requestedSources = null;
        this.onCompleteCallback(error);
    }

    _processSourceMetadata(sourceName, sourceMetadata, callback) {
        async.map(sourceMetadata, (fieldMetadata, callback) => {
            const metadata = this.services.fieldsMetadata.createFieldMetadata(sourceName, false, fieldMetadata);
            this.models.fields.add(this.config.defaultLanguId, metadata, callback);
        }, callback);
    }
}

module.exports = ImportSourceMetadataTask;