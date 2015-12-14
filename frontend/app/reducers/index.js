import { combineReducers } from 'redux'
import * as ActionTypes from '../actions'
import 'babel-polyfill'

function samples_table(state = {}, action) {
  console.log('filter',action.columnId,action.filterValue);
  var newTable = action.table;
  switch (action.type) {
    // We don't mutate state here rows().data() method return array with new table data
    // See https://datatables.net/reference/api/rows().data()
    case ActionTypes.SET_COLUMN_FILTER:
      return Object.assign({}, state, {
          filteredTable: newTable.column(action.columnId).search(action.filterValue).rows({search: 'applied'}).data()
      })

    default:
      return state
  }
}

const genApp = combineReducers({
  samples_table
})


/*
function genApp(state = {}, action) {
  return {
    //visibilityFilter: visibilityFilter(state.visibilityFilter, action),
    samples_table: samples_table(state.samples_table, action)
  }
}
*/

export default genApp

