'use strict';
// Usage: in node, funcs = require('funcs')
// Convenient functions for direct database manipulation
const Promise = require('bluebird');
const _ = require('lodash');

const ModelsFacade = require('../../../models/ModelsFacade');
const Logger = require('../../../utils/Logger');
const config = require('../../../utils/Config');
const FsUtils = require('../../../utils/FileSystemUtils');

const logger = new Logger(config.logger);
const models = new ModelsFacade(config, logger);
const services = null;//new ServicesFacade(config, logger, models);

function findFilterAsync(userId, filterId) {
    return Promise.fromCallback(done => models.filters.find(userId, filterId, done));
}

function findTotalFieldsHashAsync() {
    return Promise.fromCallback(done => models.fields.findTotalMetadata(done))
        .then((totalFields) => _.keyBy(totalFields, 'id'));
}

function makeFilterRulesTemplate(filterRules, totalFieldsHash) {
    const and = '$and';
    const or = '$or';
    function processFilterRule(rule) {
        const operator = rule.hasOwnProperty(and) ? and : rule.hasOwnProperty(or) ? or : null;
        if (operator) {
            const subrulesArray = rule[operator];
            const newRules = subrulesArray.map(processFilterRule);
            return {
                [operator]: newRules
            };
        } else {
            const fieldId = Object.keys(rule)[0];
            const field = totalFieldsHash[fieldId];
            const fieldCondition = rule[fieldId];
            if (!field || !fieldCondition) {
                throw new Error(`No field id or condition is found in the rule ${JSON.stringify(rule, null, 2)}`);
            }
            return {
                field: {
                    source_name: field.sourceName,
                    name: field.name,
                    value_type: field.valueType
                },
                condition: fieldCondition
            };
        }
    }
    return processFilterRule(filterRules);
}

function getFilterAsTemplateAsync(userId, filterId) {
    return Promise.all([
        findFilterAsync(userId, filterId),
        findTotalFieldsHashAsync()
    ]).spread((filter, totalFieldsHash) => {
        const newRules = makeFilterRulesTemplate(filter.rules, totalFieldsHash);
        const filterTemplate = Object.assign({}, filter, {
            rules: newRules
        });
        return Promise.resolve(filterTemplate);
    });
}

function listAllFiltersAsync(queryConditionFuncOrNull) {
    let selector = models.db.knex.select().from('filter');
    if (queryConditionFuncOrNull) {
        queryConditionFuncOrNull(selector);
    }
    return selector;
}

function printResult(result) {
    console.log(JSON.stringify(result, null, 2));
}

function writeStringToFileAsync(filePath, contents) {
    return Promise.fromCallback(callback => FsUtils.writeStringToFile(filePath, contents, callback));
}

module.exports = {
    models,
    services,
    writeStringToFileAsync,
    printResult,
    listAllFiltersAsync,
    getFilterAsTemplateAsync
};