import jsonUrl from '../../json/data-variants.json';

/*
 * action types
 */

export const SET_COLUMN_FILTER = 'SET_COLUMN_FILTER'
export const INITIALIZE_TABLE = 'INITIALIZE_TABLE'

export const EXPORT_TO_FILE = 'EXPORT_FILE_TO'


/*
 * other constants
 */

export const fileTypes = {
  NONE: null,
  EXCEL: 'Excel',
  CSV: 'CSV'
}


/*
 * action creators
 */

export const FILTER_VARIANTS = 'FILTER_VARIANTS'
export function filterVariants(variants, columnKey, filterValue) {
  return {
    type: FILTER_VARIANTS,
    variants: variants,
    columnKey: columnKey,
    filterValue: filterValue
  }
}

export const SORT_VARIANTS = 'SORT_VARIANTS'
export function sortVariants(variants, columnKey, sortOrder) {
  return {
    type: SORT_VARIANTS,
    variants: variants,
    columnKey: columnKey,
    sortOrder: sortOrder
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

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW'
export function selectTableRow(rowId) {
  return {
    type: SELECT_VARIANTS_ROW,
    rowId
  }
}

export function initializeTable(table) {
  return {
    type: INITIALIZE_TABLE,
    table
  }
}

export function exportToFile(fileType, fileName) {
  return {
    type: EXPORT_TO_FILE,
    fileType,
    fileName
  }
}

