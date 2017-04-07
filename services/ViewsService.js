'use strict';

const _ = require('lodash');
const async = require('async');

const UserEntityServiceBase = require('./UserEntityServiceBase');

class ViewsService extends UserEntityServiceBase {
    constructor(services, models) {
        super(services, models, models.views);
    }

    add(user, languageId, item, callback) {
        async.waterfall([
            (callback) => {
                this._viewItemsCheck(item, callback);
            },
            (item, callback) => super.findAll(user, callback),
            (views, callback) => {
                this._checkViewNameExists(item, views, callback);
            },
            (item, callback) => {
                super.add(user, languageId, item, callback);
            }
        ], callback);
    }

    update(user, view, callback) {
        async.waterfall([
            (callback) => {
                this._viewItemsCheck(view, callback);
            },
            (view, callback) => super.find(user, view.id, callback),
            (existingView, callback) => this._ensureItemOfUserType(existingView, callback),
            (existingView, callback) => super.update(user, view, callback)
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

    _checkViewNameExists(view, views, callback) {
        const viewText = _.find(view.text, textData => _.isNull(textData.languageId));
        if (!_.isString(viewText.name)) {
            callback(new Error('View name should be a string.'));
            return;
        }
        const viewName = viewText.name.trim();
        const viewExists = _.some(
            views, v => _.some(v.text, textData => {
                return textData.name.trim() == viewName;
            })
        );
        if (viewExists) {
            callback(new Error('View with this name already exists.'));
        } else {
            callback(null, view);
        }
    }
}

module.exports = ViewsService;
