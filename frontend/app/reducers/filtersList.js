import * as ActionTypes from '../actions/filtersList'

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
                filters: [
                    ...state.filters,
                    action.filter
                ]
            });
        case ActionTypes.FILTERS_LIST_DELETE_FILTER:
            const deletedFilterIndex = state.filters.findIndex( (filter) => filter.id === action.filterId );
            const newFiltersArray = [
                ...state.filters.slice(0, deletedFilterIndex),
                ...state.filters.slice(deletedFilterIndex + 1)
            ];
            const newSelectedFilterId = (state.selectedFilterId === action.filterId) ? state.filters[0].id : state.selectedFilterId;
            return Object.assign({}, state, {
                filters: newFiltersArray,
                selectedFilterId: newSelectedFilterId
            });
        default:
            return state;
    }
}