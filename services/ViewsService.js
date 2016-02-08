'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ViewsService extends UserEntityServiceBase {
  constructor(services, models) {
      super(services, models, models.views);
  }

  add(user, languId, item, callback) {
    if (!_.isArray(item.viewListItems)) {
        callback(new Error('View list items must be an array'));
    } else if (item.viewListItems.length === 0) {
        callback(new Error('View list items must contain at least one element'));
    } else {
        super.add(user, languId, item, callback);
    }
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
