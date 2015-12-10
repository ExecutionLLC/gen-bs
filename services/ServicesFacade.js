'use strict';

const UserService = require('./UserService');
const ViewService = require('./ViewService');

class ServiceFacade {
  constructor() {
    this.viewService = new ViewService(this);
    this.userService = new UserService(this);
  }
}

module.exports = ServiceFacade;
