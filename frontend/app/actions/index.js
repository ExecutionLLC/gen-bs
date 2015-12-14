
/*
 * action types
 */

export const SET_COLUMN_FILTER = 'SET_COLUMN_FILTER'


/*
 * action creators
 */

export function setColumnFilter(table, columnId, filterValue) {
  return {
    type: SET_COLUMN_FILTER,
    table,
    columnId,
    filterValue
  }
}

