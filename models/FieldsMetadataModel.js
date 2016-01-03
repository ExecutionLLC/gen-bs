'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const ExtendedModelBase = require('./ExtendedModelBase');

const mappedColumns = [
    'id',
    'name',
    'source_name',
    'value_type',
    'filter_control_enable',
    'is_mandatory',
    'is_editable',
    'is_invisible',
    'is_multi_select',
    'langu_id',
    'description'
];

class FieldsMetadataModel extends ExtendedModelBase {
    constructor(models) {
        super(models, 'field_metadata', mappedColumns);
    }


}

module.exports = FieldsMetadataModel;