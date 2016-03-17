import * as ActionTypes from '../actions/variantsTable'

export default function variantsTable(
  state = {
    operationId: null,
    searchInResultsParams: {
      search: [],
      sort: [],
      limit: 100,
      offset: 0,
      top_search: ''
    },
    scrollPos: 0,
    isNextDataLoading: false,
    isFilteringOrSorting: false,

  }, action) {
  switch (action.type) {


    case ActionTypes.CLEAR_SEARCH_PARAMS:
      return Object.assign({}, state, {
        searchInResultsParams: {
          sort: [],
          search: [],
          limit: 100,
          offset: 0,
          top_search: ''
        }
      })

    case ActionTypes.INIT_SEARCH_IN_RESULTS_PARAMS:
      return Object.assign({}, state, {
        searchInResultsParams: action.searchInResultsParams
      })

    case ActionTypes.CHANGE_VARIANTS_LIMIT:
      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          offset: state.searchInResultsParams.offset + state.searchInResultsParams.limit
          //limit: state.searchInResultsParams.limit + 100
        })
      })

    case ActionTypes.CHANGE_VARIANTS_FILTER:
      var searchArray = [...state.searchInResultsParams.search]
      const fieldIndex = _.findIndex(state.searchInResultsParams.search, {field_id: action.fieldId})

      if (action.filterValue !== '') {
        if (fieldIndex !== -1) {
          searchArray = state.searchInResultsParams.search.map(e => e.field_id !== action.fieldId ? e : {field_id: action.fieldId, value: action.filterValue} )
        } else {
          searchArray.push({field_id: action.fieldId, value: action.filterValue })
        }
      } else {
        searchArray.splice(fieldIndex,1)
      }

      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          search: searchArray,
          limit: 100,
          offset: 0
        })
      })

    case ActionTypes.CHANGE_VARIANTS_SORT:
      var sortArray = [...state.searchInResultsParams.sort]
      const sortFieldIndex = _.findIndex(state.searchInResultsParams.sort, {field_id: action.fieldId})

      // Disable sort if we click on sorted element.
      if (sortFieldIndex !== -1 && sortArray[sortFieldIndex].direction === action.sortDirection) {
        sortArray = [
          ...sortArray.slice(0, sortFieldIndex),
          ...sortArray.slice(sortFieldIndex + 1)
        ]
        sortArray = sortArray.length === 0 ? [] : [Object.assign({}, sortArray[0], {order: 1})]
      } else if (sortFieldIndex !== -1 && sortArray[sortFieldIndex].direction !== action.sortDirection) {
        sortArray = [
          ...sortArray.slice(0, sortFieldIndex),
          Object.assign({}, sortArray[sortFieldIndex], {direction: action.sortDirection}),
          ...sortArray.slice(sortFieldIndex + 1)
        ]
      } else {
        // if click without Ctrl just replace sort with new item
        if (action.sortOrder === 1) {
          sortArray = [{field_id: action.fieldId, order: action.sortOrder, direction: action.sortDirection }]
        } else if (action.sortOrder === 2) { // Ctrl click
          // Delete previous element with sortOrder: 2
          if (sortArray.length === 2) {
            sortArray.pop()
          }
          sortArray.push({field_id: action.fieldId, order: action.sortOrder, direction: action.sortDirection })
        }
      }

      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          sort: sortArray,
          limit: 100,
          offset: 0
        })
      })

    case ActionTypes.REQUEST_VARIANTS:
      return Object.assign({}, state, {
        isFetching: true
      });

    case ActionTypes.RECEIVE_VARIANTS:
      return Object.assign({}, state, {
        isFetching: false,
        operationId: action.operationId,
        lastUpdated: action.receivedAt
      });

    case ActionTypes.REQUEST_SEARCHED_RESULTS:
      return Object.assign({}, state, {
        isNextDataLoading: action.isNextDataLoading,
        isFilteringOrSorting: action.isFilteringOrSorting,
        isFetching: true
      })

    case ActionTypes.RECEIVE_SEARCHED_RESULTS:
      return Object.assign({}, state, {
        isNextDataLoading: false,
        isFilteringOrSorting: false,
        isFetching: false,
        lastUpdated: action.receivedAt
      })

    case ActionTypes.SELECT_VARIANTS_ROW:
      return Object.assign({}, state, {
        clickedRow: { _fid: action.rowId },
        filteredVariants: state.filteredVariants.map( (o) => {
          if(action.rowId == o._fid) {
            o._selected = !o._selected
          }
          return o;
        })
      });

    default:
      return state
  }
}
