import * as ActionTypes from '../actions/variantsTable'

const initialState = {
    operationId: null,
    searchInResultsParams: {
        search: [],
        sort: [],
        limit: 100,
        offset: 0,
        topSearch: {
            filter: '',
            excludedFields: []
        }
    },
    scrollPos: 0,
    needUpdate: false,
    isNextDataLoading: false,
    isFilteringOrSorting: false,
    selectedRowIndices: []
};

export default function variantsTable(state = initialState, action) {
    switch (action.type) {

        case ActionTypes.CLEAR_SEARCH_PARAMS:
        {
            return Object.assign({}, state, {
                searchInResultsParams: {
                    sort: [],
                    search: [],
                    limit: 100,
                    offset: 0,
                    topSearch: {
                        filter: '',
                        excludedFields: []
                    }
                }
            });
        }
        case ActionTypes.SET_EXCLUDED_FIELDS:
        {
            return Object.assign({}, state, {
                searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
                    topSearch: {
                        filter: state.searchInResultsParams.topSearch.filter,
                        excludedFields: action.excludedFields
                    }
                })
            });
        }

        case ActionTypes.INIT_SEARCH_IN_RESULTS_PARAMS:
        {
            return Object.assign({}, state, {
                searchInResultsParams: action.searchInResultsParams
            });
        }
        case ActionTypes.CHANGE_VARIANTS_LIMIT:
        {
            return Object.assign({}, state, {
                searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
                    offset: state.searchInResultsParams.offset + state.searchInResultsParams.limit
                })
            });
        }
        case ActionTypes.CHANGE_VARIANTS_GLOBAL_FILTER:
        {
            const currentGlobalSearchString = state.searchInResultsParams.topSearch.filter;
            if (currentGlobalSearchString === action.globalSearchString) {
                return state;
            }
            return Object.assign({}, state, {
                searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
                    topSearch: {
                        filter: action.globalSearchString,
                        excludedFields: state.searchInResultsParams.topSearch.excludedFields
                    },
                    limit: 100,
                    offset: 0
                }),
                needUpdate: true
            });
        }
        case ActionTypes.SET_FIELD_FILTER:
        {
            // copy search array
            var searchArray = [...state.searchInResultsParams.search];
            const fieldIndex = _.findIndex(searchArray, {fieldId: action.fieldId});

            if (action.filterValue !== '') {
                if (fieldIndex !== -1) {
                    const currentFilterValue = searchArray[fieldIndex].value;
                    if (currentFilterValue === action.filterValue) {
                        // filter value is the same
                        return state;
                    }
                    // update current filter
                    searchArray[fieldIndex].value = action.filterValue;
                } else {
                    // it is new filter
                    searchArray.push({fieldId: action.fieldId, value: action.filterValue});
                }
            } else {
                // filter value is empty, so we should remove filter
                searchArray.splice(fieldIndex, 1);
            }

            return Object.assign({}, state, {
                searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
                    search: searchArray,
                    limit: 100,
                    offset: 0
                }),
                needUpdate: true
            });
        }
        case ActionTypes.CHANGE_VARIANTS_SORT:
        {
            // copy sort array
            var sortArray = [...state.searchInResultsParams.sort];
            var fieldIndex = _.findIndex(sortArray, {fieldId: action.fieldId});

            if (fieldIndex === -1) {
                // it is new column for sorting
                const newItem = {fieldId: action.fieldId, direction: action.sortDirection};
                if (sortArray.length < action.sortOrder) {
                    // put new item to the end of array
                    fieldIndex = sortArray.length;
                } else {
                    // replace existent item, which has the same order
                    fieldIndex = action.sortOrder - 1;
                    // remove sorting with higer order
                    // NOTE: if you want to save state of the sorting with higher order, then
                    // just remove next line  
                    sortArray = sortArray.slice(0, fieldIndex);
                }
                sortArray[fieldIndex] = newItem;
            } else {
                // user clicked on the column and want to remove sorting or change direction
                // NOTE: we do not allow to change order of the existent items, because it
                // is clashed with change direction, remove sorting logic
                if (sortArray[fieldIndex].direction !== action.sortDirection) {
                    // user want to change sort direction
                    sortArray[fieldIndex].direction = action.sortDirection;
                } else {
                    // user want to remove sorting
                    if (sortArray.length === 1) {
                        // we do not allow remove all sorting
                        return state;
                    }
                    sortArray.splice(fieldIndex, 1);
                }
            }
            // update sort order parameter
            // NOTE: actually I don't understand why we hold order in attribute of the obj
            // (our array already hold order as index)
            for (var i = 0; i < sortArray.length; i++) {
                sortArray[i].order = i + 1;
            }

            return Object.assign({}, state, {
                searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
                    sort: sortArray,
                    limit: 100,
                    offset: 0
                }),
                needUpdate: true
            });
        }
        case ActionTypes.REQUEST_VARIANTS:
        {
            return Object.assign({}, state, {
                isFetching: true
            });
        }
        case ActionTypes.RECEIVE_ANALYSIS_OPERATION_ID:
        {
            return Object.assign({}, state, {
                isFetching: false,
                operationId: action.operationId,
                lastUpdated: action.receivedAt
            });
        }

        case ActionTypes.REQUEST_SEARCHED_RESULTS:
        {
            return Object.assign({}, state, {
                isNextDataLoading: action.isNextDataLoading,
                isFilteringOrSorting: action.isFilteringOrSorting,
                isFetching: true,
                needUpdate: false
            });
        }
        case ActionTypes.RECEIVE_SEARCHED_RESULTS:
        {
            return Object.assign({}, state, {
                isNextDataLoading: false,
                isFilteringOrSorting: false,
                isFetching: false,
                lastUpdated: action.receivedAt
            });
        }
        case ActionTypes.SELECT_VARIANTS_ROW:
        {
            const {rowIndex, isSelected} = action;
            const {selectedRowIndices} = state;
            let newSelectedRowIndices;
            if (isSelected) {
                newSelectedRowIndices = selectedRowIndices.concat([rowIndex]);
            } else {
                newSelectedRowIndices = _.filter(selectedRowIndices, item => item !== rowIndex);
            }

            return Object.assign({}, state, {
                selectedRowIndices: newSelectedRowIndices
            });
        }

        case ActionTypes.CLEAR_VARIANTS_ROWS_SELECTION:
        {
            return Object.assign({}, state, {
                selectedRowIndices: initialState.selectedRowIndices
            });
        }

        default:
            return state;
    }
}
