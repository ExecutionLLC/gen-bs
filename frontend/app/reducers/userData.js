import * as ActionTypes from '../actions/userData'

export default function userData(state = {
    isFetching: false,
    isValid: false,
    profileMetadata: {},
    samples: [],
    filters: [],
    views: [],
    attachedHistoryData: {
        sampleId: null,
        filterId: null,
        viewId: null
    }
}, action) {

    switch (action.type) {

        case ActionTypes.REQUEST_USERDATA:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_USERDATA:
            return Object.assign({}, state, {
                isFetching: false,
                isValid: true,

                profileMetadata: action.userData.profileMetadata,
                samples: action.userData.samples,
                filters: action.userData.filters,
                views: action.userData.views,

                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_VIEWS:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_VIEWS:
            return Object.assign({}, state, {
                isFetching: false,

                views: action.views,

                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_FILTERS:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_FILTERS:
            return Object.assign({}, state, {
                isFetching: false,
                filters: action.filters,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_SAMPLES:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_SAMPLES:
            return Object.assign({}, state, {
                isFetching: false,
                samples: action.samples,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.ATTACH_HISTORY_DATA: {
            const oldSampleId = state.attachedHistoryData.sampleId;
            const { collection: samples, historyItemId: newSampleId} = changeHistoryItem(state.samples, oldSampleId, action.sample);
            const oldFilterId = state.attachedHistoryData.filterId;
            const { collection: filters, historyItemId: newFilterId} = changeHistoryItem(state.filters, oldFilterId, action.filters[0]);
            const oldViewId = state.attachedHistoryData.viewId;
            const { collection: views, historyItemId: newViewId} = changeHistoryItem(state.views, oldViewId, action.view);

            return Object.assign({}, state, {
                samples,
                filters,
                views,
                attachedHistoryData: {
                    sampleId: newSampleId,
                    filterId: newFilterId,
                    viewId: newViewId
                }
            });
        }
        case ActionTypes.DETACH_HISTORY_DATA: {
            if (!action.detachSample && !action.detachFilter && !action.detachView) {
                return state;
            }

            var sampleId = state.attachedHistoryData.sampleId;
            var samples = state.samples;
            if (action.detachSample) {
                samples = changeHistoryItem(samples, sampleId, null).collection;
                sampleId = null;
            }

            var filterId = state.attachedHistoryData.filterId;
            var filters = state.filters;
            if (action.detachFilter) {
                filters = changeHistoryItem(filters, filterId, null).collection;
                filterId = null;
            }

            var viewId = state.attachedHistoryData.viewId;
            var views = state.views;
            if (action.detachView) {
                views = changeHistoryItem(views, viewId, null).collection;
                viewId = null;
            }

            return Object.assign({}, state, {
                samples,
                filters,
                views,
                attachedHistoryData: {
                    sampleId: sampleId,
                    filterId: filterId,
                    viewId: viewId
                }
            });
        }
        default:
            return state
    }
}

function changeHistoryItem(collection, oldHistoryItemId, newHistoryItem) {
    var newHistoryItemId = newHistoryItem ? newHistoryItem.id : null;
    if (oldHistoryItemId === newHistoryItemId) {
        // nothing to be changed
        return { collection, historyItemId: oldHistoryItemId };
    }

    if (oldHistoryItemId) {
        // remove old item from collection
        collection = _.filter(collection, (item) => { return item.id !== oldHistoryItemId; } );
    }

    if (newHistoryItemId) {
        const hasNewHistoryItem = _.some(collection, (item) => { return item.id === newHistoryItemId; });
        if (!hasNewHistoryItem) {
            // if collection do not contain such item, we should insert it
            collection = [...collection, newHistoryItem];
        } else {
            // reset history id, because we already have this item in collection (so it is not from history, it is
            // common item)
            newHistoryItemId = null;
        }
    }

    return { collection, historyItemId: newHistoryItemId};
}