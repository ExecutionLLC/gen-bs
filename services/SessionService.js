'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

class SessionService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.sessions = {};

        this.startSystem((error, systemSession) => {
            if (error) {
                this.logger.error('Error creating system session: ' + error);
            } else {
                this.logger.info('System session created: ' + JSON.stringify(systemSession, null, 2))
            }
        });
    }

    /**
     * Creates a new session for the specified user with token.
     * Currently, also destroys existing sessions of the same user, if any.
     * */
    startForUser(userName, password, callback) {
        async.waterfall([
            (callback) => this.services.tokens.login(userName, password, callback),
            (token, callback) => this.services.tokens.findUserIdByToken(token, (error, userId) => {
                callback(error, {
                    userId,
                    token
                });
            }),
            (result, callback) => {
                // Check and remove existing user session.
                const userId = result.userId;
                let existingSession = _.find(this.sessions, session => session.userId === userId);
                if (existingSession && !this.services.config.sessions.allowMultipleUserSessions) {
                    this.destroySession(existingSession.id, (error) => {
                        if (error) {
                            this.logger.error('Error destroying existing session: %s', error);
                        } else {
                            this.logger.info('Existing session for user ' + userName + ' is destroyed.');
                        }
                    });
                }
                callback(null, result);
            },
            (result, callback) => {
                // Create new session for user.
                const userId = result.userId;
                const token = result.token;
                this._createSession(token, userId, (error, session) => {
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
        async.waterfall([
            (callback) => {
                this.services.users.findDemoUser(callback);
            },
            (demoUser, callback) => {
                this._createSession(null, demoUser.id, callback);
            },
            (session, callback) => {
                this.sessions[session.id].demoUser = true;
                callback(null, session.id);
            }
        ], callback);
    }

    /**
     * Starts system user session.
     * There should be only one active non-expired system session at one time.
     * */
    startSystem(callback) {
        async.waterfall([
            (callback) => {
                this.services.users.findSystemUser(callback);
            },
            (systemUser, callback) => {
                this._createSession(null, systemUser.id, callback);
            },
            (session, callback) => {
                this.sessions[session.id].systemUser = true;
                callback(null, session.id);
            }
        ], callback);
    }

    findById(sessionId, callback) {
        async.waterfall([
            (callback) => {
                this.checkSession(sessionId, callback);
            },
            (session, callback) => {
                this.sessions[session.id].lastActivity = Date.now();
                callback(null, session.id);
            }
        ], callback);
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

    checkSession(sessionId, callback) {
        async.waterfall([
            (callback) => {
                this._checkSessionExists(sessionId, callback);
            },
            (session, callback) => {
                if (this._sessionExpired(Date.now(), session)) {
                    callback(new Error('Session is not found'));
                } else {
                    callback(null, session)
                }
            }
        ], callback);
    }

    destroySession(sessionId, callback) {
        async.waterfall([
            (callback) => {
                this._checkSessionExists(sessionId, callback);
            },
            (session, callback) => {
                // Destroy the local session information.
                delete this.sessions[sessionId];

                if (session.token) {
                    // Destroy the associated user token.
                    this.services.tokens.logout(session.token, (error) => {
                        if (error) {
                            this.logger.error('Error logout: ' + error + ', token: ' + session.token);
                        }
                        // continue, just log the error here.
                    });
                }

                // Clear active session operatations.
                this.services.operations.removeAll(sessionId, callback);
            }
        ], callback);
    }

    /**
     * Returns all session ids.
     * */
    findAll(callback) {
        const sessionIds = _.keys(this.sessions);
        callback(null, sessionIds);
    }

    findExpiredSessions(callback) {
        const now = Date.now();
        const expiredSessions = _.filter(this.sessions, (session) => {
            return this._sessionExpired(now, session);
        });
        const expiredSessionIds = _.pluck(expiredSessions, 'id');
        callback(null, expiredSessionIds);
    }

    getMinimumActivityDate() {
        const lastActivityDates = _.pluck(this.sessions, 'lastActivity');
        return _.min(lastActivityDates);
    }

    _createSession(token, userId, callback) {
        const sessionId = Uuid.v4();
        const session = {
            id: sessionId,
            userId,
            token,
            lastActivity: Date.now(),
            operations: {}
        };

        this.sessions[sessionId] = session;
        callback(null, session);
    }

    _checkSessionExists(sessionId, callback) {
        const sessionDescriptor = this.sessions[sessionId];
        if (!sessionDescriptor) {
            callback(new Error('Session is not found'));
        } else {
            callback(null, sessionDescriptor);
        }
    }

    // 0 expiration time for non-expired sessions
    _sessionExpired(checkTime, session) {
        let result = false;
        const expirationTime = session.lastActivity + this.config.sessions.sessionTimeout * 1000;
        if (!session.systemUser && (checkTime > expirationTime)) {
            return true;
        }
        return result;
    }
}

module.exports = SessionService;