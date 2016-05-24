import * as ActionTypes from '../actions/userData';

export default function userData(state = {
    isFetching: false,
    isValid: false,
    profileMetadata: {},
    views: [], // TODO vl remove
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
                views: action.userData.views, // TODO vl remove

                lastUpdated: action.receivedAt
            });

        case ActionTypes.REQUEST_VIEWS: // TODO vl3 need?
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_VIEWS: // TODO vl3 need?
            return Object.assign({}, state, {
                isFetching: false,

                views: action.views, // TODO vl remove

                lastUpdated: action.receivedAt
            });

        case ActionTypes.CHANGE_HISTORY_DATA:
            {
                const {sampleId, filterId, viewId} = action;
                return Object.assign({}, state, {
                    attachedHistoryData: {
                        sampleId: sampleId,
                        filterId: filterId,
                        viewId: viewId
                    }
                });
            }
        case ActionTypes.CHANGE_VIEWS: // TODO vl remove
            {
                const {views} = action;
                return Object.assign({}, state, {
                    views: views
                });
            }
        case ActionTypes.DELETE_VIEW: // TODO vl remove
            {
                const deletedViewIndex = _.findIndex(state.views, view => view.id == action.viewId);
                return Object.assign({}, state, {
                    views: [
                        ...state.views.slice(0, deletedViewIndex),
                        ...state.views.slice(deletedViewIndex + 1)
                    ]
                });
            }
        default:
            return state;
    }
}