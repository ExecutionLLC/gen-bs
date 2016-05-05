'use strict';

const UserEntityControllerBase = require('./base/UserEntityControllerBase');

class ViewController extends UserEntityControllerBase {
  constructor(services) {
    super(services, services.views);
  }
}

module.exports = ViewController;
