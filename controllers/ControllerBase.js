'use strict';

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const HTTP_INTERNAL = 500;
const HTTP_OK = 200;

/**
 * Base class for all controllers.
 * */
class ControllerBase {
    constructor(services) {
        this.services = services;
    }

    sendInternalError(response, message) {
        this.sendError(response, HTTP_INTERNAL, message);
    }

    sendOk(response) {
        response
            .status(HTTP_OK)
            .end();
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

    getRequestBody(request) {
        const camelCasedBody = ChangeCaseUtil.convertKeysToCamelCase(request.body);
        return camelCasedBody;
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
