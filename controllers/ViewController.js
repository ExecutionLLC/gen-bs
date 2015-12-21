'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

class ViewController extends ControllerBase {
  constructor(services) {
    super(services);

    this.findAll = this.findAll.bind(this);
  }

  findAll(request, response) {
    if (!this.checkUserIsDefined(request, response)) {
      return;
    }

    const user = request.user;
    this.services.views.findAll(user, (error, views) => {
      if (error) {
        this.sendInternalError(response, error);
      } else {
        this.sendJson(response, views);
      }
    });
  }

  update(request, response) {
    if (!this.checkUserIsDefined(request)) {
      return;
    }

    const user = request.user;
    const viewId = request.query.viewId;
    const view = request.body;

    view.id = viewId;

    this.services.views.update(user, view, (error, updatedView) => {
      this.sendJson(response, updatedView);
    });
  }

  add(request, response) {
    if (!this.checkUserIsDefined(request, response)) {
      return;
    }

    const user = request.user;
    const view = request.body;
    this.services.views.addForUser(user, view, (error, insertedView) => {
      if (error) {
        this.sendInternalError(response, error);
      } else {
        this.sendJson(response, insertedView);
      }
    });
  }

  createRouter() {
    const router = new Express();

    router.get('/', this.findAll);
    router.put('/', this.update);
    router.post('/:viewId', this.add);

    return router;
  }
}

module.exports = ViewController;
