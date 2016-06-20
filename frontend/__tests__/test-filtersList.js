jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';


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


function mockViewRemove(sessionId, viewId, callback, expected) {
    expect(viewId).toEqual(expected.viewId);
    expect(sessionId).toEqual(expected.sessionId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK});
    }
}

function mockViewUpdate(sessionId, view, callback, expected) {
    expect(view).toEqual(expected.view);
    expect(sessionId).toEqual(expected.sessionId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.viewResponse});
    }
}

function mockViewCreate(sessionId, languageId, view, callback, expected) {
    expect(view).toEqual(expected.view);
    expect(sessionId).toEqual(expected.sessionId);
    expect(languageId).toEqual(expected.languageId);
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.viewResponse});
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
            "name": "Created Filter",
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

        describe(params.describes.deleteTests, () => {
            const {initialAppState, list, idsToDelete} = params.buildInitState(MOCK_APP_STATE);
            const {sessionId} = initialAppState.auth;

            const testCases = [
                {description: 'should delete first item', itemId: idsToDelete.first, actualDelete:true},
                {description: 'should delete middle item', itemId: idsToDelete.middle, actualDelete:true},
                {description: 'should delete last item', itemId: idsToDelete.last, actualDelete:true},
                {description: 'should delete absent item', itemId: idsToDelete.absent, actualDelete:false}
            ];

            function makeTest(testCase, testParams) {
                const {mustError} = testParams;
                const {itemId, actualDelete} = testCase;

                const reallyDelete = actualDelete && !mustError;

                const filtersCount = list.length;
                const expectedItemsCount = reallyDelete ? filtersCount - 1 : filtersCount;
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
                    actions: params.makeActions.remove(itemId, sessionId),
                    checkState: (globalState) => {
                        const stateHashedArray = params.getStateHashedArray(globalState);
                        checkHashedArrayLength(stateHashedArray, expectedItemsCount);
                        checkObjectInHashedArray(stateHashedArray, itemId, expectedItem);
                        checkHashedArraysEqual(stateHashedArray, {array: expectedItems, hash: expectedItemsHash});
                    },
                    setMocks: params.makeMocks.remove(sessionId, itemId, mustError)
                };
            }

            function resetMocks() {
                delete apiFacade.filtersClient.remove;
            }

            doTests('run deletion success', testCases, makeTest, resetMocks, {mustError: false});
            doTests('run deletion error', testCases, makeTest, resetMocks, {mustError: true});
        });

        describe(params.describes.updateTests, () => {
            const {initialAppState, list, idsToUpdate, updatedItem} = params.buildInitState(MOCK_APP_STATE);
            const {sessionId} = initialAppState.auth;

            const initialHashedArray = ImmutableHashedArray.makeFromArray(list);

            const testCases = [
                {description: 'should update first filter', itemId: idsToUpdate.first, newItem: {...updatedItem, id: idsToUpdate.first}, actualUpdate:true},
                {description: 'should update middle filter', itemId: idsToUpdate.middle, newItem: {...updatedItem, id: idsToUpdate.middle}, actualUpdate:true},
                {description: 'should update last filter', itemId: idsToUpdate.last, newItem: {...updatedItem, id: idsToUpdate.last}, actualUpdate:true},
                {description: 'should update absent filter', itemId: idsToUpdate.absent, newItem: updatedItem, actualUpdate:false}
            ];

            function makeTest(testCase, testsParams) {
                const {mustError} = testsParams;
                const {itemId, newItem, actualUpdate} = testCase;

                const expectedItemsHashedArray = actualUpdate && !mustError ?
                    ImmutableHashedArray.replaceItemId(initialHashedArray, itemId, newItem) :
                    initialHashedArray;
                const itemToResponse = {..._.cloneDeep(newItem), id: itemId};

                return {
                    initialAppState,
                    actions: params.makeActions.update(newItem, sessionId),
                    checkState: (globalState) => {
                        const stateHashedArray = params.getStateHashedArray(globalState);
                        checkHashedArraysEqual(stateHashedArray, expectedItemsHashedArray);
                    },
                    setMocks: params.makeMocks.update(sessionId, newItem, itemToResponse, mustError)
                };
            }

            function resetMocks() {
                delete apiFacade.filtersClient.update;
            }

            doTests('run updating success', testCases, makeTest, resetMocks, {mustError: false});
            doTests('run updating error', testCases, makeTest, resetMocks, {mustError: true});
        });

        describe(params.describes.createTests, () => {
            const {initialAppState, list, createdItem} = params.buildInitState(MOCK_APP_STATE);
            const {sessionId} = initialAppState.auth;
            const languageId = initialAppState.ui.language;

            const testCases = [
                {description: 'should create item', newItem: createdItem}
            ];

            function makeTest(testCase, testsParams) {
                const {mustError} = testsParams;
                const {newItem} = testCase;
                const newItemId = '' + Math.random(); // TODO get from init state
                const itemToResponse = {..._.cloneDeep(newItem), id: newItemId};
                const initialItemsHashedArray = ImmutableHashedArray.makeFromArray(list);
                const expectedItemsHashedArray = mustError ?
                    initialItemsHashedArray :
                    ImmutableHashedArray.appendItem(initialItemsHashedArray, {...newItem, id: newItemId});

                return {
                    initialAppState: initialAppState,
                    actions: params.makeActions.create(newItem, sessionId, languageId),
                    checkState: (globalState) => {
                        const stateHashedArray = params.getStateHashedArray(globalState);
                        checkHashedArraysEqual(stateHashedArray, expectedItemsHashedArray);
                    },
                    setMocks: params.makeMocks.create(sessionId, languageId, newItem, itemToResponse, mustError)
                };
            }

            function resetMocks() {
                delete apiFacade.filtersClient.add;
            }

            doTests('run creating success', testCases, makeTest, resetMocks, {mustError: false});
            doTests('run creating error', testCases, makeTest, resetMocks, {mustError: true});
        });

    };
}

