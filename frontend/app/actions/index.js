
/*
 * action types
 */

export const SET_COLUMN_FILTER = 'SET_COLUMN_FILTER'
export const INITIALIZE_TABLE = 'INITIALIZE_TABLE'

export const SET_EXPORT_FILE_TYPE = 'EXPORT_FROM_TABLE'


/*
 * other constants
 */

export const fileTypes = {
  NONE: null,
  EXCEL: 'EXCEL',
  CSV: 'CSV'
}


/*
 * action creators
 */

export function setColumnFilter(columnId, filterValue) {
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

export function setExportFileType(fileType) {
  return {
    type: SET_EXPORT_FILE_TYPE,
    fileType
  }
}

