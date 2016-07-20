import  * as ActionTypes from '../actions/queryHistory';

const initialState = {
    history: [],
    showQueryHistoryModal: false
};

function reduceReceiveQueryHistory(state, action) {
    return Object.assign({}, state, {
        history: action.history || initialState.history
    });
}

function reduceShowQueryHistoryModal(state) {
    return Object.assign({}, state, {
        showQueryHistoryModal: true
    });
}

function reduceCloseQueryHistoryModal(state) {
    return Object.assign({}, state, {
        showQueryHistoryModal: false
    });
}

export default function queryHistory(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.RECEIVE_QUERY_HISTORY:
            return reduceReceiveQueryHistory(state, action);
        case ActionTypes.SHOW_QUERY_HISTORY_MODAL:
            return reduceShowQueryHistoryModal(state);
        case ActionTypes.CLOSE_QUERY_HISTORY_MODAL:
            return reduceCloseQueryHistoryModal(state);
    }
    return state;
}
