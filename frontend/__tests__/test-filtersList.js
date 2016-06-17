jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';


function buildFiltersState(appState) {
    const {
        auth,
        ui,
        filtersList: {hashedArray: {array: filters}}
    } = appState;

    const initialAppState = {
        auth: auth,
        ui: ui,
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters),
            selectedFilterId: filters[0].id
        }
    };

    return {
        initialAppState,
        filters,
        filtersIdsToDelete: {
            first: filters[0].id,
            last: filters[filters.length - 1].id,
            middle: filters[Math.floor(filters.length / 2)].id,
            absent: 'someabsentite-midt-odel-etehere00000'
        },
        filtersIdsToUpdate: {
            first: filters[0].id,
            last: filters[filters.length - 1].id,
            middle: filters[Math.floor(filters.length / 2)].id,
            absent: 'someabsentite-midt-oupd-atehere00000'
        }
    };
}

function mockFilterRemove(sessionId, filterId, callback, expected) {
    expect(filterId).toEqual(expected.filterId);
    expect(sessionId).toEqual(expected.sessionId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK});
    }
}

function mockFilterUpdate(sessionId, filter, callback, expected) {
    expect(filter).toEqual(expected.filter);
    expect(sessionId).toEqual(expected.sessionId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.filterResponse});
    }
}

function mockFilterCreate(sessionId, languageId, filter, callback, expected) {
    expect(filter).toEqual(expected.filter);
    expect(sessionId).toEqual(expected.sessionId);
    expect(languageId).toEqual(expected.languageId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.filterResponse});
    }
}

function expectItemByPredicate(collection, predicate) {
    return expect(_.find(collection, predicate));
}

describe('Mocked filters list state', () => {
    const {filters, filtersIdsToDelete} = buildFiltersState(MOCK_APP_STATE);

    it('should contain first item to delete', () => {
        expect(filters[0].id === filtersIdsToDelete.first).toBeTruthy();
    });

    it('should contain last item to delete', () => {
        expect(filters[filters.length - 1].id === filtersIdsToDelete.last).toBeTruthy();
    });

    it('should contain middle item to delete', () => {
        const middleItemIndex = filters.findIndex((filter) => filter.id === filtersIdsToDelete.middle);
        expect(middleItemIndex > 0 && middleItemIndex < filters.length - 1).toBeTruthy();
    });

    it('should contain no item to delete', () => {
        const middleItemIndex = filters.findIndex((filter) => filter.id === filtersIdsToDelete.absent);
        expect(middleItemIndex === -1).toBeTruthy();
    });
});

function checkHashedArraysEqual(hashedArray, expectedHashedArray) {
    expect(hashedArray.array).toEqual(expectedHashedArray.array);
    expect(hashedArray.hash).toEqual(expectedHashedArray.hash);
}

function checkHashedArrayLength(hashedArray, expectedLength) {
    expect(hashedArray.array.length).toBe(expectedLength);
    expect(Object.keys(hashedArray.hash).length).toBe(expectedLength);
}

function checkObjectInHashedArray(hashedArray, objectId, expectedObject) {
    const objectInArray = hashedArray.array.find((item) => item.id === objectId);
    const objectInHash = _.find(hashedArray.hash, (filter, filterHashKey) => filter.id === objectId || filterHashKey === objectId);
    expect(objectInArray).toEqual(expectedObject);
    expect(objectInHash).toEqual(expectedObject);
}

