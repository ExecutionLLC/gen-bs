'use strict';

const Express = require('express');
const ControllerBase = require('./ControllerBase');

/**
 * Contains routing logic and common middleware for all API calls.
 * */
class ApiController extends ControllerBase {
    constructor(services) {
        super(services);

        this._initUserMiddleware = this._initUserMiddleware.bind(this);
    }

    _initUserMiddleware(request, reponse, next) {
        const sessionHeaderName = this.services.config.sessionHeader;
        const sessions = this.services.sessions;

        const setUserBySessionFunc = (sessionId) => {
            sessions.findSessionUserId(sessionId, (error, userId) => {
                if (error) {
                    next(new Error(error));
                } else {
                    this.services.users.find(userId, (error, user) => {
                        if (error) {
                            next(new Error(error));
                        } else {
                            request.sessionId = sessionId;
                            request.user = user;
                            next();
                        }
                    });
                }
            });
        };

        const sessionId = request.get(sessionHeaderName);
        if (sessionId) {
            setUserBySessionFunc(sessionId);
        } else {
            console.error('Automatically open user session for testing');
            sessions.startForUser('valarie', 'password', (error, sessionId) => {
                if (error) {
                    next(new Error(error));
                } else {
                    setUserBySessionFunc(sessionId);
                }
            });
        }
    }

    createRouter(controllersFacade) {
        // Create child routers
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
        router.use(this._initUserMiddleware);

        // Initialize child routes
        router.use('/demo/data', demoDataRouter);
        router.use('/data', dataRouter);
        router.use('/session', sessionsRouter);
        router.use('/search', searchRouter);
        router.use('/filters', filtersRouter);
        router.use('/views', viewsRouter);
        router.use('/fields', fieldsRouter);

        router.use('/test', testRouter);

        return router;
    }
}

module.exports = ApiController;
