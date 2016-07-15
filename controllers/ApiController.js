'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./base/ControllerBase');
const ErrorUtils = require('../utils/ErrorUtils');
const SafeObjectFactory = require('../utils/SafeObjectFactory');

/**
 * Contains routing logic and common middleware for all API calls.
 * */
class ApiController extends ControllerBase {
    constructor(services) {
        super(services);

        this._initRequestContext = this._initRequestContext.bind(this);
    }

    /**
     * Mutates context to store user found by id from session. If failed, user is kept undefined.
     * */
    _findAndSetUser(request, callback) {
        const {userId} = request.session;
        if (!userId) {
            // Session is new, no user is specified. Pass the request as it is.
            callback(null);
        } else {
            async.waterfall([
                (callback) => this.services.users.find(userId, callback),
                (user, callback) => {
                    request.user = user;
                    callback(null);
                }
            ], callback);
        }
    }

    /**
     * If no language is provided by header, tries to get either user or system-default language.
     * */
    _findAndSetLanguage(request, callback) {
        const {user} = request;
        const languageHeaderName = this.services.config.headers.languageHeader;
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

    _initRequestContext(request, response, next) {
        async.waterfall([
            (callback) => {
                if (!request.session) {
                    return callback(new Error('Failed to initialize session.'));
                }
                callback(null);
            },
            (callback) => this._findAndSetUser(request, callback),
            (callback) => this._findAndSetLanguage(request, request, callback)
        ], (error) => next(error));
    }

    createRouter(controllersFacade, controllerRelativePath) {
        const sessionsControllerPath = '/session';
        // Create child routers
        const samplesRouter = controllersFacade.samplesController.createRouter();
        const commentsRouter = controllersFacade.commentsController.createRouter();
        const viewsRouter = controllersFacade.viewsController.createRouter();
        const fieldsRouter = controllersFacade.fieldsMetadataController.createRouter();
        const filtersRouter = controllersFacade.filtersController.createRouter();
        const savedFilesRouter = controllersFacade.savedFilesController.createRouter();
        const queryHistoryRouter = controllersFacade.queryHistoryController.createRouter();

        const searchRouter = controllersFacade.searchController.createRouter();
        const sessionsRouter = controllersFacade.sessionsController.createRouter(controllerRelativePath + sessionsControllerPath);

        const dataRouter = controllersFacade.dataController.createRouter();

        const router = new Express();

        // Install Express middleware
        router.use(this._initRequestContext);

        // Initialize child routes
        router.use('/data', dataRouter);
        router.use(sessionsControllerPath, sessionsRouter);
        router.use('/comments', commentsRouter);
        router.use('/search', searchRouter);
        router.use('/samples', samplesRouter);
        router.use('/filters', filtersRouter);
        router.use('/views', viewsRouter);
        router.use('/fields', fieldsRouter);
        router.use('/files', savedFilesRouter);
        router.use('/history', queryHistoryRouter);

        return router;
    }

    /**@typedef {Object}ExpressSession
     * @property {string}id
     * @property {string}userId
     * @property {string}languId
     * */
}

module.exports = ApiController;
