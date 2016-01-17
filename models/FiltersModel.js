'use strict';

const MockModelBase = require('./MockModelBase');

const FILTERS = require('../defaults/filters/default-filters.json');
const userId = require('../test_data/user_metadata.json')[0].id;

class FiltersModel extends MockModelBase {
    constructor() {
        super(FILTERS, userId);
    }
}

module.exports = FiltersModel;
