import * as ActionTypes from '../actions/userData';

export default function userData(state = {
    isFetching: false,
    isValid: false,
    profileMetadata: {}
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
                profileMetadata: action.profileMetadata,
                lastUpdated: action.receivedAt
            });

        default:
            return state;
    }
}