function buildViewsState(appState) {
    const {
        auth,
        ui,
        viewsList: {hashedArray: {array: views}}
    } = appState;

    const initialAppState = {
        auth: auth,
        ui: ui,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views),
            selectedViewId: views[0].id
        }
    };

    function makeViewsIds(absentViewId) {
        return {
            first: views[0].id,
            last: views[views.length - 1].id,
            middle: views[Math.floor(views.length / 2)].id,
            absent: absentViewId
        }
    }

    return {
        initialAppState,
        views,
        viewsIdsToDelete: makeViewsIds('someabsentite-midt-odel-etehere00000'),
        viewsIdsToUpdate: makeViewsIds('someabsentite-midt-oupd-atehere00000'),
        updatedView: {
            "id": "updatedv-iewi-dent-ifie-r00000000000",
            "originalViewId": null,
            "name": "Updated View",
            "viewListItems": [
                {
                    "id": "db1a4f9f-60d6-416a-a2a1-86082dba551a",
                    "viewId": "a1fb42b1-bd2d-4ad3-baf3-1d3eb84619c5",
                    "fieldId": "00000000-0000-0000-0000-000000000001",
                    "order": 1,
                    "sortOrder": 1,
                    "sortDirection": "asc",
                    "filterControlEnable": false,
                    "keywords": []
                },
                {
                    "id": "d1b0bce8-c4c8-43b1-8a1d-4579e432537a",
                    "viewId": "a1fb42b1-bd2d-4ad3-baf3-1d3eb84619c5",
                    "fieldId": "00000000-0000-0000-0000-000000000002",
                    "order": 2,
                    "sortOrder": 2,
                    "sortDirection": "desc",
                    "filterControlEnable": false,
                    "keywords": []
                }
            ]
        },
        createdView: {
            "id": null,
            "originalFilterId": null,
            "name": "Created View",
            "viewListItems": [
                {
                    "id": "5505f259-d611-4e0a-b9c9-2f8875c0522b",
                    "viewId": "a1fb42b1-bd2d-4ad3-baf3-1d3eb84619c5",
                    "fieldId": "00000000-0000-0000-0000-000000000007",
                    "order": 3,
                    "sortOrder": null,
                    "sortDirection": null,
                    "filterControlEnable": false,
                    "keywords": []
                },
                {
                    "id": "319e82a3-e634-4509-9a10-72e119a9f3ec",
                    "viewId": "a1fb42b1-bd2d-4ad3-baf3-1d3eb84619c5",
                    "fieldId": "00000000-0000-0000-0000-000000000005",
                    "order": 4,
                    "sortOrder": null,
                    "sortDirection": null,
                    "filterControlEnable": false,
                    "keywords": [
                        "7cd8167c-52d8-4b24-afe3-38d1b2bc82de"
                    ]
                }
            ]
        }
    };
}


