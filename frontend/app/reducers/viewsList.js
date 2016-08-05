import * as _ from 'lodash';
import * as ActionTypes from '../actions/viewsList';
import {ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

function reduceViewListDeleteView(state, action) {
    const newHashedArray = ImmutableHashedArray.deleteItemId(state.hashedArray, action.viewId);
    const newSelectedViewId = (state.selectedViewId === action.viewId) ? state.hashedArray.array[0].id : state.selectedViewId;
    return Object.assign({}, state, {
        selectedViewId: newSelectedViewId,
        hashedArray: newHashedArray
    });
}

function reduceViewListEditView(state, action) {
    const newHashedArray = ImmutableHashedArray.replaceItemId(state.hashedArray, action.viewId, action.view);
    const updatedSelectedViewId = (state.selectedViewId === action.viewId) ? action.view.id : state.selectedViewId;
    return Object.assign({}, state, {
        hashedArray: newHashedArray,
        selectedViewId: updatedSelectedViewId
    });
}

function reduceViewListAddView(state, action) {
    return Object.assign({}, state, {
        hashedArray: ImmutableHashedArray.appendItem(state.hashedArray, action.view)
    });
}

function reduceViewListReceive(state, action) {
    const newHashedArray = ImmutableHashedArray.makeFromArray(action.views);
    const newSelectedViewId = newHashedArray[state.selectedViewId] ? state.selectedViewId : newHashedArray.array[0].id;
    return Object.assign({}, state, {
        hashedArray: newHashedArray,
        selectedViewId: newSelectedViewId
    });
}

function reduceViewListSetHistoryView(state, action) {
    const {view} = action;
    const {hashedArray, selectedViewId} = state;
    const inListView = view && hashedArray.hash[view.id];
    const isViewInListWOHistory = inListView && inListView.type !== entityType.HISTORY;
    const isNeedToSet = view && !isViewInListWOHistory;
    const viewsArrayHistoryParted = _.partition(hashedArray.array, {type: entityType.HISTORY});
    const viewsArrayWOHistory = viewsArrayHistoryParted[0].length ? viewsArrayHistoryParted[1] : hashedArray.array;
    if (viewsArrayWOHistory === hashedArray.array && !isNeedToSet) {
        return state;
    }
    const viewToSet = isNeedToSet && {
        ...view,
        type: 'history'
    };
    const viewsArrayWNewHistory = isNeedToSet ? [viewToSet, ...viewsArrayWOHistory] : viewsArrayWOHistory;
    const viewsHashedArrayWNewHistory = ImmutableHashedArray.makeFromArray(viewsArrayWNewHistory);
    const newSelectedViewId = viewsHashedArrayWNewHistory.hash[selectedViewId] ? selectedViewId : viewsHashedArrayWNewHistory.array[0] && viewsHashedArrayWNewHistory.array[0].id || null;
    return {
        ...state,
        hashedArray: viewsHashedArrayWNewHistory,
        selectedViewId: newSelectedViewId
    };
}

export default function viewsList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
    selectedViewId: null,
    isServerOperation: false
}, action) {

    switch (action.type) {
        case ActionTypes.VIEWS_LIST_START_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: true
            });
        case ActionTypes.VIEWS_LIST_END_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: false
            });
        case ActionTypes.VIEWS_LIST_RECEIVE:
            return reduceViewListReceive(state, action);
        case ActionTypes.VIEWS_LIST_SELECT_VIEW:
            return Object.assign({}, state, {
                selectedViewId: action.viewId
            });
        case ActionTypes.VIEWS_LIST_ADD_VIEW:
            return reduceViewListAddView(state, action);
        case ActionTypes.VIEWS_LIST_DELETE_VIEW:
            return reduceViewListDeleteView(state, action);
        case ActionTypes.VIEWS_LIST_EDIT_VIEW:
            return reduceViewListEditView(state, action);
        case ActionTypes.VIEWS_LIST_SET_HISTORY_VIEW:
            return reduceViewListSetHistoryView(state, action);
        default:
            return state;
    }
}
