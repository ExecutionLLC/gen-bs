import _ from 'lodash';

import configureStore from '../app/store/configureStore';

/**
 * @typedef {Object}ReduxStore
 * @property {function(Object)}dispatch
 * @property {function()}getState
 * */

// Jest mocks timeouts by default.
jasmine.clock().uninstall();
const originalSetTimeout = setTimeout;
jasmine.clock().install();


var deepDiffMapper = function() {
    return {
        VALUE_CREATED: 'created',
        VALUE_UPDATED: 'updated',
        VALUE_DELETED: 'deleted',
        VALUE_UNCHANGED: 'unchanged',
        map: function(obj1, obj2) {
            if (this.isFunction(obj1) || this.isFunction(obj2)) {
                throw 'Invalid argument. Function given, object expected.';
            }
            if (this.isValue(obj1) || this.isValue(obj2)) {
                var cv = this.compareValues(obj1, obj2);
                var cvchar = {[this.VALUE_UNCHANGED]: '!', [this.VALUE_CREATED]: '+', [this.VALUE_DELETED]: '-', [this.VALUE_UPDATED]: '~'}[cv];
                if (typeof cvchar === 'undefined') cvchar = '?';
                return cvchar;
                //return {type: this.compareValues(obj1, obj2), data: obj1 || obj2};
            }

            var diff = {};
            var diff2 = [];
            for (var key in obj1) {
                if (this.isFunction(obj1[key])) {
                    continue;
                }

                var value2 = undefined;
                if ('undefined' != typeof(obj2[key])) {
                    value2 = obj2[key];
                }

                diff[key] = this.map(obj1[key], value2);
                if (typeof diff[key] == 'string') {
                    if (diff[key] != '!') {
                        diff2.push(key + diff[key]);
                    }
                }
                else {
                    if (!this.isArray(diff[key]) || diff[key].length) {
                        diff2.push({[key]:  diff[key]});
                    }
                }
            }
            for (var key in obj2) {
                if (this.isFunction(obj2[key]) || ('undefined' != typeof(diff[key]))) {
                    continue;
                }

                diff[key] = this.map(undefined, obj2[key]);
                if (typeof diff[key] == 'string') {
                    if (diff[key] != '!') {
                        diff2.push(key + diff[key]);
                    }
                }
                else {
                    if (!this.isArray(diff[key]) || diff[key].length) {
                        diff2.push({[key]:  diff[key]});
                    }
                }
            }

            return diff2;

        },
        compareValues: function(value1, value2) {
            if (value1 === value2) {
                return this.VALUE_UNCHANGED;
            }
            if ('undefined' == typeof(value1)) {
                return this.VALUE_CREATED;
            }
            if ('undefined' == typeof(value2)) {
                return this.VALUE_DELETED;
            }

            return this.VALUE_UPDATED;
        },
        isFunction: function(obj) {
            return {}.toString.apply(obj) === '[object Function]';
        },
        isArray: function(obj) {
            return {}.toString.apply(obj) === '[object Array]';
        },
        isObject: function(obj) {
            return {}.toString.apply(obj) === '[object Object]';
        },
        isValue: function(obj) {
            return !this.isObject(obj) && !this.isArray(obj);
        }
    }
}();


/**
 * @typedef {Object}TestCase
 * @property {string|undefined}name
 * @property {function(Object)|undefined}stateMapperFunc If undefined, full state is used.
 * @property {Object|undefined}expectedState If undefined, no check is done at the end of the test.
 * @property {number|undefined}timeout
 * @property {Object|undefined}globalInitialState If undefined, default state is constructed by reducers.
 * @property {function(function)|undefined}applyActions If undefined, the comparison will be done immediately.
 * */

export default class StoreTestUtils {
    static debugMode = false;

    static setTimeout(callback, timeout) {
        return originalSetTimeout(callback, timeout)
    }

    /**
     * @param {Array<TestCase>}tests
     * @param {function()}onCompleted
     * */
    static runTests(tests, onCompleted) {
        const promises = _.map(tests, test => new Promise((resolve, reject) => this.runTest(test, resolve)));
        Promise.all(promises)
            .then(() => onCompleted());
    }

    /**
     * @param {TestCase}test
     * @param {function(Object)}onCompleted Function accepting mapped state (full state if mapper is undefined).
     * */
    static runTest(test, onCompleted) {
        const {applyActions, timeout, expectedState, expectedError} = test;
        const store = this.makeStore(test);
        if (applyActions) {
            try {
                applyActions(store.dispatch);
            } catch(e) {
                if (expectedError) {
                    onCompleted();
                } else {
                    throw e;
                }
            }
        }
        this.waitForFreezing(store, timeout || 10, () => {
            const state = store.getState();
            const mappedState = test.stateMapperFunc ? test.stateMapperFunc(state) : state;
            if (expectedState) {
                expect(mappedState).toEqual(expectedState);
            }
            onCompleted(mappedState);
        });
    }

    /**
     * @param {ReduxStore}store
     * @param {number}timeout
     * @param {function()}callback
     * */
    static waitForFreezing(store, timeout, callback) {
        var state = store.getState();
        this._debug(`waiting for store freeze for ${timeout} ms...`);

        this.setTimeout(() => {
            const newState = store.getState();
            if (newState === state) {
                this._debug('freeze!');
                callback();
            } else {
                this._debug('state was changed!');
                this.waitForFreezing(store, timeout, callback);
            }
        }, timeout);

        jest.runOnlyPendingTimers();
    }

    /**
     * @param {TestCase}test
     * @returns {ReduxStore}
     * */
    static makeStore(test) {
        if (test.globalInitialState) {
            const defaultGlobalState = configureStore().getState();
            const initialState = _.merge(defaultGlobalState, test.globalInitialState);
            return configureStore(initialState);
        }
        return configureStore();
    }

    static _debug(msg, ...args) {
        if (this.debugMode) {
            console.warn.call(console, msg, ...args);
        }
    }
}