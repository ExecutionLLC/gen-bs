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

    /**
     * Tries to get user by session id from header. If failed, user is kept undefined.
     * */
    _findAndSetUserAndSessionId(request, callback) {
        const sessionHeaderName = this.services.config.sessionHeader;
        const sessionId = request.get(sessionHeaderName);

        if (!sessionId) {
            callback(null);
        } else {
            async.waterfall([
                (callback) => this.services.sessions.findSessionUserId(sessionId, callback),
                (userId, callback) => this.services.users.find(userId, callback),
                (user, callback) => {
                    request.sessionId = sessionId;
                    request.user = user;
                    callback(null);
                }
            ], callback);
        }
    }

    /**
     * If no language is provided by header, tries to get either user or system-default language.
     * */
    _findAndSetLanguage(user, request, callback) {
        const languageHeaderName = this.services.config.languageHeader;
        const languId = request.get(languageHeaderName);

        async.waterfall([
            (callback) => {
                // Choose languages in preferable order.
                if (languId) {
                    callback(null, languId);
                } else if (user) {
                    callback(null, user.language);
                } else {
                    callback(null, this.services.config.defaultLanguId);
                }
            },
            (languId, callback) => this.services.langu.exists(languId, (error, isExistingLanguage) => callback(error, {
                languId,
                isExistingLanguage
            })),
            (result, callback) => {
                if (!result.isExistingLanguage) {
                    callback(new Error('Language is not found.'));
                } else {
                    request.languId = result.languId;
                    callback(null);
                }
            }
        ], callback);
    }

    _initHeaders(request, response, next) {
        async.waterfall([
            (callback) => {
                this._findAndSetUserAndSessionId(request, callback);
            },
            (callback) => {
                this._findAndSetLanguage(request.user, request, callback);
            }
        ], (error) => next(error));
    }

    createRouter(controllersFacade, controllerRelativePath) {
        const sessionsControllerPath = '/session';
        // Create child routers
        const sampleRouter = controllersFacade.samplesController.createRouter();
        const viewsRouter = controllersFacade.viewsController.createRouter();
        const fieldsRouter = controllersFacade.fieldsMetadataController.createRouter();
        const filtersRouter = controllersFacade.filtersController.createRouter();

        const searchRouter = controllersFacade.searchController.createRouter();
        const sessionsRouter = controllersFacade.sessionsController.createRouter(controllerRelativePath + sessionsControllerPath);

        const demoDataRouter = controllersFacade.demoDataController.createRouter();
        const dataRouter = controllersFacade.dataController.createRouter();

        const testRouter = controllersFacade.testController.createRouter();

        const router = new Express();

        // Install Express middleware
        router.use(this._initHeaders);

        // Initialize child routes
        router.use('/demo/data', demoDataRouter);
        router.use('/data', dataRouter);
        router.use(sessionsControllerPath, sessionsRouter);
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
