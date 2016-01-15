import { fetchVariants } from './variantsTable'
export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR'
export const CHANGE_SELECTED_SAMPLE = 'CHANGE_SELECTED_SAMPLE'



/*
 * Action Creators
 */
export function changeSelectedSample(samples, sampleId, viewId) {
  return dispatch => {

    const searchParams = {
      sampleId: sampleId,
      viewId: viewId,
      filterIds: null,
      limit: 100,
      offset: 0
    }

    dispatch(fetchVariants(searchParams))

    return {
      type: CHANGE_SELECTED_SAMPLE,
      samples,
      sampleId
    }
}
}

