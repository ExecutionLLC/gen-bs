jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import {ImmutableHashedArray} from '../app/utils/immutable';
import storeTestUtils from './storeTestUtils';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {renewHistoryItem, detachHistoryItem} from '../app/actions/queryHistory';

// Remove to get bunch of test logs
console.log = jest.genMockFunction();

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

function mockGetFields(sessionId, sampleId, expectedSampleId) {
    expect(sampleId).toEqual(expectedSampleId);
    return Promise.resolve(MOCK_APP_STATE.fields.sampleFieldsList);
}

function mockGetAllFields(sessionId, callback) {
    callback(null, MOCK_APP_STATE.fields.totalFieldsList);
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
        initialAppState,
        historyView,
        historyFilter,
        historySample,
        historyEntry
    } = buildHistoryState();

    beforeEach(() => {
        apiFacade.samplesClient.getFields = (sessionId, sampleId) => mockGetFields(sessionId, sampleId, historySample.id);
        apiFacade.samplesClient.getAllFields = mockGetAllFields;
    });

    afterEach(() => {
        delete apiFacade.samplesClient.getFields;
        delete apiFacade.samplesClient.getAllFields;
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
});
