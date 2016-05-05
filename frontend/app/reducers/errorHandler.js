import * as ActionTypes from '../actions/errorHandler'

export default function errorHandler(state = {
    showErrorWindow: false,
    lastError: null
},
                                     action) {
    switch (action.type) {
        case ActionTypes.HANDLE_ERROR:
        {
            return Object.assign({}, state, {
                showErrorWindow: action.error ? true : false,
                lastError: action.error
            });
        }
        case ActionTypes.LAST_ERROR_RESOLVED:
        {
            return Object.assign({}, state, {
                showErrorWindow: false,
                lastError: null
            });
        }
    }
    return state;
}
