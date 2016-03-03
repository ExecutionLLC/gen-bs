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

    findSessionType(sessionId, callback) {
        async.waterfall([
            (callback) => this.findById(sessionId, callback),
            (sessionId, callback) => this._findSession(sessionId, callback),
            (session, callback) => callback(null, session.type)
        ], callback);
    }

    /**
     * Creates a new session for a user with the specified email.
     * Currently, also destroys existing sessions of the same user, if any.
     * @param email User email.
     * @param callback (error, sessionId)
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
                this._createSession(userId, SESSION_TYPES.USER, (error, session) => {
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
                this._createSession(demoUser.id, SESSION_TYPES.DEMO, callback);
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
                this._createSession(systemUser.id, SESSION_TYPES.SYSTEM, callback);
            },
            (session, callback) => {
                callback(null, session.id);
            }
        ], callback);
    }

    findById(sessionId, callback) {
        async.waterfall([
            (callback) => this._findSession(sessionId, callback),
            (session, callback) => {
                if (this._isSessionExpired(session)) {
                    callback(new Error('Session is not found'));
                } else {
                    this._updateLastActivity(session, (error, session) => {
                        const sessionId = (error) ? null : session.id;
                        callback(error, sessionId);
                    });
                }
            }
        ], callback);
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

    destroySession(sessionId, callback) {
        async.waterfall([
            (callback) => {
                this._findSession(sessionId, callback);
            },
            (session, callback) => {
                // Destroy the local session information.
                delete this.sessions[sessionId];
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
            .map(session => session.id)
            .value();
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
            .map(session => session.lastActivityTimestamp)
            .value();
        if (lastUserActivityTimestamps && lastUserActivityTimestamps.length) {
            return _.min(lastUserActivityTimestamps);
        }
        return null;
    }

    _createSession(userId, sessionType, callback) {
        const sessionId = Uuid.v4();
        const session = {
            id: sessionId,
            userId,
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
     * @param session Session object
     * @param callback (error, session)
     * */
    _updateLastActivity(session, callback) {
        session.lastActivityTimestamp = Date.now();
        callback(null, session);
    }

    /**
     * Returns true if session is expired
     * @param session Session object
     * @returns {boolean}
     */
    _isSessionExpired(session) {
        if (session.type === SESSION_TYPES.SYSTEM) {
            return false;
        }

        const sessionLifetimeMs = this.config.sessions.sessionTimeoutSec * 1000;
        return (Date.now() - session.lastActivityTimestamp) > sessionLifetimeMs;
    }
}

module.exports = SessionService;