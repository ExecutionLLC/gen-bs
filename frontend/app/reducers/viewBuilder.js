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
    };
}

function reduceVBuilderStartEdit(state, action) {
    const {view, makeNew} = action;
    const editingView = makeNew ?
        Object.assign({}, view, {
            type: 'user',
            name: `Copy of ${view.name}`,
            id: null
        }) :
        view;
    return Object.assign({}, state, {
        editingView: editingView,
        originalView: editingView,
        editingViewIsNew: makeNew,
        editingViewParentId: view.id
    });
}

function reduceVBuilderSaveEdit(state) {
    return Object.assign({}, state, {
        editingView: Object.assign({}, state.editingView, {
            viewListItems: filterEmptyListItems(state.editingView.viewListItems)
        })
    });
}

function reduceVBuilderEndEdit(state) {
    return Object.assign({} ,state, {
        editingView: null,
        originalView: null,
        editingViewIsNew: false,
        editingViewParentId: ''
    });
}

export default function viewBuilder(state = {
    editingView: null,
    originalView: null,
    editingViewIsNew: false,
    editingViewParentId: '',
    isFetching: false
}, action) {

    switch (action.type) {
        case ActionTypes.VBUILDER_START_EDIT:
            return reduceVBuilderStartEdit(state, action);
        case ActionTypes.VBUILDER_SAVE_EDIT:
            return reduceVBuilderSaveEdit(state);
        case ActionTypes.VBUILDER_END_EDIT:
            return reduceVBuilderEndEdit(state);
        case ActionTypes.VBUILDER_REQUEST_UPDATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: true,
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: filterEmptyListItems(state.editingView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_UPDATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: false,
                editingView: action.view,
                originalView: action.view
            });
        }
        case ActionTypes.VBUILDER_REQUEST_CREATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: true,
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: filterEmptyListItems(state.editingView.viewListItems)
                })
            });
        }
        case ActionTypes.VBUILDER_RECEIVE_CREATE_VIEW: {
            return Object.assign({}, state, {
                isFetching: false,
                editingView: action.view,
                originalView: action.view
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
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: [
                        ...state.editingView.viewListItems.slice(0, action.viewItemIndex),
                        ...state.editingView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_ADD_COLUMN: {
            const newViewItem = createViewItem(action.columnFieldId);
            return Object.assign({}, state, {
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: [
                        ...state.editingView.viewListItems.slice(0, action.viewItemIndex),
                        newViewItem,
                        ...state.editingView.viewListItems.slice(action.viewItemIndex)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_ATTR: {
            return Object.assign({}, state, {
                editingView: Object.assign({}, state.editingView, {
                    name: action.name,
                    description: action.description
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_COLUMN: {
            const changedViewItem = createViewItem(action.fieldId);
            return Object.assign({}, state, {
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: [
                        ...state.editingView.viewListItems.slice(0, action.viewItemIndex),

                        Object.assign({}, state.editingView.viewListItems[action.viewItemIndex], changedViewItem),

                        ...state.editingView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        case ActionTypes.VBUILDER_CHANGE_SORT_COLUMN: {
            const viewItems = [...state.editingView.viewListItems];
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
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: viewItems
                })
            });
        }
        case ActionTypes.VBUILDER_SET_ITEM_KEYWORDS: {
            return Object.assign({}, state, {
                editingView: Object.assign({}, state.editingView, {
                    viewListItems: [
                        ...state.editingView.viewListItems.slice(0, action.viewItemIndex),

                        Object.assign({}, state.editingView.viewListItems[action.viewItemIndex], {
                            keywords: action.keywordsIds
                        }),

                        ...state.editingView.viewListItems.slice(action.viewItemIndex + 1)
                    ]
                })
            });
        }
        default:
            return state;
    }
}
