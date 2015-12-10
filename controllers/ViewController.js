'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class ViewController extends ControllerBase {
  constructor(services) {
    super(services);

    this.getUserViews = this.getUserViews.bind(this);
  }

  getUserViews(request, response) {
    const user = request.user;

    if (user) {
      this.services.views.findByUser(user, (error, views) => {
        if (error) {
          this.sendError(response, {
            httpError: 500,
            message: error
          })
        } else {
          response.json(views);
        }
      });
    } else {
      this.sendError(response, {
        httpError: 500,
        message: 'User is undefined.'
      });
    }
  }

  createRouter() {
    const router = new Express();

    router.get('/', this.getUserViews);

    return router;
  }
}

module.exports = ViewController;
