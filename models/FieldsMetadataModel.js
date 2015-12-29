'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

class FieldsMetadataModel {
    constructor() {
        this.fields = [];
    }

    addWithId(field, callback) {
        this.fields.push(field);
        callback(null, field);
    }

    add(field, callback) {
        field.id = Uuid.v4();
        this.fields.push(field);
        callback(null, field);
    }

    find(id, callback) {
        const field = _.find(this.fields, field => field.id === id);
        if (field) {
            callback(null, field);
        } else {
            callback(new Error('Field not found'));
        }
    }
}

module.exports = FieldsMetadataModel;