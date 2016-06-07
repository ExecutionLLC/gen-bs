import configureStore from '../app/store/configureStore';
import _ from 'lodash';

/**
 * @typedef {Object}ReduxStore
 * @property {function(Object)}dispatch
 * @property {function()}getState
 * */

/**
 * @typedef {Object}TestCase
 * @property {string|undefined}name
 * @property {function(Object)|undefined}stateMapperFunc
 * @property {Object}expectedState
 * @property {number|undefined}timeout
 * @property {Object|undefined}globalInitialState
 * @property {function(function)|undefined}applyActions
 * */

export default class StoreTestUtils {
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
     * @param {function()}onCompleted
     * */
    static runTest(test, onCompleted) {
        const {applyActions, timeout, expectedState} = test;
        const store = this.makeStore(test);
        if (applyActions) {
            applyActions(store.dispatch);
        }
        this.waitForFreezing(store, timeout || 10, () => {
            const state = store.getState();
            const mappedState = (test.stateMapperFunc) ? test.stateMapperFunc(state) : state;
            if (!_.isEqual(mappedState, expectedState)) {
                this._gracefulFail(test, mappedState);
            } else {
                onCompleted();
            }
        });
    }

    /**
     * @param {ReduxStore}store
     * @param {number}timeout
     * @param {function()}callback
     * */
    static waitForFreezing(store, timeout, callback) {
        var state = store.getState();
        console.log('waiting for freeze...');
        setTimeout(() => {
            const newState = store.getState();
            if (newState === state) {
                console.log('freeze!');
                callback();
            } else {
                console.log('still waiting for freeze...');
                this.waitForFreezing(store, timeout, callback);
            }
        }, timeout);

        jest.runAllTimers();
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

    /**
     * @param {TestCase}test
     * @param {Object}state
     * */
    static _gracefulFail(test, state) {
        const difference = _.differenceWith(state, test.expectedState, _.isEqual);
        const testNameString = (test.name) ? `[${test.name}] ` : '';
        throw new Error(`${testNameString}States are different: ${JSON.stringify(difference, null, 2)}, `
            + `\nstate: ${JSON.stringify(state, null, 2)}`);
    }
}