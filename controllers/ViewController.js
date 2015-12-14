'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class ViewController extends ControllerBase {
  constructor(services) {
    super(services);

    this.getUserViews = this.getUserViews.bind(this);
  }

  getUserViews(request, response) {
    if (!this.checkUserIsDefined(request, response)) {
      return;
    }

    const user = request.user;
    this.services.views.findByUser(user, (error, views) => {
      if (error) {
        this.sendInternalError(response, error);
      } else {
        response.json(views);
      }
    });
  }

  createRouter() {
    const router = new Express();

    router.get('/', this.getUserViews);

    return router;
  }
}

module.exports = ViewController;
