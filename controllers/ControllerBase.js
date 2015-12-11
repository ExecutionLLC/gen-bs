'use strict';

/**
 * Base class for all controllers.
 * */
class ControllerBase {
    constructor(services) {
        this.services = services;
    }

    sendInternalError(response, message) {
        this.sendError(response, 500, message);
    }

    sendError(response, httpError, message) {
        response
            .status(httpError)
            .json({
                code: httpError,
                message
            })
            .end();
    }

    checkUserIsDefined(request, response) {
        if (!request.user) {
            this.sendInternalError(response, 'User is undefined.');
            return false;
        }
        return true;
    }
}

module.exports = ControllerBase;
