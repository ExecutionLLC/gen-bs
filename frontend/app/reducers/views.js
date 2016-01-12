import * as ActionTypes from '../actions/views'

export default function views(state = {
  current: null
}, action) {
  switch (action.type) {
    case ActionTypes.CHANGE_VIEW:
        return {
          current: action.selectedView
        }

    default:
      return state
  }
}
