import * as ActionTypes from '../actions/errorHandler'

export default function errorHandler(
    state = {
        errorQueue: []
    },
    action
) {
    switch (action.type) {
        case ActionTypes.HANDLE_ERROR: {
            // add new error to the end of the queue
            const updatedQueue = [...state.errorQueue, action.error || []];
            return Object.assign({}, state, {
                errorQueue: updatedQueue
            });
        }
        case ActionTypes.LAST_ERROR_RESOLVED: {
            // remove last error
            const updatedQueue = state.errorQueue.slice().shift();
            return Object.assign({}, state, {
                errorQueue: updatedQueue
            });
        }
    }
    return state;
}
