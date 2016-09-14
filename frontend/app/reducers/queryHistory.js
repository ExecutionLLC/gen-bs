import _ from 'lodash';

import  * as ActionTypes from '../actions/queryHistory';
import immutableArray from '../utils/immutableArray';
import * as HistoryItemUtils from '../utils/HistoryItemUtils';


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
    search: '',
    isReceivedAll: false,
    newHistoryItem: null,
    currentHistoryId: null,
    loadingHistoryData: false,
    isRequesting: false
};

function reduceSetCurrentQueryHistoryId(state, action) {
    const {history, newHistoryItem} = state;
    return {
        ...state,
        currentHistoryId: ensureHistoryId(history, action.id, !!newHistoryItem)
    };
}

function reduceReceiveQueryHistory(state, action) {
    const history = action.history || initialState.history;
    const {currentHistoryId, newHistoryItem} = state;
    return Object.assign({}, state, {
        history: history,
        isReceivedAll: false,
        search: '',
        currentHistoryId: ensureHistoryId(history, currentHistoryId, !!newHistoryItem)
    });
}

function reduceReceiveInitialQueryHistory(state, action) {
    const history = action.history || initialState.history;
    const {currentHistoryId, newHistoryItem} = state;
    return Object.assign({}, state, {
        initialHistory: history,
        history: history,
        isReceivedAll: false,
        search: '',
        currentHistoryId: ensureHistoryId(history, currentHistoryId, !!newHistoryItem)
    });
}

function reducePrepareQueryHistoryToSearch(state, action) {
    return {
        ...state,
        search: action.search,
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
    const {history, currentHistoryId} = state;
    if (!history.length) {
        return state;
    } else {
        return {
            ...state,
            newHistoryItem: null,
            currentHistoryId: ensureHistoryId(history, currentHistoryId, false)
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
    const {samplesList, modelsList, changeItem, isDemo} = action;
    const {newHistoryItem} = state;
    if (!newHistoryItem) {
        return state;
    } else {
        return {
            ...state,
            newHistoryItem: HistoryItemUtils.changeHistoryItem(newHistoryItem, samplesList, modelsList, isDemo, changeItem)
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
    const {history, search} = state;
    // Check if data received for actual state
    // Seems like crutch, need to think about consistency
    if (action.search !== search || action.requestFrom !== history.length) {
        return state;
    } else {
        return {
            ...state,
            history: immutableArray.concat(history, action.history),
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
        case ActionTypes.PREPARE_QUERY_HISTORY_TO_SEARCH:
            return reducePrepareQueryHistoryToSearch(state, action);
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
