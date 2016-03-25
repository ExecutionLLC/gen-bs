import * as ActionTypes from '../actions/auth'

export default function auth(state = {
    isFetching: false,
    sessionId: null,
    isAuthenticated: false,
    isDemo: false,
    errorMessage: null
}, action) {

    switch (action.type) {

        case ActionTypes.REQUEST_SESSION:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_SESSION:
            return Object.assign({}, state, {
                isFetching: false,
                sessionId: action.sessionId,
                isAuthenticated: action.isAuthenticated,
                isDemo: action.isDemo,
                lastUpdated: action.receivedAt
            });

        case ActionTypes.LOGIN_ERROR:
            return Object.assign({}, state, {
                errorMessage: action.errorMessage
            });

        default:
            return state
    }
}
