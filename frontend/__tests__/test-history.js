import {
    setCurrentAnalysesHistoryIdLoadDataAsync, createNewDefaultHistoryItem, receiveAnalysesHistory,
    setCurrentAnalysesHistoryId
} from '../app/actions/analysesHistory';

import {entityType, getDefaultOrStandardItem} from '../app/utils/entityTypes';
import {analysisType} from '../app/utils/analyseUtils';
import {sampleType} from '../app/utils/samplesUtils';
import {ImmutableHashedArray} from '../app/utils/immutable';
import * as i18n from '../app/utils/i18n';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import apiMocks from './__mocks__/apiMocks';
import {
    expectItemByPredicate,
    installMocks
} from './jestUtils';

// Remove to get bunch of test logs
//console.log = jest.genMockFunction();

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

describe('Mocked History State', () => {
    const state = buildHistoryState();
    const {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry,
        nonHistoryEntry,
        absentHistoryItemId
    } = state;
    const {
        filters, views, samples, history, newHistoryItem
    } = mapStateToCollections(initialAppState);

    it('should have truly history items', () => {
        expect(historyView.type).toBe(entityType.HISTORY);
        expect(historyFilter.type).toBe(entityType.HISTORY);
        expect(historySample.type).toBe(entityType.HISTORY);
    });

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
        const {viewId: selectedViewId, filterId: selectedFilterId, samples} = newHistoryItem;
        const selectedSampleId = samples[0].id;
        function checkSelectionCorrect(selectedId, historyItem) {
            expect(selectedId).toBeTruthy();
            expect(selectedId).not.toBe(historyItem.id);
        }
        checkSelectionCorrect(selectedFilterId, historyFilter);
        checkSelectionCorrect(selectedViewId, historyView);
        checkSelectionCorrect(selectedSampleId, historySample);
    });

    it('should not contain absent id', () => {
        expect(_.find(history, entry => entry.id === absentHistoryItemId)).toBe(undefined);
    });
});

