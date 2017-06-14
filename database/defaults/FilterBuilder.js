'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../scripts/utils/FileSystemUtils');
const ChangeCaseUtil = require('../scripts/utils/ChangeCaseUtil.js');

// TODO: Now view builder can be merged with field builder to reduce most of the copy-paste.
class FilterBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        this.filterTemplates = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.defaultsDir + '/templates/filter-templates.json')
        );

        this.build = this.build.bind(this);
        this._storeFilters = this._storeFilters.bind(this);
        this._createFilter = this._createFilter.bind(this);
        this._createRules = this._createRules.bind(this);
        this._processRulesRecursively = this._processRulesRecursively.bind(this);
    }

    build(callback) {
        const fieldsMetadata = ChangeCaseUtil.convertKeysToCamelCase(
            require(this.fieldMetadataFile)
        );

        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.filtersDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.filtersDir, callback);
            },
            (callback) => {
                const filters = _.map(this.filterTemplates, (filter) => this._createFilter(filter, fieldsMetadata));
                this._storeFilters(filters, callback);
            }
        ], callback);
    }

    _storeFilters(filters, callback) {
        const json = JSON.stringify(filters, null, 2);
        const filtersFile = this.filtersDir + '/default-filters.json';
        FsUtils.writeStringToFile(filtersFile, json, callback);
    }

    _createFilter(filterTemplate, fieldsMetadata) {
        const rules = this._createRules(filterTemplate.rules, fieldsMetadata);
        return {
            id: Uuid.v4(),
            name: filterTemplate.name,
            description: filterTemplate.description,
            type: filterTemplate.type,
            isCopyDisabled: filterTemplate.isCopyDisabled,
            rules
        };
    }

    _createRules(rulesTemplate, fieldsMetadata) {
        return this._processRulesRecursively(rulesTemplate, fieldsMetadata);
    }

    _processRulesRecursively(rulesObject, fieldsMetadata) {
        const operator = rulesObject['$and'] ?
            '$and' : (
                rulesObject['$or'] ? '$or' : null
        );

        if (operator) {
            const operands = rulesObject[operator];
            const mappedOperands = _.map(operands, (operand) => this._processRulesRecursively(operand, fieldsMetadata));
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            const fieldDescriptor = rulesObject.field;
            const field = this._findField(fieldDescriptor.name, fieldDescriptor.sourceName, fieldDescriptor.valueType, fieldsMetadata);
            if (!field) {
                throw new Error('Field is not found: ' + fieldDescriptor.name + ', source: ' + fieldDescriptor.sourceName + ', type: ' + fieldDescriptor.valueType);
            }

            const condition = rulesObject.condition;
            const result = {};
            result[field.id] = condition;
            return result;
        }
    }
}

module.exports = new FilterBuilder();
