'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'ImportSourceMetadata';

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
        this.requestedSources = [];
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
            return 5000; // waiting for 5 seconds
        } else {
            return super.calculateTimeout();
        }
    }

    _onSourcesListReceived(reply) {
        async.waterfall([
            (callback) => {
                this.models.fields.findSourcesMetadata(callback);
            },
            (sourcesMetadata, callback) => {
                const repliedSourcesList = reply.result.sourcesList;
                const databaseSourcesList = _.map(_.uniq(_.pluck(sourcesMetadata, 'sourceName')), (source) => {
                    return source + '.h5';
                });
                const sourcesList = _.xor(repliedSourcesList, databaseSourcesList);
                callback(null, sourcesList);
            },
            (sourcesList, callback) => {
                if (sourcesList.length > 0) {
                    this.services.sessions.findSystemSession((error, systemSession) => {
                        if (error) {
                            callback(error);
                        } else {
                            this.requestedSources = _.map(sourcesList, (source) => {
                                return source.replace('.h5', '');
                            });
                            this.this.services.applicationServer.requestSourceMetadata(systemSession.id, sourcesList, callback);
                        }
                    });
                } else {
                    this.logger.info(this.name + ': there are no sources to import.');
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
                    const sourceName = this.requestedSources[sourcesMetadata.indexOf(sourceMetadata)];
                    this._processSourceMetadata(sourceName, sourceMetadata, (error, result) => {
                        if (error) {
                            this.logger.error('Error import source ' + sourceName + ': ' + error)
                        } else {
                            this.logger.info('Source imported: ' + sourceName);
                        }
                        callback(error, result);
                    });
                }, callback);
            }
        ], (error) => {
            this._complete(error);
        });
    }

    _complete(error) {
        this.requestedSources = [];
        this.onCompleteCallback(error);
    }

    _processSourceMetadata(sourceName, sourceMetadata, callback) {
        async.forEachOf(sourceMetadata, (fieldMetadata, fieldName, callback) => {
            const dataToInsert = {
                name: fieldName,
                sourceName: sourceName,
                valueType: fieldMetadata.type,
                isMandatory: fieldMetadata.isMandatory,
                isEditable: false,
                description: fieldMetadata.desc,
                dimension: fieldMetadata.num
            };
            this.models.fields.add(this.config.defaultLanguId, dataToInsert, callback);
        }, callback);
    }
}

module.exports = ImportSourceMetadataTask;