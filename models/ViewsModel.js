'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const MockModelBase = require('./MockModelBase');

const VIEWS = require('../test_data/views.json');
const userId = require('../test_data/user_metadata.json')[0].id;

class ViewsModel extends MockModelBase {
    constructor() {
        super(VIEWS, userId);
    }
}

module.exports = ViewsModel;
