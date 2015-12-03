'use strict';

const Express = require('express');

class ViewController {
  constructor(services) {
    this.services = services;

    this.getUserViews = this.getUserViews.bind(this);
  }

  getUserViews(request, response) {
    const user = request.user;

    if (user) {
      this.services.views.findByUser(user, (error, views) => {
        if (error) {
          response
            .status(500)
            .json({
              code: 500,
              message: error
            })
            .end();
        } else {
          response.json(views);
        }
      });
    } else {
      response
        .status(500)
        .json({
          code: 500,
          // TODO: i18n
          message: 'User should not be undefined'
        })
        .end();
    }
  }

  createRouter() {
    const router = new Express();

    router.get('/', this.getUserViews);

    return router;
  }
}

module.exports = ViewController;
