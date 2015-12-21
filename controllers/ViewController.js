'use strict';

const UserEntityControllerBase = require('./UserEntityControllerBase');

class ViewController extends UserEntityControllerBase {
  constructor(services) {
    super(services, services.views);
  }
}

module.exports = ViewController;
