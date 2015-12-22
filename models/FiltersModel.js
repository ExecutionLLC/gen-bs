'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const MockModelBase = require('./MockModelBase');

const FILTERS = require('../test_data/filters.json');
const userId = require('../test_data/user_metadata.json')[0].id;

class FiltersModel extends MockModelBase {
    constructor() {
        super(FILTERS, userId);
    }
}

module.exports = FiltersModel;