describe('Filters list delete tests', () => {
    const {initialAppState, filters, filtersIdsToDelete} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;

    function makeDeleteTest(filterId, actualDelete, mustError) {
        const filtersCount = filters.length;
        const reallyDelete = actualDelete && !mustError;
        const expectedFiltersCount = reallyDelete ? filtersCount - 1 : filtersCount;
        const expectedFilters = reallyDelete ? filters.filter((filter) => filter.id !== filterId) : filters;
        const expectedFiltersHash = filters.reduce((hash, filter) => {
            if (!reallyDelete || filter.id !== filterId) {
                hash[filter.id] = filter;
            }
            return hash;
        }, {});
        const expectedFilter = actualDelete && !mustError ? void 0 : filters.find((item) => item.id === filterId);
        return {
            actions(dispatch) {
                return dispatch(filtersListServerDeleteFilter(filterId, sessionId));
            },
            checkState(globalState) {
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArrayLength(filtersHashedArray, expectedFiltersCount);
                checkObjectInHashedArray(filtersHashedArray, filterId, expectedFilter);
                checkHashedArraysEqual(filtersHashedArray, {array: expectedFilters, hash: expectedFiltersHash});
            },
            mockRemove(requestSessionId, requestFilterId, callback) {
                return mockFilterRemove(
                    requestSessionId, requestFilterId, callback,
                    {sessionId: sessionId, filterId: filterId, error: mustError ? {message: 'mockedError'} : null}
                );
            }
        };
    }
    
    function makeDeleteTestItMock(description, filterId, actualDelete, mustError) {
        const delTest = makeDeleteTest(filterId, actualDelete, mustError);
        return {
            it: () => {
                it(description, (done) => {
                    storeTestUtils.runTest({
                        globalInitialState: initialAppState,
                        applyActions: delTest.actions
                    }, (globalState) => {
                        delTest.checkState(globalState);
                        done();
                    });
                });
            },
            mockRemove: delTest.mockRemove
        };
    }

    function makeDeleteTestsItsMocksArray(descriptionsIds, mustError) {
        return descriptionsIds.map((descriptionsIds) => {
            return makeDeleteTestItMock(descriptionsIds.description + ' (mustError=' + mustError + ')', descriptionsIds.filterId, descriptionsIds.actualDelete, mustError);
        });
    }

    const testCases = [
        {description: 'should delete first filter', filterId: filtersIdsToDelete.first, actualDelete:true},
        {description: 'should delete middle filter', filterId: filtersIdsToDelete.middle, actualDelete:true},
        {description: 'should delete last filter', filterId: filtersIdsToDelete.last, actualDelete:true},
        {description: 'should delete absent filter', filterId: filtersIdsToDelete.absent, actualDelete:false}
    ];

    const delTestsItsMocksArraySuccess = makeDeleteTestsItsMocksArray(testCases, false);
    const delTestsItsMocksArrayError = makeDeleteTestsItsMocksArray(testCases, true);

    function runTests(describeName, tests) {
        describe(describeName, () => {
            var testIndex = 0;
    
            beforeEach(() => {
                apiFacade.filtersClient.remove = tests[testIndex++].mockRemove;
            });
    
            afterEach(() => {
                delete apiFacade.filtersClient.remove;
            });
    
            tests.forEach((test) => test.it());
        });
    }

    runTests('run deletion success', delTestsItsMocksArraySuccess);
    runTests('run deletion error', delTestsItsMocksArrayError);
});

describe('Filters list update tests', () => {
    const {initialAppState, filters, filtersIdsToUpdate} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;

    function makeUpdateTest(filterId, newFilter, actualUpdate, mustError) {
        //const filterToUpdate = filters.find((filter) => filter.id === filterId);
        const filterToResponse = {..._.cloneDeep(newFilter), id: filterId};
        const initialFiltersHashedArray = ImmutableHashedArray.makeFromArray(filters);
        const expectedFiltersHashedArray = actualUpdate && !mustError ?
            ImmutableHashedArray.replaceItemId(initialFiltersHashedArray, filterId, newFilter) :
            initialFiltersHashedArray;
        return {
            actions(dispatch) {
                return dispatch(filtersListServerUpdateFilter(newFilter, sessionId));
            },
            checkState(globalState) {
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArraysEqual(filtersHashedArray, expectedFiltersHashedArray);
            },
            mockUpdate(requestSessionId, requestFilter, callback) {
                return mockFilterUpdate(
                    requestSessionId, requestFilter, callback,
                    {sessionId: sessionId, filter: newFilter, filterResponse: filterToResponse, error: mustError ? {message: 'mockError'} : null}
                );
            }
        };
    }

    function makeUpdateTestItMock(description, filterId, newFilter, actualUpdate, mustError) {
        const updateTest = makeUpdateTest(filterId, newFilter, actualUpdate, mustError);
        return {
            it: () => {
                it(description, (done) => {
                    storeTestUtils.runTest({
                        globalInitialState: initialAppState,
                        applyActions: updateTest.actions
                    }, (globalState) => {
                        updateTest.checkState(globalState);
                        done();
                    });
                });
            },
            mockUpdate: updateTest.mockUpdate
        };
    }

    function makeUpdateTestsItsMocksArray(descriptionsIds, mustError) {
        return descriptionsIds.map((descriptionsIds) => {
            return makeUpdateTestItMock(
                descriptionsIds.description + ' (mustError=' + mustError + ')',
                descriptionsIds.filterId,
                descriptionsIds.newFilter,
                descriptionsIds.actualUpdate,
                mustError
            );
        });
    }

    const updatedFilter = {
        "id": "updatedf-ilte-ride-ntif-ier000000000",
        "originalFilterId": null,
        "name": "Updated Filter",
        "rules": {
            "$and": [
                {
                    "00000000-0000-0000-0000-000000000007": {
                        "$eq": "SAPP"
                    }
                },
                {
                    "00000000-0000-0000-0000-000000000005": {
                        "$neq": "B"
                    }
                },
                {
                    "$or": [
                        {
                            "69d1d2db-1d7b-4a9e-a3ee-d5108da78c84": {
                                "$eq": "CBA"
                            }
                        }
                    ]
                }
            ]
        }
    };

    const testCases = [
        {description: 'should update first filter', filterId: filtersIdsToUpdate.first, newFilter: {...updatedFilter, id: filtersIdsToUpdate.first}, actualUpdate:true},
        {description: 'should update middle filter', filterId: filtersIdsToUpdate.middle, newFilter: {...updatedFilter, id: filtersIdsToUpdate.middle}, actualUpdate:true},
        {description: 'should update last filter', filterId: filtersIdsToUpdate.last, newFilter: {...updatedFilter, id: filtersIdsToUpdate.last}, actualUpdate:true},
        {description: 'should update absent filter', filterId: filtersIdsToUpdate.absent, newFilter: updatedFilter, actualUpdate:false}
    ];

    const updateTestsItsMocksArraySuccess = makeUpdateTestsItsMocksArray(testCases, false);
    const updateTestsItsMocksArrayError = makeUpdateTestsItsMocksArray(testCases, true);

    function runTests(describeName, tests) {
        describe(describeName, () => {
            var testIndex = 0;

            beforeEach(() => {
                apiFacade.filtersClient.update = tests[testIndex++].mockUpdate;
            });

            afterEach(() => {
                delete apiFacade.filtersClient.update;
            });

            tests.forEach((test) => test.it());
        });
    }

    runTests('run updating success', updateTestsItsMocksArraySuccess);
    runTests('run updating error', updateTestsItsMocksArrayError);
});

