'use strict';

const _ = require('lodash');
const async = require('async');

const ScheduleTaskBase = require('./ScheduleTaskBase');

const TASK_NAME = 'ImportSourceMetadata';
const TASK_TIMEOUT = 10; // Task timeout, in seconds

class ImportSourceMetadataTask extends ScheduleTaskBase {
    constructor(services, models) {
        super(TASK_NAME, TASK_TIMEOUT, services, models);

        const appServerReplyEvents = this.services.applicationServerReply.registeredEvents();
        this.services.applicationServerReply.on(appServerReplyEvents.onSourceListReceived, this._onServerReply.bind(this));

        this.requestSourcesList = this.services.applicationServer.requestSourcesList.bind(this);
    }

    execute(callback) {
        async.waterfall([
            (callback) => {
                this.services.sessions.findSystemSession(callback);
            },
            (systemSession, callback) => {
                this.requestSourcesList(systemSession.id, callback);
            },
            (result, callback) => {
                //console.log(JSON.stringify(sourcesList, null, 2));

                //callback(null, result);
            }
        ], callback);
    }

    _onServerReply(reply) {
        console.log(reply);


        //const sessionId = reply.sessionId;
        //const client = this._findClientBySessionId(sessionId);
        //if (client && client.ws) {
        //    client.ws.send(JSON.stringify(reply), null, (error) => {
        //        if (error) {
        //            console.error('Error sending client WS reply: ' + JSON.stringify(error));
        //        }
        //    });
        //} else {
        //    console.log('No client WS is found for session ' + sessionId);
        //}
    }

}

module.exports = ImportSourceMetadataTask;