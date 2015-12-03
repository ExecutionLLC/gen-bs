'use strict';

const UserService = require('./UserService');
const ViewService = require('./ViewService');

class ServiceFacade {
  constructor() {
    this.views = new ViewService();
    this.users = new UserService();
  }
}

module.exports = ServiceFacade;
