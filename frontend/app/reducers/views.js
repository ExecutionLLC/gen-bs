import * as ActionTypes from '../actions/views'

export default function views(state = {
  list: [],
  current: null
}, action) {
  switch (action.type) {
    case ActionTypes.CHANGE_VIEW:
        return { 
          list: action.views,
          current: _.find(action.views, {id: action.selectedViewId})
        }

    default:
      return state
  }
}
