'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');
const getUserDataResult = require('../test_data/get_user_data-result.json');

class DemoUserDataController extends ControllerBase {
    constructor(services) {
        super(services);

        this.getDemoUserData = this.getDemoUserData.bind(this);
        this.getFieldsMetadata = this.getFieldsMetadata.bind(this);
        this.initDemoUser = this.initDemoUser.bind(this);
    }

    initDemoUser(request, response, next) {
        this.services.users.findDemoUser((error, user) => {
            if (error) {
                next(error);
            } else {
                request.user = user;
                next();
            }
        });
    }

    getDemoUserData(request, response) {
        if (!this._checkUserIsSet(request, response)) {
            return;
        }

        // TODO: Combine and send back the demo user data.
        response.json(getUserDataResult);
    }

    getFieldsMetadata(request, response) {
        if (!this._checkUserIsSet(request, response)) {
            return;
        }

        const user = request.user;
        this.services.applicationServer.getFieldsMetadata(user, (error, fieldsMetadata) => {
            if (error) {
                this.sendError(response, error);
            } else {
                response.json(fieldsMetadata);
            }
        });
    }

    createRouter(viewController, filtersController) {
        const router = new Express();
        const viewRouter = viewController.createRouter();
        const filtersRouter = filtersController.createRouter();

        router.use(this.initDemoUser);

        router.get('/data', this.getDemoUserData);
        router.use('/views', viewRouter);
        router.use('/filters', filtersRouter);

        return router;
    }

    _checkUserIsSet(request, response) {
        if (!request.user) {
            this.sendError(response, 'Demo user property is not initialized.');
            return false;
        }
        return true;
    }
}

module.exports = DemoUserDataController;