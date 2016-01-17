import * as ActionTypes from '../actions/viewBuilder'

export default function viewBuilder(state = {
  isReceivedViews: false,
  currentView: null
}, action) {

  var currentView;
  var viewItemIndex;

  switch (action.type) {
    case ActionTypes.VBUILDER_SELECT_VIEW:
      currentView = _.find(action.views, {id: action.viewId}) || null
      return Object.assign({}, state, {
        currentView: currentView,
        isReceivedViews: currentView !== null
      })

    case ActionTypes.VBUILDER_CHANGE_COLUMN:
      viewItemIndex = (ary, action) => _.findIndex(ary, (item) => action.fieldId === item.field_id)
      return Object.assign({}, state, {
        currentView: Object.assign({}, state.currentView, {
          view_list_items: [
            ...state.currentView.view_list_items.slice(0, viewItemIndex(state.currentView.view_list_items, action)),
            Object.assign({}, state.currentView.view_list_items[viewItemIndex(state.currentView.view_list_items, action)], {
              field_id: action.fieldId
            }),
            ...state.currentView.view_list_items.slice(viewItemIndex(state.currentView.view_list_items, action)+ 1),
          ]
        }),
      })

    default:
      return state
  }
}
