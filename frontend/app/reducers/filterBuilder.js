import * as ActionTypes from '../actions/filterBuilder'

export default function filterBuilder(state = {
  isReceivedFilters: false,
  currentFilter: null,
  editedFilter: null,
  newFilter: null,
  editOrNew: true,
  isFetching: false,
  rulesRequested: false
}, action) {

  var currentFilter;
  var filterItemIndex;

  switch (action.type) {
    case ActionTypes.FBUILDER_SELECT_FILTER:
      currentFilter = _.find(action.filters, {id: action.filterId}) || null
      return Object.assign({}, state, {
        currentFilter: currentFilter,
        isReceivedFilters: currentFilter !== null,
        editedFilter: action.editOrNew ? currentFilter: null,
        newFilter: !action.editOrNew ? currentFilter: null,
        editOrNew: action.editOrNew,
        rulesPrepared: false
      })

    case ActionTypes.FBUILDER_TOGGLE_NEW_EDIT:
      return Object.assign({}, state, {
        editOrNew: action.editOrNew,
        editedFilter: action.editOrNew ? state.currentFilter: null,
        newFilter: !action.editOrNew ? Object.assign({}, state.currentFilter, { filter_type: 'advanced', name: `Copy of ${state.currentFilter.name}` }) : null,
      })

    case ActionTypes.FBUILDER_CHANGE_ATTR:
      return Object.assign({}, state, {
        editedFilter: state.editedFilter ? Object.assign( {}, state.editedFilter, {
          name: action.name,
          description: action.description
        }):null,
        newFilter: state.newFilter ? Object.assign( {}, state.newFilter, {
          name: action.name,
          description: action.description
        }):null
      })

    case ActionTypes.FBUILDER_REQUEST_RULES:
      return Object.assign({}, state, {
        rulesPrepared: true
      })

    case ActionTypes.FBUILDER_RECEIVE_RULES:
      return Object.assign({}, state, {
        rulesPrepared: false 
      })

    default:
      return state
  }
}
