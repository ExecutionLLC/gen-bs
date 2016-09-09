import _ from 'lodash';

import  * as ActionTypes from '../actions/queryHistory';
import immutableArray from '../utils/immutableArray';
import HistoryItemUtils from '../utils/HistoryItemUtils';


function ensureHistoryId(history, id, hasNewHistoryItem) {
    if (_.find(history, {id}))
        return id;
    if (hasNewHistoryItem)
        return null;
    if (history[0])
        return history[0].id;
    return null;
}


const initialState = {
    initialHistory: [],
    history: [],
    filter: '', // TODO rename
    isReceivedAll: false,
    newHistoryItem: null,
    currentHistoryId: null,
    loadingHistoryData: false,
    isRequesting: false
};

function reduceSetCurrentQueryHistoryId(state, action) {
    return {
        ...state,
        currentHistoryId: ensureHistoryId(state.history, action.id, !!state.newHistoryItem)
    };
}

function reduceReceiveQueryHistory(state, action) {
    const history = action.history || initialState.history;
    return Object.assign({}, state, {
        history: history,
        isReceivedAll: false,
        filter: '', // TODO rename
        currentHistoryId: ensureHistoryId(history, state.currentHistoryId, !!state.newHistoryItem)
    });
}

function reduceReceiveInitialQueryHistory(state, action) {
    const history = action.history || initialState.history;
    return Object.assign({}, state, {
        initialHistory: history,
        history: history,
        isReceivedAll: false,
        filter: '', // TODO rename
        currentHistoryId: ensureHistoryId(history, state.currentHistoryId, !!state.newHistoryItem)
    });
}

function reducePrepareQueryHistoryToFilter(state, action) {
    return {
        ...state,
        filter: action.filter, // TODO rename
        isReceivedAll: false,
        isRequesting: false,
        history: [],
        currentHistoryId: null
    };
}

function reduceDuplicateQueryHistoryItem(state, action) {
    const {historyItem} = action;
    return {
        ...state,
        newHistoryItem: HistoryItemUtils.makeHistoryItem(historyItem),
        currentHistoryId: null
    };
}

function reduceCancelQueryHistoryEdit(state) {
    if (!state.history.length) {
        return state;
    } else {
        return {
            ...state,
            newHistoryItem: null,
            currentHistoryId: ensureHistoryId(state.history, state.currentHistoryId, false)
        };
    }
}

function reduceEditExistentHistoryItem(state, action) {
    const {history} = state;
    const {historyItem} = action;
    const index = _.findIndex(history, {id: historyItem.id});
    if (index < 0) {
        return state;
    }
    return {
        ...state,
        history: immutableArray.replace(state.history, index, historyItem)
    };
}

function reduceEditQueryHistoryItem(state, action) {
    const {samplesList, filtersList, viewsList, modelsList, changeItem, isDemo} = action;
    const {newHistoryItem} = state;
    if (!newHistoryItem) {
        return state;
    } else {
        return {
            ...state,
            newHistoryItem: HistoryItemUtils.changeHistoryItem(newHistoryItem, samplesList, filtersList, viewsList, modelsList, isDemo, changeItem)
        };
    }
}

function reduceDeleteQueryHistoryItem(state, action) {
    const {historyItemId, newHistoryItem} = action;
    const {history, currentHistoryId} = state;
    const historyItemIndex = _.findIndex(history, {id: historyItemId});
    if (historyItemIndex < 0) {
        return state;
    }
    const historyItem = history[historyItemIndex];
    var newHistoryItemIndex;
    if (currentHistoryId === historyItemId) {
        newHistoryItemIndex = historyItemIndex >= history.length - 1 ? historyItemIndex - 1 : historyItemIndex;
    } else {
        newHistoryItemIndex = historyItemIndex;
    }
    const nowHistory = immutableArray.remove(history, historyItemIndex);
    const nowHistoryItem = newHistoryItemIndex < 0 ? null : nowHistory[newHistoryItemIndex];
    const nowHistoryItemId = nowHistoryItem ? nowHistoryItem.id : null;
    const newNewHistoryItem = newHistoryItem || nowHistory.length ? newHistoryItem : HistoryItemUtils.makeHistoryItem(historyItem);
    return {
        ...state,
        history: nowHistory,
        currentHistoryId: nowHistoryItemId,
        newHistoryItem: newNewHistoryItem
    };
}

function reduceRequestQueryHistory(state) {
    return {
        ...state,
        isRequesting: true
    };
}

function reduceSetEditedQueryHistory(state, action) {
    return {
        ...state,
        newHistoryItem: null,
        currentHistoryId: action.newHistoryItem.id,
        history: [action.newHistoryItem, ...state.history]
    };
}

function reduceAppendQueryHistory(state, action) {
    // Check if data received for actual state
    // Seems like crutch, need to think about consistency
    if (action.filter !== state.filter || action.requestFrom !== state.history.length) { // TODO rename
        return state;
    } else {
        return {
            ...state,
            history: immutableArray.concat(state.history, action.history),
            isReceivedAll: action.isReceivedAll,
            isRequesting: false
        };
    }
}

function reduceToggleLoadingHistoryData(state, action) {
    return {
        ...state,
        loadingHistoryData: action.isLoading
    };
}

function reduceCreateNewHistoryItem(state, action) {
    const {sample, filter, view} = action;
    return {
        ...state,
        newHistoryItem: HistoryItemUtils.makeNewHistoryItem(sample, filter, view)
    };
}

export default function queryHistory(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.SET_CURRENT_QUERY_HISTORY_ID:
            return reduceSetCurrentQueryHistoryId(state, action);
        case ActionTypes.RECEIVE_QUERY_HISTORY:
            return reduceReceiveQueryHistory(state, action);
        case ActionTypes.RECEIVE_INITIAL_QUERY_HISTORY:
            return reduceReceiveInitialQueryHistory(state, action);
        case ActionTypes.REQUEST_QUERY_HISTORY:
            return reduceRequestQueryHistory(state, action);
        case ActionTypes.SET_EDITED_QUERY_HISTORY:
            return reduceSetEditedQueryHistory(state, action);
        case ActionTypes.APPEND_QUERY_HISTORY:
            return reduceAppendQueryHistory(state, action);
        case ActionTypes.PREPARE_QUERY_HISTORY_TO_FILTER:
            return reducePrepareQueryHistoryToFilter(state, action);
        case ActionTypes.DUPLICATE_QUERY_HISTORY_ITEM:
            return reduceDuplicateQueryHistoryItem(state, action);
        case ActionTypes.EDIT_QUERY_HISTORY_ITEM:
            return reduceEditQueryHistoryItem(state, action);
        case ActionTypes.DELETE_QUERY_HISTORY_ITEM:
            return reduceDeleteQueryHistoryItem(state, action);
        case ActionTypes.EDIT_EXISTENT_HISTORY_ITEM:
            return reduceEditExistentHistoryItem(state, action);
        case ActionTypes.CANCEL_QUERY_HISTORY_EDIT:
            return reduceCancelQueryHistoryEdit(state, action);
        case ActionTypes.TOGGLE_LOADING_HISTORY_DATA:
            return reduceToggleLoadingHistoryData(state, action);
        case ActionTypes.CREATE_NEW_HISTORY_ITEM:
            return reduceCreateNewHistoryItem(state, action);
    }
    return state;
}
