'use strict';

const _ = require('lodash');
const HttpStatus = require('http-status');
const RateLimit = require('express-rate-limit');

const ErrorUtils = require('../../utils/ErrorUtils');

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
        const errorObject = ErrorUtils.createInternalError(message);
        ControllerBase.sendError(response, HttpStatus.INTERNAL_SERVER_ERROR, errorObject);
    }

    sendOk(response) {
        response
            .status(HttpStatus.OK)
            .end();
    }

    /**
     * Options for limiting.
     * @typedef {Object} LimitOptions
     * @property {number|undefined}delayWindowMs Time window in which requests should persist.
     * @property {number|undefined}noDelayCount Count of calls before starting to delay.
     * @property {number|undefined}delayMs Time period to delay requests.
     * @property {number|undefined}maxCallCountBeforeBlock Maximum count for API calls before blocking.
     * @property {string|undefined}message Message to send to the client.
     * @property {function(request, response):string|undefined}keyGenerator Function to generate custom keys for the limiter.
     * */

    /**
     *
     * @param {LimitOptions}options
     * @returns {*}
     */
    createLimiter(options) {
        // If disabled, return no-op middleware.
        if (this.config.disableRequestLimits) {
            return (request, response, next) => next();
        }

        return RateLimit({
            windowMs: options.delayWindowMs || 60 * 1000,
            delayAfter: options.noDelayCount || 100000,
            delayMs: options.delayMs || 500,
            max: options.maxCallCountBeforeBlock || 1000,
            message: options.message || 'Too many requests, please try later',
            keyGenerator: options.keyGenerator
        });
    }

    sendErrorOrJson(response, error, jsonResult) {
        if (error) {
            this.sendInternalError(response, error);
        } else {
            this.sendJson(response, jsonResult);
        }
    }

    static sendError(response, httpError, errorObject) {
        response
            .status(httpError)
            .json(errorObject)
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
