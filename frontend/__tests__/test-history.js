jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {renewHistoryItem, detachHistoryItem} from '../app/actions/queryHistory';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListDeleteView} from '../app/actions/viewsList';

// Remove to get bunch of test logs
console.log = jest.genMockFunction();

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
            expect(selectedId).not.toEqual(historyItem.id);
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
        const {samplesClient, viewsClient} = apiFacade;
        samplesClient.getFields = (sessionId, sampleId, callback) => mockGetFields(sessionId, sampleId, historySample.id, callback);
        samplesClient.getAllFields = mockGetAllFields;
        viewsClient.add = (sessionId, languageId, view, callback) => mockAddView(sessionId, languageId, view, userView.id, callback);
        viewsClient.update = (sessionId, languageId, view, callback) => mockUpdateView(sessionId, languageId, view, userView.id, callback);
        viewsClient.remove = (sessionId, languageId, view, callback) => mockDeleteView(sessionId, languageId, view, userView.id, callback);
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
            expect(selectedFilterId).toEqual(historyFilter.id);
            expect(selectedViewId).toEqual(historyView.id);
            expect(selectedSampleId).toEqual(historySample.id);

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
            // Update is done.
            expectItemByPredicate(views, item => item.id === 'createdViewId').toBeTruthy();
            // History item is still in the collection.
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
    const historyView = Object.assign({}, views[0], {id: 'historyViewId'});
    const historyFilter = Object.assign({}, filters[0], {id: 'historyFilterId'});
    const historySample = Object.assign({}, samples[0], {id: 'historySampleId'});
    const historyEntry = {
        id: 'historyEntryId',
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

function mockAddView(sessionId, languageId, view, expectedViewId, callback) {
    expect(view).toBeTruthy();
    expect(view.id).toBe(expectedViewId);
    expect(sessionId).toBeTruthy();
    expect(languageId).toBeTruthy();
    expect(callback).toBeTruthy();
    const createdView = Object.assign({}, view, {id:'createdViewId'});
    callback(null, mockResponse(createdView));
}

function mockUpdateView(sessionId, languageId, view, expectedViewId, callback) {
    mockAddView(sessionId, languageId, view, expectedViewId, (e, view) => {
       const updatedView = Object.assign(view, {id: 'updatedView'});
        callback(null, mockResponse(updatedView));
    });
}

function mockDeleteView(sessionId, languageId, view, expectedViewId, callback) {
    expect(view).toBeTruthy();
    expect(view.id).toBe(expectedViewId);
    expect(sessionId).toBeTruthy();
    expect(languageId).toBeTruthy();
    expect(callback).toBeTruthy();
    callback(null, mockResponse(view));
}

function mockGetFields(sessionId, sampleId, expectedSampleId, callback) {
    expect(sampleId).toEqual(expectedSampleId);
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
