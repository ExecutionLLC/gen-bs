import {handleError, lastErrorResolved} from '../app/actions/errorHandler';
import configureStore from '../app/store/configureStore';

/**
 * @template {T}
 * @param {{exec: function(), state: T}[]} tests
 * @param {function():T} getState
 * @param {function()} done
 * @returns {function()}
 */
function makeStateTests(tests, getState, done) {

    var currentTest = null;

    function doTest() {
        currentTest = tests.shift();
        if (!currentTest) {
            done();
            return;
        }
        currentTest.exec();
    }

    function testCheck() {
        expect(getState()).toEqual(currentTest.state);
    }

    doTest.check = testCheck;
    return doTest;
}


describe('dispatching errorHandler actions', () => {
    it('succeed when', (done) => {

        const tests = [
            {
                name: 'init',
                exec: () => {},
                state: {showErrorWindow: false, lastError: null}
            },
            {
                name: 'error set',
                exec: () => { store.dispatch(handleError(1, 'q')); },
                state: {showErrorWindow: true, lastError: {errorCode: 1, errorMessage: 'q'}}
            },
            {
                name: 'error set',
                exec: () => { store.dispatch(handleError(2, 'w')); },
                state: {showErrorWindow: true, lastError: {errorCode: 2, errorMessage: 'w'}}
            },
            {
                name: 'error reset',
                exec: () => { store.dispatch(lastErrorResolved()); },
                state: {showErrorWindow: false, lastError: null }
            }
        ];

        const store = configureStore();
        var unsubscribe;
        var t = makeStateTests(tests, () => store.getState().errorHandler, () => { unsubscribe(); done(); } );
        unsubscribe = store.subscribe( () => {
            t.check();
            t();
        });
        t();
        t.check();
        t();
    });
});
