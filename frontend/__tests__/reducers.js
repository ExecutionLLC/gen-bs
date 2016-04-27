import {handleError, lastErrorResolved} from '../app/actions/errorHandler';
import configureStore from '../app/store/configureStore';

const store = configureStore();

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
            expect(store.getState().errorHandler).toEqual(currentTest.state);
        }

        store.subscribe( () => {
            testCheck();
            doTest();
        });
        doTest();
        testCheck();
        doTest();
    });
});
