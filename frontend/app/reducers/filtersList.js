import * as _ from 'lodash';
import * as ActionTypes from '../actions/filtersList';
import {ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

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
    const newHashedArray = ImmutableHashedArray.makeFromArray(action.filters);
    const newSelectedFilterId = newHashedArray[state.selectedFilterId] ? state.selectedFilterId : newHashedArray.array[0].id;
    return Object.assign({}, state, {
        hashedArray: newHashedArray,
        selectedFilterId: newSelectedFilterId
    });
}

function reduceFilterListSetHistoryFilter(state, action) {
    const {filter} = action;
    const {hashedArray, selectedFilterId} = state;
    const inListFilter = filter && hashedArray.hash[filter.id];
    const isFilterInListWOHistory = inListFilter && inListFilter.type !== entityType.HISTORY;
    const isNeedToSet = filter && !isFilterInListWOHistory;
    const filtersArrayHistoryParted = _.partition(hashedArray.array, {type: entityType.HISTORY});
    const filtersArrayWOHistory = filtersArrayHistoryParted[0].length ? filtersArrayHistoryParted[1] : hashedArray.array;
    if (filtersArrayWOHistory === hashedArray.array && !isNeedToSet) {
        return state;
    }
    const filterToSet = isNeedToSet && {
            ...filter,
            type: 'history'
        };
    const filtersArrayWNewHistory = isNeedToSet ? [filterToSet, ...filtersArrayWOHistory] : filtersArrayWOHistory;
    const filtersHashedArrayWNewHistory = ImmutableHashedArray.makeFromArray(filtersArrayWNewHistory);
    const newSelectedFilterId = filtersHashedArrayWNewHistory.hash[selectedFilterId] ? selectedFilterId : filtersHashedArrayWNewHistory.array[0] && filtersHashedArrayWNewHistory.array[0].id || null;
    return {
        ...state,
        hashedArray: filtersHashedArrayWNewHistory,
        selectedFilterId: newSelectedFilterId
    };
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
        case ActionTypes.FILTERS_LIST_SET_HISTORY_FILTER:
            return reduceFilterListSetHistoryFilter(state, action);
        default:
            return state;
    }
}
