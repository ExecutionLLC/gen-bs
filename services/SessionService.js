'use strict';

const _ = require('lodash');
const async = require('async');
const Uuid = require('node-uuid');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const ServiceBase = require('./ServiceBase');
const TooManyUserSessionsError = require('../utils/errors/TooManyUserSessionsError');

const SESSION_TYPES = {
    USER: 'USER',
    DEMO: 'DEMO',
    SYSTEM: 'SYSTEM'
};

const SESSION_KEY_PREFIX = 'genomics:';

class SessionService extends ServiceBase {
    constructor(services, models) {
        super(services, models);

        this.config = this.services.config;
        this.logger = this.services.logger;
    }

    init() {
        const {host, port, password, databaseNumber} = this.config.redis;
        const {sessionTimeoutSec} = this.config.sessions;
        this.redisStore = new RedisStore({
            host,
            port,
            ttl: sessionTimeoutSec,
            pass: password,
            db: databaseNumber,
            prefix: SESSION_KEY_PREFIX,
            serializer: {
                stringify: (session) => this._stringifySession(session),
                parse: (sessionString) => this._parseSession(sessionString)
            }
        });

        // System session is currently stored in memory, as it contains system-wide
        // operations, and, if being put in Redis, there will be race conditions
        // between different web server instances.
        this.systemSession = {
            id: Uuid.v4(),
            operations:{}
        };

        const {sessionCookieName, sessionSecret} = this.config.sessions;
        this.sessionParser = session({
            // Change carefully, because it affects RPCProxy message id implementation.
            genid: (request) => Uuid.v4(),
            name: sessionCookieName,
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            session: {
                secure: false
            },
            unset: 'destroy',
            store: this.services.sessions.getSessionStore()
        });
        this.logger.info(`Created system session ${this.systemSession.id}`);
    }

    getSessionStore() {
        return this.redisStore;
    }

    getSessionParserMiddleware() {
        return this.sessionParser;
    }

    isSessionValid(session) {
        return session
            && session.id
            && session.type
            && session.userId;
    }

    /**
     * Initializes session for a user with the specified email.
     *
     * @param {Object}session Express session
     * @param email User email.
     * @param callback (error, session)
     * */
    startForEmail(session, email, callback) {
        async.waterfall([
            (callback) => this.services.users.findIdByEmail(email, callback),
            (userId, callback) => this.ensureNoUserSessions(userId, callback),
            (userId, callback) => this.services.operations.closeSearchOperationsIfAny(session,
                (error) => callback(error, userId)
            ),
            (userId, callback) => {
                Object.assign(session, {
                    userId,
                    type: SESSION_TYPES.USER
                });
                callback(null, session);
            }
        ], callback);
    }

    closeAllUserSessions(userEmail, callback) {
        async.waterfall([
            (callback) => this.services.users.findIdByEmail(userEmail, callback),
            (userId, callback) => this.findUserSessions(userId, callback),
            (sessions, callback) => async.each(sessions,
                (session, callback) => this.destroySession(session, callback),
                callback)
        ], callback);
    }

    /**
     * Starts demo user session.
     * There should be only few active demo sessions at one time.
     * */
    startDemo(session, callback) {
        async.waterfall([
            (callback) => this.services.users.findDemoUser(callback),
            (demoUser, callback) => {
                Object.assign(session, {
                    userId: demoUser.id,
                    type: SESSION_TYPES.DEMO
                });
                callback(null, session);
            }
        ], callback);
    }

    findById(sessionId, callback) {
        if (sessionId !== this.systemSession.id) {
            async.waterfall([
                (callback) => this.redisStore.get(sessionId, (error, result) => callback(error, result || null)),
                (rawSession, callback) => {
                    const session = Object.assign({}, rawSession, {
                        id: sessionId,
                        destroy: (callback) => this.redisStore.destroy(sessionId, (error) => callback(error))
                    });
                    callback(null, session)
                }
            ], callback);
        } else {
            callback(null, this.systemSession);
        }
    }

    findSystemSession(callback) {
        callback(null, this.systemSession);
    }

    destroySession(session, callback) {
        async.waterfall([
            (callback) => this.services.operations.closeSearchOperationsIfAny(session, callback),
            (callback) => session.destroy(callback)
        ], callback);
    }

    saveSession(session, callback) {
        if (this.systemSession.id !== session.id) {
            this.redisStore.set(session.id, session, (error) => callback(error));
        } else {
            callback(null);
        }
    }

    touchSession(session, callback) {
        if (this.systemSession.id !== session.id) {
            this.redisStore.touch(session.id, session, (error) => callback(error));
        } else {
            callback(new Error('System session is unexpected here.'))
        }
    }

    ensureNoUserSessions(userId, callback) {
        async.waterfall([
            (callback) => this.findUserSessions(userId, callback),
            (sessions, callback) => sessions.length ? callback(new TooManyUserSessionsError()) : callback(null)
        ], callback);
    }

    findUserSessions(userId, callback) {
        const {client} = this.redisStore;
        async.waterfall([
            (callback) => client.keys(`${SESSION_KEY_PREFIX}*`, callback),
            (sessionKeys, callback) => async.map(sessionKeys, (sessionKey, callback) => {
                const sessionId = sessionKey.substring(SESSION_KEY_PREFIX.length, sessionKey.length);
                this.findById(sessionId, (error, session) => callback(error, Object.assign({}, session, {sessionId})));
            }, callback),
            (sessions, callback) => {
                const userSessions = _.filter(sessions, session => session.userId === userId);
                callback(null, userSessions)
            }
        ], callback);
    }
    
    _stringifySession(session) {
        const operationsString = this.services.operations.stringifyOperations(session.operations);
        const sessionToSerialize = Object.assign({}, session, {
            operations: operationsString
        });
        return JSON.stringify(sessionToSerialize);
    }

    _parseSession(sessionString) {
        const session = JSON.parse(sessionString);
        session.operations = this.services.operations.parseOperations(session.operations);
        return session;
    }
}

module.exports = SessionService;