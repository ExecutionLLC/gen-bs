jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';


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


function doTests(describeName, testCases, makeTest, resetMocks, testsParams) {

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

    function makeFiltersIds(absentFilterId) {
        return {
            first: filters[0].id,
                last: filters[filters.length - 1].id,
            middle: filters[Math.floor(filters.length / 2)].id,
            absent: absentFilterId
        }
    }

    return {
        initialAppState,
        filters,
        filtersIdsToDelete: makeFiltersIds('someabsentite-midt-odel-etehere00000'),
        filtersIdsToUpdate: makeFiltersIds('someabsentite-midt-oupd-atehere00000'),
        updatedFilter: {
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
        },
        createdFilter: {
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
        }
    };
}


function makeListedObjectTests(params) {

    return () => {

        describe(params.describes.initial, () => {
            const {list, idsToDelete} = params.buildInitState(MOCK_APP_STATE);

            it('should contain first item to delete', () => {
                expect(list[0].id === idsToDelete.first).toBeTruthy();
            });

            it('should contain last item to delete', () => {
                expect(list[list.length - 1].id === idsToDelete.last).toBeTruthy();
            });

            it('should contain middle item to delete', () => {
                const middleItemIndex = list.findIndex((filter) => filter.id === idsToDelete.middle);
                expect(middleItemIndex > 0 && middleItemIndex < list.length - 1).toBeTruthy();
            });

            it('should contain no item to delete', () => {
                const middleItemIndex = list.findIndex((filter) => filter.id === idsToDelete.absent);
                expect(middleItemIndex === -1).toBeTruthy();
            });
        });

    };
}

const filtersTests = makeListedObjectTests({
    describes: {
        initial: 'Mocked filters list state'
    },
    buildInitState: () => {
        const {filters, filtersIdsToDelete} = buildFiltersState(MOCK_APP_STATE);
        return {
            idsToDelete: {
                first: filtersIdsToDelete.first,
                middle: filtersIdsToDelete.middle,
                last: filtersIdsToDelete.last,
                absent: filtersIdsToDelete.absent
            },
            list: filters
        };
    }
});

filtersTests();

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

describe('Filters list delete tests', () => {
    const {initialAppState, filters, filtersIdsToDelete} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;

    const testCases = [
        {description: 'should delete first filter', filterId: filtersIdsToDelete.first, actualDelete:true},
        {description: 'should delete middle filter', filterId: filtersIdsToDelete.middle, actualDelete:true},
        {description: 'should delete last filter', filterId: filtersIdsToDelete.last, actualDelete:true},
        {description: 'should delete absent filter', filterId: filtersIdsToDelete.absent, actualDelete:false}
    ];

    function makeTest(testCase, testParams) {
        const {mustError} = testParams;
        const {filterId, actualDelete} = testCase;

        const reallyDelete = actualDelete && !mustError;

        const filtersCount = filters.length;
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
            initialAppState,
            actions: (dispatch) => {
                dispatch(filtersListServerDeleteFilter(filterId, sessionId));
            },
            checkState: (globalState) => {
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArrayLength(filtersHashedArray, expectedFiltersCount);
                checkObjectInHashedArray(filtersHashedArray, filterId, expectedFilter);
                checkHashedArraysEqual(filtersHashedArray, {array: expectedFilters, hash: expectedFiltersHash});
            },
            setMocks: () => {
                apiFacade.filtersClient.remove = (requestSessionId, requestFilterId, callback) => mockFilterRemove(
                    requestSessionId, requestFilterId, callback,
                    {sessionId: sessionId, filterId: filterId, error: mustError ? {message: 'mockedError'} : null}
                );
            }
        };
    }

    function resetMocks() {
        delete apiFacade.filtersClient.remove;
    }

    doTests('run deletion success', testCases, makeTest, resetMocks, {mustError: false});
    doTests('run deletion error', testCases, makeTest, resetMocks, {mustError: false});
});

