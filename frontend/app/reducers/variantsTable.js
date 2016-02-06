import * as ActionTypes from '../actions/variantsTable'

export default function variantsTable(
  state = {
    operationId: null,
    searchInResultsParams: {
      search: [],
      sort: [],
      limit: 100,
      offset: 0,
      top_search: 'PASS'
    }
  }, action) {
  switch (action.type) {

    case ActionTypes.INIT_SEARCH_IN_RESULTS_PARAMS:
      return Object.assign({}, state, {
        searchInResultsParams: action.searchInResultsParams
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
          search: searchArray })
      })

    case ActionTypes.CHANGE_VARIANTS_SORT:
      var sortArray = [...state.searchInResultsParams.search]
      const sortFieldIndex = _.findIndex(state.searchInResultsParams.sort, {field_id: action.fieldId})

      if (action.filterValue !== '') {
        if (sortFieldIndex !== -1) {
          sortArray = state.searchInResultsParams.sort.map(e => e.field_id !== action.fieldId ? e : {field_id: action.fieldId, sort_order: action.sortOrder, sort_direction: action.sortDirection} )
        } else {
          sortArray.push({field_id: action.fieldId, sort_order: action.sortOrder, sort_direction: action.sortDirection })
        }
      } else {
        sortArray.splice(fieldIndex,1)
      }

      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          sort: sortArray })
      })

    case ActionTypes.REQUEST_VARIANTS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_VARIANTS:
      return Object.assign({}, state, {
        isFetching: false,
        operationId: action.operationId,
        lastUpdated: action.receivedAt
      })

    case ActionTypes.REQUEST_SEARCHED_RESULTS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_SEARCHED_RESULTS:
      return Object.assign({}, state, {
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
      })

    default:
      return state
  }
}
