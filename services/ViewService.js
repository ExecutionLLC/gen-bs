'use strict';

const ServiceBase = require('./ServiceBase');

const VIEWS = require('../test_data/views.json');

class ViewService extends ServiceBase {
  constructor(services) {
    super(services);
  }

  findByUser(user, callback) {
    if (user) {
      callback(null, VIEWS);
    } else {
      callback(new Error('User cannot be undefined here.'));
    }
  }
}

module.exports = ViewService;
