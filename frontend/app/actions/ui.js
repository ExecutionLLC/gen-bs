import { fetchVariants } from './variantsTable'
import { requestAnalyze } from './websocket'

export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR'
export const CHANGE_SAMPLE = 'CHANGE_SAMPLE'
export const CHANGE_VIEW = 'CHANGE_VIEW'
export const CHANGE_FILTER = 'CHANGE_VIEW'
export const ANALYZE = 'ANALYZE'



/*
 * Action Creators
 */
export function toggleQueryNavbar(samples, sampleId) {
  return {
    type: TOGGLE_QUERY_NAVBAR
  }
}

export function changeSample(samples, sampleId) {
  return {
    type: CHANGE_SAMPLE,
    samples,
    sampleId
  }
}

export function changeView(views, viewId) {
  return {
    type: CHANGE_VIEW,
    views,
    viewId
  }
}

export function changeFilter(filters, filterId) {
  return {
    type: CHANGE_FILTER,
    filters,
    filterId
  }
}

export function analyze(sampleId, viewId, filterIds) {
  return dispatch => {

    const searchParams = {
      sampleId: sampleId,
      viewId: viewId,
      filterIds: null,
      limit: 100,
      offset: 0
    }

    dispatch(requestAnalyze(searchParams))

    dispatch(fetchVariants(searchParams))

  }
}
