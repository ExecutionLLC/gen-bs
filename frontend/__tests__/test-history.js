jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {renewHistoryItem, detachHistoryItem} from '../app/actions/queryHistory';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';

// Remove to get bunch of test logs
console.log = jest.genMockFunction();

const TestIds = {
    historyViewId: 'historyViewId',
    historyFilterId: 'historyFilterId',
    historySampleId: 'historySampleId',
    historyEntryId: 'historyEntryId',

    updatedItemId: 'updatedItemId',
    createdItemId: 'createdItemId'
};

describe('Mocked History State', () => {
    const state = buildHistoryState();
    const {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry
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

    it('should contain correct history entry', () => {
        expectItemByPredicate(history, entry => entry.id === historyEntry.id).toBeTruthy();
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
            auth: {sessionId}
        },
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry
    } = buildHistoryState();
    const userView = initialAppState.viewsList.hashedArray.array.find(item => item.type === 'user');

    beforeEach(() => {
        const {samplesClient, viewsClient, filtersClient} = apiFacade;
        samplesClient.getFields = jest.fn(
            (sessionId, sampleId, callback) => mockGetFields(sessionId, sampleId, historySample.id, callback)
        );
        samplesClient.getAllFields = jest.fn(mockGetAllFields);
        viewsClient.add = jest.fn((sessionId, languageId, view, callback) =>
            mockAdd(sessionId, languageId, view, callback)
        );
        viewsClient.update = jest.fn((sessionId, view, callback) =>
            mockUpdate(sessionId, view, userView.id, callback)
        );
        viewsClient.remove = jest.fn((sessionId, viewId, callback) => {
            const viewToDelete = initialAppState.viewsList.hashedArray.hash[viewId];
            mockDelete(sessionId, viewToDelete, userView.id, callback)
        });
    });

    afterEach(() => {
        const {samplesClient, viewsClient} = apiFacade;
        delete samplesClient.getFields;
        delete samplesClient.getAllFields;
        delete viewsClient.add;
        delete viewsClient.update;
        delete viewsClient.remove;
    });
    
    it('should correctly renew history item', (done) => {
        storeTestUtils.runTest({
            globalInitialState: initialAppState,
            applyActions: (dispatch) => dispatch(renewHistoryItem(historyEntry.id))
        }, (globalState) => {
            const {
                views, samples, filters, history,
                selectedFilterId, selectedViewId, selectedSampleId
            } = mapStateToCollections(globalState);

            // History items should be in collections.
            expectItemByPredicate(history, item => item.id === historyEntry.id).toBeTruthy();
            expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();
            expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();
            expectItemByPredicate(samples, item => item.id === historySample.id).toBeTruthy();

            // History items should be selected in lists.
            expect(selectedFilterId).toBe(historyFilter.id);
            expect(selectedViewId).toBe(historyView.id);
            expect(selectedSampleId).toBe(historySample.id);

            done();
        });
    });

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
            history: [historyEntry]
        })
    };
    return {
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry
    };
}
function mockResponse(body, status = HttpStatus.OK) {
    return {
        body,
        status
    }
}

function mockAdd(sessionId, languageId, item, callback) {
    expect(item).toBeTruthy();
    expect(sessionId).toBeTruthy();
    expect(languageId).toBeTruthy();
    expect(callback).toBeTruthy();
    const createdItem = Object.assign({}, item, {id:TestIds.createdItemId});
    callback(null, mockResponse(createdItem));
}

function mockUpdate(sessionId, item, expectedItemId, callback) {
    expect(item).toBeTruthy();
    expect(item.id).toBe(expectedItemId);
    expect(sessionId).toBeTruthy();
    expect(callback).toBeTruthy();
    const updatedItem = Object.assign({}, item, {id: TestIds.updatedItemId});
    callback(null, mockResponse(updatedItem));
}

function mockDelete(sessionId, item, expectedItemId, callback) {
    expect(item).toBeTruthy();
    expect(item.id).toBe(expectedItemId);
    expect(sessionId).toBeTruthy();
    expect(callback).toBeTruthy();
    callback(null, mockResponse(item));
}

function mockGetFields(sessionId, sampleId, expectedSampleId, callback) {
    expect(sampleId).toBe(expectedSampleId);
    return callback(null, mockResponse(MOCK_APP_STATE.fields.sampleFieldsList));
}

function mockGetAllFields(sessionId, callback) {
    callback(null, mockResponse(MOCK_APP_STATE.fields.totalFieldsList));
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