describe('Filters list update tests', () => {
    const {initialAppState, filters, filtersIdsToUpdate, updatedFilter} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;

    const initialFiltersHashedArray = ImmutableHashedArray.makeFromArray(filters);

    const testCases = [
        {description: 'should update first filter', filterId: filtersIdsToUpdate.first, newFilter: {...updatedFilter, id: filtersIdsToUpdate.first}, actualUpdate:true},
        {description: 'should update middle filter', filterId: filtersIdsToUpdate.middle, newFilter: {...updatedFilter, id: filtersIdsToUpdate.middle}, actualUpdate:true},
        {description: 'should update last filter', filterId: filtersIdsToUpdate.last, newFilter: {...updatedFilter, id: filtersIdsToUpdate.last}, actualUpdate:true},
        {description: 'should update absent filter', filterId: filtersIdsToUpdate.absent, newFilter: updatedFilter, actualUpdate:false}
    ];

    function makeTest(testCase, testsParams) {
        const {mustError} = testsParams;
        const {filterId, newFilter, actualUpdate} = testCase;

        const expectedFiltersHashedArray = actualUpdate && !mustError ?
            ImmutableHashedArray.replaceItemId(initialFiltersHashedArray, filterId, newFilter) :
            initialFiltersHashedArray;
        const filterToResponse = {..._.cloneDeep(newFilter), id: filterId};

        return {
            initialAppState,
            actions: (dispatch) => {
                dispatch(filtersListServerUpdateFilter(newFilter, sessionId))
            },
            checkState: (globalState) => {
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArraysEqual(filtersHashedArray, expectedFiltersHashedArray);
            },
            setMocks: () => {
                apiFacade.filtersClient.update = (requestSessionId, requestFilter, callback) => mockFilterUpdate(
                    requestSessionId, requestFilter, callback,
                    {
                        filter: newFilter,
                        sessionId: sessionId,
                        filterResponse: filterToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                )
            }
        };
    }

    function resetMocks() {
        delete apiFacade.filtersClient.update;
    }

    doTests('run updating success', testCases, makeTest, resetMocks, {mustError: false});
    doTests('run updating error', testCases, makeTest, resetMocks, {mustError: true});
});

describe('Filters list create tests', () => {
    const {initialAppState, filters, createdFilter} = buildFiltersState(MOCK_APP_STATE);
    const {sessionId} = initialAppState.auth;
    const languageId = initialAppState.ui.language;

    const testCases = [
        {description: 'should create filter', newFilter: createdFilter}
    ];

    function makeTest(testCase, testsParams) {
        const {mustError} = testsParams;
        const {newFilter} = testCase;
        const newFilterId = '' + Math.random();
        const filterToResponse = {..._.cloneDeep(newFilter), id: newFilterId};
        const initialFiltersHashedArray = ImmutableHashedArray.makeFromArray(filters);
        const expectedFiltersHashedArray = mustError ?
            initialFiltersHashedArray :
            ImmutableHashedArray.appendItem(initialFiltersHashedArray, {...newFilter, id: newFilterId});

        return {
            initialAppState: initialAppState,
            actions: (dispatch) => {
                return dispatch(filtersListServerCreateFilter(newFilter, sessionId, languageId));
            },
            checkState: (globalState) => {
                const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
                checkHashedArraysEqual(filtersHashedArray, expectedFiltersHashedArray);
            },
            setMocks: () => {
                apiFacade.filtersClient.add = (sessionId, languageId, requestFilter, callback) => mockFilterCreate(
                    sessionId, languageId, requestFilter, callback,
                    {
                        sessionId: sessionId,
                        languageId: languageId,
                        filter: newFilter,
                        filterResponse: filterToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            }
        };
    }

    function resetMocks() {
        delete apiFacade.filtersClient.add;
    }

    doTests('run creating success', testCases, makeTest, resetMocks, {mustError: false});
    doTests('run creating error', testCases, makeTest, resetMocks, {mustError: true});
});
