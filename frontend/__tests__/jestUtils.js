import _ from 'lodash';

export function expectItemByPredicate(collection, predicate) {
    return expect(_.find(collection, predicate));
}

export function expectCountByPredicate(collection, predicate) {
    return expect(_.filter(collection, predicate).length);
}

/**
 * Installs or removes mocks
 * @param {Object}obj
 * @param {Object}mocksObj name->mockFunction hash. If mockFunction is null or undefined, the mock will be removed.
 * */
export function installMocks(obj, mocksObj) {
    _.each(mocksObj, (mockFunc, funcName) => {
        if (mockFunc) {
            // Install mock.
            mockFunc.__mockedFunction = obj[funcName];
            obj[funcName] = mockFunc;
        } else {
            // Uninstall mock.
            const mockedFunc = obj[funcName];
            if (mockedFunc.hasOwnProperty('__mockedFunction')) {
                obj[funcName] = mockedFunc.__mockedFunction;
            }
        }
    });
}
