import _ from 'lodash';

import storeTestUtils from './storeTestUtils';
import {receiveTotalFields} from '../app/actions/fields';

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
    totalFieldsHashedArray: {array: [], hash: {}}
};

describe('fields', () => {

    const LANG = 'en';
    const LANG2 = 'ru';

    const fieldsTotal = [
        {id: '1', text: [{languageId: LANG, label: 'label1'}],  name: 'name1', sourceName: 'sample'},
        {id: '2', text: null,                                   name: 'name2', sourceName: 'source1'},
        {id: '3', text: [{languageId: null, label: 'label3'}],  name: 'name3', sourceName: 'source2'},
        {id: '4', text: null,                                   name: 'name4', sourceName: 'source2'},
        {id: '5', text: [{languageId: LANG2, label: 'label5'}], name: 'name5', sourceName: 'sample'},
        {id: '6', text: null,                                   name: 'name6', sourceName: 'sample'},
        {id: '7', text: [{languageId: LANG}],                   name: 'name7', sourceName: 'sample'},
        {id: '8', text: null,                                   name: 'name8', sourceName: 'sample'}
    ];

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
        // same as fieldsTotal in the hash
        const totalFieldsHash = _.keyBy(fieldsTotal, 'id');
        storeTestUtils.runTest({
            applyActions: (dispatch) => dispatch(receiveTotalFields(fieldsTotal)),
            stateMapperFunc,
            expectedState: {
                ...initState,
                totalFieldsHashedArray: {
                    hash: totalFieldsHash,
                    array: fieldsTotal
                }
            }
        }, done);
    });
});