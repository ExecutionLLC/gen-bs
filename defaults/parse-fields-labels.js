'use strict';

const fs = require('fs');
const _ = require('lodash');

const columnStrings = fs.readFileSync(__dirname + '/columns.txt')
    .toString()
    .split('column name:')
    .filter(col => col && col.length)
    .map(col => col.trim()
        .replace(/(“|”)/g, '"')
    );

// Each of them is a string similar to
// '"CAF" {,name: "Allele frequency",Number=R,type: flag,comment: "based on 1000 genomes project",hidden,}'
const columns = columnStrings
    .map(col => {
        const fieldName = col.substr(1, col.indexOf('"', 1) - 1);
        const startIndex = col.indexOf('{');
        const endIndex = col.indexOf('}');
        if (startIndex === -1 || endIndex === -1) {
            throw new Error(`Field ${fieldName}: cannot find { or }.`);
        }
        const params = col.substring(startIndex + 2, endIndex - 1)
            .trim()
            // Each param is on it's own line.
            .split('\n')
            // Parse params to objects.
            .map(param => {
                // Split by first occurrence of ':'.
                const parts = param.split(/:(.+)?/);
                const name = parts[0];
                // Some properties don't have value, as 'hidden' or 'skip'
                const rawValue = parts.length > 1 ? parts[1].trim() : '';
                return {name, rawValue};
            })
            // Parse array values for params: [Something, "here"]
            .map(({name, rawValue}) => {
                if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
                    const arr = rawValue.substring(rawValue.indexOf('[') + 1, rawValue.indexOf(']'))
                        .trim()
                        .split(',')
                        .filter(val => val)
                        .map(val => val.trim());
                    return {
                        name,
                        rawValue: arr
                    };
                } else {
                    return {name, rawValue};
                }
            })
            // Create one object with all params.
            .reduce((result, {name, rawValue}) => {
                result[name] = rawValue;
                return result;
            }, {});
        return {
            fieldName,
            params
        };
    })
    .filter(col => !(col.params.hasOwnProperty('skip') || col.params.hasOwnProperty('hidden')));

function cutQuotes(strOrArray) {
    if (_.isArray(strOrArray)) {
        return strOrArray.map(cutQuotes);
    }
    if (strOrArray.startsWith('"') && strOrArray.endsWith('"')) {
        return strOrArray.substring(1, strOrArray.length - 1);
    }
    return strOrArray;
}

function createColumnObject(fieldName, label) {
    return {
        field: {
            name: `INFO_${fieldName}`,
            source_name: 'dbsnp_20160601_v01'
        },
        label: cutQuotes(label)
    };
}

const labels = columns.reduce((result, col) => {
    const {fieldName, params: { name: label }} = col;
    if (_.isArray(label)) {
        label.map((l, index) => createColumnObject(`${fieldName}_${index}`, l))
            .forEach(columnObject => result.push(columnObject));
    } else {
        const columnObject = createColumnObject(fieldName, label);
        result.push(columnObject);
    }
    return result;
}, []);
fs.writeFileSync(__dirname + '/out__dbsnp_20160601_v01.json', JSON.stringify(labels, null, 2));

console.log('Parsing completed.');
process.exit(0);
