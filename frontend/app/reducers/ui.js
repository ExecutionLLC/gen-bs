import * as ActionTypes from '../actions/ui'

export default function ui(state = {
  queryNavbarClosed: true,
  samples: [],
  currentSample: null,
  currentView: null,
}, action) {

  switch (action.type) {

    case ActionTypes.TOGGLE_QUERY_NAVBAR:
      return Object.assign({}, state, {
        queryNavbarClosed: !state.queryNavbarClosed
      })

    case ActionTypes.CHANGE_SAMPLE:
      return Object.assign({}, state, {
          samples: action.samples,
          currentSample: _.find(action.samples, {id: action.sampleId})
      })

    case ActionTypes.CHANGE_VIEW:
      return Object.assign({}, state, {
          views: action.views,
          currentView: _.find(action.views, {id: action.viewId})
      })

    case ActionTypes.CHANGE_FILTER:
      return Object.assign({}, state, {
          filters: action.filters,
          currentFilter: _.find(action.filters, {id: action.filterId})
      })

    default:
      return state
  }
}
