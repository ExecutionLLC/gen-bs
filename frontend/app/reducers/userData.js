import * as ActionTypes from '../actions/userData';

export default function userData(state = {
    isFetching: false,
    isValid: false,
    profileMetadata: {},
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
        default:
            return state;
    }
}