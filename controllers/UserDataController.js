'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class UserDataController extends ControllerBase {
  constructor(services) {
    super(services);

    this.getUserMetadata = this.getUserMetadata.bind(this);
  }

  initUserByToken(request, response, next) {
    // TODO: here we should get token from the request.
    // TODO: check token is valid on external auth service and is not expired
    // TODO: get user by token from the database
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

  getUserMetadata(request, response) {
    response.json({
      user: request.user,
      meta: 'data'
    });
  }

  createRouter(viewController, filtersController) {
    const router = new Express();
    const viewRouter = viewController.createRouter();
    const filtersRouter = filtersController.createRouter();

    router.use(this.initUserByToken);
    router.get('/', this.getUserMetadata);
    router.use('/views', viewRouter);

    return router;
  }
}

module.exports = UserDataController;
