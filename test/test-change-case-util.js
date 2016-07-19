'use strict';

const assert = require('assert');
const _ = require('lodash');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const generateSnakeObject = (i) => {
    return {
        test_item: {
            test_value_one: 'value of test value one ' + i,
            test_value_two: {
                value: 'value' + i
            }
        }
    };
};

const generateCamelObject = (i) => {
    return {
        testItem: {
            testValueOne: 'value ' + i,
            testValueTwo: {
                value: 'value 2 - ' + i
            }
        }
    };
};

const checkCamelObject = (obj) => {
    assert.ok(obj.testItem);
    assert.ok(obj.testItem.testValueOne);
    assert.ok(obj.testItem.testValueTwo);
    assert.ok(obj.testItem.testValueTwo.value);
};

const checkSnakeObject = (obj) => {
    assert.ok(obj.test_item);
    assert.ok(obj.test_item.test_value_one);
    assert.ok(obj.test_item.test_value_two);
    assert.ok(obj.test_item.test_value_two.value);
};

const generateAndCheckArray = (objectGenerator, converterFunc, objectChecker) => {
    const objectArray = _.map(_.range(10), i => objectGenerator(i));
    const convertedArray = converterFunc(objectArray);
    _.each(convertedArray, item => objectChecker(item));
};

const generateAndCheckHash = (objectGenerator, converterFunc, objectChecker) => {
    const objectArray = _.map(_.range(10), i => generateSnakeObject(i));
    const hash = _.reduce(objectArray, (result, item, index) => {
        result[index] = item;
        return result;
    }, Object.create(null));
    const convertedHash = converterFunc(hash);
    _.each(convertedHash, item => objectChecker(item));
};

describe('ChangeCaseUtil', () => {
    describe('snake to camel', () => {
        it('should properly convert objects', () => {
            const obj = generateSnakeObject(0);
            const convertedObject = ChangeCaseUtil.convertKeysToCamelCase(obj);
            checkCamelObject(convertedObject);
        });

        it('should properly convert arrays of objects', () => {
            generateAndCheckArray(generateSnakeObject, ChangeCaseUtil.convertKeysToCamelCase, checkCamelObject);
        });

        it('should properly convert hashes of objects', () => {
            generateAndCheckHash(generateSnakeObject, ChangeCaseUtil.convertKeysToCamelCase, checkCamelObject);
        });
    });

    describe('camel to snake', () => {
        it('should properly convert objects', () => {
            const obj = generateCamelObject(0);
            const convertedObject = ChangeCaseUtil.convertKeysToSnakeCase(obj);
            checkSnakeObject(convertedObject);
        });

        it('should properly convert arrays of objects', () => {
            generateAndCheckArray(generateCamelObject, ChangeCaseUtil.convertKeysToSnakeCase, checkSnakeObject);
        });

        it('should properly convert hashes of objects', () => {
            generateAndCheckHash(generateCamelObject, ChangeCaseUtil.convertKeysToSnakeCase, checkSnakeObject);
        });
    });
});
