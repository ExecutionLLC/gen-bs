'use strict';

const _ = require('lodash');

function updateFiltersRules(knex, Promise) {
    console.log('=> Update filters ...');
    return knex('filter')
        .select('id', 'rules')
        .then((filterObjects) => Promise.all(
            filterObjects.map((filterObject) => {
                    const newRule = createNewRulesFormat(filterObject.rules);
                    return knex('filter')
                        .where('id', filterObject.id)
                        .update({
                            rules: newRule
                        })
                }
            )
            )
        );

}

function createNewRulesFormat(oldRule) {
    if (oldRule === null) {
        return null
    }
    return processRulesRecursively(oldRule);
}

function processRulesRecursively(rulesObject) {
    const operator = rulesObject['$and'] ?
        '$and' : (
        rulesObject['$or'] ? '$or' : null
    );

    if (operator) {
        const operands = rulesObject[operator];
        const mappedOperands = _.map(operands, (operand) => processRulesRecursively(operand));
        const result = {};
        result['condition'] = operator;
        result['rules'] = mappedOperands;
        return result;
    } else {
        const field = Object.keys(rulesObject)[0];
        const fieldRule = rulesObject[field];
        const operator = Object.keys(fieldRule)[0];
        const value = fieldRule[operator];
        return {
            field,
            operator,
            value
        };
    }
}

exports.up = function (knex, Promise) {
    return updateFiltersRules(knex, Promise)
        .then(() => console.log('=> Complete.'));
};

exports.down = function (knex, Promise) {

};
