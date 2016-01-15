import * as ActionTypes from '../actions/auth'

export default function auth(state = {
  isFetching:false,
  sessionId: null,
  isAuthenticated: false
}, action) {

  switch (action.type) {

    case ActionTypes.REQUEST_SESSION:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_SESSION:
      return Object.assign({}, state, {
        isFetching: false,
        sessionId: action.sessionId,
        isAuthenticated: action.isAuthenticated,
        lastUpdated: action.receivedAt
      })


    default:
      return state
  }
}
