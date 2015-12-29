'use strict';

const MockModelBase = require('./MockModelBase');
const userId = require('../test_data/user_metadata.json')[0].id;

class SamplesModel extends MockModelBase {
    constructor() {
        super([], userId);
    }
}

module.exports = SamplesModel;