'use strict';

const Express = require('express');

class DemoUserDataController {
    constructor(services) {
        this.services = services;

        this.getDemoUserData = this.getDemoUserData.bind(this);
        this.initUserParamById = this.initUserParamById.bind(this);
    }

    initUserParamById(request, response, next, id) {
        this.services.users.findById(id, (error, user) => {
            if (error) {
                next(error);
            } else if (user) {
                request.user = user;
                next();
            } else {
                next(new Error('User is not found: ' + id));
            }
        });
    }

    getDemoUserData(request, response) {
       //this.services.userService.getTestUserData();
    }

    //getUserMetadata(request, response) {
    //    response.json({
    //        user: request.user,
    //        meta: 'data'
    //    });
    //}

    createRouter(viewController, filtersController) {
        const router = new Express();
        const viewRouter = viewController.createRouter();
        const filtersRouter = filtersController.createRouter();

        // TODO: middleware initializing demo user data, something like that:
        // request.user = getDemoUserData();

        router.get('/', this.getUserMetadata);
        router.use('/views', viewRouter);
        router.use('/filters', filtersRouter);

        return router;
    }
}

module.exports = DemoUserDataController;