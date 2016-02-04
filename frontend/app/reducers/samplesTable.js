
export default function samplesTable(state = {}, action) {
  switch (action.type) {

    // We don't mutate state here rows().data() method return table api instance with new rows 
    // See https://datatables.net/reference/api/rows().data()
    case ActionTypes.SET_COLUMN_FILTER:
        return state.column(action.columnId)
            .search(action.filterValue)
            .rows({search: 'applied'})
            .data();

    case ActionTypes.INITIALIZE_TABLE:
      return action.table;

    default:
      return state
  }
}
