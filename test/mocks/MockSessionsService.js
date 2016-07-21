'use strict';

const Uuid = require('node-uuid');
const session = require('express-session');
const MemoryStore = require('express-session/session/memory');

const SessionService = require('../../services/SessionService');

class MockSessionsService extends SessionService {
    constructor(services, models) {
        super(services, models);
    }

    init() {
        const {sessionCookieName, sessionSecret} = this.config.sessions;

        this.systemSession = {
            id: Uuid.v4(),
            operations:{}
        };

        this.redisStore = new MemoryStore();

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
            store: this.getSessionStore(),
            unset: 'destroy'
        });
    }
}

module.exports = MockSessionsService;
