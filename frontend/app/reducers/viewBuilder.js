import _ from 'lodash';

import * as ActionTypes from '../actions/viewBuilder';
import {entityType} from '../utils/entityTypes';
import * as i18n from '../utils/i18n';

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
    const {view, newViewInfo, allowedFields, languageId} = action;
    const editingView = newViewInfo ?
        i18n.changeEntityText(
            {
                ...view,
                type: entityType.USER,
                id: null
            },
            languageId,
            {
                name: newViewInfo.name
            }
        ) :
        view;
    return Object.assign({}, state, {
        editingView: editingView,
        originalView: editingView,
        editingViewIsNew: !!newViewInfo,
        editingViewParentId: view.id,
        allowedFields
    });
}

function reduceVBuilderSaveEdit(state) {
    return state;
}

function reduceVBuilderEndEdit(state) {
    return Object.assign({} ,state, {
        editingView: null,
        originalView: null,
        editingViewIsNew: false,
        editingViewParentId: '',
        allowedFields: null
    });
}

export default function viewBuilder(state = {
    editingView: null,
    originalView: null,
    editingViewIsNew: false,
    editingViewParentId: '',
    allowedFields: null,
    isFetching: false
}, action) {

    switch (action.type) { // TODO extract reducers
        case ActionTypes.VBUILDER_START_EDIT:
            return reduceVBuilderStartEdit(state, action);
        case ActionTypes.VBUILDER_SAVE_EDIT:
            return reduceVBuilderSaveEdit(state);
        case ActionTypes.VBUILDER_END_EDIT:
            return reduceVBuilderEndEdit(state);
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
                editingView: i18n.changeEntityText(
                    state.editingView,
                    action.languageId,
                    {
                        name: action.name,
                        description: action.description
                    }
                )
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
        case ActionTypes.VBUILDER_ON_SAVE:
            return {
                ...state,
                onSaveAction: action.onSaveAction,
                onSaveActionProperty: action.onSaveActionProperty
            };
        default:
            return state;
    }
}
