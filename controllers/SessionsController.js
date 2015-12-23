'use strict';

const ControllerBase = require('./ControllerBase');

class SessionsController extends ControllerBase {
    constructor(services) {
        super(services);
    }

    /**
     * Opens new session, either demo or user, depending on the token presence in the request.
     * */
    open(request, response) {
        const tokenHeaderName = this.services.config.applicationServer.authTokenHeader;
        const token = request.get(tokenHeaderName);

        if (token) {
            // Open session for the corresponding user.
            this.services.tokens.findUserIdByToken(token, (error, userId) => {
                // TODO: Add a new session.
                // TODO: Assign token to the session.
            });
        } else {
            // TODO: Open demo session.
        }
    }

    check(request, response) {

    }
}