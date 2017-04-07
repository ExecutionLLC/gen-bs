'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./base/ControllerBase');
const ErrorUtils = require('../utils/ErrorUtils');

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
        const languageId = this.getLanguageId(request);

        async.waterfall([
            (callback) => {
                // Choose languages in preferable order.
                if (languageId) {
                    callback(null, languageId);
                } else if (user) {
                    callback(null, user.languageId);
                } else {
                    callback(null, this.services.config.defaultLanguId);
                }
            },
            (languageId, callback) => this.services.language.exists(languageId, (error, isExistingLanguage) => callback(error, {
                languageId,
                isExistingLanguage
            })),
            (result, callback) => {
                if (!result.isExistingLanguage) {
                    callback(new Error('Language is not found.'));
                } else {
                    request.languageId = result.languageId;
                    callback(null);
                }
            }
        ], callback);
    }

    _initRequestContext(request, response, next) {
        async.waterfall([
            (callback) => callback(request.session ?
                null : new Error('Failed to initialize session. Possibly, Redis service is unavailable.')),
            (callback) => this._findAndSetUser(request, callback),
            (callback) => this._findAndSetLanguage(request, callback)
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
        const modelRouter = controllersFacade.modelsController.createRouter();
        const analysisController = controllersFacade.analysisController.createRouter();
        const sampleUploadHistoryRouter = controllersFacade.sampleUploadHistoryController.createRouter();

        const searchRouter = controllersFacade.searchController.createRouter();
        const sessionsRouter = controllersFacade.sessionsController.createRouter(controllerRelativePath + sessionsControllerPath);
        const usersRouter = controllersFacade.usersController.createRouter();

        const dataRouter = controllersFacade.dataController.createRouter();

        const router = new Express();

        // Install Express middleware
        router.use(this._initRequestContext);

        // Initialize child routes
        router.use('/data', dataRouter);
        router.use(sessionsControllerPath, sessionsRouter);
        router.use('/users', usersRouter);
        router.use('/comments', commentsRouter);
        router.use('/search', searchRouter);
        router.use('/samples', samplesRouter);
        router.use('/filters', filtersRouter);
        router.use('/views', viewsRouter);
        router.use('/fields', fieldsRouter);
        router.use('/models', modelRouter);
        router.use('/files', savedFilesRouter);
        router.use('/analysis', analysisController);
        router.use('/uploads', sampleUploadHistoryRouter);

        return router;
    }

    /**@typedef {Object}ExpressSession
     * @property {string}id
     * @property {string}userId
     * @property {string}languageId
     * @property {string}type Session type (USER or DEMO)
     * */
}

module.exports = ApiController;
