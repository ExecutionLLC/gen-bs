'use strict';

const _ = require('lodash');
const async = require('async');

const SchedulerTaskBase = require('./SchedulerTaskBase');

const TASK_NAME = 'ImportSourceMetadata';
const TASK_TIMEOUT = 10; // Task timeout, in seconds

class ImportSourceMetadataTask extends SchedulerTaskBase {
    constructor(services, models) {
        super(TASK_NAME, TASK_TIMEOUT, services, models);

        //this.services.applicationServer.requestSourcesList = this.services.applicationServer.requestSourcesList.bind(this);
    }

    execute(callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findSystemSession(callback);
            },
            (systemSession, callback) => {
                this.services.applicationServer.requestSourcesList(systemSession.id, callback);
            },
            (sourcesList, callback) => {
                console.log(JSON.stringify(sourcesList, null, 2));

                callback(null, sourcesList);
            }
        ], callback);
    }
}

module.exports = ImportSourceMetadataTask;