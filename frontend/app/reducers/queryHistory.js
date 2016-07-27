import _ from 'lodash';

import  * as ActionTypes from '../actions/queryHistory';
import immutableArray from '../utils/immutableArray';
import {ImmutableHash} from '../utils/immutable';
import HistoryItemUtils from '../utils/HistoryItemUtils';

const initialState = {
    history: [],
    filter: '',
    isReceivedAll: false,
    showQueryHistoryModal: false,
    newHistoryItem: null,
    editingHistory: {}
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

function reduceStartQueryHistoryEdit(state, action) {
    const {historyItemId} = action;
    const {history, editingHistory} = state;
    const historyItem = historyItemId && _.find(history, {id: historyItemId});
    const historyItemConverted = historyItem && HistoryItemUtils.makeHistoryItem(historyItem);
    const newEditingHistory = editingHistory[historyItemId] ?
        ImmutableHash.replace(editingHistory, historyItemId, historyItemConverted) :
        ImmutableHash.add(editingHistory, historyItemId, historyItemConverted);
    return {
        ...state,
        editingHistory: newEditingHistory
    };
}

function reduceCancelQueryHistoryEdit(state, action) {
    const {historyItemId} = action;
    if (!historyItemId) {
        return {
            ...state,
            newHistoryItem: null
        };
    }
    const {editingHistory} = state;
    const newEditingHistory = editingHistory[historyItemId] ?
        ImmutableHash.remove(editingHistory, historyItemId) :
        editingHistory;
    return {
        ...state,
        editingHistory: newEditingHistory
    };
}

function reduceEditQueryHistoryItem(state, action) {
    const {historyItemId, samplesList, filtersList, viewsList, modelsList, changeItem, defaultHistoryItem} = action;
    const {newHistoryItem, editingHistory} = state;
    const editingHistoryItem = historyItemId && editingHistory[historyItemId];
    if (editingHistoryItem) {
        const editedHistoryItem = HistoryItemUtils.changeHistoryItem(editingHistoryItem, samplesList, filtersList, viewsList, modelsList, changeItem);
        const newEditingHistory = ImmutableHash.replace(editingHistory, historyItemId, editedHistoryItem);
        return {
            ...state,
            editingHistory: newEditingHistory
        };
    } else {
        return {
            ...state,
            newHistoryItem: HistoryItemUtils.changeHistoryItem(newHistoryItem || defaultHistoryItem, samplesList, filtersList, viewsList, modelsList, changeItem)
        };
    }
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
        case ActionTypes.START_QUERY_HISTORY_EDIT:
            return reduceStartQueryHistoryEdit(state, action);
        case ActionTypes.EDIT_QUERY_HISTORY_ITEM:
            return reduceEditQueryHistoryItem(state, action);
        case ActionTypes.CANCEL_QUERY_HISTORY_EDIT:
            return reduceCancelQueryHistoryEdit(state, action);
        case ActionTypes.SHOW_QUERY_HISTORY_MODAL:
            return reduceShowQueryHistoryModal(state);
        case ActionTypes.CLOSE_QUERY_HISTORY_MODAL:
            return reduceCloseQueryHistoryModal(state);
    }
    return state;
}
