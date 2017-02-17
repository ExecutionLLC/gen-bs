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

function checkConvertResultTheSame(converts, source) {
    const result = converts.forward(source);
    assert.equal(result, source);
    const resultBack = converts.backward(result);
    assert.equal(resultBack, source);
}

function checkConvertResult(testSuite, source, wantedResult, dontConvertBack) {
    const result = testSuite.forward(source);
    assert.notEqual(result, source);
    assert.deepEqual(result, wantedResult);
    const resultBack = testSuite.backward(result);
    assert.notEqual(resultBack, result);
    assert.notEqual(resultBack, source);
    if (!dontConvertBack) {
        assert.deepEqual(resultBack, source);
    }
}

describe('ChangeCaseUtil', () => {
    describe('exact values converting', () => {

        const convertToCamelCase = ChangeCaseUtil.convertKeysToCamelCase.bind(ChangeCaseUtil);
        const convertCaseToSnakeCase = ChangeCaseUtil.convertKeysToSnakeCase.bind(ChangeCaseUtil);

        const convertToCamelTestSuit = {
            forward: convertToCamelCase,
            backward: convertCaseToSnakeCase
        };
        const convertToSnakeTestSuit = {
            forward: convertCaseToSnakeCase,
            backward: convertToCamelCase
        };

        it('should convert falsy values', () => {
            checkConvertResultTheSame(convertToCamelTestSuit, 0);
            checkConvertResultTheSame(convertToCamelTestSuit, null);
            checkConvertResultTheSame(convertToCamelTestSuit, '');
            checkConvertResultTheSame(convertToSnakeTestSuit, 0);
            checkConvertResultTheSame(convertToSnakeTestSuit, null);
            checkConvertResultTheSame(convertToSnakeTestSuit, '');
        });

        it('should convert non-array and non-object values', () => {
            checkConvertResultTheSame(convertToCamelTestSuit, 1);
            checkConvertResultTheSame(convertToSnakeTestSuit, 1);
        });

        it('should convert ampty array and object', () => {
            checkConvertResult(convertToCamelTestSuit, [], []);
            checkConvertResult(convertToCamelTestSuit, {}, {});
            checkConvertResult(convertToSnakeTestSuit, [], []);
            checkConvertResult(convertToSnakeTestSuit, {}, {});
        });

        it('should convert arrays', () => {
            const sampleArray = [0, '1', [3, '4', []]];
            checkConvertResult(convertToCamelTestSuit, sampleArray, sampleArray);
            checkConvertResult(convertToSnakeTestSuit, sampleArray, sampleArray);
        });

        it('should clone object with simple keys', () => {
            const sampleObj = {
                'qwe': 1,
                'wer': [
                    'we',
                    {
                        'e': 'r'
                    }
                ]
            };
            checkConvertResult(convertToCamelTestSuit, sampleObj, sampleObj);
            checkConvertResult(convertToSnakeTestSuit, sampleObj, sampleObj);
        });

        it('should keep functions intact', () => {
            function f1() {}
            f1.q = 789;
            const sampleObj = {f: f1};
            const resultCamel = convertToCamelCase(sampleObj);
            assert(resultCamel.f === f1);
            const resultSnake = convertCaseToSnakeCase(sampleObj);
            assert(resultSnake.f === f1);
        });

        it('should convert simple keys', () => {
            checkConvertResult(
                convertToCamelTestSuit,
                {
                    'qwe_rty': 1,
                    'we_r': [
                        'we',
                        {
                            '_ert': 'r',
                            '_': 'v',
                            'd': 'f',
                            'f_': 'f',
                            'cvb__12_e': 123
                        }
                    ],
                    'qw_er_ty_ui': 456
                },
                {
                    'qweRty': 1,
                    'weR': [
                        'we',
                        {
                            'ert': 'r',
                            '': 'v',
                            'd': 'f',
                            'f': 'f',
                            'cvb12E': 123
                        }
                    ],
                    'qwErTyUi': 456
                },
                true
            );
            checkConvertResult(
                convertToSnakeTestSuit,
                {
                    'qweRty': 1,
                    'weR': [
                        'we',
                        {
                            'Ert': 'r',
                            'C': 'v',
                            'd': 'f',
                            'cvbNM12e': 123
                        }
                    ],
                    'qwErTyUi': 456
                },
                {
                    'qwe_rty': 1,
                    'we_r': [
                        'we',
                        {
                            'ert': 'r',
                            'c': 'v',
                            'd': 'f',
                            'cvb_nm12_e': 123
                        }
                    ],
                    'qw_er_ty_ui': 456
                },
                true
            );
        });

        it('should skip non-alpha-numeric-dash keys', () => {
            checkConvertResult(
                convertToCamelTestSuit,
                {
                    'qwe_rty': {'asd_fgh': 123},
                    'a@sd_fgh': {'zxc_vbn': 456}
                },
                {
                    'qweRty': {'asdFgh': 123},
                    'a@sd_fgh': {'zxcVbn': 456}
                }
            );
            checkConvertResult(
                convertToSnakeTestSuit,
                {
                    'qweRty': {'asdFgh': 123},
                    'a@sdFgh': {'zxcVbn': 456}
                },
                {
                    'qwe_rty': {'asd_fgh': 123},
                    'a@sdFgh': {'zxc_vbn': 456}
                }
            );
        });
    });

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
