import storeTestUtils from './storeTestUtils';
import {handleError, lastErrorResolved} from '../app/actions/errorHandler';

function stateMapperFunc(globalState) {
    return globalState.errorHandler;
}

xdescribe('error handling', () => {
    it('should properly init state', (done) => {
        storeTestUtils.runTest({
            expectedState: {
                showErrorWindow: false,
                lastError: null
            },
            stateMapperFunc
        }, done);
    });

    it('should set error message and show dialog', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(handleError(1, 'q')),
            stateMapperFunc,
            expectedState: {
                showErrorWindow: true,
                lastError: {
                    errorCode: 1,
                    errorMessage: 'q'
                }
            }
        }, done);
    });
    
    it('should resolve errors', (done) => {
        storeTestUtils.runTest({
            globalInitialState: {
                errorHandler: {
                    showErrorWindow: true,
                    lastError: {
                        errorCode: 1,
                        errorMessage: 'q'
                    }
                }
            },
            applyActions: (dispatch) => dispatch(lastErrorResolved()),
            expectedState: {
                showErrorWindow: false,
                lastError: null
            },
            stateMapperFunc
        }, done);
    });

    it('should keep only the last from several errors', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch([
                handleError(1, 'q'),
                handleError(2, 'w'),
                handleError(3, 'e')
            ]),
            stateMapperFunc,
            expectedState: {
                showErrorWindow: true,
                lastError: {
                    errorCode: 3,
                    errorMessage: 'e'
                }
            }
        }, done);
    });
});