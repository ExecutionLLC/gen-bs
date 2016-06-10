import storeTestUtils from './storeTestUtils';
import {receiveFields} from '../app/actions/fields';

function stateMapperFunc(globalState) {
    return {
        ..._.omit(globalState.fields, 'lastUpdated')
    };
}

const initState = {
    isFetching: {
        samples: false,
        sources: false
    },
    sampleFieldsList: [],
    sampleIdToFieldHash: {},
    editableFields: [],
    sourceFieldsList: [],
    totalFieldsList: [],
    totalFieldsHash: {},
    allowedFieldsList: [],
    allowedIdToFieldHash: {}
};

describe('fields', () => {
    it('should properly init state', (done) => {
        storeTestUtils.runTest({
            expectedState: initState,
            stateMapperFunc
        }, done);
    });

    it('should receive fields null', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields(null)),
            stateMapperFunc,
            expectedState: initState
        }, done);
    });

    it('should receive fields empty', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields([])),
            stateMapperFunc,
            expectedState: initState
        }, done);
    });

    it('should receive fields', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields([{id: 1, label: 'label1'}, {id: 2, name: 'name2'}, {id: '3', label: 'label3', name: 'name3'}])),
            stateMapperFunc,
            expectedState: {
                ...initState,
                sampleFieldsList: [{id: 1, label: 'label1'}, {id: 2, label: 'name2', name: 'name2'}, {id: '3', label: 'label3', name: 'name3'}],
                sampleIdToFieldHash: {1: {id: 1, label: 'label1'}, 2: {id: 2, label: 'name2', name: 'name2'}, 3: {id: '3', label: 'label3', name: 'name3'}}
            }
        }, done);
    });

    /*
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
        });*/
});