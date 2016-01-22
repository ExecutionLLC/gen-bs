'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class SessionsController extends ControllerBase {
    constructor(services) {
        super(services);

        this.open = this.open.bind(this);
        this.check = this.check.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * Opens new session, either demo or user, depending on the user name and password presence in the request.
     * */
    open(request, response) {
        const body = this.getRequestBody(request, response);
        if (!body) {
            return;
        }
        const userName = body.userName;
        const password = body.password;

        const createSessionCallback = (error, sessionId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    sessionId
                });
            }
        };

        if (userName && password) {
            this.services.sessions.startForUser(userName, password, createSessionCallback);
        } else {
            // open demo session
            this.services.sessions.startDemo(createSessionCallback);
        }
    }

    check(request, response) {
        const sessionId = this.getSessionId(request);

        this.services.sessions.findById(sessionId, (error, sessionId) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {
                    sessionId
                });
            }
        })
    }

    close(request, response) {
        const sessionId = this.getSessionId(request);
        this.services.sessions.destroySession(sessionId, (error) => {
            if (error) {
                this.sendInternalError(response, error);
            } else {
                this.sendJson(response, {});
            }
        });
    }

    createRouter() {
        const router = new Express();

        router.post('/', this.open);
        router.put('/', this.check);
        router.delete('/', this.close);

        return router;
    }
}

module.exports = SessionsController;