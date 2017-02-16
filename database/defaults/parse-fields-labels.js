'use strict';

const fs = require('fs');
const _ = require('lodash');

const FIELD_NAME_PREFIX = 'INFO';
const sourceName = 'dbsnp_20160601_v01';
const outputFile = `out__${sourceName}.json`;

// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/1000genomes.txt';
// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ClinVar.txt';
// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/dbSNP.txt';
// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ESP6500.txt';
// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/ExAC.txt';
// const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vcf.txt';
const inputFile = '/home/andrey/work/sources/VCFUtils/docs/parsing-rules-translate/vep.txt';


function getAllIndexes(str, subStr) {
    let indexes = [];
    let i = 0;
    while (true) {
        i = str.indexOf(subStr, i+1);
        if (i === -1) {
            break;
        } else {
            indexes.push(i);
        }
    }
    return indexes;
}

function findClosingChar(str, openPos, openChar = '{', closeChar = '}') {
    let closePos = openPos;
    let counter = 1;
    while (counter > 0) {
        const char = str[++closePos];
        if (char === openChar) {
            counter++;
        }
        else if (char === closeChar) {
            counter--;
        }
    }
    return closePos;
}

function exitWithError(err) {
    console.log(err);
    process.exit(1);
}

function  assertRange(left, right) {
    if (left > right) {
        throw `Bad range {${left} - ${right}}`;
    }
}

// range1 inside of range2
function insideOf(r1, r2)
{
    assertRange(r1.left, r1.right);
    assertRange(r2.left, r2.right);
    if (r1.left < r2.left && r1.right >= r2.left && r1.right <= r2.right) {
        throw `Intersection detected for ranges {${r1.left} - ${r1.right}} and {${r2.left} - ${r2.right}}`;
    } else if (r1.left >= r2.left && r1.left <= r2.right && r1.right > r2.right) {
        throw `Intersection detected for ranges {${r1.left} - ${r1.right}} and {${r2.left} - ${r2.right}}`;
    } else {
        return (r1.left > r2.left && r1.left < r2.right && r1.right > r2.left && r1.right < r2.right);
    }
}

function parseSingleField(col, text) {
    const a = text.split(':');
    if (!a || a.length < 2) {
        exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
    } else {
        let key = a[0].trim();
        const value = cutQuotes(a[1].trim());
        const exclamInd = key.indexOf('!');
        if (exclamInd === 0) {
            key = key.slice(1);
        } else if (exclamInd > 0) {
            exitWithError(`Error in key {${key}} in column ${col.name}`);
        }
        if (key === '' || value === '') {
            exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
        } else if (key in col) {
            exitWithError(`Field ${key} already exists in column ${col.name}`);
        } else {
            col[key] = value;
            return true;
        }
    }
}

function parseFlag(col, text) {
    const flag = text.trim();
    if (flag in col) {
        exitWithError(`Field ${flag} already exists in column ${col.name}`);
    } else {
        col[flag] = true;
        return true;
    }
}

