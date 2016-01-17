import * as ActionTypes from '../actions/viewBuilder'

export default function viewBuilder(state = {
  isReceivedViews: false,
  currentView: null,
  editedView: null,
  newView: null,
  editOrNew: true,
  isFetching: false
}, action) {

  var currentView;
  var viewItemIndex;

  switch (action.type) {
    case ActionTypes.VBUILDER_SELECT_VIEW:
      currentView = _.find(action.views, {id: action.viewId}) || null
      return Object.assign({}, state, {
        currentView: currentView,
        isReceivedViews: currentView !== null,
        editedView: action.editOrNew ? currentView : null,
        newView: !action.editOrNew ? currentView : null,
        editOrNew: action.editOrNew
      })

    case ActionTypes.VBUILDER_REQUEST_UPDATE_VIEW:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.VBUILDER_RECEIVE_UPDATE_VIEW:
      return Object.assign({}, state, {
        isFetching: false
      })

    case ActionTypes.VBUILDER_DELETE_COLUMN:
      return Object.assign({}, state, {
        editedView: Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),
            ...state.editedView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        })
      })
  
    case ActionTypes.VBUILDER_ADD_COLUMN:
      return Object.assign({}, state, {
        editedView: Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),
            state.editedView.view_list_items[action.viewItemIndex],
            ...state.editedView.view_list_items.slice(action.viewItemIndex)
          ]
        })
      })

    case ActionTypes.VBUILDER_CHANGE_COLUMN:
      return Object.assign({}, state, {
        editedView: Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),

            Object.assign({}, state.editedView.view_list_items[action.viewItemIndex], {
              field_name: action.fieldName,
              source_name: action.sourceName
            }),
            
            ...state.editedView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        })
      })

    default:
      return state
  }
}
