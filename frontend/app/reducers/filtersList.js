import * as ActionTypes from '../actions/filtersList';
import {ImmutableHashedArray} from '../utils/immutable';

function reduceFilterListDeleteFilter(state, action) {
    const newHashedArray = ImmutableHashedArray.deleteItemId(state.hashedArray, action.filterId);
    const newSelectedFilterId = (state.selectedFilterId === action.filterId) ? state.hashedArray.array[0].id : state.selectedFilterId;
    return Object.assign({}, state, {
        selectedFilterId: newSelectedFilterId,
        hashedArray: newHashedArray
    });
}

function reduceFilterListEditFilter(state, action) {
    const newHashedArray = ImmutableHashedArray.replaceItemId(state.hashedArray, action.filterId, action.filter);
    if (!newHashedArray) {
        return state;
    }
    const updatedSelectedFilterId = (state.selectedFilterId === action.filterId) ? action.filter.id : state.selectedFilterId;
    return Object.assign({}, state, {
        hashedArray: newHashedArray,
        selectedFilterId: updatedSelectedFilterId
    });
}

function reduceFilterListAddFilter(state, action) {
    return Object.assign({}, state, {
        hashedArray: ImmutableHashedArray.appendItem(state.hashedArray, action.filter)
    });
}

function reduceFilterListReceive(state, action) {
    return Object.assign({}, state, {
        hashedArray: ImmutableHashedArray.makeFromArray(action.filters)
    });
}

export default function filtersList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
    selectedFilterId: null,
    isServerOperation: false
}, action) {

    switch (action.type) {
        case ActionTypes.FILTERS_LIST_START_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: true
            });
        case ActionTypes.FILTERS_LIST_END_SERVER_OPERATION:
            return Object.assign({}, state, {
                isServerOperation: false
            });
        case ActionTypes.FILTERS_LIST_RECEIVE:
            return reduceFilterListReceive(state, action);
        case ActionTypes.FILTERS_LIST_SELECT_FILTER:
            return Object.assign({}, state, {
                selectedFilterId: action.filterId
            });
        case ActionTypes.FILTERS_LIST_ADD_FILTER:
            return reduceFilterListAddFilter(state, action);
        case ActionTypes.FILTERS_LIST_DELETE_FILTER:
            return reduceFilterListDeleteFilter(state, action);
        case ActionTypes.FILTERS_LIST_EDIT_FILTER:
            return reduceFilterListEditFilter(state, action);
        default:
            return state;
    }
}
