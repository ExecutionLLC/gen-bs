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
        const sessionHeaderName = this.services.config.applicationServer.sessionHeader;

        const session = request.get(sessionHeaderName);
        this.services.users.findByToken(token, (error, user) => {
            if (error) {
                next(error);
            } else if (user) {
                request.user = user;
                next();
            } else {
                // TODO: load demo user here if there is no token.
                next(new Error('User is not found by token'));
            }
        });
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
