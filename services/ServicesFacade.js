'use strict';

const UserService = require('./UserService');
const ViewService = require('./ViewService');
const SessionService = require('./SessionService');
const WSService = require('./WSService');
const ApplicationServerService = require('./ApplicationServerService');


class ServiceFacade {
  constructor(config) {
    this.config = config;
    this.views = new ViewService(this);
    this.users = new UserService(this);

    this.sessionService = new SessionService(this);
    this.applicationServer = new ApplicationServerService(this);

    this.wsService = new WSService(this);
  }
}

module.exports = ServiceFacade;
