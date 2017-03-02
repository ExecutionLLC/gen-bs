'use strict';

const fs = require('fs');
const _ = require('lodash');


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

function cutQuotes(str) {
    const firstCh = str.charAt(0);
    const lastCh = str.slice(-1);
    if (firstCh === '"' && lastCh === '"') {
        return str.slice(1, -1);
    } else {
        if (firstCh === '"' || lastCh === '"') {
            console.log(`Warning: double quote mismatch in '${str}'`);
        }
        return str;
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
    const colonInd = text.indexOf(':');
    let key = text.slice(0, colonInd).trim();
    const rawValue = text.slice(colonInd + 1).trim();
    if (key === '' || rawValue === '') {
        exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
    }
    const value = cutQuotes(rawValue);
    const exclamInd = key.indexOf('!');
    if (exclamInd === 0) {
        key = key.slice(1);
    } else if (exclamInd > 0) {
        exitWithError(`Error in key {${key}} in column ${col.name}`);
    }
    if (key in col) {
        exitWithError(`Field ${key} already exists in column ${col.name}`);
    } else {
        col[key] = value;
        return true;
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

function  getArrayOfSubcolumnTexts(text) {
    let result = [];
    while (text !== '') {
        text.trim();

        // skip commas
        let left = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                left = i;
                break;
            } else if (text[i] !== ',') {
                exitWithError(`Can't parse  ${text}`);
            }
        }
        const right = findClosingChar(text, left);

        result.push(text.substring(left + 1, right).trim());

        text = text.slice(right + 1);
    }
    return result;
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
            col[key] = _.map(getArrayOfSubcolumnTexts(value), (item) => parseBody({}, item, true));
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
                c.prefix = col.column_name;
                if (!_.includes(prefixes, col)) {
                    prefixes.push(col);
                }
            }
        })
    });
    _.remove(sortedColumnData, (col) => _.includes(prefixes, col));
    return sortedColumnData;
}

function isBlank(string) {
    return (_.isUndefined(string) || _.isNull(string) || !_.isString(string) || string.trim().length === 0);
}

const validTypes = [
    'string',
    'integer',
    'float',
    'boolean',
    'hyperlink'
];

function fixDimensionForBoolean(col) {
    if (col.value_type === 'boolean' && col.dimension === '0') {
        col.dimension = '1';
    }
}

function validateColumn(col) {
    if (isBlank(col.column_name)) {
        console.log(`Invalid column ${JSON.stringify(col)}`);
    } else {
        if (isBlank(col.source_name)) {
            console.log(`Unknown source_name in column ${JSON.stringify(col)}`);
        }
        if (isBlank(col.value_type)) {
            console.log(`Unknown value_type in column ${JSON.stringify(col)}`);
        } else if (!_.includes(validTypes, col.value_type)) {
            console.log(`Invalid value_type in column ${JSON.stringify(col)}`);
        }

        if (isBlank(col.dimension)) {
            console.log(`Unknown dimension in column ${JSON.stringify(col)}`);
        } else if (isNaN(+col.dimension)) {
            console.log(`Invalid dimension in column ${JSON.stringify(col)}`);
        }

        if (isBlank(col.en.label)) {
            console.log(`Unknown en.label in column ${JSON.stringify(col)}`);
        }
        if (isBlank(col.en.description)) {
            console.log(`Unknown en.description in column ${JSON.stringify(col)}`);
        }
    }
}

function mapDimension(dimensionRawValue) {
    if (isNaN(dimensionRawValue)) {
        switch (dimensionRawValue) {
            case '.':
            case 'CLN':
                return '0';
            case 'R':
                return '-2';
            default:
                exitWithError(`Unknown dimension value: ${dimensionRawValue}`);
        }
    } else {
        return dimensionRawValue;
    }
}

function mapType(type) {
    return type === 'flag' ? 'boolean' : type;
}

function processRulesFile(inputFilePath, source_name) {
    console.log(`\n# ---------- Process ${source_name} ---------- #`);

    // Find all column entries in the text
    const rawColumnData = getRawColumnData(inputFilePath);

    // Process column bodies
    const parsedColumnData = _.map(rawColumnData, (col) => parseBody(col, col.text));

    // Skip columns with the 'hidden' property
    const beforeSkip = parsedColumnData.length;
    _.remove(parsedColumnData, 'hidden');
    _.remove(parsedColumnData, 'skip');
    _.remove(parsedColumnData, 'hide');
    const skipped = beforeSkip - parsedColumnData.length;

    // Process data about sub columns
    const processedColumnData = _.reduce(parsedColumnData, (result, col) => {

        const data = {
            column_name: col.prefix ? `${col.prefix}_${col.column_name}` : col.column_name,
            source_name,
            value_type: mapType(col.type || 'string'),
            dimension:  mapDimension(col.number || '0'),
            en: {
                label: col.name,
                description: col.description || col.comment
            },
            ru: {
                label: col.name_ru,
                description: col.description_ru || col.comment_ru
            }
        };

        if ('columns' in col) {
            _.forEach(col.columns, (subColumn) => {

                let scdata = Object.assign({}, data);

                // data from sub column has a higher priority
                if (subColumn.ref) {
                    scdata.column_name = col.prefix ? `${col.prefix}_${subColumn.ref}` : subColumn.ref;
                }

                if (subColumn.type) {
                    scdata.value_type = mapType(subColumn.type);
                }

                if (subColumn.number) {
                    scdata.dimension = mapDimension(subColumn.number);
                }

                if (subColumn.name) {
                    scdata.en.label = subColumn.name;
                }

                if (subColumn.comment) {
                    scdata.en.description = subColumn.comment;
                }

                if (subColumn.description) {
                    scdata.en.description = subColumn.description;
                }

                result.push(scdata);
            });
        } else {
            result.push(data);
        }
        return result;
    }, []);

    _.forEach(processedColumnData, fixDimensionForBoolean);

    _.forEach(processedColumnData, validateColumn);

    console.log(`Final count: ${processedColumnData.length}. (Skipped: ${skipped})`);

    return processedColumnData;
}

module.exports = {
    processRulesFile,
    isBlank
};
