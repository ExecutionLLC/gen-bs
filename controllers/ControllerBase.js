'use strict';

const ChangeCaseUtil = require('../util/ChangeCaseUtil');

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

    sendJson(response, obj) {
      const snakeCasedObj = ChangeCaseUtil.convertKeysToSnakeCase(obj);
      response
        .json(snakeCasedObj)
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