describe('Filters list create tests', () => {
    const {initialAppState, filters} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;
    const languageId = initialAppState.ui.language;

    const newFilter = {
        "id": null,
        "originalFilterId": null,
        "name": "Updated Filter",
        "rules": {
            "$and": [
                {
                    "00000000-0000-0000-0000-000000000007": {
                        "$eq": "SAPP"
                    }
                },
                {
                    "00000000-0000-0000-0000-000000000005": {
                        "$neq": "B"
                    }
                },
                {
                    "$or": [
                        {
                            "69d1d2db-1d7b-4a9e-a3ee-d5108da78c84": {
                                "$eq": "CBA"
                            }
                        }
                    ]
                }
            ]
        }
    };

    const testCases = [
        {description: 'should create filter', newFilter: newFilter}
    ];

    function makeTests(describeName, testCases, mustError) {

        const tests = testCases.map((testCase) => {
            const {description, newFilter} = testCase;
            const newFilterId = '' + Math.random();
            const filterToResponse = {..._.cloneDeep(newFilter), id: newFilterId};
            const initialFiltersHashedArray = ImmutableHashedArray.makeFromArray(filters);
            const expectedFiltersHashedArray = mustError ?
                initialFiltersHashedArray :
                ImmutableHashedArray.appendItem(initialFiltersHashedArray, {...newFilter, id: newFilterId});
            
            function actions(dispatch) {
                return dispatch(filtersListServerCreateFilter(newFilter, sessionId, languageId));
            }

            function checkState(globalState) {
                //expect(123).toBe(456);
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArraysEqual(filtersHashedArray, expectedFiltersHashedArray);
            }

            function setMocks() {
                apiFacade.filtersClient.add = (sessionId, languageId, requestFilter, callback) => mockFilterCreate(
                    sessionId, languageId, requestFilter, callback,
                    {sessionId: sessionId, languageId: languageId, filter: newFilter, filterResponse: filterToResponse, error: mustError ? {message: 'mockError'} : null}
                );
            }

            return {
                it: () => {
                    it(description, (done) => {
                        storeTestUtils.runTest({
                            globalInitialState: initialAppState,
                            applyActions: actions
                        }, (globalState) => {
                            checkState(globalState);
                            done();
                        });
                    })
                },
                setMocks: setMocks
            };
        });

        function resetMocks() {
            delete apiFacade.filtersClient.add;
        }

        return () => {
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
        };
    }

    const testsSuccess = makeTests('run creating success', testCases, false);
    const testsError = makeTests('run creating error', testCases, true);
    testsSuccess();
    testsError();
});
