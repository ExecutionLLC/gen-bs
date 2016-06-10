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
    const historyView = views[0];
    const historyFilter = filters[0];
    const historySample = samples[0];
    const historyEntry = {
        id: '005f858f-a723-4556-b45f-1464abb074f3',
        timestamp: '2016-05-31T10:52:17.813Z',
        view: historyView,
        filters: [historyFilter],
        sample: historySample
    };

    const initialAppState = {
        fields,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views.slice(1))
        },
        samplesList: {
            samples: samples.slice(1)
        },
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters.slice(1))
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

function mockGetAllFields(sessionId, callback) {
    callback(null, APP_STATE.fields.totalFieldsList);
}

/**@returns {{views:Array, filters:Array, samples:Array, history:Array}}*/
function mapStateToCollections(globalState) {
    const {
        viewsList: {hashedArray:{array:views}},
        filtersList: {hashedArray:{array:filters}},
        samplesList: {samples},
        queryHistory: {history}
    } = globalState;
    return {
        views,
        filters,
        samples,
        history
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
    const {filters, views, samples, history} = mapStateToCollections(initialAppState);

    it('should not contain history items', () => {
        expectItemByPredicate(views, view => view.id === historyView.id).toBeFalsy();
        expectItemByPredicate(filters, filter => filter.id === historyFilter.id).toBeFalsy();
        expectItemByPredicate(samples, sample => sample.id === historySample.id).toBeFalsy();
    });

    it('should contain correct history entry', () => {
        expectItemByPredicate(history, entry => entry.id === historyEntry.id).toBeTruthy();
    });
});

describe('History Tests', () => {
    beforeEach(() => {
        apiFacade.samplesClient.getAllFields = mockGetAllFields;
    });

    afterEach(() => {
        delete apiFacade.samplesClient.getAllFields;
    });
    
    it('should correctly renew history item', (done) => {
        const {
            initialAppState,
            historyView,
            historyFilter,
            historySample,
            historyEntry
        } = buildHistoryState();
        storeTestUtils.runTest({
            globalInitialState: initialAppState,
            applyActions: (dispatch) => dispatch(renewHistoryItem(historyEntry.id))
        }, (globalState) => {
            const {views, samples, filters, history} = mapStateToCollections(globalState);
            expectItemByPredicate(history, item => item.id === historyEntry.id).toBeTruthy();
            expectItemByPredicate(filters, item => item.id === historyFilter.id).toBeTruthy();
            expectItemByPredicate(views, item => item.id === historyView.id).toBeTruthy();
            expectItemByPredicate(samples, item => item.id === historySample.id).toBeTruthy();

            done();
        });
    });
});
