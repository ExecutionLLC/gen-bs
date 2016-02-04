import * as ActionTypes from '../actions/variantsTable'

export default function variantsTable(
  state = {
    searchInResultsParams: {}
  }, action) {
  switch (action.type) {

    case ActionTypes.INIT_SEARCH_IN_RESULTS_PARAMS:
      return Object.assign({}, state, {
        searchInResultsParams: action.searchInResultsParams
      })

    case ActionTypes.FILTER_VARIANTS:
      const filterItemIndex = _.find(state.searchInResultsParams.search, {field_id: action.fieldId} )
      return Object.assign({}, state, {
        searchInResultsParams: Object.assign({}, state.searchInResultsParams, {
          search: [
            ...state.searchInResultsParams.search.slice(0, filterItemIndex),
            {field_id: action.fieldId},
            ...state.searchInResultsParams.search.slice(filterItemIndex + 1),

          ] 
        })
      })

    case ActionTypes.REQUEST_VARIANTS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_VARIANTS:
      return Object.assign({}, state, {
        isFetching: false,
        variants: action.variants.map( (o, index) => Object.assign(o, {_fid: index, _selected: false}) ),
        filteredVariants: action.variants.map( (o, index) => Object.assign(o, {_fid: index, _selected: false}) ),
        lastUpdated: action.receivedAt
      })

    case ActionTypes.SORT_VARIANTS:
      return Object.assign({}, state, {
        filteredVariants: _.sortByOrder(action.variants, [action.columnKey], [action.sortOrder]),
        sortOrder: Object.assign({}, state.sortOrder, {
          [action.columnKey]: action.sortOrder
        })
      })

      /*
    case ActionTypes.FILTER_VARIANTS:
      return Object.assign({}, state, {
        filteredVariants: _.filter(action.variants, (o) => { return _.includes(o[action.columnKey].toString().toUpperCase(), action.filterValue.toUpperCase())}),
        columnFilters: Object.assign({}, state.filterValue, {
          [action.columnKey]: action.filterValue
        })
      })
      */

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
