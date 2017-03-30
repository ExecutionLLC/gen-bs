import _ from 'lodash';

import storeTestUtils from './storeTestUtils';
import {ImmutableHashedArray} from '../app/utils/immutable';

class HashedArrayDataUtils {

    static checkHashedArraysEqual(hashedArray, expectedHashedArray) {
        expect(hashedArray.array).toEqual(expectedHashedArray.array);
        expect(hashedArray.hash).toEqual(expectedHashedArray.hash);
    }

    static checkHashedArrayLength(hashedArray, expectedLength) {
        expect(hashedArray.array.length).toBe(expectedLength);
        expect(Object.keys(hashedArray.hash).length).toBe(expectedLength);
    }

    static checkObjectInHashedArray(hashedArray, objectId, expectedObject) {
        const objectInArray = hashedArray.array.find((item) => item.id === objectId);
        const objectInHash = _.find(hashedArray.hash, (filter, filterHashKey) => filter.id === objectId || filterHashKey === objectId);
        expect(objectInArray).toEqual(expectedObject);
        expect(objectInHash).toEqual(expectedObject);
    }

    static doTests(describeName, testCases, makeTest, resetMocks, testsParams) {

        const tests = testCases.map((testCase) => {
            const {description} = testCase;
            const test = makeTest(testCase, testsParams);

            return {
                it: () => {
                    it(description, (done) => {
                        storeTestUtils.runTest({
                            globalInitialState: test.initialAppState,
                            applyActions: test.actions
                        }, (globalState) => {
                            test.checkState(globalState);
                            done();
                        });
                    })
                },
                setMocks: test.setMocks
            };
        });

        describe(describeName, () => {
            var testIndex = 0;

            beforeEach(() => {
                tests[testIndex++].setMocks();
            });

            afterEach(() => {
                resetMocks();
            });

            tests.forEach((test) => test.it());
        })
    }

}

export function runListedObjectTests(params) {

    describe(`${params.listName} mocked state`, () => {
        const {list, createdItemId} = params.buildInitState();
        it('should contain no create item', () => {
            const absentItemIndex = list.findIndex((filter) => filter.id === createdItemId);
            expect(absentItemIndex).toBe(-1);
        });
    });

    describe(`${params.listName} delete tests`, () => {
        const {initialAppState, list, createdItemId} = params.buildInitState();

        const testCases = [];
        var i;
        for (i = 0; i < list.length; i++) {
            testCases.push({
                description: 'should delete item #' + i,
                itemId: list[i].id,
                actualDelete: true
            });
        }
        testCases.push({
            description: 'should not delete',
            itemId: createdItemId,
            actualDelete: false
        });

        function makeTest(testCase, testParams) {
            const {mustError} = testParams;
            const {itemId, actualDelete} = testCase;

            const reallyDelete = actualDelete && !mustError;

            const itemsCount = list.length;
            const expectedItemsCount = reallyDelete ? itemsCount - 1 : itemsCount;
            const expectedItems = reallyDelete ? list.filter((item) => item.id !== itemId) : list;
            const expectedItemsHash = list.reduce((hash, item) => {
                if (!reallyDelete || item.id !== itemId) {
                    hash[item.id] = item;
                }
                return hash;
            }, {});
            const expectedItem = actualDelete && !mustError ? void 0 : list.find((item) => item.id === itemId);

            return {
                initialAppState,
                actions: params.makeActions.remove(itemId),
                checkState: (globalState) => {
                    const stateHashedArray = params.getStateHashedArray(globalState);
                    HashedArrayDataUtils.checkHashedArrayLength(stateHashedArray, expectedItemsCount);
                    HashedArrayDataUtils.checkObjectInHashedArray(stateHashedArray, itemId, expectedItem);
                    HashedArrayDataUtils.checkHashedArraysEqual(stateHashedArray, {array: expectedItems, hash: expectedItemsHash});
                },
                setMocks: () => params.makeMocks.remove(mustError)
            };
        }

        function resetMocks() {
            params.removeMocks.remove();
        }

        HashedArrayDataUtils.doTests('run deletion success', testCases, makeTest, resetMocks, {mustError: false});
        HashedArrayDataUtils.doTests('run deletion error', testCases, makeTest, resetMocks, {mustError: true});
    });

    describe(`${params.listName} update tests`, () => {
        const {initialAppState, list, createdItemId} = params.buildInitState();

        const updatedItem = _.cloneDeep(list[0]);
        const initialHashedArray = ImmutableHashedArray.makeFromArray(list);

        const testCases = [];
        var i;
        for (i = 0; i < list.length; i++) {
            testCases.push({
                description: 'should update item #' + i,
                itemId: list[i].id,
                newItem: {...updatedItem, id: list[i].id},
                actualUpdate:true
            });
        }
        testCases.push({
            description: 'should not update absent item',
            itemId: createdItemId,
            newItem: updatedItem,
            actualUpdate:false
        });

        function makeTest(testCase, testsParams) {
            const {mustError} = testsParams;
            const {itemId, newItem, actualUpdate} = testCase;

            const expectedItemsHashedArray = actualUpdate && !mustError ?
                ImmutableHashedArray.replaceItemId(initialHashedArray, itemId, newItem) :
                initialHashedArray;

            return {
                initialAppState,
                actions: params.makeActions.update(newItem),
                checkState: (globalState) => {
                    const stateHashedArray = params.getStateHashedArray(globalState);
                    HashedArrayDataUtils.checkHashedArraysEqual(stateHashedArray, expectedItemsHashedArray);
                },
                setMocks: () => params.makeMocks.update(mustError)
            };
        }

        function resetMocks() {
            params.removeMocks.update();
        }

        HashedArrayDataUtils.doTests('run updating success', testCases, makeTest, resetMocks, {mustError: false});
        HashedArrayDataUtils.doTests('run updating error', testCases, makeTest, resetMocks, {mustError: true});
    });

    describe(`${params.listName} create tests`, () => {
        const {initialAppState, list, createdItemId} = params.buildInitState();
        const languageId = initialAppState.ui.language;

        const createdItem = {..._.cloneDeep(list[0]), id: null};

        const testCases = [
            {description: 'should create item', newItem: createdItem}
        ];

        function makeTest(testCase, testsParams) {
            const {mustError} = testsParams;
            const {newItem} = testCase;
            const initialItemsHashedArray = ImmutableHashedArray.makeFromArray(list);
            const expectedItemsHashedArray = mustError ?
                initialItemsHashedArray :
                ImmutableHashedArray.appendItem(initialItemsHashedArray, {...newItem, id: createdItemId});

            return {
                initialAppState: initialAppState,
                actions: params.makeActions.create(newItem, languageId),
                checkState: (globalState) => {
                    const stateHashedArray = params.getStateHashedArray(globalState);
                    HashedArrayDataUtils.checkHashedArraysEqual(stateHashedArray, expectedItemsHashedArray);
                },
                setMocks: () => params.makeMocks.create(mustError, createdItemId)
            };
        }

        function resetMocks() {
            params.removeMocks.create();
        }

        HashedArrayDataUtils.doTests('run creating success', testCases, makeTest, resetMocks, {mustError: false});
        HashedArrayDataUtils.doTests('run creating error', testCases, makeTest, resetMocks, {mustError: true});
    });

}
