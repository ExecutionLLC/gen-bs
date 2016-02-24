'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);

        this.sessions = {};
    }

    /**
     * Creates a new session for a user with the specified email.
     * Currently, also destroys existing sessions of the same user, if any.
     * */
    startForEmail(email, callback) {
        async.waterfall([
            (callback) => this.services.users.findIdByEmail(email, callback),
            (userId, callback) => {
                // Check and remove existing user session.
                let existingSession = _.find(this.sessions, session => session.userId === userId);
                if (existingSession && !this.services.config.allowMultipleUserSessions) {
                    this.destroySession(existingSession.id, (error) => {
                        if (error) {
                            this.logger.error('Error destroying existing session: %s', error);
                        } else {
                            this.logger.info('Existing session for user ' + email + ' is destroyed.');
                        }
                    });
                }
                callback(null, userId);
            },
            (userId, callback) => {
                // Create new session for user.
                this._createSession(userId, (error, session) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, session.id);
                    }
                });
            }
        ], callback);
    }

    /**
     * Starts demo user session.
     * There should be only few active demo sessions at one time.
     * */
    startDemo(callback) {
        this.services.users.findDemoUser((error, demoUser) => {
            if (error) {
                callback(error);
            } else {
                this._createSession(demoUser.id, (error, session) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, session.id);
                    }
                });
            }
        });
    }

    findById(sessionId, callback) {
        // TODO: Do dead sessions cleanup here.
        const session = this.sessions[sessionId];
        if (session) {
            callback(null, session.id);
        } else {
            callback(new Error('Session is not found.'));
        }
    }

    findSessionUserId(sessionId, callback) {
        this.findById(sessionId, (error, sessionId) => {
            if (error) {
                callback(error);
            } else {
                const session = this.sessions[sessionId];
                callback(null, session.userId);
            }
        })
    }

    destroySession(sessionId, callback) {
        const sessionDescriptor = this.sessions[sessionId];
        if (!sessionDescriptor) {
            callback(new Error('Session is not found'));
        } else {
            // Destroy the local session information.
            delete this.sessions[sessionId];

            // Clear active session operatations.
            this.services.operations.removeAll(sessionId, callback);
        }
    }

    /**
     * Returns all session ids.
     * */
    findAll(callback) {
        const sessionIds = _.keys(this.sessions);
        callback(null, sessionIds);
    }

    _createSession(userId, callback) {
        const sessionId = Uuid.v4();
        const session = {
            id: sessionId,
            userId,
            lastActivity: Date.now()
        };

        this.sessions[sessionId] = session;
        callback(null, session);
    }
}

module.exports = SessionService;