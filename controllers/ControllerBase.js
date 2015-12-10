'use strict';

/**
 * Base class for all controllers.
 * */
class ControllerBase {
    sendError(response, message) {
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
}

module.exports = ControllerBase;
