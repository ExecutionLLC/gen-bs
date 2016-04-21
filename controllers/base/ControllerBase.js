'use strict';

const _ = require('lodash');
const HttpStatus = require('http-status');

/**
 * Base class for all controllers.
 * */
class ControllerBase {
    constructor(services) {
        this.services = services;

        this.config = services.config;
        this.logger = services.logger;

        this.getSessionId = this.getSessionId.bind(this);
        this.getLanguageId = this.getLanguageId.bind(this);
    }

    sendInternalError(response, message) {
        ControllerBase.sendError(response, HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    sendOk(response) {
        response
            .status(HttpStatus.OK)
            .end();
    }

    sendErrorOrJson(response, error, jsonResult) {
        if (error) {
            this.sendInternalError(response, error);
        } else {
            this.sendJson(response, jsonResult);
        }
    }

    static sendError(response, httpError, message) {
        console.error(message);
        if (message && typeof message !== 'string') {
            message = message.toString();
        }
        response
            .status(httpError)
            .json({
                code: httpError,
                message
            })
            .end();
    }

    sendJson(response, obj) {
      response
        .json(obj)
        .end();
    }

    /**
     * Reads body. If body is empty, sends internal error.
     * */
    getRequestBody(request, callback) {
        const requestBody = request.body;
        if (_.isEmpty(requestBody)) {
            callback(new Error('Request body is empty'));
        } else {
            callback(null, requestBody);
        }
    }

    getSessionId(request) {
        return request.get(this.services.config.headers.sessionHeader);
    }

    getLanguageId(request) {
        return request.get(this.services.config.headers.languageHeader);
    }

    parseJson(jsonString, callback) {
        try {
            callback(null, JSON.parse(jsonString));
        } catch (exception) {
            callback(exception);
        }
    }

    checkUserIsDefined(request, callback) {
        if (!request.user) {
            callback(new Error('User is undefined.'));
        } else {
            callback(null);
        }
    }
}

module.exports = ControllerBase;
