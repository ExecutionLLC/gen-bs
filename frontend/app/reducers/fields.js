import * as ActionTypes from '../actions/fields'

export default function fields(state = {
  isFetching:false,
  list: [],
}, action) {

  switch (action.type) {

    case ActionTypes.REQUEST_FIELDS:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_FIELDS:
      return Object.assign({}, state, {
        isFetching: false,
        list: action.fields,
        lastUpdated: action.receivedAt
      })


    default:
      return state
  }
}
