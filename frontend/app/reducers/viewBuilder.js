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

    case ActionTypes.VBUILDER_TOGGLE_NEW_EDIT:
      return Object.assign({}, state, {
        editOrNew: action.editOrNew,
        editedView: action.editOrNew ? state.currentView : null,
        newView: !action.editOrNew ? Object.assign({}, state.currentView, { type: 'advanced', name: `Copy of ${state.currentView.name}` }) : null,
      })

    case ActionTypes.VBUILDER_REQUEST_UPDATE_VIEW:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.VBUILDER_RECEIVE_UPDATE_VIEW:
      return Object.assign({}, state, {
        isFetching: false,
        currentView: action.view
      })

    case ActionTypes.VBUILDER_REQUEST_CREATE_VIEW:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.VBUILDER_RECEIVE_CREATE_VIEW:
      return Object.assign({}, state, {
        isFetching: false,
        currentView: action.view
      })

    case ActionTypes.VBUILDER_REQUEST_DELETE_VIEW:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.VBUILDER_RECEIVE_DELETE_VIEW:
      return Object.assign({}, state, {
        isFetching: false
      })

    case ActionTypes.VBUILDER_DELETE_COLUMN:
      return Object.assign({}, state, {
        editedView: state.editedView ? Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),
            ...state.editedView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        }) : null,
        newView: state.newView ? Object.assign({}, state.newView, {
          view_list_items: [
            ...state.newView.view_list_items.slice(0, action.viewItemIndex),
            ...state.newView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        }) : null
      })
  
    case ActionTypes.VBUILDER_ADD_COLUMN:
      return Object.assign({}, state, {
        editedView: state.editedView ? Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),
            state.editedView.view_list_items[action.viewItemIndex],
            ...state.editedView.view_list_items.slice(action.viewItemIndex)
          ]
        }) : null,
        newView: state.newView ? Object.assign({}, state.newView, {
          view_list_items: [
            ...state.newView.view_list_items.slice(0, action.viewItemIndex),
            state.newView.view_list_items[action.viewItemIndex],
            ...state.newView.view_list_items.slice(action.viewItemIndex)
          ]
        }) : null
      })

    case ActionTypes.VBUILDER_CHANGE_ATTR:
      return Object.assign({}, state, {
        editedView: state.editedView ? Object.assign( {}, state.editedView, {
          name: action.name,
          description: action.description
        }):null,
        newView: state.newView ? Object.assign( {}, state.newView, {
          name: action.name,
          description: action.description
        }):null
      })

    case ActionTypes.VBUILDER_CHANGE_COLUMN:
      return Object.assign({}, state, {
        editedView: state.editedView ? Object.assign({}, state.editedView, {
          view_list_items: [
            ...state.editedView.view_list_items.slice(0, action.viewItemIndex),

            Object.assign({}, state.editedView.view_list_items[action.viewItemIndex], {
              field_id: action.fieldId
            }),
            
            ...state.editedView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        }) : null,
        newView: state.newView ? Object.assign({}, state.newView, {
          view_list_items: [
            ...state.newView.view_list_items.slice(0, action.viewItemIndex),

            Object.assign({}, state.newView.view_list_items[action.viewItemIndex], {
              field_id: action.fieldId
            }),
            
            ...state.newView.view_list_items.slice(action.viewItemIndex + 1)
          ]
        }) : null
      })

    default:
      return state
  }
}
