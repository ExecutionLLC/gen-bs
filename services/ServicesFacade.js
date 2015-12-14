'use strict';

const UserService = require('./UserService');
const ViewService = require('./ViewService');
const ApplicationServerService = require('./ApplicationServerService');

class ServiceFacade {
  constructor() {
    this.views = new ViewService(this);
    this.users = new UserService(this);
    this.applicationServer = new ApplicationServerService(this);
  }
}

module.exports = ServiceFacade;
