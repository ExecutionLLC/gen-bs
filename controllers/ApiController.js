'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

/**
 * Contains routing logic and common middleware for all API calls.
 * */
class ApiController extends ControllerBase {
    constructor(services) {
        super(services);

        this._initHeaders = this._initHeaders.bind(this);
    }

    _initHeaders(request, response, next) {
        const sessionHeaderName = this.services.config.sessionHeader;
        const languageHeaderName = this.services.config.languageHeader;
        const sessions = this.services.sessions;

        const setUserBySessionFunc = (sessionId, callback) => {
            sessions.findSessionUserId(sessionId, (error, userId) => {
                if (error) {
                    callback(error);
                } else {
                    this.services.users.find(userId, (error, user) => {
                        if (error) {
                            callback(error);
                        } else {
                            request.sessionId = sessionId;
                            request.user = user;
                            callback(null, request);
                        }
                    });
                }
            });
        };

        const setLanguBySessionFunc = (languId, callback) => {
            this.services.langu.exists(languId, (error, exists) => {
                if (error) {
                    callback(error);
                } else {
                    if (exists) {
                        request.languId = languId;
                        callback(null, request);
                    } else {
                        callback(new Error('Language not found.'));
                    }
                }
            });
        };

        const setRequestParameters = (sessionId, languId) => {
            async.waterfall([
                (cb) => {
                    if (sessionId) {
                        setUserBySessionFunc(sessionId, cb);
                    } else {
                        cb(null, null);
                    }
                },
                (result, cb) => {
                    if (languId) {
                        setLanguBySessionFunc(languId, cb);
                    } else {
                        cb(null, null);
                    }
                }
            ], (error) => {
                if (error) {
                    next(new Error(error));
                } else {
                    next();
                }
            });
        };

        const sessionId = request.get(sessionHeaderName);
        const languId = request.get(languageHeaderName);
        setRequestParameters(sessionId, languId);
    }

    createRouter(controllersFacade) {
        // Create child routers
        const sampleRouter = controllersFacade.samplesController.createRouter();
        const viewsRouter = controllersFacade.viewsController.createRouter();
        const fieldsRouter = controllersFacade.fieldsMetadataController.createRouter();
        const filtersRouter = controllersFacade.filtersController.createRouter();

        const searchRouter = controllersFacade.searchController.createRouter();
        const sessionsRouter = controllersFacade.sessionsController.createRouter();

        const demoDataRouter = controllersFacade.demoDataController.createRouter();
        const dataRouter = controllersFacade.dataController.createRouter();

        const testRouter = controllersFacade.testController.createRouter();

        const router = new Express();

        // Install Express middleware
        router.use(this._initHeaders);

        // Initialize child routes
        router.use('/demo/data', demoDataRouter);
        router.use('/data', dataRouter);
        router.use('/session', sessionsRouter);
        router.use('/search', searchRouter);
        router.use('/samples', sampleRouter);
        router.use('/filters', filtersRouter);
        router.use('/views', viewsRouter);
        router.use('/fields', fieldsRouter);

        router.use('/test', testRouter);

        return router;
    }
}

module.exports = ApiController;
