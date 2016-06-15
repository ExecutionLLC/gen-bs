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

function mockFilterRemove(sessionId, filterId, expectedSessionId, expectedFilterId, callback) {
    expect(filterId).toEqual(expectedFilterId);
    expect(sessionId).toEqual(expectedSessionId);
    return callback(null, {status: HttpStatus.OK});
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

    function makeDeleteTest(filterId) {
        return {
            actions(dispatch) {
                return dispatch(filtersListServerDeleteFilter(filterId, sessionId));
            },
            checkState(globalState) {
                const {filtersList: {hashedArray: {array: filters, hash: filtersHash}}} = globalState;
                const isInFilters = filters.find((item) => item.id === filterId);
                expect(isInFilters).toBeFalsy();
                const isInFiltersHash = _.find(filtersHash, (filter, filterHashKey) => filter.id === filterId || filterHashKey === filterId);
                expect(isInFiltersHash).toBeFalsy();
            },
            mockRemove(requestSessionId, requestFilterId, callback) {
                return mockFilterRemove(requestSessionId, requestFilterId, sessionId, filterId, callback);
            }
        };
    }
    
    function makeDeleteTestItMock(description, filterId) {
        const delTest = makeDeleteTest(filterId);
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

    function makeDeleteTestsItsMocks(descriptionsIds) {
        return descriptionsIds.reduce((result, descriptionsIds) => {
            const test = makeDeleteTestItMock(descriptionsIds.description, descriptionsIds.filterId);
            return {
                its: [...result.its, test.it],
                mocks: [...result.mocks, test.mockRemove]
            };
        }, {its: [], mocks: []});
    }

    const delTestsItsMocks = makeDeleteTestsItsMocks([
        {description: 'should delete first filter', filterId: filtersIdsToDelete.first},
        {description: 'should delete middle filter', filterId: filtersIdsToDelete.middle},
        {description: 'should delete last filter', filterId: filtersIdsToDelete.last},
        {description: 'should delete absent filter', filterId: filtersIdsToDelete.absent}
    ]);

    var mockIndex = 0;

    beforeEach(() => {
        apiFacade.filtersClient.remove = delTestsItsMocks.mocks[mockIndex++];
    });

    afterEach(() => {
        delete apiFacade.filtersClient.remove;
    });

    delTestsItsMocks.its.forEach((it) => it());
});