'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class SessionService extends ServiceBase {
    constructor(services) {
        super(services);

        this.sessions = {};
    }

    /**
     * Creates a new session for the specified user with token.
     * Currently, also destroys existing sessions of the same user, if any.
     * */
    startForUser(userName, password, callback) {
        this.sessions.tokens.login(userName, password, (error, tokenDescriptor) => {
            if (error) {
                callback(error);
            } else {
                const token = tokenDescriptor.token;
                const userId = tokenDescriptor.userId;

                // Check and remove existing user session.
                let existingSessionId = _.findKey(this.sessions, {'userId': userId});
                if (existingSessionId) {
                    this._destroySession(existingSessionId, (error) => {
                        if (error) {
                            console.error('Error destroying existing session: %s', error);
                        }
                    });
                }

                this._createSession(userId, token, callback);
            }
        });
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
                this._createSession(null, demoUser.id, (error, session) => {
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

            if (sessionDescriptor.token) {
                // Destroy the associated user token.
                this.services.tokens.logout(sessionDescriptor.token, (error) => {
                    if (error) {
                        console.log(error);
                    }
                    // continue, just log the error here.
                });
            }

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

    _createSession(token, userId, callback) {
        const sessionId = Uuid.v4();
        const session = {
            id: sessionId,
            userId: userId,
            token: token,
            lastActivity: Date.now(),
            operations: {}
        };

        this.sessions[sessionId] = session;
        callback(null, session);
    }
}

module.exports = SessionService;