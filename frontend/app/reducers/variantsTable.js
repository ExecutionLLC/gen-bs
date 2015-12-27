import * as ActionTypes from '../actions'

export default function variantsTable(state = {}, action) {
  switch (action.type) {

    case ActionTypes.REQUEST_VARIANTS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_VARIANTS:
      return Object.assign({}, state, {
        isFetching: false,
        variants: action.variants,
        filteredVariants: action.variants,
        lastUpdated: action.receivedAt
      })

    case ActionTypes.SORT_VARIANTS:
      return Object.assign({}, state, {
        filteredVariants: _.sortByOrder(action.variants, [action.columnKey], [action.sortOrder]),
        sortOrder: Object.assign({}, state.sortOrder, {
          [action.columnKey]: action.sortOrder
        })
      })

    case ActionTypes.FILTER_VARIANTS:
      return Object.assign({}, state, {
        filteredVariants: _.filter(action.variants, (o) => { return _.includes(o[action.columnKey].toString().toUpperCase(), action.filterValue.toUpperCase())}),
        columnFilters: Object.assign({}, state.filterValue, {
          [action.columnKey]: action.filterValue
        })
      })

    default:
      return state
  }
}
