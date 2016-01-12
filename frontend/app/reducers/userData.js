import * as ActionTypes from '../actions/userData'

export default function userData(state = {
  isFetching:false,
  profileMetadata: {},
  samples: [],
  filters: [],
  views: []
}, action) {

  switch (action.type) {

    case ActionTypes.REQUEST_USERDATA:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.RECEIVE_USERDATA:
      return Object.assign({}, state, {
        isFetching: false,

        profileMetadata: action.userData.profile_metadata,
        samples: action.userData.samples,
        filters: action.userData.filters,
        views: action.userData.views,

        lastUpdated: action.receivedAt
      })


    default:
      return state
  }
}