function parseMultilineField(col, text) {
    const sepInd = text.indexOf(':');
    if (sepInd === -1) {
        exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
    } else {
        const key = text.slice(0, text.indexOf(':')).trim();
        const value = text.slice(text.indexOf(':') + 1).trim().slice(1, -1);
        if (key === '' || value === '') {
            exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
        } else if (key in col) {
            exitWithError(`Field ${key} already exists in column ${col.name}`);
        } else {
            const spl = value.split(/,\s*(?={)/);
            const colArr = _.map(spl, (item) => {
                const found = item.match(/{\s*([^{}]*?)\s*}/);
                if (!found || found.length < 2) {
                    exitWithError(`Can't parse  ${text}`);
                }
                return parseBody({}, found[1], true);
            });
            col[key] = colArr;
            return true;
        }
    }

}

function parseBody(col, text, subcolumn = false) {
    while (text !== '') {
        let right = text.indexOf('\n');
        if (right === -1) {
            right = text.length;
        }
        const chunk = text.slice(0, right);

        let res = false;

        if (chunk.trim() === '') {
            res = true;
        } else if (!subcolumn && chunk.includes('[') && chunk.indexOf('columns') === 0) {
            const left = text.indexOf('[');
            right = findClosingChar(text, left, '[', ']');
            res = parseMultilineField(col, text.substring(0, right + 1));
        } else if (chunk.includes(':')) {
            res = parseSingleField(col, chunk);
        } else {
            res = parseFlag(col, chunk);
        }

        if (res) {
            text = text.slice(right + 1).trim();
        }
    }
    return col;
}

function getRawColumnData(inputFile) {
    const content = fs.readFileSync(inputFile).toString();
    const columnText = content.substring(content.indexOf('parsing')); // start from 'parsing'

    const indexes1 = getAllIndexes(columnText, 'column name'); // TODO: /\W(column name)\W/g
    const indexes2 = getAllIndexes(columnText, 'Generate new column');
    const indexes = indexes1.concat(indexes2).sort();

    // 1. Get raw data (parse column names and get ranges with textual raw data)

    const columnData = indexes.map((i) => {
        const left = columnText.indexOf('{', i);
        const rightLimitForSearchName = (left || columnText.indexOf('\n', i)) - 1;
        const found = columnText.substring(i, rightLimitForSearchName).match(/"(.*)"/);
        if (!found || found.length < 2) {
            exitWithError(`Can't find column name in ${columnText.substring(i, rightLimitForSearchName)}`);
        }
        const column_name = found[1];
        const right = findClosingChar(columnText, left);

        return {
            left: left,
            right: right,
            column_name,
            text: columnText.substring(left + 1, right)
        };
    });

    const sortedColumnData = _.sortBy(columnData, ['left']);

    // 2. Process prefixes
    let prefixes = [];
    _.forEach(sortedColumnData, (col) => {
        _.forEach(sortedColumnData, (c) => {
            if (c === col)
                return;
            if (insideOf(c, col)) {
                if ('prefix' in c) {
                    exitWithError(`Column ${c.name} has two or more parents`);
                }
                c.prefix = col.name;
                if (!_.includes(prefixes, col)) {
                    prefixes.push(col);
                }
            }
        })
    });
    _.remove(sortedColumnData, (col) => _.includes(prefixes, col));
    return sortedColumnData;
}

const rawColumnData = getRawColumnData(inputFile);
// console.log(JSON.stringify(rawColumnData, null, 2));
console.log('First stage completed');

// Process column bodies
const parsedColumnData = _.map(rawColumnData, (col) => parseBody(col, col.text));
console.log('Second stage completed');
// console.log(JSON.stringify(parsedColumnData, null, 2));

// Skip columns with the 'hidden' property
const totalCount = parsedColumnData.length;
_.remove(parsedColumnData, 'hidden');
_.remove(parsedColumnData, 'skip');
// console.log(JSON.stringify(parsedColumnData, null, 2));
console.log(`Skip hidden columns... ${totalCount - parsedColumnData.length} were skipped;`);

// Process data about sub columns
const processedColumnData = _.reduce(parsedColumnData, (result, col) => {
    if ('columns' in col) {

        _.forEach(col.columns, (subColumn) => {
            result.push({
                column_name: col.prefix ? `${col.prefix}_${subColumn.ref}` : subColumn.ref,
                name: subColumn.name,
                comment: subColumn.comment
            })
        });
    } else {
        if (col.prefix) {
            col.column_name = `${col.prefix}_${subColumn.column_name}`
        }
        result.push(_.pick(col, ['column_name', 'name', 'comment']));
    }
    return result;
}, []);


console.log('Third stage completed');
console.log(JSON.stringify(processedColumnData, null, 2));

process.exit(0);



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
    const name = FIELD_NAME_PREFIX ? `${FIELD_NAME_PREFIX}_${fieldName}` : fieldName;
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
