'use strict';

const ServiceBase = require('./ServiceBase');

class ViewService extends ServiceBase {
  constructor(services) {
    super(services);
  }

  findByUser(user, callback) {
    if (user) {
      const view = {
        view: 'goes here'
      };
      callback(null, view);
    } else {
      callback(new Error('User cannot be undefined here.'));
    }
  }
}

module.exports = ViewService;
