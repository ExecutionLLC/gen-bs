'use strict';

const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ViewsService extends UserEntityServiceBase {
  constructor(services, models) {
      super(services, models, models.views);
  }

  update(user, view, callback) {
      async.waterfall([
          (callback) => super.find(user, view.id, callback),
          (existingView, callback) => {
          if (existingView.type !== 'user') {
              callback(new Error('Default view cannot be updated'));
          } else {
              super.update(user, view, callback);
          }
        }
      ], callback);
  }
}

module.exports = ViewsService;
