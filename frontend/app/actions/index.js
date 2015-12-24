import jsonUrl from '../../json/data-variants.json';

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

export const SORT_VARIANTS = 'REQUEST_VARIANTS'
function sortVariants(columnKey, sortOrder) {
  return {
    type: REQUEST_VARIANTS,
    columnKey,
    sortOrder
  }
}

export const REQUEST_VARIANTS = 'REQUEST_VARIANTS'
function requestVariants() {
  return {
    type: REQUEST_VARIANTS
  }
}

export const RECEIVE_VARIANTS = 'RECEIVE_VARIANTS'
function receiveVariants(json) {
  return {
    type: RECEIVE_VARIANTS,
    variants: json,
    receivedAt: Date.now()
  }
}

export function fetchVariants() {

  return dispatch => {

    dispatch(requestVariants())

    return $.get(jsonUrl)
      .then(json =>
        dispatch(receiveVariants(json))
      )

      // In a real world app, you also want to
      // catch any error in the network call.
  }
}

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

