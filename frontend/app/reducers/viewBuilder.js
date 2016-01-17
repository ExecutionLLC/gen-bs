import * as ActionTypes from '../actions/viewBuilder'

export default function viewBuilder(state = {
  isReceivedViews: false,
  currentView: null
}, action) {
  const currentView = _.find(action.views, {id: action.viewId}) || null
  console.log('vbuilder reducer', action.views, action.viewId)
  console.log('vbuilder reducer currentView', currentView)
  switch (action.type) {
    case ActionTypes.VBUILDER_SELECT_VIEW:
      return Object.assign({}, state, {
        currentView: currentView,
        isReceivedViews: currentView !== null
      })

    default:
      return state
  }
}
