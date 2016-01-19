'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');
const async = require('async');

const DefaultsBuilderBase = require('./DefaultsBuilderBase');
const FsUtils = require('../utils/FileSystemUtils');

class FilterBuilder extends DefaultsBuilderBase {
    constructor() {
        super();

        // CAUTION! Do not use ChangeCaseUtil here, as currently it works incorrect with '$' symbols.
        this.filterTemplates = require(this.defaultsDir + '/templates/filter-templates.json');

        this.build = this.build.bind(this);
        this._storeFilters = this._storeFilters.bind(this);
        this._createFilter = this._createFilter.bind(this);
        this._createRules = this._createRules.bind(this);
        this._processRulesRecursively = this._processRulesRecursively.bind(this);
    }

    build(callback) {
        async.waterfall([
            (callback) => {
                FsUtils.createDirectoryIfNotExists(this.filtersDir, callback);
            },
            (callback) => {
                this._removeJsonFilesFromDirectory(this.filtersDir, callback);
            },
            (callback) => {
                const filters = _.map(this.filterTemplates, this._createFilter);
                this._storeFilters(filters, callback);
            }
        ], callback);
    }

    _storeFilters(filters, callback) {
        const json = JSON.stringify(filters, null, 2);
        const filtersFile = this.filtersDir + '/default-filters.json';
        FsUtils.writeStringToFile(filtersFile, json, callback);
    }

    _createFilter(filterTemplate) {
        const rules = this._createRules(filterTemplate.rules);
        return {
            id: Uuid.v4(),
            name: filterTemplate.name,
            description: filterTemplate.description,
            type: filterTemplate.type,
            is_disabled_4copy: filterTemplate.is_disabled_4copy,
            rules
        };
    }

    _createRules(rulesTemplate) {
        return this._processRulesRecursively(rulesTemplate);
    }

    _processRulesRecursively(rulesObject) {
        const operator = rulesObject['$and'] ?
            '$and' : (
                rulesObject['$or'] ? '$or' : null
        );

        if (operator) {
            const operands = rulesObject[operator];
            const mappedOperands = _.map(operands, this._processRulesRecursively);
            const result = {};
            result[operator] = mappedOperands;
            return result;
        } else {
            const field = rulesObject.field;
            const condition = rulesObject.condition;
            const fieldName = field.source_name === 'sample' ?
                field.name : field.source_name + '_' + field.name;

            const result = {};
            result[fieldName] = condition;
            return result;
        }
    }
}

module.exports = new FilterBuilder();
