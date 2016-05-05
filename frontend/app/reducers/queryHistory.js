import  * as ActionTypes from '../actions/queryHistory'

const initialState = {
    history: [],
    showQueryHistoryModal: false
};

export default function queryHistory(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.RECEIVE_QUERY_HISTORY:
        {
            return Object.assign({}, state, {
                history: action.history || initialState.history
            });
        }
        case ActionTypes.SHOW_QUERY_HISTORY_MODAL:
        {
            return Object.assign({}, state, {
                showQueryHistoryModal: true
            });
        }
        case ActionTypes.CLOSE_QUERY_HISTORY_MODAL:
        {
            return Object.assign({}, state, {
                showQueryHistoryModal: false
            });
        }
    }
    return state;
}
