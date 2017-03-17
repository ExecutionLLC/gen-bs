import {setVariantsSort, changeVariantsSort} from '../app/actions/variantsTable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';

function stateMapperFunc(globalState) {
    return {
        appState: {
            ...globalState.variantsTable
        },
        sortingFields: [
            {fieldId: 'field1', sampleId: 'sample1'},
            {fieldId: 'field2', sampleId: 'sample2'},
            {fieldId: 'field3', sampleId: 'sample3'},
        ]
    };
}

describe('Variants table', () => {
    describe('Set sorting', () => {

        const initStore = stateMapperFunc(MOCK_APP_STATE);
        const {appState, sortingFields} = initStore;

        /**
         * @param {number} index in sortingFields array
         * @param {number} order 1 or 2
         * @param {string} direction 'asc' or 'desc'
         * @returns {{fieldId: string, sampleId: string, order: number, direction: string}}
         */
        function makeSortObj(index, order, direction) {
            const {fieldId, sampleId} = sortingFields[index];
            return {
                fieldId,
                sampleId,
                order,
                direction
            };
        }

        it('should set sort', (done) => {
            const initSort = appState.searchInResultsParams.sort;
            const newSort = ['some', 'sort', 'params'];
            expect(initSort).not.toEqual(newSort);
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch(setVariantsSort(newSort)),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).toBe(newSort);
                done();
            });
        });

        it('should store sort to empty array', (done) => {
            const sortObj = makeSortObj(0, 1, 'asc');
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort([]),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).toEqual([sortObj]);
                done();
            });
        });

        it('should store 2nd sort to empty array', (done) => {
            const sortObj = makeSortObj(0, 2, 'asc'); // try to set 2 as first sort
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort([]),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).toEqual([{
                    ...sortObj,
                    order: 1 // always 1 if single sort
                }]);
                done();
            });
        });

        it('should add sort', (done) => {
            const initialSort = [makeSortObj(0, 1, 'asc')];
            const sortObj = makeSortObj(1, 2, 'desc'); // try with 'sortArray.length < action.sortOrder'
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([
                    ...initialSort,
                    sortObj
                ]);
                done();
            });
        });

        it('should replace less-order sort', (done) => {
            const initialSort = [makeSortObj(0, 1, 'asc')];
            const sortObj = makeSortObj(1, 1, 'desc'); // try with not 'sortArray.length < action.sortOrder'
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([sortObj]);
                done();
            });
        });

        it('should set 1 sort with two sorts', (done) => {
            const initialSort = [
                makeSortObj(0, 1, 'asc'),
                makeSortObj(1, 2, 'asc')
            ];
            const sortObj = makeSortObj(2, 1, 'desc');
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([sortObj]);
                done();
            });
        });

        it('should set 2 sort with two sorts', (done) => {
            const initialSort = [
                makeSortObj(0, 1, 'asc'),
                makeSortObj(1, 2, 'asc')
            ];
            const sortObj = makeSortObj(2, 2, 'desc');
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([
                    initialSort[0],
                    sortObj
                ]);
                done();
            });
        });

        it('should change direction', (done) => {
            const initialSort = [
                makeSortObj(0, 1, 'asc'),
                makeSortObj(1, 2, 'asc')
            ];
            /** @type {{fieldId: string, sampleId: string, order: number, direction: string}} */
            const sortObj = {
                ...initialSort[0],
                direction: 'desc'
            };
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([
                    sortObj,
                    initialSort[1]
                ]);
                done();
            });
        });

        it('should remove sorting', (done) => {
            const initialSort = [
                makeSortObj(0, 1, 'asc'),
                makeSortObj(1, 2, 'asc')
            ];
            const sortObj = initialSort[0];
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).not.toBe(initialSort);
                expect(newState.appState.searchInResultsParams.sort).toEqual([
                    {
                        ...initialSort[1],
                        order: 1
                    }
                ]);
                done();
            });
        });

        it('should not remove last sorting', (done) => {
            const initialSort = [makeSortObj(0, 1, 'asc')];
            const sortObj = initialSort[0];
            storeTestUtils.runTest({
                applyActions: (dispatch) => dispatch([
                    setVariantsSort(initialSort),
                    changeVariantsSort(sortObj.fieldId, sortObj.sampleId, sortObj.order, sortObj.direction)
                ]),
                stateMapperFunc
            }, (newState) => {
                expect(newState.appState.searchInResultsParams.sort).toBe(initialSort);
                done();
            });
        });
    });
});
