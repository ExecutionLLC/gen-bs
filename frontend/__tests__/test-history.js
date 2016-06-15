import HttpStatus from 'http-status';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import apiMocks from './__mocks__/apiMocks';
import {renewHistoryItem, detachHistoryItem} from '../app/actions/queryHistory';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';

// Remove to get bunch of test logs
console.log = jest.genMockFunction();

const TestIds = {
    historyViewId: 'historyViewId',
    historyFilterId: 'historyFilterId',
    historySampleId: 'historySampleId',

    historyEntryId: 'historyEntryId',
    nonHistoryEntryId: 'nonHistoryEntryId', // history entry which contains non-history items.

    updatedItemId: 'updatedItemId',
    createdItemId: 'createdItemId'
};
const {sampleFieldsList, totalFieldsList} = MOCK_APP_STATE.fields;

describe('Mocked History State', () => {
    const state = buildHistoryState();
    const {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry,
        nonHistoryEntry
    } = state;
    const {
        filters, views, samples, history,
        selectedFilterId, selectedViewId, selectedSampleId
    } = mapStateToCollections(initialAppState);

    it('should not contain history items', () => {
        expectItemByPredicate(views, view => view.id === historyView.id).toBeFalsy();
        expectItemByPredicate(filters, filter => filter.id === historyFilter.id).toBeFalsy();
        expectItemByPredicate(samples, sample => sample.id === historySample.id).toBeFalsy();
    });

    it('should contain correct history entries', () => {
        expectItemByPredicate(history, entry => entry.id === historyEntry.id).toBeTruthy();
        expectItemByPredicate(history, entry => entry.id === nonHistoryEntry.id).toBeTruthy();
    });

    it('should have selected items, and they should not be history items', () => {
        function checkSelectionCorrect(selectedId, historyItem) {
            expect(selectedId).toBeTruthy();
            expect(selectedId).not.toBe(historyItem.id);
        }

        checkSelectionCorrect(selectedFilterId, historyFilter);
        checkSelectionCorrect(selectedViewId, historyView);
        checkSelectionCorrect(selectedSampleId, historySample);
    })
});

describe('History Tests', () => {
    const {
        initialAppState: {
            userData: {profileMetadata:{language}},
            auth: {sessionId},
            viewsList,
            filtersList
        },
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry,
        nonHistoryEntry
    } = buildHistoryState();
    const userView = viewsList.hashedArray.array.find(item => item.type === 'user');
    const userFilter = filtersList.hashedArray.array.find(item => item.type === 'user');

    beforeAll(() => {
        const {samplesClient, viewsClient, filtersClient} = apiFacade;
        samplesClient.getFields = apiMocks.createGetFieldsMock(sessionId, historySample.id, sampleFieldsList);
        samplesClient.getAllFields = apiMocks.createGetAllFieldsMock(sessionId, totalFieldsList);
        viewsClient.add = apiMocks.createAddMock();
        viewsClient.update = apiMocks.createUpdateMock(userView.id);
        viewsClient.remove = apiMocks.createDeleteMock(userView.id, initialAppState.viewsList.hashedArray.hash);
        filtersClient.add = apiMocks.createAddMock();
        filtersClient.update = apiMocks.createUpdateMock(userFilter.id);
        filtersClient.remove = apiMocks.createDeleteMock(userFilter.id, initialAppState.filtersList.hashedArray.hash);
    });

    afterAll(() => {
        const {samplesClient, viewsClient} = apiFacade;
        delete samplesClient.getFields;
        delete samplesClient.getAllFields;
        delete viewsClient.add;
        delete viewsClient.update;
        delete viewsClient.remove;
    });

    describe('Renew History: history items', () => {
        let renewGlobalState = null;
        beforeAll((done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(renewHistoryItem(historyEntry.id))
            }, (globalState) => {
                renewGlobalState = globalState;

                done();
            });
        });

        it('should add history items into collection', () => {
            const {
                views, samples, filters, history
            } = mapStateToCollections(renewGlobalState);

            expectItemByPredicate(history, item => item.id === historyEntry.id).toBeTruthy();
            expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();
            expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();
            expectItemByPredicate(samples, item => item.id === historySample.id).toBeTruthy();
        });

        it('should select history items in lists', () => {
            const {
                selectedFilterId, selectedViewId, selectedSampleId
            } = mapStateToCollections(renewGlobalState);
            expect(selectedFilterId).toBe(historyFilter.id);
            expect(selectedViewId).toBe(historyView.id);
            expect(selectedSampleId).toBe(historySample.id);
        });

        it('should call analyze with proper arguments', () => {
            expect(true).toBe(false);
        });
    });

    describe('Renew History: non-history items', () => {
        let renewGlobalState = null;
        const originalSamplesGetFields = apiFacade.samplesClient.getFields;
        const {view:{id: nonHistoryViewId}, sample:{id: nonHistorySampleId}} = nonHistoryEntry;
        const nonHistoryFilterId = nonHistoryEntry.filters[0].id;
        beforeAll((done) => {
            apiFacade.samplesClient.getFields = apiMocks.createGetFieldsMock(sessionId, nonHistorySampleId, sampleFieldsList);
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(renewHistoryItem(nonHistoryEntry.id))
            }, (globalState) => {
                renewGlobalState = globalState;

                done();
            });
        });
        afterAll(() => {
            apiFacade.samplesClient.getFields = originalSamplesGetFields;
        });

        it('should not add non-history items into collections', () => {
            const {
                views, samples, filters
            } = mapStateToCollections(renewGlobalState);

            expectCountByPredicate(views, view => view.id === nonHistoryViewId).toBe(1);
            expectCountByPredicate(filters, filter => filter.id === nonHistoryFilterId).toBe(1);
            expectCountByPredicate(samples, sample => sample.id === nonHistorySampleId).toBe(1);
        });

        it('should select non-history items in lists', () => {
            const {
                selectedFilterId, selectedViewId, selectedSampleId
            } = mapStateToCollections(renewGlobalState);
            expect(selectedFilterId).toBe(nonHistoryFilterId);
            expect(selectedViewId).toBe(nonHistoryViewId);
            expect(selectedSampleId).toBe(nonHistorySampleId);
        });
    });

    describe('History Items in Collections', () => {
        it('should keep history items when creating view', (done) => {
            expect(userView).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    viewsListServerCreateView(userView, sessionId, language)
                ])
            }, (globalState) => {
                const {views} = mapStateToCollections(globalState);
                // Create is done.
                expectItemByPredicate(views, item => item.id === TestIds.createdItemId).toBeTruthy();
                // History item is still in the collection.
                expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();

                done();
            });
        });

        it('should keep history items when updating view', (done) => {
            expect(userView).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    viewsListServerUpdateView(userView, sessionId)
                ])
            }, (globalState) => {
                const {views} = mapStateToCollections(globalState);
                expectItemByPredicate(views, item => item.id === TestIds.updatedItemId).toBeTruthy();
                expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();

                done();
            });
        });

        it('should keep history items when deleting view', (done) => {
            expect(userView).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    viewsListServerDeleteView(userView.id, sessionId)
                ])
            }, (globalState) => {
                const {views} = mapStateToCollections(globalState);
                expectItemByPredicate(views, item => item.id === userView.id).toBeFalsy();
                expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();

                done();
            });
        });

        it('should keep history items when creating filter', (done) => {
            expect(userFilter).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    filtersListServerCreateFilter(userFilter.id, sessionId, language)
                ])
            }, (globalState) => {
                const {filters} = mapStateToCollections(globalState);
                expectItemByPredicate(filters, item => item.id === userFilter.id).toBeTruthy();
                expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();

                done();
            });
        });

        it('should keep history items when updating filter', (done) => {
            expect(userFilter).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    filtersListServerUpdateFilter(userFilter, sessionId)
                ])
            }, (globalState) => {
                const {filters} = mapStateToCollections(globalState);
                expectItemByPredicate(filters, item => item.id === TestIds.updatedItemId).toBeTruthy();
                expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();

                done();
            });
        });

        it('should keep history items when deleting filter', (done) => {
            expect(userFilter).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    filtersListServerDeleteFilter(userFilter.id, sessionId)
                ])
            }, (globalState) => {
                const {filters} = mapStateToCollections(globalState);
                expectItemByPredicate(filters, item => item.id === userFilter.id).toBeFalsy();
                expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();

                done();
            });
        });
    });
});

