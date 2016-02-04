import * as ActionTypes from '../actions/userData'

export default function userData(state = {
  isFetching: false,
  isValid: false,
  profileMetadata: {},
  samples: [],
  filters: [],
  views: []
}, action) {

  switch (action.type) {

    case ActionTypes.REQUEST_USERDATA:
      return Object.assign({}, state, {
        isFetching: true
      });

    case ActionTypes.RECEIVE_USERDATA:
      return Object.assign({}, state, {
        isFetching: false,
        isValid: true,

        profileMetadata: action.userData.profile_metadata,
        samples: action.userData.samples,
        filters: action.userData.filters,
        views: action.userData.views,

        lastUpdated: action.receivedAt
      });

    case ActionTypes.REQUEST_VIEWS:
      return Object.assign({}, state, {
        isFetching: true
      });

    case ActionTypes.RECEIVE_VIEWS:
      return Object.assign({}, state, {
        isFetching: false,

        views: action.views,

        lastUpdated: action.receivedAt
      });

    case ActionTypes.REQUEST_FILTERS:
      return Object.assign({}, state, {
        isFetching: true
      });

    case ActionTypes.RECEIVE_FILTERS:
      return Object.assign({}, state, {
        isFetching: false,
        filters: action.filters,
        lastUpdated: action.receivedAt
      });

    default:
      return state
  }
}
