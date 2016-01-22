'use strict';

const MockModelBase = require('./MockModelBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const FILTERS = ChangeCaseUtil.convertKeysToCamelCase(
    require('../defaults/filters/default-filters.json')
);
const userId = require('../test_data/user_metadata.json')[0].id;

class FiltersModel extends MockModelBase {
    constructor() {
        super(FILTERS, userId);
    }
}

module.exports = FiltersModel;
