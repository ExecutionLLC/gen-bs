import * as ActionTypes from '../actions/filterBuilder'

export default function filterBuilder(state = {
    isReceivedFilters: false,
    selectedFilter: null,
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
                editingFilter: {
                    filter: selectedFilter,
                    isNew: false
                }
            });

        case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
            filterToEdit = action.makeNew ?
                Object.assign({}, state.selectedFilter, {
                    type: 'user',
                    name: `Copy of ${state.selectedFilter.name}`
                }) :
                state.selectedFilter;
            return Object.assign({}, state, {
                editingFilter: {
                    filter: filterToEdit,
                    isNew: action.makeNew
                }
            });

        case ActionTypes.FBUILDER_CHANGE_ATTR:
            return Object.assign({}, state, {
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
            return Object.assign({}, state, {
                editingFilter: Object.assign({}, {
                    filter: Object.assign({}, state.editingFilter.filter, {
                        rules: action.rules
                    })
                })
            });
        })();

        default:
            return state
    }
}
