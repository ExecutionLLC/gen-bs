'use strict';

const MockModelBase = require('./MockModelBase');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const VIEWS = ChangeCaseUtil.convertKeysToCamelCase(
    require('../defaults/views/default-views.json')
);
const userId = require('../test_data/user_metadata.json')[0].id;

class ViewsModel extends MockModelBase {
    constructor() {
        super(VIEWS, userId);
    }
}

module.exports = ViewsModel;
