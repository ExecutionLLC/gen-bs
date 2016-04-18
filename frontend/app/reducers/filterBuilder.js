import * as ActionTypes from '../actions/filterBuilder'

export default function filterBuilder(state = {
    isReceivedFilters: false,
    selectedFilter: null,
    editedFilter: null,
    newFilter: null,
    editOrNew: true,
    isFetching: false,
    rulesRequested: false,
    editingFilter: {
        filter: null,
        rulesParsed: null,
        isNew: false
    }
}, action) {

    var selectedFilter;
    var filterToEdit;

    switch (action.type) {
        case ActionTypes.FBUILDER_SELECT_FILTER:
            selectedFilter = _.find(action.filters, {id: action.filterId}) || null;
            return Object.assign({}, state, {
                selectedFilter,
                isReceivedFilters: selectedFilter !== null,
                editedFilter: selectedFilter,
                newFilter: null,
                editOrNew: true,
                editingFilter: {
                    filter: selectedFilter,
                    isNew: false
                }
            });

        case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
            filterToEdit = action.editOrNew ?
                state.selectedFilter :
                Object.assign({}, state.selectedFilter, {
                    type: 'user',
                    name: `Copy of ${state.selectedFilter.name}`
                });
            return Object.assign({}, state, {
                editOrNew: action.editOrNew,
                editedFilter: action.editOrNew ? filterToEdit : null,
                newFilter: !action.editOrNew ? filterToEdit : null,
                editingFilter: {
                    filter: filterToEdit,
                    isNew: !action.editOrNew
                }
            });

        case ActionTypes.FBUILDER_CHANGE_ATTR:
            return Object.assign({}, state, {
                editedFilter: state.editedFilter ? Object.assign({}, state.editedFilter, {
                    name: action.name,
                    description: action.description
                }) : null,
                newFilter: state.newFilter ? Object.assign({}, state.newFilter, {
                    name: action.name,
                    description: action.description
                }) : null,
                editingFilter: state.editingFilter ?
                    Object.assign({}, {
                        filter: Object.assign({},
                            state.editingFilter.filter,
                            {
                                name: action.name,
                                description: action.description
                            }
                        )
                    }) :
                    null
            });

        case ActionTypes.FBUILDER_RECEIVE_RULES:
            return Object.assign({}, state, {
                rulesRequested: false,
                rulesPrepared: true,
                editedFilter: state.editedFilter ? Object.assign({}, state.editedFilter, {
                    rules: action.rules
                }) : null,
                newFilter: state.newFilter ? Object.assign({}, state.newFilter, {
                    rules: action.rules
                }) : null,
                editingFilter: state.editingFilter ?
                    Object.assign({}, {
                        filter: Object.assign({},
                            state.editingFilter.filter,
                            {
                                rules: action.rules
                            })
                    }) :
                    null
            });

        case ActionTypes.FBUILDER_REQUEST_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_UPDATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false,
                selectedFilter: action.filter
            });

        case ActionTypes.FBUILDER_REQUEST_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: true
            });

        case ActionTypes.FBUILDER_RECEIVE_CREATE_FILTER:
            return Object.assign({}, state, {
                isFetching: false,
                selectedFilter: action.filter
            });

        case ActionTypes.FBUILDER_CHANGE_ALL: return (function() {
            const { editOrNew, editedFilter, newFilter } = state;
            const filter = editOrNew ? (editedFilter):(newFilter);

            if (editOrNew) {
                return Object.assign({}, state, {
                    editedFilter: Object.assign({}, state.editedFilter, {rules: action.rules}),
                    editingFilter: Object.assign({}, {
                        filter: Object.assign({}, state.editedFilter.filter, {
                            rules: action.rules
                        })
                    })
                });
            } else {
                return Object.assign({}, state, {
                    newFilter: Object.assign({}, state.newFilter, {rules: action.rules}),
                    editingFilter: Object.assign({}, {
                        filter: Object.assign({}, state.editedFilter.filter, {
                            rules: action.rules
                        })
                    })
                });
            }
        })();

        default:
            return state
    }
}
