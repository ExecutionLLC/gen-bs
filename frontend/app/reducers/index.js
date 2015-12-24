import { combineReducers } from 'redux'
import * as ActionTypes from '../actions'

function samplesTable(state = {}, action) {
  switch (action.type) {

    // We don't mutate state here rows().data() method return table api instance with new rows 
    // See https://datatables.net/reference/api/rows().data()
    case ActionTypes.SET_COLUMN_FILTER:
        return state.column(action.columnId).search(action.filterValue).rows({search: 'applied'}).data()

    case ActionTypes.INITIALIZE_TABLE:
      return action.table

    default:
      return state
  }
}

function variantsTable(state = {}, action) {
  switch (action.type) {

    case ActionTypes.REQUEST_VARIANTS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_VARIANTS:
      return Object.assign({}, state, {
        isFetching: false,
        variants: action.variants,
        lastUpdated: action.receivedAt
      })

    case ActionTypes.SORT_VARIANTS:
      return Object.assign({}, state, {
        variants: action.variants
      })

    default:
      return state
  }
}

function exportFileType (state = ActionTypes.fileTypes.NONE, action) {
  switch (action.type) {
    case ActionTypes.SET_EXPORT_FILE_TYPE:
        return action.fileType

    default:
      return state
  }
}

const genApp = combineReducers({
  //samplesTable,
  variantsTable,
  exportFileType
})

export default genApp

