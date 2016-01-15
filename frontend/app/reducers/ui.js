import * as ActionTypes from '../actions/ui'

export default function ui(state = {
  queryNavbarClosed: true,
  samples: [],
  currentSample: null 
}, action) {

  switch (action.type) {

    case ActionTypes.TOGGLE_QUERY_NAVBAR:
      return Object.assign({}, state, {
        queryNavbarClosed: !state.queryNavbarClosed
      })

    case ActionTypes.CHANGE_SELECTED_SAMPLE:
      return Object.assign({}, state, {
          samples: action.samples,
          currentSample: _.find(action.samples, {id: action.selectedSampleId})
      })

    default:
      return state
  }
}

