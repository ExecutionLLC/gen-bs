'use strict';

const Express = require('express');

class UserController {
  constructor(services) {
    this.services = services;

    this.home = this.home.bind(this);
    this.getUserMetadata = this.getUserMetadata.bind(this);
    this.initUserParamById = this.initUserParamById.bind(this);
  }

  home(request, response) {
    response.json({
      hello: 'world'
    });
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

  getUserMetadata(request, response) {
    response.json({
      user: request.user,
      meta: 'data'
    });
  }

  createRouter(viewController) {
    const router = new Express();
    const viewRouter = viewController.createRouter();

    router.param('userId', this.initUserParamById);
    router.get('/', this.home);
    router.get('/:userId', this.getUserMetadata);
    router.use('/:userId/views', viewRouter);

    return router;
  }
}

module.exports = UserController;
