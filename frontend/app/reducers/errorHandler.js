import * as ActionTypes from '../actions/errorHandler';

const initialState = {
    showErrorWindow: false,
    lastError: null
};

export default function errorHandler(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.HANDLE_ERROR: {
            return Object.assign({}, state, {
                showErrorWindow: action.error ? true : false,
                lastError: action.error
            });
        }
        case ActionTypes.LAST_ERROR_RESOLVED: {
            return Object.assign({}, state, {
                showErrorWindow: false,
                lastError: null
            });
        }
    }
    return state;
}
