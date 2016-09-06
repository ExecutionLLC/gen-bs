'use strict';

const fs = require('fs');
const _ = require('lodash');

const FIELD_NAME_PREFIX = 'INFO';
const sourceName = 'dbsnp_20160601_v01';
const outputFile = `out__${sourceName}.json`;

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
        // Search trimmed string in {} as colDescriptionMatch[1]
        const colDescriptionMatch = col.match(/{\s*([^}]*?)\s*}/);
        if (!colDescriptionMatch) {
            throw new Error(`Field ${fieldName}: cannot find { or }.`);
        }
        const params = colDescriptionMatch[1]
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
                // Search trimmed string in [], starting and ending with [ and ] as squaredMatch[1]
                const squaredMatch = rawValue.match(/^\[\s*(.*?)\s*]$/);
                if (squaredMatch) {
                    const arr = squaredMatch[1]
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
    .filter(col => !(col.params.hasOwnProperty('skip')));

function cutQuotes(strOrArray) {
    if (_.isArray(strOrArray)) {
        return strOrArray.map(cutQuotes);
    }
    const quotedMatch = strOrArray.match(/^"(.*)"$/);
    if (quotedMatch) {
        return quotedMatch[1];
    }
    return strOrArray;
}

function createColumnObject(fieldName, label) {
    if (!label) {
        throw new Error(`Field ${fieldName} has no label.`);
    }
    const name = (FIELD_NAME_PREFIX) ? `${FIELD_NAME_PREFIX}_${fieldName}` : fieldName;
    return {
        field: {
            name,
            source_name: sourceName
        },
        label: cutQuotes(label)
    };
}

const labels = columns.reduce((result, col) => {
    const {fieldName, params: { name: label }} = col;
    if (_.isArray(label)) {
        // TODO: Now MAF fields are not split, but the labels are written as if they are.
        // Therefore get only the first value for MEF fields
        if (fieldName.endsWith('MAF')) {
            const columnObject = createColumnObject(fieldName, label[0]);
            return [...result, columnObject];
        } else {
            return [...result, label.map((l, index) => createColumnObject(`${fieldName}_${index}`, l))];
        }
    } else {
        const columnObject = createColumnObject(fieldName, label);
        return [...result, columnObject];
    }
}, []);
fs.writeFileSync(__dirname + `/${outputFile}`, JSON.stringify(labels, null, 2));

console.log('Parsing completed.');
process.exit(0);
