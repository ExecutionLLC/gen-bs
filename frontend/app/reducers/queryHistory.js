import  * as ActionTypes from '../actions/queryHistory';
import immutableArray from '../utils/immutableArray';

const initialState = {
    history: [],
    filter: '',
    isReceivedAll: false,
    showQueryHistoryModal: false
};

function reduceReceiveQueryHistory(state, action) {
    return Object.assign({}, state, {
        history: action.history || initialState.history,
        isReceivedAll: false,
        filter: ''
    });
}

function reducePrepareQueryHistoryToFilter(state, action) {
    return {
        ...state,
        filter: action.filter,
        isReceivedAll: false,
        history: []
    };
}

function reduceAppendQueryHistory(state, action) {
    // Check if data received for actual state
    // Seems like crutch, need to think about consistency
    if (action.filter !== state.filter || action.requestFrom !== state.history.length) {
        return state;
    } else {
        return {
            ...state,
            history: immutableArray.concat(state.history, action.history),
            isReceivedAll: action.isReceivedAll
        };
    }
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
        case ActionTypes.APPEND_QUERY_HISTORY:
            return reduceAppendQueryHistory(state, action);
        case ActionTypes.PREPARE_QUERY_HISTORY_TO_FILTER:
            return reducePrepareQueryHistoryToFilter(state, action);
        case ActionTypes.SHOW_QUERY_HISTORY_MODAL:
            return reduceShowQueryHistoryModal(state);
        case ActionTypes.CLOSE_QUERY_HISTORY_MODAL:
            return reduceCloseQueryHistoryModal(state);
    }
    return state;
}
