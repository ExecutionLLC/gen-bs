import configureStore from '../app/store/configureStore';

/**
 * @typedef {Object}TestCase
 * @property {Object}expectedState
 * @property {Object}initialState
 * @property {function()}onSuccess
 * */

class TestStoreWrapper {
    constructor(configureStore, test) {
        this.test = test;
        this.store = configureStore(test.initialState);
        this.store.subscribe(this._onStoreChanged.bind(this));
    }
    
    _onStoreChanged() {
        // Here we want:
        // 1. State to stop changing
        // 2. State to have the same value as test.expectedState
        var state = this.store.getState();
        if (this._deepEquals(state, test.expectedState)) {
            
        }
    }
        
    _deepEquals(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
}

export default class StoreTestUtils {
    static waitForFreezing(getState, callback) {
        var state = getState();
        setTimeout(() => {
            const newState = getState();
            if (newState == state) {
                callback(null);
            } else {
                this.waitForFreezing(getState, callback);
            }
        }, 10);
    }

    static makeStore(initialState) {
        return configureStore(initialState);
    }
}