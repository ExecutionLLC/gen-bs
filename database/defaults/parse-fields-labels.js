'use strict';

const fs = require('fs');
const _ = require('lodash');


function findClosingChar(str, openPos, openChar = '{', closeChar = '}') {
    let closePos = openPos;
    let counter = 1;
    while (counter > 0) {
        const char = str[++closePos]; // skip position of opening character
        if (char === openChar) {
            counter++;
        } else if (char === closeChar) {
            counter--;
        }
        if (closePos > str.length) {
            closePos = -1;
            break;
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
    if (str.length < 2) {
        if (str.length === 1 && str.charAt(0) === '"') {
            console.log(`Warning: double quote mismatch in '${str}'`);
        }
        return str;
    }
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
function insideOf(r1, r2) {
    assertRange(r1.left, r1.right);
    assertRange(r2.left, r2.right);
    if ((r1.left < r2.left && r1.right >= r2.left && r1.right <= r2.right) ||
        (r1.left >= r2.left && r1.left <= r2.right && r1.right > r2.right)) {
        throw `Intersection detected for ranges {${r1.left} - ${r1.right}} and {${r2.left} - ${r2.right}}`;
    } else {
        return (r1.left > r2.left && r1.left < r2.right);
    }
}

function parseKeyValue(col, text) {
    const sepInd = text.indexOf(':');
    if (sepInd === -1) {
        exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
    } else {
        const rawKey = text.slice(0, sepInd).trim();
        const rawValue = text.slice(sepInd + 1).trim();
        if (rawKey === '' || rawValue === '') {
            exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
        }
        return {rawKey, rawValue};
    }
}

function parseSingleField(col, text) {
    const res = parseKeyValue(col, text);
    let key = res.rawKey;
    const exclamInd = key.indexOf('!');
    if (exclamInd === 0) {
        key = key.slice(1);
    } else if (exclamInd > 0) {
        exitWithError(`Error in key {${key}} in column ${col.name}`);
    }
    if (key in col) {
        exitWithError(`Field ${key} already exists in column ${col.name}`);
    } else {
        col[key] = cutQuotes(res.rawValue);
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
        if (right === -1) {
            exitWithError(`Can't parse  ${text}`);
        }
        result.push(text.substring(left + 1, right).trim());

        text = text.slice(right + 1);
    }
    return result;
}

/* precondition: text must contain '[' and ']' characters */
function parseMultilineField(col, text) {
    const res = parseKeyValue(col, text);
    const key = res.rawKey;
    const value = res.rawValue.slice(1, -1); // remove '[' and ']' characters
    if (value === '') {
        exitWithError(`Error while parsing text {${text}} in column ${col.name}`);
    } else if (key in col) {
        exitWithError(`Field ${key} already exists in column ${col.name}`);
    } else {
        col[key] = _.map(getArrayOfSubcolumnTexts(value), (item) => parseBody(Object.create(null), item, true));
        return true;
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
            if (right === -1) {
                exitWithError(`Can't parse  ${text}`);
            }
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

function getRawColumnData(content) {
    const columnText = content.substring(content.indexOf('parsing')); // start from 'parsing'

    const indexes = [];
    const re = /column name|Generate new column/g;
    while (re.exec(columnText)) {
        indexes.push(re.lastIndex);
    }

    // 1. Get raw data (parse column names and get ranges with textual raw data)

    const columnData = indexes.map((i) => {
        const left = columnText.indexOf('{', i);
        const rightLimitForSearchName = (left !== -1 ? left : columnText.indexOf('\n', i)) - 1;
        const text = columnText.substring(i, rightLimitForSearchName);
        const found = text.match(/"(.*?)"/);
        if (!found) {
            exitWithError(`Can't find column name in ${text}`);
        }
        const columnName = found[1];
        const right = findClosingChar(columnText, left);
        if (right === -1) {
            exitWithError(`Can't parse  ${columnText}`);
        }

        return {
            left: left,
            right: right,
            columnName,
            text: columnText.substring(left + 1, right)
        };
    });

    const sortedColumnData = _.sortBy(columnData, ['left']); // sort by position in the file

    // 2. Process prefixes
    let prefixes = [];
    _.forEach(sortedColumnData, (col) => {
        _.forEach(sortedColumnData, (c) => {
            if (c === col)
                return;
            if (insideOf(c, col)) {
                if (c.prefix) {
                    exitWithError(`Column ${c.name} has two or more parents`);
                }
                c.prefix = col.columnName;
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
    if (col.valueType === 'boolean' && col.dimension === '0') {
        col.dimension = '1';
    }
}

/* Precondition: col[language] must be initialized for each language from languages. */
function validateColumn(col, languages) {
    if (isBlank(col.columnName)) {
        console.log(`Invalid column ${JSON.stringify(col)}`);
    } else {
        if (isBlank(col.sourceName)) {
            console.log(`Unknown sourceName in column ${JSON.stringify(col)}`);
        }
        if (isBlank(col.valueType)) {
            console.log(`Unknown valueType in column ${JSON.stringify(col)}`);
        } else if (!_.includes(validTypes, col.valueType)) {
            console.log(`Invalid valueType in column ${JSON.stringify(col)}`);
        }

        if (isBlank(col.dimension)) {
            console.log(`Unknown dimension in column ${JSON.stringify(col)}`);
        } else if (isNaN(+col.dimension)) {
            console.log(`Invalid dimension in column ${JSON.stringify(col)}`);
        }

        _.forEach(languages, (language) => {
            if (isBlank(col[language].label)) {
                console.log(`Unknown ${language}.label in column ${JSON.stringify(col)}`);
            }
            if (isBlank(col[language].description)) {
                console.log(`Unknown ${language}.description in column ${JSON.stringify(col)}`);
            }
        });
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

function processRulesFile(content, sourceName, languages) {

    // Find all column entries in the text
    const rawColumnData = getRawColumnData(content);

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
            columnName: col.prefix ? `${col.prefix}_${col.columnName}` : col.columnName,
            sourceName,
            valueType: mapType(col.type || 'string'),
            dimension:  mapDimension(col.number || '0')
        };

        const genLangProp = function (propName, language) {
            if (language === 'en') {
                return propName;
            } else {
                return `${propName}_${language}`;
            }
        };
        _.forEach(languages, (language) => {
            data[language] = {
                label: col[genLangProp('name', language)],
                description: col[genLangProp('description', language)] || col[genLangProp('comment', language)]
            };
        });

        if (col.columns) {
            _.remove(col.columns, 'hidden');
            _.remove(col.columns, 'skip');
            _.remove(col.columns, 'hide');

            _.forEach(col.columns, (subColumn) => {

                let scdata = Object.assign({}, data);

                // data from sub column has a higher priority
                if (subColumn.ref) {
                    scdata.columnName = col.prefix ? `${col.prefix}_${subColumn.ref}` : subColumn.ref;
                } else if (col.columns.length > 1) {
                    exitWithError(`Cannot find ref for sub column ${JSON.stringify(col)}`);
                }

                if (subColumn.type) {
                    scdata.valueType = mapType(subColumn.type);
                }

                if (subColumn.number) {
                    scdata.dimension = mapDimension(subColumn.number);
                }

                _.forEach(languages, (language) => {

                    if (!isBlank(subColumn.name)) {
                        scdata[language].label = subColumn[genLangProp('name', language)];
                    }

                    if (!isBlank(subColumn.comment)) {
                        scdata[language].description = subColumn[genLangProp('comment', language)];
                    }

                    if (!isBlank(subColumn.description)) {
                        scdata[language].description = subColumn[genLangProp('description', language)];
                    }
                });

                result.push(scdata);
            });
        } else {
            result.push(data);
        }
        return result;
    }, []);

    _.forEach(processedColumnData, fixDimensionForBoolean);

    _.forEach(processedColumnData, (col) => validateColumn(col, languages));

    console.log(`Final count: ${processedColumnData.length}. (Skipped: ${skipped})`);

    return processedColumnData;
}

module.exports = {
    processRulesFile,
    isBlank
};
