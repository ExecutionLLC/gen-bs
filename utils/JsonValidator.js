'use strict';

var Ajv = require('ajv');


class JsonValidator {

    constructor() {
        this.ajv = Ajv({
            v5: true,
            allErrors: true,
            verbose: true,
            schemas: [
                require('../docs/ws-ui-schema/WS-UI/get_data_to_table_answer'),
                require('../docs/ws-ui-schema/WS-UI/get_filters'),
                require('../docs/ws-ui-schema/WS-UI/get_user_data'),
                require('../docs/ws-ui-schema/WS-UI/get_saved_files_answer'),
                require('../docs/ws-ui-schema/WS-UI/get_fields_metadata'),
                require('../docs/ws-ui-schema/UI-WS/save_file'),
                require('../docs/ws-ui-schema/base_json/filter'),
                require('../docs/ws-ui-schema/base_json/user_metadata'),
                require('../docs/ws-ui-schema/base_json/sample_metadata'),
                require('../docs/ws-ui-schema/base_json/view'),
                require('../docs/ws-ui-schema/base_json/query_history'),
                require('../docs/ws-ui-schema/base_json/field_metadata'),
                require('../docs/ws-ui-schema/base_json/view_list_item'),
                require('../docs/ws-ui-schema/base_json/keyword'),
                require('../docs/ws-ui-schema/base_json/sample'),
                require('../docs/ws-ui-schema/base_json/vcf_field'),
                require('../docs/ws-ui-schema/base_json/comment'),
            ]
        });
    }

    _validateData(validateFunction, data) {
        var valid = validateFunction(data);

        if (valid) {
            console.log('Data is valid!');
        } else {
            console.log('Data is INVALID!');
            console.log(validateFunction.errors);
        }
        return valid;
    }

    getValidateWsUiGetDataToTableAnswer(data) {
        const validate = this.ajv.getSchema('ws-ui-schema/WS-UI/get_data_to_table_answer#');
        return this._validateData(validate, data)
    }

    getValidateWsUiGetFilters(data) {
        const validate =  this.ajv.getSchema('ws-ui-schema/WS-UI/get_filters#');
        return this._validateData(validate, data)
    }

    getValidateWsUiFilter(data) {
        const validate =  this.ajv.getSchema('ws-ui-schema/base_json/filter#');
        return this._validateData(validate, data)
    }

    getValidateUserData(data) {
        const validate =  this.ajv.getSchema('ws-ui-schema/WS-UI/get_user_data#');
        return this._validateData(validate, data)
    }

    getValidateGetSavedFilesAnswer(data) {
        const validate =  this.ajv.getSchema('ws-ui-schema/WS-UI/get_saved_files_answer#');
        return this._validateData(validate, data)
    }

    getValidateGetFieldsMetadata(data) {
        const validate =  this.ajv.getSchema('ws-ui-schema/WS-UI/get_fields_metadata#');
        return this._validateData(validate, data)
    }
}

module.exports = JsonValidator;