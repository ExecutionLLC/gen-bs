'use strict';

const async = require('async');
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

        this.redisStore = this._createMockSessionStore();

        this.sessionParser = session({
            // Change carefully, because it affects RPCProxy message id implementation.
            genid: (request) => Uuid.v4(),
            name: sessionCookieName,
            secret: sessionSecret,
            resave: true,
            saveUninitialized: false,
            store: this.redisStore,
            unset: 'destroy'
        });

        this.findUserSessions = (function(userId, callback) {
            this.redisStore.all((err, all) => {
                if (err) {
                    callback(err);
                    return;
                }
                let res = [];
                let k;
                for (k in all) {
                    if (all[k].userId === userId) {
                        res.push(all[k]);
                    }
                }
                callback(null, res);
            });
        }).bind(this);

    }

    _createMockSessionStore() {
        const mockStore = new MemoryStore();
        // Patch the store to make it call serializers.
        const originalGet = mockStore.get.bind(mockStore);
        mockStore.get = (sessionId, callback) => {
            originalGet(sessionId, (error, sessionObject) => {
                if (error || !sessionObject) {
                    callback(error, sessionObject);
                } else {
                    const session = this._parseSession(JSON.stringify(sessionObject));
                    callback(null, session);
                }
            });
        };

        const originalSet = mockStore.set.bind(mockStore);
        mockStore.set = (sessionId, session, callback) => {
            const sessionObject = JSON.parse(this._stringifySession(session));
            originalSet(sessionId, sessionObject, callback);
        };
        return mockStore;
    }
}

module.exports = MockSessionsService;
