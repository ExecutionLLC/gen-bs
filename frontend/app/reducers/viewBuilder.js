import * as ActionTypes from '../actions/viewBuilder';

const EMPTY_VIEW_ITEM = {
    fieldId: null,
    keywords: []
};

function filterEmptyListItems(viewListItems) {
    return _.filter(viewListItems, item => item !== EMPTY_VIEW_ITEM);
}

function getNextDirection(direction) {
    if (!direction) {
        return 'asc';
    }
    const switcher = {
        'asc': 'desc',
        'desc': null
    };

    return switcher[direction];
}

function createViewItem(fieldId) {
    return {
        fieldId,
        keywords: []
    }
}

export default function viewBuilder(state = {
    selectedView: null,
    editedView: null,
    isFetching: false
}, action) {

    switch (action.type) {
        case ActionTypes.VBUILDER_SELECT_VIEW: {
            const selectedView = _.find(action.views, {id: action.viewId}) || null;
            return Object.assign({}, state, {
                selectedView: selectedView,
                editedView: selectedView
            });
        }
        case ActionTypes.VBUILDER_TOGGLE_NEW: {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    id: null,
                    type: 'user',
                    name: `Copy of ${state.editedView.name}`,
                    originalViewId: state.editedView.id
                })
            });
        }
        case ActionTypes.VBUILDER_REQUEST_UPDATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: true,
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: filterEmptyListItems(state.editedView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_UPDATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: false,
                selectedView: action.view,
                editedView: action.view
            });
        }
        case ActionTypes.VBUILDER_REQUEST_CREATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: true,
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: filterEmptyListItems(state.editedView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_CREATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: false,
                editedView: action.view,
                selectedView: action.view
            });
        }
        case ActionTypes.VBUILDER_REQUEST_DELETE_VIEW: {
            return Object.assign({}, state, {
                isFetching: true
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_DELETE_VIEW: {
            return Object.assign({}, state, {
                isFetching: false
            });
        }
        case ActionTypes.VBUILDER_DELETE_COLUMN: {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),
                        ...state.editedView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_ADD_COLUMN: {
            const newViewItem = createViewItem(action.columnFieldId);
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),
                        newViewItem,
                        ...state.editedView.viewListItems.slice(action.viewItemIndex)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_ATTR: {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    name: action.name,
                    description: action.description
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_COLUMN: {
            const changedViewItem = createViewItem(action.fieldId);
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),

                        Object.assign({}, state.editedView.viewListItems[action.viewItemIndex], changedViewItem),

                        ...state.editedView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_SORT_COLUMN: {
            const viewItems = [...state.editedView.viewListItems];
            const firstSortItemIndex = _.findIndex(viewItems, {sortOrder: 1});
            const secondSortItemIndex = _.findIndex(viewItems, {sortOrder: 2});
            const selectedSortItemIndex = _.findIndex(viewItems, {fieldId: action.fieldId});
            const selectedOrder = action.sortOrder;
            const selectedDirection = getNextDirection(action.sortDirection);
            if (selectedSortItemIndex == secondSortItemIndex || selectedSortItemIndex == firstSortItemIndex) {
                viewItems[selectedSortItemIndex] = Object.assign({}, viewItems[selectedSortItemIndex], {
                    sortDirection: selectedDirection
                });
                if (selectedDirection == null) {
                    viewItems[selectedSortItemIndex] = Object.assign({}, viewItems[selectedSortItemIndex], {
                        sortOrder: null
                    });
                    if (selectedSortItemIndex == firstSortItemIndex && secondSortItemIndex != -1) {
                        viewItems[secondSortItemIndex] = Object.assign({}, viewItems[secondSortItemIndex], {
                            sortOrder: 1
                        });
                    }
                }
            } else {
                const oldSortItemIndex = _.findIndex(viewItems, {sortOrder: selectedOrder});
                if (oldSortItemIndex != -1) {
                    viewItems[oldSortItemIndex] = Object.assign({}, viewItems[oldSortItemIndex], {
                        sortOrder: null,
                        sortDirection: null
                    });
                }
                viewItems[selectedSortItemIndex] = Object.assign({}, viewItems[selectedSortItemIndex], {
                    sortDirection: selectedDirection,
                    sortOrder: firstSortItemIndex == -1 ? 1 : selectedOrder
                });
            }
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: viewItems
                })
            });
        }
        case ActionTypes.VBUILDER_SET_ITEM_KEYWORDS: {
            return Object.assign({}, state, {
                editedView: Object.assign({}, state.editedView, {
                    viewListItems: [
                        ...state.editedView.viewListItems.slice(0, action.viewItemIndex),

                        Object.assign({}, state.editedView.viewListItems[action.viewItemIndex], {
                            keywords: action.keywordsIds
                        }),

                        ...state.editedView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        default:
            return state;
    }
}
