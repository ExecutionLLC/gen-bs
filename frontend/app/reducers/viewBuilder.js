import _ from 'lodash';

import * as ActionTypes from '../actions/viewBuilder';
import {entityType} from '../utils/entityTypes';
import * as i18n from '../utils/i18n';
import immutableArray from '../utils/immutableArray';

const INITIAL_STATE = {
    editingView: null,
    originalView: null,
    editingViewIsNew: false,
    editingViewParentId: '',
    allowedFields: null
};

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

function setNewViewListItems(state, newViewListItems) {
    return {
        ...state,
        editingView: {
            ...state.editingView,
            viewListItems: newViewListItems
        }
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
    return {
        ...state,
        ...INITIAL_STATE
    };
}

function reduceVBuilderDeleteColumn(state, action) {
    return setNewViewListItems(
        state,
        immutableArray.remove(state.editingView.viewListItems, action.viewItemIndex)
    );
}

function reduceVBuilderAddColumn(state, action) {
    const newViewItem = createViewItem(action.columnFieldId);
    return setNewViewListItems(
        state,
        immutableArray.insertBefore(state.editingView.viewListItems, action.viewItemIndex, newViewItem)
    );
}

function reduceVBuilderChangeAttr(state, action) {
    return {
        ...state,
        editingView: i18n.changeEntityText(
            state.editingView,
            action.languageId,
            {
                name: action.name,
                description: action.description
            }
        )
    };
}

function reduceVBuilderChangeColumn(state, action) {
    const changedViewItem = createViewItem(action.fieldId);
    return setNewViewListItems(
        state,
        immutableArray.assign(state.editingView.viewListItems, action.viewItemIndex, changedViewItem)
    );
}

function reduceVBuilderChangeSortColumn(state, action) {
    const {fieldId: sortFieldId, sortOrder, sortDirection} = action;
    const {editingView} = state;
    const {viewListItems} = editingView;

    const selectedSortItemIndex = _.findIndex(viewListItems, {fieldId: sortFieldId});

    // item index of sort order 1
    const firstSortItemIndex = _.findIndex(viewListItems, {sortOrder: 1});
    // item index of sort order 2
    const secondSortItemIndex = _.findIndex(viewListItems, {sortOrder: 2});

    // is sort order 1 item same as selected item?
    const isFirstSortItemSorting = selectedSortItemIndex >= 0 && firstSortItemIndex === selectedSortItemIndex;
    // is sort order 2 item same as selected item?
    const isSecondSortItemSorting = selectedSortItemIndex >= 0 && secondSortItemIndex === selectedSortItemIndex;

    const selectedDirection = getNextDirection(sortDirection);
    const changingItems = [];

    if (isFirstSortItemSorting || isSecondSortItemSorting) {
        // selected one of already ordered items
        if (!selectedDirection) {
            // reset column sorting
            changingItems.push({
                index: selectedSortItemIndex,
                item: {
                    sortDirection: null,
                    sortOrder: null
                }
            });
            if (isFirstSortItemSorting && secondSortItemIndex >= 0) {
                // first sort order was reset, and there is second (not the same field as first),
                // need to change second into the first
                changingItems.push({
                    index: secondSortItemIndex,
                    item: {
                        sortOrder: 1
                    }
                });
            }
        } else {
            // set next column sorting
            changingItems.push({
                index: selectedSortItemIndex,
                item: {
                    sortDirection: selectedDirection
                }
            });
        }
    } else {
        // selected one of not sorted items, selectedSortItemIndex != firstSortItemIndex, != secondSortItemSorting
        // oldSortItemIndex will be firstSortItemIndex or secondSortItemSorting depends on desired sort order
        const oldSortItemIndex = _.findIndex(viewListItems, {sortOrder});
        if (oldSortItemIndex >= 0) {
            changingItems.push({
                index: oldSortItemIndex,
                item: {
                    sortOrder: null,
                    sortDirection: null
                }
            });
        }
        changingItems.push({
            index: selectedSortItemIndex,
            item: {
                sortDirection: selectedDirection,
                sortOrder: firstSortItemIndex < 0 ? 1 : sortOrder
            }
        });
    }
    const newViewListItems = _.reduce(
        changingItems,
        (newViewItems, change) => {
            return immutableArray.assign(newViewItems, change.index, change.item);
        },
        viewListItems
    );
    return setNewViewListItems(state, newViewListItems);
}

function reduceVBuilderSetItemKeywords(state, action) {
    return setNewViewListItems(
        state,
        immutableArray.assign(state.editingView.viewListItems, action.viewItemIndex, {keywords: action.keywordsIds})
    );
}

function reduceVBuilderOnSave(state, action) {
    return {
        ...state,
        onSaveAction: action.onSaveAction,
        onSaveActionProperty: action.onSaveActionProperty
    };
}

export default function viewBuilder(state = {
    ...INITIAL_STATE,
    isFetching: false
}, action) {

    switch (action.type) {
        case ActionTypes.VBUILDER_START_EDIT:
            return reduceVBuilderStartEdit(state, action);
        case ActionTypes.VBUILDER_SAVE_EDIT:
            return reduceVBuilderSaveEdit(state);
        case ActionTypes.VBUILDER_END_EDIT:
            return reduceVBuilderEndEdit(state);
        case ActionTypes.VBUILDER_DELETE_COLUMN:
            return reduceVBuilderDeleteColumn(state, action);
        case ActionTypes.VBUILDER_ADD_COLUMN:
            return reduceVBuilderAddColumn(state, action);
        case ActionTypes.VBUILDER_CHANGE_ATTR:
            return reduceVBuilderChangeAttr(state, action);
        case ActionTypes.VBUILDER_CHANGE_COLUMN:
            return reduceVBuilderChangeColumn(state, action);
        case ActionTypes.VBUILDER_CHANGE_SORT_COLUMN:
            return reduceVBuilderChangeSortColumn(state, action);
        case ActionTypes.VBUILDER_SET_ITEM_KEYWORDS:
            return reduceVBuilderSetItemKeywords(state, action);
        case ActionTypes.VBUILDER_ON_SAVE:
            return reduceVBuilderOnSave(state, action);
        default:
            return state;
    }
}
