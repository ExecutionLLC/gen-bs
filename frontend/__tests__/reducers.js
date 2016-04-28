import {handleError, lastErrorResolved} from '../app/actions/errorHandler';
import {openModal, closeModal} from '../app/actions/modalWindows';
import {toggleQueryNavbar, changeView, changeHeaderFilter, changeFilter} from '../app/actions/ui';
import {receiveViews} from '../app/actions/userData';
import configureStore from '../app/store/configureStore';

function makeStateTests(tests, store, getState) {

    var stateChangeF;
    const unsubscribe = store.subscribe(() => {
        if (stateChangeF) {
            var f = stateChangeF;
            stateChangeF = null;
            f();
        }
    });

    function doTest(i) {
        const test = tests[i];
        it(test.name, (done) => {
            if (test.exec) {
                stateChangeF = () => {
                    expect(getState()).toEqual(test.expectedState);
                    done();
                };
                test.exec();
            } else {
                expect(getState()).toEqual(test.expectedState);
                done();
            }
        });
    }

    var i;
    for (i = 0; i < tests.length; i++) {
        doTest(i);
    }
    it('no-test-state-listener-unsubscribe', () => unsubscribe() );
}

describe('dispatching errorHandler actions', () => {

    const tests = [
        {
            name: 'init',
            exec: null,
            expectedState: {showErrorWindow: false, lastError: null}
        },
        {
            name: 'error set 1',
            exec: () => {
                store.dispatch(handleError(1, 'q'));
            },
            expectedState: {showErrorWindow: true, lastError: {errorCode: 1, errorMessage: 'q'}}
        },
        {
            name: 'error set 2',
            exec: () => {
                store.dispatch(handleError(2, 'w'));
            },
            expectedState: {showErrorWindow: true, lastError: {errorCode: 2, errorMessage: 'w'}}
        },
        {
            name: 'error reset',
            exec: () => {
                store.dispatch(lastErrorResolved());
            },
            expectedState: {showErrorWindow: false, lastError: null}
        }
    ];

    const store = configureStore();
    makeStateTests(tests, store, () => store.getState().errorHandler);
    
});

describe('dispatching modalWindows actions', () => {
    const tests = [
        {
            name: 'init',
            expectedState: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: false}}
        },
        {
            name: 'close already closed filters',
            exec: () => { store.dispatch(closeModal('filters')); },
            expectedState: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: false}}
        },
        {
            name: 'open upload',
            exec: () => { store.dispatch(openModal('upload')); },
            expectedState: {views: {showModal: false}, filters: {showModal: false}, upload: {showModal: true}}
        },
        {
            name: 'open views',
            exec: () => { store.dispatch(openModal('views')); },
            expectedState: {views: {showModal: true}, filters: {showModal: false}, upload: {showModal: true}}
        },
        {
            name: 'open filters',
            exec: () => { store.dispatch(openModal('filters')); },
            expectedState: {views: {showModal: true}, filters: {showModal: true}, upload: {showModal: true}}
        },
        {
            name: 'close views',
            exec: () => { store.dispatch(closeModal('views')); },
            expectedState: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: true}}
        },
        {
            name: 'close upload',
            exec: () => { store.dispatch(closeModal('upload')); },
            expectedState: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: false}}
        },
        {
            name: 'open already opened filters',
            exec: () => { store.dispatch(openModal('filters')); },
            expectedState: {views: {showModal: false}, filters: {showModal: true}, upload: {showModal: false}}
        }
    ];

    const store = configureStore();
    makeStateTests(tests, store, () => store.getState().modalWindows);
});

describe('dispatching ui actions', () => {

    const INIT_STATE = {queryNavbarClosed: true, selectedView: null, selectedFilter: null, currentLimit: 100, currentOffset: 0, isAnalyzeTooltipVisible: false, language: 'en'};

    function chstate(ch) {
        return Object.assign({}, INIT_STATE, ch);
    }

    const tests = [
        {
            name: 'init',
            expectedState: INIT_STATE
        },
        {
            name: 'toggle query navbar',
            exec: () => store.dispatch(toggleQueryNavbar()),
            expectedState: chstate({queryNavbarClosed: false})
        },
        {
            name: 'toggle query navbar again',
            exec: () => store.dispatch(toggleQueryNavbar()),
            expectedState: chstate()
        },
        {
            name: 'set views',
            exec: () => store.dispatch(receiveViews([{id:1, q:2}, {id:2, w:3}])),
            expectedState: chstate()
        },
        {
            name: 'change absent view',
            exec: () => store.dispatch(changeView(4)),
            expectedState: chstate({selectedView: void 0})
        },
        {
            name: 'change existent view',
            exec: () => store.dispatch(changeView(2)),
            expectedState: chstate({selectedView: {id:2, w:3}})
        }
    ];

    const store = configureStore();
    makeStateTests(tests, store, () => store.getState().ui);
});
