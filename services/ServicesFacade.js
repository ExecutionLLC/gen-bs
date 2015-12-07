'use strict';

const UserService = require('./UserService');
const ViewService = require('./ViewService');

class ServiceFacade {
  constructor() {
    this.views = new ViewService(this);
    this.users = new UserService(this);
  }
}

module.exports = ServiceFacade;
