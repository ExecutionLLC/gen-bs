import * as ActionTypes from '../actions/filterBuilder'

export default function filterBuilder(state = {
  isReceivedFilters: false,
  currentFilter: null,
  editedFilter: null,
  newFilter: null,
  editOrNew: true,
  isFetching: false,
  rulesRequested: false,
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
        rulesRequested: true,
        rulesPrepared: false
      })

    case ActionTypes.FBUILDER_RECEIVE_RULES:
      return Object.assign({}, state, {
        rulesRequested: false,
        rulesPrepared: true,
        editedFilter: state.editedFilter ? Object.assign( {}, state.editedFilter, {
          rules: action.rules
        }):null,
        newFilter: state.newFilter ? Object.assign( {}, state.newFilter, {
          rules: action.rules
        }):null
      })

    case ActionTypes.FBUILDER_REQUEST_UPDATE_FILTER:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.FBUILDER_RECEIVE_UPDATE_FILTER:
      return Object.assign({}, state, {
        isFetching: false,
        currentFilter: action.filter
      })

    case ActionTypes.FBUILDER_REQUEST_CREATE_FILTER:
      return Object.assign({}, state, {
        isFetching: true
      })

    case ActionTypes.FBUILDER_RECEIVE_CREATE_FILTER:
      return Object.assign({}, state, {
        isFetching: false,
        currentFilter: action.filter
      })

    default:
      return state
  }
}
