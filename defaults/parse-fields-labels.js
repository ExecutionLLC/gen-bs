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
        const params = col.substring(col.indexOf('{') + 2, col.indexOf('}') - 1)
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

function cutQuotes(str) {
    if (str.startsWith('"') && str.endsWith('"')) {
        str = str.substring(1, str.length - 1);
    }
    return str;
}

const labels = columns.map(col => ({
    field: {
        name: `INFO_${col.fieldName}`,
        source_name: 'dbsnp_20160601_v01'
    },
    label: cutQuotes(col.params.name)
}));
fs.writeFileSync(__dirname + '/out__dbsnp_20160601_v01.json', JSON.stringify(labels, null, 2));

console.log('Parsing completed.');
process.exit(0);
