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
        filtersList: {hashedArray: {array: filters}}
    } = appState;

    const initialAppState = {
        auth: auth,
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
        }
    };
}

function mockFilterRemove(sessionId, filterId, expectedSessionId, expectedFilterId, mustError, callback) {
    expect(filterId).toEqual(expectedFilterId);
    expect(sessionId).toEqual(expectedSessionId);
    if (mustError) {
        return callback({message: 'mockedError'}, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK});
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

describe('Filters list tests', () => {
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
                const {filtersList: {hashedArray: {array: filters, hash: filtersHash}}} = globalState;
                expect(filters.length).toBe(expectedFiltersCount);
                expect(Object.keys(filtersHash).length).toBe(expectedFiltersCount);
                const isInFilters = filters.find((item) => item.id === filterId);
                if (!actualDelete || !mustError) {
                    expect(isInFilters).toBeFalsy();
                } else {
                    expect(isInFilters).toBeTruthy();
                }
                const isInFiltersHash = _.find(filtersHash, (filter, filterHashKey) => filter.id === filterId || filterHashKey === filterId);
                if (!actualDelete || !mustError) {
                    expect(isInFiltersHash).toBeFalsy();
                } else {
                    expect(isInFiltersHash).toBeTruthy();
                }
                expect(isInFilters).toEqual(expectedFilter);
                expect(isInFiltersHash).toEqual(expectedFilter);
                expect(filters).toEqual(expectedFilters);
                expect(filtersHash).toEqual(expectedFiltersHash);
            },
            mockRemove(requestSessionId, requestFilterId, callback) {
                return mockFilterRemove(requestSessionId, requestFilterId, sessionId, filterId, mustError, callback);
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