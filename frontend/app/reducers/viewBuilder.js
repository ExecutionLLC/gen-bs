import * as ActionTypes from '../actions/viewBuilder'

const EMPTY_VIEW_ITEM = {fieldId: null};

function filterEmptyListItems(viewListItems) {
    return _.filter(viewListItems, item => item !== EMPTY_VIEW_ITEM);
}

export default function viewBuilder(state = {
    currentView: null,
    editedView: null,
    isFetching: false
}, action) {

    switch (action.type) {
        case ActionTypes.VBUILDER_SELECT_VIEW:
        {
            const currentView = _.find(action.views, {id: action.viewId}) || null;
            return Object.assign({}, state, {
                currentView: currentView,
                editedView: currentView
            });
        }
        case ActionTypes.VBUILDER_TOGGLE_EDIT:
        {
            const editedView = _.find(action.views, {id: action.viewId}) || null;
            return Object.assign({}, state, {
                editedView: editedView
            });
        }
        case ActionTypes.VBUILDER_TOGGLE_NEW:
        {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    id: null,
                    type: 'user',
                    name: `Copy of ${state.editedView.name}`,
                    originalViewId: state.editedView.id
                })
            });
        }
        case ActionTypes.VBUILDER_REQUEST_UPDATE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: true,
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: filterEmptyListItems(state.editedView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_UPDATE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: false,
                currentView: action.view,
                editedView: action.view
            });
        }
        case ActionTypes.VBUILDER_REQUEST_CREATE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: true,
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: filterEmptyListItems(state.editedView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_CREATE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: false,
                editedView: action.view,
                currentView: action.view
            });
        }
        case ActionTypes.VBUILDER_REQUEST_DELETE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: true
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_DELETE_VIEW:
        {
            return Object.assign({}, state, {
                isFetching: false
            });
        }
        case ActionTypes.VBUILDER_DELETE_COLUMN:
        {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),
                        ...state.editedView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_ADD_COLUMN:
        {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),
                        EMPTY_VIEW_ITEM,
                        ...state.editedView.viewListItems.slice(action.viewItemIndex)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_ATTR:
        {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    name: action.name,
                    description: action.description
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_COLUMN:
        {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),

                        Object.assign({}, state.editedView.viewListItems[action.viewItemIndex], {
                            fieldId: action.fieldId
                        }),

                        ...state.editedView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        default:
            return state
    }
}
