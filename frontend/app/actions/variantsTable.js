import jsonUrl from '../../json/variants777.json';

/*
 * action types
 */

export const INITIALIZE_TABLE = 'INITIALIZE_TABLE'

export const SET_COLUMN_FILTER = 'SET_COLUMN_FILTER'
export const FILTER_VARIANTS = 'FILTER_VARIANTS'
export const SORT_VARIANTS = 'SORT_VARIANTS'

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW'

export const RECEIVE_VARIANTS = 'RECEIVE_VARIANTS'
export const REQUEST_VARIANTS = 'REQUEST_VARIANTS'



/*
 * action creators
 */

export function filterVariants(variants, columnKey, filterValue) {
  return {
    type: FILTER_VARIANTS,
    variants: variants,
    columnKey: columnKey,
    filterValue: filterValue
  }
}

export function sortVariants(variants, columnKey, sortOrder) {
  return {
    type: SORT_VARIANTS,
    variants: variants,
    columnKey: columnKey,
    sortOrder: sortOrder
  }
}

function requestVariants() {
  return {
    type: REQUEST_VARIANTS
  }
}

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

