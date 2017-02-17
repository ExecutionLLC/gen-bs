import {setVariantsSort, changeVariantsSort} from '../app/actions/variantsTable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

function stateMapperFunc(globalState) {
    return {
        ...globalState.variantsTable
    };
}

describe('Variants table', () => {
    describe('Set sorting', () => {

        const initStore = stateMapperFunc(MOCK_APP_STATE);

        it('should set sort', (done) => {
            const initSort = initStore.searchInResultsParams.sort;
            const newSort = ['some', 'sort', 'params'];
            expect(initSort).not.toEqual(newSort);
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch(setVariantsSort(newSort)),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).toBe(newSort);
                done();
            });
        });

        it('should store sort to empty array', (done) => {
            const FIELD_ID = 'FIELD_ID';
            const SAMPLE_ID = 'SAMPLE_ID';
            const SORT_ORDER = 1; // or 2
            const SORT_DIRECTION = 'asc'; // or 'desc'
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort([]),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).toEqual([{
                    fieldId: FIELD_ID,
                    sampleId: SAMPLE_ID,
                    order: SORT_ORDER,
                    direction: SORT_DIRECTION
                }]);
                done();
            });
        });

        it('should store 2nd sort to empty array', (done) => {
            const FIELD_ID = 'FIELD_ID';
            const SAMPLE_ID = 'SAMPLE_ID';
            const SORT_ORDER = 2; // try to set 2 as first sort
            const SORT_DIRECTION = 'asc';
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort([]),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).toEqual([{
                    fieldId: FIELD_ID,
                    sampleId: SAMPLE_ID,
                    order: 1, // always 1 if single sort
                    direction: SORT_DIRECTION
                }]);
                done();
            });
        });

        it('should add sort', (done) => {
            const initialSort = [{
                fieldId: 'field1',
                sampleId: 'sample1',
                order: 1,
                direction: 'asc'
            }];
            const FIELD_ID = 'field2';
            const SAMPLE_ID = 'sample2';
            const SORT_ORDER = 2; // try with 'sortArray.length < action.sortOrder'
            const SORT_DIRECTION = 'desc';
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.searchInResultsParams.sort).toEqual([
                    ...initialSort,
                    {
                        fieldId: FIELD_ID,
                        sampleId: SAMPLE_ID,
                        order: SORT_ORDER,
                        direction: SORT_DIRECTION
                    }
                ]);
                done();
            });
        });

        it('should replace less-order sort', (done) => {
            const initialSort = [{
                fieldId: 'field1',
                sampleId: 'sample1',
                order: 1,
                direction: 'asc'
            }];
            const FIELD_ID = 'field2';
            const SAMPLE_ID = 'sample2';
            const SORT_ORDER = 1; // try with not 'sortArray.length < action.sortOrder'
            const SORT_DIRECTION = 'desc';
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.searchInResultsParams.sort).toEqual([
                    {
                        fieldId: FIELD_ID,
                        sampleId: SAMPLE_ID,
                        order: SORT_ORDER,
                        direction: SORT_DIRECTION
                    }
                ]);
                done();
            });
        });

        it('should set 1 sort with two sorts', (done) => {
            const initialSort = [
                {
                    fieldId: 'field1',
                    sampleId: 'sample1',
                    order: 1,
                    direction: 'asc'
                },
                {
                    fieldId: 'field2',
                    sampleId: 'sample3',
                    order: 2,
                    direction: 'asc'
                },
            ];
            const FIELD_ID = 'field3';
            const SAMPLE_ID = 'sample3';
            const SORT_ORDER = 1;
            const SORT_DIRECTION = 'desc';
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.searchInResultsParams.sort).toEqual([
                    {
                        fieldId: FIELD_ID,
                        sampleId: SAMPLE_ID,
                        order: SORT_ORDER,
                        direction: SORT_DIRECTION
                    }
                ]);
                done();
            });
        });

        it('should set 2 sort with two sorts', (done) => {
            const initialSort = [
                {
                    fieldId: 'field1',
                    sampleId: 'sample1',
                    order: 1,
                    direction: 'asc'
                },
                {
                    fieldId: 'field2',
                    sampleId: 'sample3',
                    order: 2,
                    direction: 'asc'
                },
            ];
            const FIELD_ID = 'field3';
            const SAMPLE_ID = 'sample3';
            const SORT_ORDER = 2;
            const SORT_DIRECTION = 'desc';
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(FIELD_ID, SAMPLE_ID, SORT_ORDER, SORT_DIRECTION)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.searchInResultsParams.sort).toEqual([
                    initialSort[0],
                    {
                        fieldId: FIELD_ID,
                        sampleId: SAMPLE_ID,
                        order: SORT_ORDER,
                        direction: SORT_DIRECTION
                    }
                ]);
                done();
            });
        });

    });
});
