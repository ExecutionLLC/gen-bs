'use strict';

const _ = require('lodash');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const HTTP_INTERNAL = 500;
const HTTP_OK = 200;

/**
 * Base class for all controllers.
 * */
class ControllerBase {
    constructor(services) {
        this.services = services;

        this.getSessionId = this.getSessionId.bind(this);
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
        if (message && typeof message !== 'string') {
            message = message.toString();
        }
        console.error(message);
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

    getRequestBody(request, response) {
        const requestBody = request.body;
        if (_.isEmpty(requestBody)) {
            this.sendInternalError(response, 'Request body is empty');
            return null;
        }
        const camelCasedBody = ChangeCaseUtil.convertKeysToCamelCase(requestBody);
        return camelCasedBody;
    }

    getSessionId(request) {
        return request.get(this.services.config.sessionHeader);
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
