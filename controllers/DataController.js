'use strict';

const Express = require('express');
const async = require('async');

const ControllerBase = require('./ControllerBase');

class DataController extends ControllerBase {
  constructor(services) {
    super(services);

    this.getData = this.getData.bind(this);
  }

  getData(request, response) {
    const user = request.user;
    const sessionId = request.sessionId;
    async.parallel({
      views: (callback) => {
        this.services.views.findAll(user, callback);
      },
      filters: (callback) => {
        this.services.filters.findAll(user, callback);
      },
      samples: (callback) => {
        this.services.samples.findAll(user, callback);
      },
      operations: (callback) => {
        this.services.operations.findAll(sessionId, callback);
      }
    }, (error, results) => {
      if (error) {
        this.sendInternalError(response, error);
      } else {
        this.sendJson(response, results);
      }
    });
  }

  createRouter() {
    const router = new Express();
    router.get('/', this.getData);
    return router;
  }
}

module.exports = DataController;
