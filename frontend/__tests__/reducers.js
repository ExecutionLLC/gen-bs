import {handleError, lastErrorResolved} from '../app/actions/errorHandler';
import {openModal, closeModal} from '../app/actions/modalWindows';
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

describe('dispatching modalWindows actions', () => {
    it('succeed when', (done) => {

        const tests = [
            {
                exec: () => {},
                state: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: false}}
            },
            {
                exec: () => { store.dispatch(closeModal('filters')); },
                state: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: false}}
            },
            {
                exec: () => { store.dispatch(openModal('upload')); },
                state: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: true}}
            },
            {
                exec: () => { store.dispatch(openModal('views')); },
                state: {views: {showModal: true}, filters: {showModal: false}, upload: {showModal: true}}
            },
            {
                exec: () => { store.dispatch(openModal('filters')); },
                state: {views: {showModal: true}, filters: {showModal: true}, upload: {showModal: true}}
            },
            {
                exec: () => { store.dispatch(closeModal('views')); },
                state: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: true}}
            },
            {
                exec: () => { store.dispatch(closeModal('upload')); },
                state: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: false}}
            },
            {
                exec: () => { store.dispatch(openModal('filters')); },
                state: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: false}}
            }
        ];

        const store = configureStore();
        var unsubscribe;
        const t = makeStateTests(tests, () => store.getState().modalWindows, () => { unsubscribe(); done() } );
        unsubscribe = store.subscribe( () => {
            t.check();
            t();
        });
        t();
        t.check();
        t();
    });
});
