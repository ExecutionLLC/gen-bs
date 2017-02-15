import {renewHistoryItem, detachHistoryItem} from '../app/actions/analysesHistory';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView, viewsListReceive} from '../app/actions/viewsList';
import {filtersListServerCreateFilterAsync, filtersListServerUpdateFilter, filtersListServerDeleteFilter, filtersListReceive} from '../app/actions/filtersList';
//import {analyze} from '../app/actions/ui';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import apiMocks from './__mocks__/apiMocks';
import {
    expectCountByPredicate,
    expectItemByPredicate,
    installMocks
} from './jestUtils';

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
const searchOperationId = 'searchOperationId';

xdescribe('Mocked History State', () => {
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

xdescribe('History Tests', () => {
    const {
        initialAppState: {
            ui:{languageId},
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
        installMocks(console, {log: jest.fn()});
        const {samplesClient, viewsClient, filtersClient, searchClient} = apiFacade;
        installMocks(searchClient, {
            sendSearchRequest: apiMocks.createSendSearchRequestMock(sessionId, languageId,
                historySample.id, historyView.id, historyFilter.id, searchOperationId)
        });
        installMocks(samplesClient, {
            getFields: apiMocks.createGetFieldsMock(sessionId, historySample.id, sampleFieldsList),
            getAllFields: apiMocks.createGetAllFieldsMock(sessionId, totalFieldsList)
        });
        installMocks(viewsClient, {
            add: apiMocks.createAddMock(),
            update: apiMocks.createUpdateMock(userView.id),
            remove: apiMocks.createDeleteMock(userView.id, initialAppState.viewsList.hashedArray.hash)
        });
        installMocks(filtersClient, {
            add: apiMocks.createAddMock(),
            update: apiMocks.createUpdateMock(userFilter.id),
            remove: apiMocks.createDeleteMock(userFilter.id, initialAppState.filtersList.hashedArray.hash)
        });
    });

    afterAll(() => {
        installMocks(console, {log: null});
        const {samplesClient, viewsClient, filtersClient} = apiFacade;
        installMocks(searchClient, {
            sendSearchRequest: null
        });
        installMocks(samplesClient, {
            getFields: null,
            getAllFields: null
        });
        installMocks(viewsClient, {
            add: null,
            update: null,
            remove: null
        });
        installMocks(filtersClient, {
            add: null,
            update: null,
            remove: null
        });
    });

    xdescribe('Renew History: history items', () => {
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
/*
        it('should select history items in lists', () => {
            const {
                selectedFilterId, selectedViewId, selectedSampleId
            } = mapStateToCollections(renewGlobalState);
            expect(selectedFilterId).toBe(historyFilter.id);
            expect(selectedViewId).toBe(historyView.id);
            expect(selectedSampleId).toBe(historySample.id);
        });

        it('should call analyze with proper arguments', () => {
            expect(apiFacade.searchClient.sendSearchRequest).toBeCalled();
        });
*/
    });

// no renewHistoryItem, also reanalyse must be used
//     describe('History Items Removal', () => {
//         const {sample, view, filters} = nonHistoryEntry;
//         const filter = filters[0];
//         const {searchClient} = apiFacade;
//         beforeEach(() => {
//             installMocks(searchClient, {
//                 sendSearchRequest: apiMocks.createSendSearchRequestSimpleMock(searchOperationId)
//             });
//         });
//
//         afterEach(() => {
//             installMocks(searchClient, {
//                 sendSearchRequest: null
//             });
//         });
//
//         it('should remove history items when a normal analyze is done', (done) => {
//             storeTestUtils.runTest({
//                 globalInitialState: initialAppState,
//                 applyActions: (dispatch) => dispatch(renewHistoryItem(historyEntry.id))
//             }, (globalState) => {
//                 const {
//                     views, samples, filters
//                 } = mapStateToCollections(globalState);
//
//                 // now they are here.
//                 expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();
//                 expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();
//                 expectItemByPredicate(samples, item => item.id === historySample.id).toBeTruthy();
// /*
//                 storeTestUtils.runTest({
//                     globalInitialState: globalState,
//                     applyActions: (dispatch) => dispatch(analyze(sample.id, view.id, filter.id))
//                 }, (globalState) => {
//                     const {
//                         views, samples, filters
//                     } = mapStateToCollections(globalState);
//
//                     // And now they should be removed.
//                     expectItemByPredicate(views, item => item.id === historyView.id).toBeFalsy();
//                     expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeFalsy();
//                     expectItemByPredicate(samples, item => item.id === historySample.id).toBeFalsy();
//
//                     done();
//                 });
//                 FIXME analyze: replace by reanalyze */
//             });
//         });
//     });

/* no selected items, no renewHistoryItem
    xdescribe('Renew History: non-history items', () => {
        let renewGlobalState = null;
        const {view:{id: nonHistoryViewId}, sample:{id: nonHistorySampleId}} = nonHistoryEntry;
        const nonHistoryFilterId = nonHistoryEntry.filters[0].id;
        beforeAll((done) => {
            const {samplesClient, searchClient} = apiFacade;
            installMocks(samplesClient, {
                getFields: apiMocks.createGetFieldsMock(sessionId, nonHistorySampleId, sampleFieldsList)
            });
            installMocks(searchClient, {
                sendSearchRequest: apiMocks.createSendSearchRequestMock(sessionId, languageId,
                    nonHistorySampleId, nonHistoryViewId, nonHistoryFilterId, searchOperationId)
            });
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(renewHistoryItem(nonHistoryEntry.id))
            }, (globalState) => {
                renewGlobalState = globalState;

                done();
            });
        });
        afterAll(() => {
            const {samplesClient, searchClient} = apiFacade;
            installMocks(samplesClient, {
                getFields: null
            });
            installMocks(searchClient, {
                sendSearchRequest: null
            });
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

        it('should call analyze with proper arguments', () => {
            expect(apiFacade.searchClient.sendSearchRequest).toBeCalled();
        });
    });
*/
    xdescribe('History Items in Collections', () => {
/* no renewHistoryItem
        it('should keep history items when creating view', (done) => {
            expect(userView).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    viewsListServerCreateView(userView, sessionId, languageId)
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
*/
/* no renewHistoryItem
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
*/
/* no renewHistoryItem
        it('should keep history items when creating filter', (done) => {
            expect(userFilter).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    renewHistoryItem(historyEntry.id),
                    filtersListServerCreateFilterAsync(userFilter.id, sessionId, languageId)
                ])
            }, (globalState) => {
                const {filters} = mapStateToCollections(globalState);
                expectItemByPredicate(filters, item => item.id === userFilter.id).toBeTruthy();
                expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();

                done();
            });
        });
*/
/* no renewHistoryItem
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
*/
/* no renewHistoryItem
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
*/
    });
/* no selected item, no renewHistoryItem
    xdescribe('Handle history items', () => {
        it('should select sample after history', (done) => {

            function checkSelection(itemId, itemsList) {
                console.log('checkSelection', itemId, itemsList);
                return !!itemsList.hashedArray.hash[itemId];
            }

            expect(userView).toBeTruthy();
            expect(userFilter).toBeTruthy();
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => {
                    dispatch(renewHistoryItem(historyEntry.id));
                    dispatch(viewsListServerUpdateView(userView, sessionId));
                    dispatch(filtersListServerUpdateFilter(userFilter, sessionId))
                        .then( () => {
                            dispatch([
                                viewsListReceive([userView]),
                                filtersListReceive([userFilter])
                            ]);
                        });
                }
            }, (globalState) => {
                expect(checkSelection(globalState.viewsList.selectedViewId, globalState.viewsList)).toBe(true);
                expect(checkSelection(globalState.filtersList.selectedFilterId, globalState.filtersList)).toBe(true);
                done();
            });
        });
    });
*/
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
        samplesList: {hashedArray:{array: samples}},
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
        ui: {languageId: 'en'},
        auth: {sessionId: auth.sessionId},
        fields,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views.slice(1)),
            selectedViewId: views[1].id
        },
        samplesList: {
            hashedArray: ImmutableHashedArray.makeFromArray(samples.slice(1)),
            selectedSampleId: samples[1].id
        },
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters.slice(1)),
            selectedFilterId: filters[1].id
        },
        analysesHistory: Object.assign({}, MOCK_APP_STATE.analysesHistory, {
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

/**@returns {{
* views: Array,
* filters: Array,
* samples: Array,
* history: Array
* }}*/
function mapStateToCollections(globalState) {
    const {
        viewsList: {hashedArray: {array: views}},
        filtersList: {hashedArray: {array: filters}},
        samplesList: {hashedArray: {array: samples}},
        analysesHistory: {history, newHistoryItem}
    } = globalState;
    return {
        views,
        filters,
        samples,
        history,
        newHistoryItem
    };
}
