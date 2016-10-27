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
            })
        ));

}
/*
{"$or":[
    {
        "00000000-0000-0000-0000-000000000005":{
                                                    "$neq":"A"
                                               }
    },
    {
        "00000000-0000-0000-0000-000000000007":{
                                                    "$eq":"PASS"
                                               }
    },
    {
        "$and":[
            {
                "00000000-0000-0000-0000-000000000005":{
                                                            "$neq":"ABC"
                                                       }
            }
        ]
    }
]}
modify to
{
    "condition":"$or",
    "rules":[
        {
            "field":"00000000-0000-0000-0000-000000000005",
            "operator":"$neq",
            "value":"A"
        },
        {
            "field":"00000000-0000-0000-0000-000000000007",
            "operator":"$eq",
            "value":"PASS"
        },
        {
            "condition":"$and",
            "rules":[
                {
                    "field":"00000000-0000-0000-0000-000000000005",
                    "operator":"$neq",
                    "value":"ABC"
                }
            ]
        }
    ]
}
 */
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
        return {
            condition: operator,
            rules: mappedOperands
        };
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
    console.log('Moving filters to new format');
    return updateFiltersRules(knex, Promise)
        .then(() => console.log('=> Complete.'));
};

exports.down = function (knex, Promise) {
    throw new Error('Not implemented');
};
