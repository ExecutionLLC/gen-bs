import * as _ from 'lodash';
import * as ActionTypes from '../actions/filtersList';
import {ImmutableHashedArray} from '../utils/immutable';
import {entityType} from '../utils/entityTypes';

function reduceFilterListDeleteFilter(state, action) {
    const newHashedArray = ImmutableHashedArray.deleteItemId(state.hashedArray, action.filterId);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceFilterListEditFilter(state, action) {
    const newHashedArray = ImmutableHashedArray.replaceItemId(state.hashedArray, action.filterId, action.filter);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceFilterListAddFilter(state, action) {
    return Object.assign({}, state, {
        hashedArray: ImmutableHashedArray.appendItem(state.hashedArray, action.filter)
    });
}

function reduceFilterListReceive(state, action) {
    const newHashedArray = ImmutableHashedArray.makeFromArray(action.filters);
    return Object.assign({}, state, {
        hashedArray: newHashedArray
    });
}

function reduceFilterListSetHistoryFilter(state, action) {
    const {filter} = action;
    const {hashedArray} = state;
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
    return {
        ...state,
        hashedArray: filtersHashedArrayWNewHistory
    };
}


export default function filtersList(state = {
    hashedArray: ImmutableHashedArray.makeFromArray([]),
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
            return state; // FIXME rid of FILTERS_LIST_SELECT_FILTER
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
