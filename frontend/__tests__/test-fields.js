import _ from 'lodash';

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

    it('should throw error when receiving total fields as null', (done) => {
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
        const fields =           [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2,                 name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        // all fields with 'label' properties
        const totalFieldsList =  [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        // same as above in the hash
        const totalFieldsHash =  {1: {id: 1, label: 'label1', sourceName: 'sample'},  2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false}};
        // fields with 'sourceName' === 'sample', labelled
        const sourceFieldsList = [                                                       {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields(fields)),
            stateMapperFunc,
            expectedState: {
                ...initState,
                totalFieldsList,
                totalFieldsHash,
                sourceFieldsList
            }
        }, done);
    });
    
    it('should receive null as empty sample fields list', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields(null)),
            stateMapperFunc,
            expectedState: initState
        }, done);
    });

    it('should receive empty fields list', (done) => {
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields([])),
            stateMapperFunc,
            expectedState: initState
        }, done);
    });

    it('should receive fields', (done) => {
        const fields =               [   {id: 1, label: 'label1'},     {id: 2,                 name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false},     {id: '4',                 name: 'name4', isEditable: false}];
        // all fields with 'label' properties
        const sampleFieldsList =     [   {id: 1, label: 'label1'},     {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false},     {id: '4', label: 'name4', name: 'name4', isEditable: false}];
        // same as above in the hash
        const sampleIdToFieldHash =  {1: {id: 1, label: 'label1'},  2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false},  4: {id: '4', label: 'name4', name: 'name4', isEditable: false}};
        // fields with 'isEditable' === true, labelled
        const editableFields =       [                                 {id: 2, label: 'name2', name: 'name2', isEditable: true}];
        // fields with 'isEditable' === false, labelled
        const allowedFieldsList =    [                                                                                               {id: '3', label: 'label3', name: 'name3', isEditable: false},     {id: '4', label: 'name4', name: 'name4', isEditable: false}];
        // same as above in the hash
        const allowedIdToFieldHash = {                                                                                            3: {id: '3', label: 'label3', name: 'name3', isEditable: false},  4: {id: '4', label: 'name4', name: 'name4', isEditable: false}};
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields(fields)),
            stateMapperFunc,
            expectedState: {
                ...initState,
                sampleFieldsList,
                sampleIdToFieldHash,
                editableFields,
                allowedFieldsList,
                allowedIdToFieldHash
            }
        }, done);
    });

    it('should receive sample fields after total fields', (done) => {
        // total fields input
        const fieldsTotal =          [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2,                 name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        // all total fields with 'label' properties
        const totalFieldsList =      [   {id: 1, label: 'label1', sourceName: 'sample'},     {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        // same as above in the hash
        const totalFieldsHash =      {1: {id: 1, label: 'label1', sourceName: 'sample'},  2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false}};
        // total fields with 'sourceName' === 'sample', labelled
        const sourceFieldsList =     [                                                       {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];

        // sample fields input
        const fieldsSample =         [   {id: 5, label: 'label5'},     {id: 6,                 name: 'name6', isEditable: true},     {id: '7', label: 'label7', name: 'name7', isEditable: false}];
        // all sample fields with 'label' properties
        const sampleFieldsList =     [   {id: 5, label: 'label5'},     {id: 6, label: 'name6', name: 'name6', isEditable: true},     {id: '7', label: 'label7', name: 'name7', isEditable: false}];
        // same as above in the hash
        const sampleIdToFieldHash =  {5: {id: 5, label: 'label5'},  6: {id: 6, label: 'name6', name: 'name6', isEditable: true},  7: {id: '7', label: 'label7', name: 'name7', isEditable: false}};
        // sample fields with 'isEditable' === true, labelled
        const editableFields =       [                                 {id: 6, label: 'name6', name: 'name6', isEditable: true}];

        // sample fields with 'isEditable' === false, labelled, concatenated with total fields with 'sourceName' === 'sample', labelled
        const allowedFieldsList =    [                                                                                               {id: '7', label: 'label7', name: 'name7', isEditable: false},
                                                                                             {id: 2, label: 'name2', name: 'name2', isEditable: true},     {id: '3', label: 'label3', name: 'name3', isEditable: false}];
        // same as above in the hash
        const allowedIdToFieldHash = {                                                    2: {id: 2, label: 'name2', name: 'name2', isEditable: true},  3: {id: '3', label: 'label3', name: 'name3', isEditable: false},
                                                                                                                                  7: {id: '7', label: 'label7', name: 'name7', isEditable: false}};
        
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch([receiveTotalFields(fieldsTotal), receiveFields(fieldsSample)]),
            stateMapperFunc,
            expectedState: {
                ...initState,
                sampleFieldsList,
                sampleIdToFieldHash,
                editableFields,
                totalFieldsList,
                totalFieldsHash,
                sourceFieldsList,
                allowedFieldsList,
                allowedIdToFieldHash
            }
        }, done);
    });
});