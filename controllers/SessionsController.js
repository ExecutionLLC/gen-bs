'use strict';

const ControllerBase = require('./ControllerBase');

class SessionsController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    /**
     * Opens new session, either demo or user, depending on the user name and password presence in the request.
     * */
    open(request, response) {
        const body = this.getRequestBody(request);
        const userName = body.userName;
        const password = body.password;

        if (userName && password) {
            this._openUserSession(userName, password, (error, sessionId) => {
                if (error) {

                }
            });
        } else {
            // open demo session
        }
    }

    check(request, response) {
        const body = this.getRequestBody(request);
        const userName = body.userName;
        const password = body.password;
        this.services.users.login(userName, password, (error, tokenDescriptor) => {
            this.sendJson(response, {
                token: tokenDescriptor.token
            });
        });
    }

    close(request, response) {

    }

    _openUserSession(userName, password, callback) {
        this.services.tokens.login(userName, password, (error, token) => {
            if (error) {

            }
        });
    }
}