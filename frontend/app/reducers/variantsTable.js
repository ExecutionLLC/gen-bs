import * as ActionTypes from '../actions/variantsTable'

export default function variantsTable(
  state = {
    operationId: null,
    searchInResultsParams: {}
  }, action) {
  switch (action.type) {

    case ActionTypes.INIT_SEARCH_IN_RESULTS_PARAMS:
      return Object.assign({}, state, {
        searchInResultsParams: action.searchInResultsParams
      })

    case ActionTypes.CHANGE_VARIANTS_FILTER:
      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          search: state.searchInResultsParams.search.map(e => e.field_id !== action.fieldId ? e : {field_id: action.fieldId, value: action.filterValue} )
        })
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
