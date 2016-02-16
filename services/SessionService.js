'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');

const ServiceBase = require('./ServiceBase');

const SESSION_TYPES = {
    USER: 'USER',
    DEMO: 'DEMO',
    SYSTEM: 'SYSTEM'
};

class SessionService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;

        this.sessions = {};

        this.startSystem((error, systemSession) => {
            if (error) {
                throw new Error('Error creating system session: ' + error);
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
                const userId = result.userId;
                this._removeExistingUserSessionIfNeeded(userId, (error) => {
                    if (error) {
                        this.logger.error('Error destroying existing session: %s', error);
                    } else {
                        this.logger.info('Existing session for user ' + userName + ' is destroyed.');
                    }
                    callback(null, result);
                });
            },
            (result, callback) => {
                // Create new session for user.
                const userId = result.userId;
                const token = result.token;
                this._createSession(token, userId, SESSION_TYPES.USER, (error, session) => {
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
                this._createSession(null, demoUser.id, SESSION_TYPES.DEMO, callback);
            },
            (session, callback) => {
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
                this._createSession(null, systemUser.id, SESSION_TYPES.SYSTEM, callback);
            },
            (session, callback) => {
                callback(null, session.id);
            }
        ], callback);
    }

    findById(sessionId, callback) {
        this._updateLastActivity(sessionId, (error, session) => {
            const sessionId = (error) ? null : session.id;
            callback(error, sessionId);
        });
    }

    findSystemSession(callback) {
        const systemSession = _.find(this.sessions, (session) => session.type === SESSION_TYPES.SYSTEM);
        if (!systemSession) {
            callback(new Error("System session is not found"));
        } else {
            callback(null, systemSession);
        }
    }

    findSessionUserId(sessionId, callback) {
        async.waterfall([
            (callback) => this.findById(sessionId, callback),
            (sessionId, callback) => {
                const session = this.sessions[sessionId];
                callback(null, session.userId);
            }
        ], callback);
    }

    checkSession(sessionId, callback) {
        async.waterfall([
            (callback) => {
                this._findSession(sessionId, callback);
            },
            (session, callback) => {
                if (this._isSessionExpired(session)) {
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
                this._findSession(sessionId, callback);
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

                // Clear active session operations.
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
        const expiredSessionIds =
            _(this.sessions)
            .filter(this._isSessionExpired.bind(this))
            .map(session => session.id);
        callback(null, expiredSessionIds);
    }

    /**
     * Returns minimum by last activity timestamps in all user sessions.
     * Returns null if there are no user sessions active.
     * */
    getMinimumActivityTimestamp() {
        const lastUserActivityTimestamps =
            _(this.sessions)
            .filter(session => session.type !== SESSION_TYPES.SYSTEM)
            .map(session => session.lastActivityTimestamp);
        if (lastUserActivityTimestamps && lastUserActivityTimestamps.length) {
            return _.min(lastUserActivityTimestamps);
        }
        return null;
    }

    _createSession(token, userId, sessionType, callback) {
        const sessionId = Uuid.v4();
        const session = {
            id: sessionId,
            userId,
            token,
            type: sessionType,
            lastActivityTimestamp: Date.now()
        };

        this.sessions[sessionId] = session;
        callback(null, session);
    }

    _findSession(sessionId, callback) {
        const sessionDescriptor = this.sessions[sessionId];
        if (!sessionDescriptor) {
            callback(new Error('Session is not found'));
        } else {
            callback(null, sessionDescriptor);
        }
    }

    /**
     * Removes existing session (by calling this.destroySession()) for the specified user, if needed.
     * @param userId User identifier
     * @param callback (error)
     * */
    _removeExistingUserSessionIfNeeded(userId, callback) {
        let existingSession = _.find(
            this.sessions,
            session => session.type === SESSION_TYPES.USER && session.userId === userId
        );
        if (existingSession && !this.services.config.sessions.allowMultipleUserSessions) {
            this.destroySession(existingSession.id, (error) => callback(error));
        } else {
            callback(null);
        }
    }

    /**
     * Finds specified session and updates the last activity timestamp.
     * @param sessionId Session identifier.
     * @param callback (error, session)
     * */
    _updateLastActivity(sessionId, callback) {
        async.waterfall([
            (callback) => this._findSession(sessionId, callback),
            (session, callback) => {
                session.lastActivityTimestamp = Date.now();
                callback(null, session);
            }
        ], callback);
    }

    _isSessionExpired(session) {
        if (session.type === SESSION_TYPES.SYSTEM) {
            return false;
        }

        const sessionLifetimeMs = this.config.sessions.sessionTimeoutSec * 1000;
        return (Date.now() - session.lastActivityTimestamp) > sessionLifetimeMs;
    }
}

module.exports = SessionService;