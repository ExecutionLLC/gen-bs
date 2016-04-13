import * as ActionTypes from '../actions/userData'

export default function userData(state = {
    isFetching: false,
    isValid: false,
    profileMetadata: {},
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

        case ActionTypes.ATTACH_HISTORY_DATA: {
            const { attachedHistoryData: { sampleId, filterId, viewId} } = state;

            const {collection: samples, historyItemId: newSampleId} = changeHistoryItem(state.samples, sampleId, action.sample);
            const {collection: filters, historyItemId: newFilterId} = changeHistoryItem(state.filters, filterId, action.filters[0]);
            const {collection: views, historyItemId: newViewId} = changeHistoryItem(state.views, viewId, action.view);

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

            const { attachedHistoryData } = state;

            const {
                collection: samples,
                historyItemId: sampleId
            } = detachHistoryItemIfNeedIt(action.detachSample, state.samples, attachedHistoryData.sampleId, null);
            const {
                collection: filters,
                historyItemId: filterId
            } = detachHistoryItemIfNeedIt(action.detachFilter, state.filters, attachedHistoryData.filterId, null);
            const {
                collection: views,
                historyItemId: viewId
            } = detachHistoryItemIfNeedIt(action.detachView, state.views, attachedHistoryData.viewId, null);

            return Object.assign({}, state, {
                samples,
                filters,
                views,
                attachedHistoryData: {
                    sampleId,
                    filterId,
                    viewId
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

function detachHistoryItemIfNeedIt(needDetach, collection, historyItemId) {
    if (needDetach) {
        return changeHistoryItem(collection, historyItemId, null);
    }
    return { collection, historyItemId };
}