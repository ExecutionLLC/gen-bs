'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ViewsService extends UserEntityServiceBase {
  constructor(services, models) {
      super(services, models, models.views);
  }

  add(user, languId, item, callback) {
    async.waterfall([
        (callback) => {
            this._viewItemsCheck(item, callback);
        },
        (item, callback) => {
            super.add(user, languId, item, callback);
        }
    ], callback);
  }

  update(user, view, callback) {
      async.waterfall([
          (callback) => super.find(user, view.id, callback),
          (existingView, callback) => {
              this._viewItemsCheck(existingView, callback);
          },
          (existingView, callback) => {
              if (existingView.type !== 'user') {
                  callback(new Error('Default view cannot be updated'));
              } else {
                super.update(user, view, callback);
              }
          }
      ], callback);
  }

  _viewItemsCheck(view, callback) {
      if (!view.viewListItems) {
          callback(new Error('View list items must be defined'))
      } else if (!_.isArray(view.viewListItems)) {
          callback(new Error('View list items must be an array'));
      } else if (view.viewListItems.length === 0) {
          callback(new Error('View list items must contain at least one element'));
      } else {
        callback(null, view);
      }
  }

}

module.exports = ViewsService;
