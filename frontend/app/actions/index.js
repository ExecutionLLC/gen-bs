
/*
 * action types
 */

export const SET_COLUMN_FILTER = 'SET_COLUMN_FILTER'
export const INITIALIZE_TABLE = 'INITIALIZE_TABLE'


/*
 * action creators
 */

export function setColumnFilter(table, columnId, filterValue) {
  return {
    type: SET_COLUMN_FILTER,
    columnId,
    filterValue
  }
}

export function initializeTable(table) {
  return {
    type: INITIALIZE_TABLE,
    table
  }
}

