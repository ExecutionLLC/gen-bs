import storeTestUtils from './storeTestUtils';
import {receiveFields, receiveTotalFields} from '../app/actions/fields';

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

    it('should receive total fields null', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields(null)),
            stateMapperFunc,
            expectedError: true
        }, done);
    });

    it('should receive total fields empty', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields([])),
            stateMapperFunc,
            expectedState: initState
        }, done);
    });

    it('should receive total fields', (done) => {
        const inFields =            [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2,                 name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        const outTotalFields =      [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        const outTotalFieldsHash =  {1: {id: 1, label: 'label1', sourceName: 'sample'},  2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false}};
        const outSourceFieldsList = [                                                       {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields(inFields)),
            stateMapperFunc,
            expectedState: {
                ...initState,
                totalFieldsList: outTotalFields,
                totalFieldsHash: outTotalFieldsHash,
                sourceFieldsList: outSourceFieldsList
            }
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
        const inFields =            [   {id: 1, label: 'label1'},     {id: 2,                 name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        const outSampleFields =     [   {id: 1, label: 'label1'},     {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        const outSampleFieldsHash = {1: {id: 1, label: 'label1'},  2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false}};
        const outEditableFields =   [                                 {id: 2, label: 'name2', name: 'name2', isEditable: true}];
        const outAllowedFieldList = [                                                                                               {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        const outAllowedFieldHash = {                                                                                            3: {id: '3', label: 'label3', name: 'name3', isEditable: false}};
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields(inFields)),
            stateMapperFunc,
            expectedState: {
                ...initState,
                sampleFieldsList: outSampleFields,
                sampleIdToFieldHash: outSampleFieldsHash,
                editableFields: outEditableFields,
                allowedFieldsList: outAllowedFieldList,
                allowedIdToFieldHash: outAllowedFieldHash
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