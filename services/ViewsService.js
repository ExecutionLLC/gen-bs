'use strict';

const ServiceBase = require('./ServiceBase');

class ViewsService extends ServiceBase {
  constructor(services, models) {
    super(services, models);
  }

  add(user, view, callback) {
    // TODO: Check view format.
    this.models.views.add(user.id, view, callback);
  }

  update(user, view, callback) {
    this.models.views.update(user.id, view, callback);
  }

  findAll(user, callback) {
    if (user) {
      this.models.views.findAll(user.id, callback);
    } else {
      callback(new Error('User cannot be undefined here.'));
    }
  }
}

module.exports = ViewsService;
