import * as ActionTypes from '../actions/auth';

export default function auth(state = {
    isFetching: false,
    isDemo: false,
    showAutoLogoutDialog: false,
    secondsToAutoLogout: null,
    errorMessage: null,
    showCloseAllUserSessionsDialog: false,
    showAnotherPageOpenedModal: false
}, action) {

    switch (action.type) {

        case ActionTypes.REQUEST_SESSION:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.RECEIVE_SESSION: {
            return Object.assign({}, state, {
                isFetching: false,
                isDemo: action.isDemo,
                lastUpdated: action.receivedAt
            });
        }

        case ActionTypes.UPDATE_AUTOLOGOUT_TIMER: {
            const showAutoLogoutDialog = action.secondsToAutoLogout !== null;
            return Object.assign({}, state, {
                showAutoLogoutDialog,
                secondsToAutoLogout: action.secondsToAutoLogout
            });
        }

        case ActionTypes.LOGIN_ERROR:
            return Object.assign({}, state, {
                errorMessage: action.errorMessage
            });

        case ActionTypes.SHOW_CLOSE_ALL_USER_SESSIONS_DIALOG:
            return Object.assign({}, state, {
                showCloseAllUserSessionsDialog: action.shouldShow
            });

        case ActionTypes.CLOSE_OTHER_SOCKETS:
            return Object.assign({}, state, {
                showAnotherPageOpenedModal: action.shouldShow
            });

        default:
            return state;
    }
}
