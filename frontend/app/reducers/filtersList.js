import _ from 'lodash';
import * as ActionTypes from '../actions/filtersList';
import immutableArray from '../utils/immutableArray';

function reduceFilterListDeleteFilter(state, action) {
    const deletedFilterIndex = _.findIndex(state.filters, {id: action.filterId});
    if (deletedFilterIndex < 0) {
        return state;
    }
    const newSelectedFilterId = (state.selectedFilterId === action.filterId) ? state.filters[0].id : state.selectedFilterId;
    return Object.assign({}, state, {
        filters: immutableArray.remove(state.filters, deletedFilterIndex),
        selectedFilterId: newSelectedFilterId
    });
}

function reduceFilterListEditFilter(state, action) {
    const editFilterIndex = _.findIndex(state.filters, {id: action.filterId});
    if (editFilterIndex < 0) {
        return state;
    }
    const updatedSelectedFilterId = (state.selectedFilterId === action.filterId) ? action.filter.id : state.selectedFilterId;
    return Object.assign({}, state, {
        filters: immutableArray.replace(state.filters, editFilterIndex, action.filter),
        selectedFilterId: updatedSelectedFilterId
    });
}

export default function filtersList(state = {
    filters: [],
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
            return Object.assign({}, state, {
                filters: action.filters
            });
        case ActionTypes.FILTERS_LIST_SELECT_FILTER:
            return Object.assign({}, state, {
                selectedFilterId: action.filterId
            });
        case ActionTypes.FILTERS_LIST_ADD_FILTER:
            return Object.assign({}, state, {
                filters: immutableArray.append(state.filters, action.filter)
            });
        case ActionTypes.FILTERS_LIST_DELETE_FILTER:
            return reduceFilterListDeleteFilter(state, action);
        case ActionTypes.FILTERS_LIST_EDIT_FILTER:
            return reduceFilterListEditFilter(state, action);
        default:
            return state;
    }
}