/**
 * Build mock app state with one history entry.
 * @returns {{
 * initialAppState: Object,
 * historyView: Object,
 * historyFilter: Object,
 * historySample: Object,
 * historyEntry: Object
 * }}
 */
function buildHistoryState() {
    const {
        auth,
        viewsList: {hashedArray:{array: views}},
        samplesList: {samples},
        filtersList: {hashedArray:{array: filters}},
        fields
    } = MOCK_APP_STATE;
    const historyView = Object.assign({}, views[0], {id: TestIds.historyViewId});
    const historyFilter = Object.assign({}, filters[0], {id: TestIds.historyFilterId});
    const historySample = Object.assign({}, samples[0], {id: TestIds.historySampleId});
    const historyEntry = {
        id: TestIds.historyEntryId,
        timestamp: '2016-05-31T10:52:17.813Z',
        view: historyView,
        filters: [historyFilter],
        sample: historySample
    };
    const nonHistoryEntry = {
        id: TestIds.nonHistoryEntryId,
        timestamp: '2016-05-31T10:53:17.813Z',
        view: views[2],
        filters: [filters[2]],
        sample: samples[2]
    };

    const initialAppState = {
        auth: {sessionId: auth.sessionId},
        userData: {
            profileMetadata: {
                language: 'en'
            }
        },
        fields,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views.slice(1)),
            selectedViewId: views[1].id
        },
        samplesList: {
            samples: samples.slice(1),
            selectedSample: samples[1]
        },
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters.slice(1)),
            selectedFilterId: filters[1].id
        },
        queryHistory: Object.assign({}, MOCK_APP_STATE.queryHistory, {
            history: [historyEntry, nonHistoryEntry]
        })
    };
    return {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry,
        nonHistoryEntry
    };
}
function mockResponse(body, status = HttpStatus.OK) {
    return {
        body,
        status
    }
}

/**@returns {{views:Array, filters:Array, samples:Array, history:Array}}*/
function mapStateToCollections(globalState) {
    const {
        viewsList: {hashedArray:{array:views}, selectedViewId},
        filtersList: {hashedArray:{array:filters}, selectedFilterId},
        samplesList: {samples, selectedSample},
        queryHistory: {history}
    } = globalState;
    return {
        views,
        filters,
        samples,
        history,
        selectedViewId,
        selectedFilterId,
        selectedSampleId: selectedSample.id
    };
}

function expectItemByPredicate(collection, predicate) {
    return expect(_.find(collection, predicate));
}

function expectCountByPredicate(collection, predicate) {
    return expect((_.filter(collection, predicate) || []).length);
}
