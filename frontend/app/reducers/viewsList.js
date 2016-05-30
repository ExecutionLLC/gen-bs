import * as ActionTypes from '../actions/viewsList';
import {ImmutableHashedArray} from '../utils/immutable';

function reduceViewListDeleteView(state, action) {
    const newHashedArray = ImmutableHashedArray.deleteItemId(state.hashedArray, action.viewId);
    if (!newHashedArray) {
        return state;
    }
    const newSelectedViewId = (state.selectedViewId === action.viewId) ? state.hashedArray.array[0].id : state.selectedViewId;
    return Object.assign({}, state, {
        selectedViewId: newSelectedViewId,
        hashedArray: newHashedArray
    });
}

function reduceViewListEditView(state, action) {
    const newHashedArray = ImmutableHashedArray.replaceItemId(state.hashedArray, action.viewId, action.view);
    if (!newHashedArray) {
        return state;
    }
    const updatedSelectedViewId = (state.selectedViewId === action.viewId) ? action.view.id : state.selectedViewId;
    return Object.assign({}, state, {
        hashedArray: newHashedArray,
        selectedViewId: updatedSelectedViewId
    });
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
            return Object.assign({}, state, {
                hashedArray: ImmutableHashedArray.makeFromArray(action.views)
            });
        case ActionTypes.VIEWS_LIST_SELECT_VIEW:
            return Object.assign({}, state, {
                selectedViewId: action.viewId
            });
        case ActionTypes.VIEWS_LIST_ADD_VIEW:
            return Object.assign({}, state, {
                hashedArray: ImmutableHashedArray.appendItem(state.hashedArray, action.view)
            });
        case ActionTypes.VIEWS_LIST_DELETE_VIEW:
            return reduceViewListDeleteView(state, action);
        case ActionTypes.VIEWS_LIST_EDIT_VIEW:
            return reduceViewListEditView(state, action);
        default:
            return state;
    }
}
