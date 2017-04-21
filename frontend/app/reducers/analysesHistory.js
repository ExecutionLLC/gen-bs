import _ from 'lodash';

import  * as ActionTypes from '../actions/analysesHistory';
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

function reduceSetCurrentAnalysesHistoryId(state, action) {
    const {history, newHistoryItem} = state;
    return {
        ...state,
        currentHistoryId: ensureHistoryId(history, action.id, !!newHistoryItem)
    };
}

function reduceReceiveAnalysesHistory(state, action) {
    const history = action.history || initialState.history;
    const {currentHistoryId, newHistoryItem} = state;
    return Object.assign({}, state, {
        history: history,
        isReceivedAll: false,
        search: '',
        currentHistoryId: ensureHistoryId(history, currentHistoryId, !!newHistoryItem)
    });
}

function reduceReceiveInitialAnalysesHistory(state, action) {
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

function reducePrepareAnalysesHistoryToSearch(state, action) {
    return {
        ...state,
        search: action.search,
        isReceivedAll: false,
        isRequesting: false,
        history: [],
        currentHistoryId: null
    };
}

function reduceDuplicateAnalysesHistoryItem(state, action) {
    const {historyItem, newHistoryItemInfo, languageId} = action;
    return {
        ...state,
        newHistoryItem: HistoryItemUtils.makeHistoryItem(historyItem, newHistoryItemInfo, languageId),
        currentHistoryId: null
    };
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

function reduceEditAnalysesHistoryItem(state, action) {
    const {samplesList, modelsList, changeItem, isDemo, languageId} = action;
    const {newHistoryItem} = state;
    if (!newHistoryItem) {
        return state;
    } else {
        return {
            ...state,
            newHistoryItem: HistoryItemUtils.changeHistoryItem(newHistoryItem, samplesList, modelsList, isDemo, changeItem, languageId)
        };
    }
}

function reduceDeleteAnalysesHistoryItem(state, action) {
    const {historyItemId} = action;
    const {history, currentHistoryId} = state;
    const historyItemIndex = _.findIndex(history, {id: historyItemId});
    if (historyItemIndex < 0) {
        return state;
    }
    var newHistoryItemIndex;
    if (currentHistoryId === historyItemId) {
        newHistoryItemIndex = historyItemIndex >= history.length - 1 ? historyItemIndex - 1 : historyItemIndex;
    } else {
        newHistoryItemIndex = historyItemIndex;
    }
    const nowHistory = immutableArray.remove(history, historyItemIndex);
    const nowHistoryItem = newHistoryItemIndex < 0 ? null : nowHistory[newHistoryItemIndex];
    const nowHistoryItemId = nowHistoryItem ? nowHistoryItem.id : null;
    return {
        ...state,
        history: nowHistory,
        currentHistoryId: nowHistoryItemId
    };
}

function reduceRequestAnalysesHistory(state) {
    return {
        ...state,
        isRequesting: true
    };
}

function reduceSetEditedAnalysesHistory(state, action) {
    return {
        ...state,
        currentHistoryId: action.newHistoryItem.id,
        history: [action.newHistoryItem, ...state.history]
    };
}

function reduceAppendAnalysesHistory(state, action) {
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
    const {sample, filter, view, newHistoryItemInfo} = action;
    return {
        ...state,
        newHistoryItem: HistoryItemUtils.makeNewHistoryItem(sample, filter, view, newHistoryItemInfo)
    };
}

export default function analysesHistory(state = initialState, action) {
    switch (action.type) {
        case ActionTypes.SET_CURRENT_ANALYSES_HISTORY_ID:
            return reduceSetCurrentAnalysesHistoryId(state, action);
        case ActionTypes.RECEIVE_ANALYSES_HISTORY:
            return reduceReceiveAnalysesHistory(state, action);
        case ActionTypes.RECEIVE_INITIAL_ANALYSES_HISTORY:
            return reduceReceiveInitialAnalysesHistory(state, action);
        case ActionTypes.REQUEST_ANALYSES_HISTORY:
            return reduceRequestAnalysesHistory(state, action);
        case ActionTypes.SET_EDITED_ANALYSES_HISTORY:
            return reduceSetEditedAnalysesHistory(state, action);
        case ActionTypes.APPEND_ANALYSES_HISTORY:
            return reduceAppendAnalysesHistory(state, action);
        case ActionTypes.PREPARE_ANALYSES_HISTORY_TO_SEARCH:
            return reducePrepareAnalysesHistoryToSearch(state, action);
        case ActionTypes.DUPLICATE_ANALYSES_HISTORY_ITEM:
            return reduceDuplicateAnalysesHistoryItem(state, action);
        case ActionTypes.EDIT_ANALYSES_HISTORY_ITEM:
            return reduceEditAnalysesHistoryItem(state, action);
        case ActionTypes.DELETE_ANALYSES_HISTORY_ITEM:
            return reduceDeleteAnalysesHistoryItem(state, action);
        case ActionTypes.EDIT_EXISTENT_HISTORY_ITEM:
            return reduceEditExistentHistoryItem(state, action);
        case ActionTypes.TOGGLE_LOADING_HISTORY_DATA:
            return reduceToggleLoadingHistoryData(state, action);
        case ActionTypes.CREATE_NEW_HISTORY_ITEM:
            return reduceCreateNewHistoryItem(state, action);
    }
    return state;
}
