import * as ActionTypes from '../actions/ui'

export default function ui(state = {
  queryNavbarClosed: true,
}, action) {

  switch (action.type) {

    case ActionTypes.TOGGLE_QUERY_NAVBAR:
      return Object.assign({}, state, {
        queryNavbarClosed: !state.queryNavbarClosed
      })

    default:
      return state
  }
}

