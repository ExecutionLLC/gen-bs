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
    const fieldsTotal = [
        {id: '1', label: 'label1', name: 'name1', sourceName: 'sample',  isEditable: false},
        {id: '2',                  name: 'name2', sourceName: 'source1', isEditable:  true},
        {id: '3', label: 'label3', name: 'name3', sourceName: 'source2', isEditable: false},
        {id: '4',                  name: 'name4', sourceName: 'source2', isEditable: false},
        {id: '5', label: 'label5', name: 'name5', sourceName: 'sample',  isEditable: false},
        {id: '6',                  name: 'name6', sourceName: 'sample',  isEditable:  true},
        {id: '7', label: 'label7', name: 'name7', sourceName: 'sample',  isEditable: false},
        {id: '8',                  name: 'name8', sourceName: 'sample',  isEditable: false}
    ];
    const fieldsSample = _.filter(fieldsSample, {sourceName: 'sample'});

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
        // all fields with 'label' properties
        const totalFieldsList = _.map(fieldsTotal, (item) => ({...item, label: item.label || item.name}));
        // same as above in the hash
        const totalFieldsHash = _.keyBy(totalFieldsList, 'id');
        // fields with 'sourceName' !== 'sample', labelled
        const sourceFieldsList = _.filter(totalFieldsList, (field) => field.sourceName !== 'sample');
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields(fieldsTotal)),
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
        // all fields with 'label' properties
        const sampleFieldsList = _.map(fieldsTotal, (item) => ({...item, label: item.label || item.name}));
        // same as above in the hash
        const sampleIdToFieldHash = _.keyBy(sampleFieldsList, 'id');
        // fields with 'isEditable' === true, labelled
        const editableFields = _.filter(sampleFieldsList, {isEditable: true});
        // fields with 'isEditable' === false, labelled
        const allowedFieldsList = _.filter(sampleFieldsList, {isEditable: false});
        // same as above in the hash
        const allowedIdToFieldHash = _.keyBy(allowedFieldsList, 'id');
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveFields(fieldsTotal)),
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
        // all total fields with 'label' properties
        const totalFieldsList = _.map(fieldsTotal, (item) => ({...item, label: item.label || item.name}));
        // same as above in the hash
        const totalFieldsHash = _.keyBy(totalFieldsList, 'id');
        // total fields with 'sourceName' !== 'sample', labelled
        const sourceFieldsList = _.filter(totalFieldsList, (field) => field.sourceName !== 'sample');

        // all sample fields with 'label' properties
        const sampleFieldsList = _.map(fieldsSample, (item) => ({...item, label: item.label || item.name}));
        // same as above in the hash
        const sampleIdToFieldHash = _.keyBy(sampleFieldsList, 'id');
        // sample fields with 'isEditable' === true, labelled
        const editableFields = _.filter(sampleFieldsList, {isEditable: true});

        // sample fields with 'isEditable' === false, labelled, concatenated with total fields with 'sourceName' === 'sample', labelled
        const allowedFieldsList = _.filter(sampleFieldsList, {isEditable: false}).concat(sourceFieldsList);
        // same as above in the hash
        const allowedIdToFieldHash = _.keyBy(allowedFieldsList, 'id');

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