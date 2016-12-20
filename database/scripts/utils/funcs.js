'use strict';
// Usage: in node, funcs = require('funcs')
// Convenient functions for direct database manipulation
const Promise = require('bluebird');
const _ = require('lodash');

const ModelsFacade = require('../../../models/ModelsFacade');
const Logger = require('../../../utils/Logger');
const config = require('../../../utils/Config');
const FsUtils = require('../../../utils/FileSystemUtils');
const CollectionUtils = require('../../../utils/CollectionUtils');

const logger = new Logger(config.logger);
const models = new ModelsFacade(config, logger);

function findTotalFieldsHashAsync() {
    return Promise.fromCallback(done => models.fields.findAll(done))
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

function getFilterAsTemplateAsync(filter) {
    return findTotalFieldsHashAsync()
        .then((totalFieldsHash) => {
        const {name, description, type, rules} = filter;
        const newRules = makeFilterRulesTemplate(rules, totalFieldsHash);
        const filterTemplate = {
            name,
            description,
            type,
            is_copy_disabled: false,
            rules: newRules
        };
        return Promise.resolve(filterTemplate);
    });
}

function listAllFiltersAsync(queryConditionFuncOrNull) {
    let selector = models.db.knex.select()
        .from('filter')
        .innerJoin('filter_text', 'filter_text.filter_id', 'filter.id');
    if (queryConditionFuncOrNull) {
        queryConditionFuncOrNull(selector);
    }
    return selector;
}

function listAllViewsAsync(queryConditionFuncOrNull) {
    let selector = models.db.knex.select()
        .from('view')
        .innerJoin('view_text', 'view_text.view_id', 'view.id');
    if (queryConditionFuncOrNull) {
        queryConditionFuncOrNull(selector);
    }
    return selector
        .then((views) => {
            const viewIds = views.map(v => v.id);
            return models.db.knex.select()
                    .from('view_item')
                    .whereIn('view_id', viewIds)
                .then((viewItems) => CollectionUtils.createMultiValueHash(viewItems, (item) => item.view_id))
                .then((viewIdToItemsHash) => ({
                    viewIds,
                    views,
                    viewIdToItemsHash
                }));
            // TODO: Add keywords support here.
        }).then(({views, viewIdToItemsHash}) => {
            return views.map(view => Object.assign({}, view, {
                view_list_items: viewIdToItemsHash[view.id]
            }));
        });
}

function getViewAsTemplateAsync(view) {
    return findTotalFieldsHashAsync()
        .then(totalFieldsHash => {
            const {name, description, type} = view;
            return {
                name,
                description,
                type,
                items: view.view_list_items.map(item => {
                    const {field_id, order, sort_order, sort_direction} = item;
                    const field = totalFieldsHash[field_id];
                    if (!field) {
                        throw new Error(`Field is not found for item ${item}`);
                    }
                    return {
                        field: {
                            name: field.name,
                            source_name: field.sourceName,
                            value_type: field.valueType
                        },
                        keywords: [],
                        order,
                        sort_order,
                        sort_direction
                    };
                })
            };
        });
}

function printResult(result) {
    console.log(JSON.stringify(result, null, 2));
}

function writeStringToFileAsync(filePath, contents) {
    return Promise.fromCallback(callback => FsUtils.writeStringToFile(filePath, contents, callback));
}

module.exports = {
    models,
    writeStringToFileAsync,
    printResult,

    findTotalFieldsHashAsync,

    listAllViewsAsync,
    getViewAsTemplateAsync,

    listAllFiltersAsync,
    getFilterAsTemplateAsync
};