describe('History Tests', () => {
    const {
        initialAppState: {
            ui: {languageId},
            auth: {sessionId},
            viewsList,
            filtersList
        },
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry
    } = buildHistoryState();
    const userView = viewsList.hashedArray.array.find(item => item.type === entityType.USER);
    const userFilter = filtersList.hashedArray.array.find(item => item.type === entityType.USER);

    beforeAll(() => {
        //installMocks(console, {log: jest.fn()});
        const {samplesClient, viewsClient, filtersClient, modelsClient, searchClient} = apiFacade;
        installMocks(searchClient, {
            sendSearchRequest: apiMocks.createSendSearchRequestMock(sessionId, languageId,
                historySample.id, historyView.id, historyFilter.id, searchOperationId)
        });
        installMocks(samplesClient, {
            get: apiMocks.createGetMock(historySample.id, historySample),
            getFields: apiMocks.createGetFieldsMock(sessionId, historySample.id, sampleFieldsList),
            getAllFields: apiMocks.createGetAllFieldsMock(sessionId, totalFieldsList)
        });
        installMocks(viewsClient, {
            get: apiMocks.createGetMock(historyView.id, historyView),
            add: apiMocks.createAddMock(),
            update: apiMocks.createUpdateMock(userView.id),
            remove: apiMocks.createDeleteMock(userView.id, initialAppState.viewsList.hashedArray.hash)
        });
        installMocks(filtersClient, {
            get: apiMocks.createGetMock(historyFilter.id, historyFilter),
            add: apiMocks.createAddMock(),
            update: apiMocks.createUpdateMock(userFilter.id),
            remove: apiMocks.createDeleteMock(userFilter.id, initialAppState.filtersList.hashedArray.hash)
        });
        installMocks(modelsClient, {
            get: apiMocks.createGetMock('models-id', {}),
        });
    });

    afterAll(() => {
        //installMocks(console, {log: null});
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

    describe('Create history item', () => {
        const state = buildHistoryState();
        const {initialAppState} = state;
        const {filters, views, samples, history, newHistoryItem} = mapStateToCollections(initialAppState);

        const initialHistory = history.slice();

        let newState;
        beforeAll((done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(createNewDefaultHistoryItem())
            }, (globalState) => {
                newState = globalState;
                done();
            });
        });

        it('should make new history item', () => {
            const {history: newHistory, newHistoryItem: newNewHistoryItem} = mapStateToCollections(newState);
            expect(newHistory).toEqual(initialHistory);
            expect(newNewHistoryItem).not.toBe(newHistoryItem);
            expect(newNewHistoryItem.id).toBe(null);
            expect(newNewHistoryItem.type).toBe(analysisType.SINGLE);
            const expectedView = getDefaultOrStandardItem(views);
            const expectedFilter = getDefaultOrStandardItem(filters);
            const expectedSample = getDefaultOrStandardItem(samples);
            expect(newNewHistoryItem.viewId).toBe(expectedView.id);
            expect(newNewHistoryItem.filterId).toBe(expectedFilter.id);
            expect(newNewHistoryItem.samples).toEqual([{id: expectedSample.id, type: sampleType.SINGLE}]);
            expect(i18n.getEntityText(newNewHistoryItem).name).toBeTruthy();
            expect(i18n.getEntityText(newNewHistoryItem).description).toBeTruthy();
        });
    });

    describe('Set current analysis', () => {
        const state = buildHistoryState();
        const {initialAppState} = state;
        const {history, absentHistoryItemId} = mapStateToCollections(initialAppState);

        it('should set exist analysis', (done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(setCurrentAnalysesHistoryId(history[0].id))
            }, (globalState) => {
                expect(globalState.analysesHistory.currentHistoryId).toBe(history[0].id);
                done();
            });
        });

        it('should set absent analysis having new analysis', (done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    createNewDefaultHistoryItem(),
                    setCurrentAnalysesHistoryId(absentHistoryItemId)
                ])
            }, (globalState) => {
                expect(globalState.analysesHistory.currentHistoryId).toBe(null);
                done();
            });
        });

        it('should set absent analysis having no new analysis', (done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(setCurrentAnalysesHistoryId(absentHistoryItemId))
            }, (globalState) => {
                expect(globalState.analysesHistory.currentHistoryId).toBe(null);
                done();
            });
        });
    });

    describe('Set history list', () => {
        // check:
        // - current id is null
        // - new list have the current id
        // - new list have no current id and have new analysis
        // - new list have no current id and have no new analysis (impossible case)

        // it('should be mocked correctly', () => {
        //     expect(initialAppState.analysesHistory.newHistoryItem).not.toBe(null);
        // });

        it('should set history list without current item', (done) => {
            const state = buildHistoryState();
            const {initialAppState} = state;

            const originalNewHistoryItem = initialAppState.analysesHistory.newHistoryItem;
            expect(originalNewHistoryItem).not.toBe(null);

            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(receiveAnalysesHistory([]))
            }, (newState) => {
                const {history, currentHistoryId, newHistoryItem} = mapStateToCollections(newState);
                expect(history).toEqual([]);
                expect(currentHistoryId).toBe(null);
                expect(newHistoryItem).toEqual(originalNewHistoryItem); // seems like it has toBe, but it is not, idk why
                done();
            });
        });

        it('should set history list with current item', (done) => {
            const state = buildHistoryState();
            const {initialAppState} = state;

            const originalNewHistoryItem = initialAppState.analysesHistory.newHistoryItem;
            expect(originalNewHistoryItem).not.toBe(null);
            const historyIdCurrent = initialAppState.analysesHistory.history[0].id;
            const historyItemCurrent = _.find(initialAppState.analysesHistory.history, {id: historyIdCurrent});

            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch([
                    setCurrentAnalysesHistoryId(historyIdCurrent),
                    receiveAnalysesHistory([historyItemCurrent])
                ])
            }, (newState) => {
                const {history, currentHistoryId, newHistoryItem} = mapStateToCollections(newState);
                expect(history).toEqual([historyItemCurrent]);
                expect(currentHistoryId).toBe(historyIdCurrent);
                expect(newHistoryItem).toEqual(originalNewHistoryItem);
                done();
            });
        });
    });

    describe('Select history item', () => {
        const state = buildHistoryState();
        const {initialAppState} = state;
        let renewGlobalState = null;
        beforeAll((done) => {
            storeTestUtils.runTest({
                globalInitialState: initialAppState,
                applyActions: (dispatch) => dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(historyEntry.id))
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

        it('should select history analysis', () => {
            const {currentHistoryId} = mapStateToCollections(renewGlobalState);
            expect(currentHistoryId).toBe(historyEntry.id);
        });


        it('should select history items in lists', () => {
            const {history} = mapStateToCollections(renewGlobalState);
            const currentHistoryItem = _.find(history, {id: historyEntry.id});
            expect(currentHistoryItem.viewId).toBe(historyView.id);
            expect(currentHistoryItem.filterId).toBe(historyFilter.id);
            expect(currentHistoryItem.samples).toEqual([{id: historySample.id, type: entityType.HISTORY}]);
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
        viewsList: {hashedArray: {array: views}},
        samplesList: {hashedArray: {array: samples}},
        filtersList: {hashedArray: {array: filters}},
        analysesHistory: {newHistoryItem},
        analysesHistory,
        fields
    } = MOCK_APP_STATE;
    const historyView = Object.assign({}, views[0], {id: TestIds.historyViewId, type: entityType.HISTORY});
    const historyFilter = Object.assign({}, filters[0], {id: TestIds.historyFilterId, type: entityType.HISTORY});
    const historySample = Object.assign({}, samples[0], {id: TestIds.historySampleId, type: entityType.HISTORY});
    const historyEntry = {
        id: TestIds.historyEntryId,
        timestamp: '2016-05-31T10:52:17.813Z',
        viewId: historyView.id,
        filterId: historyFilter.id,
        samples: [{id: historySample.id, type: historySample.type}]
    };
    const nonHistoryEntry = {
        id: TestIds.nonHistoryEntryId,
        timestamp: '2016-05-31T10:53:17.813Z',
        viewId: views[2].id,
        filterId: filters[2].id,
        samples: [{id: samples[2].id, type: samples[2].type}]
    };

    const initialAppState = {
        ui: {languageId: 'en'},
        auth: {sessionId: auth.sessionId},
        fields,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views.slice(1))
        },
        samplesList: {
            hashedArray: ImmutableHashedArray.makeFromArray(samples.slice(1))
        },
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters.slice(1))
        },
        analysesHistory: Object.assign({}, analysesHistory, {
            initialHistory: [historyEntry, nonHistoryEntry],
            history: [historyEntry, nonHistoryEntry],
            newHistoryItem,
            currentHistoryId: null
        })
    };
    return {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry,
        nonHistoryEntry,
        absentHistoryItemId: 'absentHistoryItemId'
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
        analysesHistory: {history, newHistoryItem, currentHistoryId}
    } = globalState;
    return {
        views,
        filters,
        samples,
        history,
        newHistoryItem,
        currentHistoryId
    };
}
