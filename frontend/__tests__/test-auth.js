import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';


import {
    setWaitStateForModal,
    showAnotherPageOpenedModal
} from '../app/actions/auth';


function stateMapperFunc(globalState) {
    return {
        appState: {
            ...globalState
        }
    };
}


describe('Another page opened', () => {

    it('should have proper initial state', () => {
        const mappedState = stateMapperFunc(MOCK_APP_STATE);
        expect(mappedState.appState.auth.showAnotherPageOpenedModal).toBe(false);
        expect(mappedState.appState.auth.isWaitingForCloseAnotherPageOpenedModal).toBe(false);
    });

    let openedModalState;
    let openedModalWaitingState;

    it('should show "close another page" modal', (done) => {
        storeTestUtils.runTest({
            globalInitialState: MOCK_APP_STATE,
            applyActions: (dispatch) => dispatch(showAnotherPageOpenedModal(true)),
            stateMapperFunc
        }, (mappedState) => {
            openedModalState = mappedState;
            expect(mappedState.appState.auth.showAnotherPageOpenedModal).toBe(true);
            expect(mappedState.appState.auth.isWaitingForCloseAnotherPageOpenedModal).toBe(false);
            done();
        });
    });

    it('should show "close another page" modal waiting caption', (done) => {
        storeTestUtils.runTest({
            globalInitialState: openedModalState.appState,
            applyActions: (dispatch) => dispatch(setWaitStateForModal()),
            stateMapperFunc
        }, (mappedState) => {
            openedModalWaitingState = mappedState;
            expect(mappedState.appState.auth.showAnotherPageOpenedModal).toBe(true);
            expect(mappedState.appState.auth.isWaitingForCloseAnotherPageOpenedModal).toBe(true);
            done();
        });
    });

    it('should hide "close another page" after closing sockets', (done) => {

        // Mocked asynchronous action, wait a bit and return success
        function closeOtherSocketsAsync() {
            return () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 100);
                });
            };
        }

        storeTestUtils.runTest({
            globalInitialState: openedModalWaitingState.appState,
            applyActions: (dispatch) => dispatch([
                closeOtherSocketsAsync(),
                showAnotherPageOpenedModal(false)
            ]),
            stateMapperFunc
        }, (mappedState) => {
            expect(mappedState.appState.auth.showAnotherPageOpenedModal).toBe(false);
            done();
        });
    });

    it('should not hide "close another page" after closing sockets while user closes modal', (done) => {

        // Mocked asynchronous action, wait a bit and return success
        function closeOtherSocketsAsync() {
            return () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 100);
                });
            };
        }

        storeTestUtils.runTest({
            globalInitialState: openedModalWaitingState.appState,
            applyActions: (dispatch) => dispatch([
                showAnotherPageOpenedModal(true), // received CLOSED_BY_USER while closeOtherSockets handling
                closeOtherSocketsAsync(),
                showAnotherPageOpenedModal(false)
            ]),
            stateMapperFunc
        }, (mappedState) => {
            expect(mappedState.appState.auth.showAnotherPageOpenedModal).toBe(true);
            expect(mappedState.appState.auth.isWaitingForCloseAnotherPageOpenedModal).toBe(false);
            done();
        });
    });

});