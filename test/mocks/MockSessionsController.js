'use strict';

const async = require('async');
const _ = require('lodash');

class MockApiController {
    constructor(sessionsController) {
        this.sessionsController = sessionsController;

        const originalOpen = sessionsController.open;
        sessionsController.open = (request, response) => {
            this._openMock(request, response, originalOpen.bind(sessionsController));
        };

        // Original controller will be a resulting object of the constructor.
        return sessionsController;
    }

    /**
     * Starts user session if correct email is provided.
     * Otherwise goes to the original implementation.
     * */
    _openMock(request, response, originalMethod) {
        const services = this.sessionsController.services;
        const body = request.body;

        if (_.isEmpty(body) || !body.email) {
            originalMethod(request, response);
        } else {
            const email = body.email;
            async.waterfall([
                (callback) => services.sessions.startForEmail(email, callback),
                (sessionId, callback) => services.sessions.findSessionType(sessionId,
                    (error, sessionType) => callback(error, sessionId, sessionType))
            ], (error, sessionId, sessionType) => {
                this.sessionsController.sendErrorOrJson(response, error, {
                    sessionId,
                    sessionType
                });
            });
        }
    }
}

module.exports = MockApiController;
