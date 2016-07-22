'use strict';

const async = require('async');

const WebServerHost = require('../../WebServerHost');

class MockWebServerHost extends WebServerHost {
    constructor(controllers, services, models) {
        super(controllers, services, models);
        this.sessionHeaderName = services.config.headers.sessionHeader;
    }

    _addMiddleware(app) {
        // Session is passed by header in tests, so we need to load it here.
        app.use((request, response, next) => {
            const sessionId = request.get(this.sessionHeaderName);
            if (!sessionId) {
                return next();
            }

            const store = this.services.sessions.getSessionStore();

            async.waterfall([
                (callback) => store.get(sessionId, callback),
                (session, callback) => {
                    if (!session) {
                        return callback(null, {});
                    }
                    callback(null, Object.assign(session, {
                        id: sessionId,
                        destroy: (callback) => store.destroy(session.id, callback)
                    }))
                }
            ], (error, session) => {
                if (error) {
                    return next(error);
                }
                Object.assign(request, {
                    sessionID: sessionId,
                    session
                });
                next();
            });
        });

        super._addMiddleware(app);
    }

    _verifyWebSocketClient(info, callback) {
        callback(true);
    }
}

module.exports = MockWebServerHost;
