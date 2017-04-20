import * as ActionTypes from '../actions/auth';

export default function auth(state = {
    isFetching: false,
    isDemo: false,
    showAutoLogoutDialog: false,
    secondsToAutoLogout: null,
    errorMessage: null,
    showCloseAllUserSessionsDialog: false,
    showAnotherPageOpenedModal: false,
    isWaitingForCloseAnotherPageOpenedModal: false
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

        case ActionTypes.SET_AUTOLOGOUT_COUNTDOWN_TIMER: {
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

        case ActionTypes.SHOW_ANOTHER_PAGE_OPENED_MODAL:
            return {
                ...state,
                showAnotherPageOpenedModal: action.shouldShow,
                isWaitingForCloseAnotherPageOpenedModal: !action.shouldShow
            };

        case ActionTypes.SET_WAITING_FOR_CLOSE_ANOTHER_PAGE_OPENED_MODAL:
            return {
                ...state,
                isWaitingForCloseAnotherPageOpenedModal: true
            };

        default:
            return state;
    }
}
