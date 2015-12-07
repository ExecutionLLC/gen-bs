'use strict';

class ViewService {
  constructor(services) {
    this.services = services;
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