const filtersTests = makeListedObjectTests({
    describes: {
        initial: 'Mocked filters list state',
        deleteTests: 'Filters list delete tests',
        updateTests: 'Filters list update tests',
        createTests: 'Filters list create tests'
    },
    buildInitState() {
        const {initialAppState, filters, filtersIdsToDelete, updatedFilter, createdFilter} = buildFiltersState(MOCK_APP_STATE);
        return {
            initialAppState,
            idsToDelete: {
                first: filtersIdsToDelete.first,
                middle: filtersIdsToDelete.middle,
                last: filtersIdsToDelete.last,
                absent: filtersIdsToDelete.absent
            },
            idsToUpdate: {
                first: filtersIdsToDelete.first,
                middle: filtersIdsToDelete.middle,
                last: filtersIdsToDelete.last,
                absent: filtersIdsToDelete.absent
            },
            list: filters,
            updatedItem: updatedFilter,
            createdItem: createdFilter
        };
    },
    makeActions: {
        remove(filterId, sessionId) {
            return (dispatch) => {
                dispatch(filtersListServerDeleteFilter(filterId, sessionId));
            };
        },
        update(newFilter, sessionId) {
            return (dispatch) => {
                dispatch(filtersListServerUpdateFilter(newFilter, sessionId));
            };
        },
        create(newFilter, sessionId, languageId) {
            return (dispatch) => {
                return dispatch(filtersListServerCreateFilter(newFilter, sessionId, languageId));
            }
        }
    },
    makeMocks: {
        remove(sessionId, itemId, mustError) {
            return () => {
                apiFacade.filtersClient.remove = (requestSessionId, requestFilterId, callback) => mockFilterRemove(
                    requestSessionId, requestFilterId, callback,
                    {sessionId: sessionId, filterId: itemId, error: mustError ? {message: 'mockedError'} : null}
                );
            };
        },
        update(sessionId, newItem, itemToResponse, mustError) {
            return () => {
                apiFacade.filtersClient.update = (requestSessionId, requestFilter, callback) => mockFilterUpdate(
                    requestSessionId, requestFilter, callback,
                    {
                        filter: newItem,
                        sessionId: sessionId,
                        filterResponse: itemToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        },
        create(sessionId, languageId, newFilter, filterToResponse, mustError) {
            return () => {
                apiFacade.filtersClient.add = (requestSessionId, requestLanguageId, requestFilter, callback) => mockFilterCreate(
                    requestSessionId, requestLanguageId, requestFilter, callback,
                    {
                        sessionId: sessionId,
                        languageId: languageId,
                        filter: newFilter,
                        filterResponse: filterToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        }
    },
    getStateHashedArray(globalState) {
        const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
        return filtersHashedArray;
    }
});

const viewsTests = makeListedObjectTests({
    describes: {
        initial: 'Mocked views list state',
        deleteTests: 'Views list delete tests',
        updateTests: 'Views list update tests',
        createTests: 'Views list create tests'
    },
    buildInitState: () => {
        const {initialAppState, views, viewsIdsToDelete, updatedView, createdView} = buildViewsState(MOCK_APP_STATE);
        return {
            initialAppState,
            idsToDelete: {
                first: viewsIdsToDelete.first,
                middle: viewsIdsToDelete.middle,
                last: viewsIdsToDelete.last,
                absent: viewsIdsToDelete.absent
            },
            idsToUpdate: {
                first: viewsIdsToDelete.first,
                middle: viewsIdsToDelete.middle,
                last: viewsIdsToDelete.last,
                absent: viewsIdsToDelete.absent
            },
            list: views,
            updatedItem: updatedView,
            createdItem: createdView
        };
    },
    makeActions: {
        remove(viewId, sessionId) {
            return (dispatch) => {
                dispatch(viewsListServerDeleteView(viewId, sessionId));
            };
        },
        update(newView, sessionId) {
            return (dispatch) => {
                dispatch(viewsListServerUpdateView(newView, sessionId));
            };
        },
        create(newView, sessionId, languageId) {
            return (dispatch) => {
                return dispatch(viewsListServerCreateView(newView, sessionId, languageId));
            }
        }
    },
    makeMocks: {
        remove(sessionId, itemId, mustError) {
            return () => {
                apiFacade.viewsClient.remove = (requestSessionId, requestViewId, callback) => mockViewRemove(
                    requestSessionId, requestViewId, callback,
                    {sessionId: sessionId, viewId: itemId, error: mustError ? {message: 'mockedError'} : null}
                );
            };
        },
        update(sessionId, newItem, itemToResponse, mustError) {
            return () => {
                apiFacade.viewsClient.update = (requestSessionId, requestView, callback) => mockViewUpdate(
                    requestSessionId, requestView, callback,
                    {
                        view: newItem,
                        sessionId: sessionId,
                        viewResponse: itemToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        },
        create(sessionId, languageId, newView, viewToResponse, mustError) {
            return () => {
                apiFacade.viewsClient.add = (requestSessionId, requestLanguageId, requestView, callback) => mockViewCreate(
                    requestSessionId, requestLanguageId, requestView, callback,
                    {
                        sessionId: sessionId,
                        languageId: languageId,
                        view: newView,
                        viewResponse: viewToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        }
    },
    getStateHashedArray(globalState) {
        const {viewsList: {hashedArray: viewsHashedArray}} = globalState;
        return viewsHashedArray;
    }
});

filtersTests();
viewsTests();

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
    doTests('run deletion error', testCases, makeTest, resetMocks, {mustError: true});
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
                apiFacade.filtersClient.add = (requestSessionId, requestLanguageId, requestFilter, callback) => mockFilterCreate(
                    requestSessionId, requestLanguageId, requestFilter, callback,
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
