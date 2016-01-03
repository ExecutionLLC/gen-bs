'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [];

class SamplesModel extends SecureModelBase {
    constructor(models) {
        super(models, 'vcf_file_sample', mappedColumns);
    }


}

module.exports = SamplesModel;