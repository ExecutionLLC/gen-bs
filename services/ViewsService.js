'use strict';

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ViewsService extends UserEntityServiceBase {
  constructor(services, models) {
    super(services, models, models.views);
  }
}

module.exports = ViewsService;
