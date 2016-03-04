import config from '../../config'
import { requestAnalyze } from './websocket'

/*
 * action types
 */
export const INIT_SEARCH_IN_RESULTS_PARAMS = 'INIT_SEARCH_IN_RESULTS_PARAMS'
export const CHANGE_VARIANTS_FILTER = 'CHANGE_VARIANTS_FILTER'
export const CHANGE_VARIANTS_SORT = 'CHANGE_VARIANTS_SORT'
export const CLEAR_SEARCH_PARAMS = 'CLEAR_SEARCH_PARAMS'

export const FILTER_VARIANTS = 'FILTER_VARIANTS'

export const SORT_VARIANTS = 'SORT_VARIANTS'

export const SELECT_VARIANTS_ROW = 'SELECT_VARIANTS_ROW'

export const REQUEST_VARIANTS = 'REQUEST_VARIANTS'
export const RECEIVE_VARIANTS = 'RECEIVE_VARIANTS'

export const REQUEST_SEARCHED_RESULTS = 'REQUEST_SEARCHED_RESULTS'
export const RECEIVE_SEARCHED_RESULTS = 'RECEIVE_SEARCHED_RESULTS'

export const CHANGE_VARIANTS_LIMIT = 'CHANGE_VARIANTS_LIMIT'
export const RECEIVE_NEXT_PART_OF_DATA = 'RECEIVE_NEXT_PART_OF_DATA'





/*
 * action creators
 */


function changeVariantsLimit() {
  return {
    type: CHANGE_VARIANTS_LIMIT
  }
}

export function getNextPartOfData(currentSample, currentView, currentFilter ) {
  return (dispatch, getState) => {
    const limit = getState().ui.currentLimit + 100
    const offset = getState().ui.currentOffset

    dispatch(changeVariantsLimit())

    setTimeout(() => {
      dispatch(searchInResults())
    }, 500)


  }
}

export function initSearchInResultsParams(searchInResultsParams) {
  return {
    type: INIT_SEARCH_IN_RESULTS_PARAMS,
    searchInResultsParams
  }
}

export function clearSearchParams() {
  return {
    type: CLEAR_SEARCH_PARAMS
  }
}

export function changeVariantsFilter(variants, fieldId, filterValue) {
  return {
    type: CHANGE_VARIANTS_FILTER,
    variants: variants,
    fieldId: fieldId,
    filterValue: filterValue
  }
}

export function sortVariants(fieldId, sortDirection, ctrlKeyPressed) {
  return (dispatch, getState) => {
    dispatch(changeVariantsSort(fieldId, ctrlKeyPressed ? 2:1, sortDirection))
    if (getState().variantsTable.searchInResultsParams.sort.length > 0) {
      setTimeout(() => {
          dispatch(searchInResults())
      }, 1000)
    }
  }
}

export function changeVariantsSort(fieldId, sortOrder, sortDirection) {
  return {
    type: CHANGE_VARIANTS_SORT,
    fieldId,
    sortOrder,
    sortDirection
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
    operationId: json.operation_id,
    receivedAt: Date.now()
  }
}

export function fetchVariants(searchParams) {

  return dispatch => {

    console.log('fetchVariants: ', searchParams)

    dispatch(requestVariants())

    setTimeout(() => {
      $.ajax(config.URLS.SEARCH, {
        'data': JSON.stringify(searchParams),
        'type': 'POST',
        'processData': false,
        'contentType': 'application/json'
      })
      .then(json => {
        console.log('search', json)
        dispatch(receiveVariants(json))
      })
    }, 1000)

      // TODO:
      // catch any error in the network call.
  }
}

function requestSearchedResults() {
  return {
    type: REQUEST_SEARCHED_RESULTS
  }
}

function receiveSearchedResults(json) {
  return {
    type: RECEIVE_SEARCHED_RESULTS,
    receivedAt: Date.now()
  }
}

export function searchInResults() {

  return (dispatch, getState) => {

    dispatch(requestSearchedResults())
    dispatch(requestAnalyze())
    
    const clearedJson = getState().variantsTable.searchInResultsParams

    $.ajax(config.URLS.SEARCH_IN_RESULTS(getState().variantsTable.operationId), {
      'data': JSON.stringify(clearedJson),
      'type': 'POST',
      'processData': false,
      'contentType': 'application/json'
    })
    .then(json => {
      console.log('search', json)
      dispatch(receiveSearchedResults(json))
    })
    .fail(json => {
      console.log('search fail', json)
      dispatch(receiveSearchedResults(json))
    })

      // TODO:
      // catch any error in the network call.
  }
}

export function selectTableRow(rowId) {
  return {
    type: SELECT_VARIANTS_ROW,
    rowId
  }
}


