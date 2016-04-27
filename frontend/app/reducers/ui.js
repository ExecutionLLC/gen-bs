import _ from 'lodash';
import * as ActionTypes from '../actions/ui'

export default function ui(state = {
    queryNavbarClosed: true,
    selectedView: null,
    selectedFilter: null,
    currentLimit: 100,
    currentOffset: 0,
    isAnalyzeTooltipVisible: false,
    language: 'en'
}, action) {

    switch (action.type) {

        case ActionTypes.TOGGLE_QUERY_NAVBAR:
            return Object.assign({}, state, {
                queryNavbarClosed: !state.queryNavbarClosed
            });

        case ActionTypes.CHANGE_HEADER_VIEW:
            return Object.assign({}, state, {
                selectedView: _.find(action.views, {id: action.viewId})
            });

        case ActionTypes.CHANGE_HEADER_FILTER:
            return Object.assign({}, state, {
                selectedFilter: _.find(action.filters, {id: action.filterId})
            });

        case ActionTypes.TOGGLE_ANALYZE_TOOLTIP:
            return Object.assign({}, state, {
                isAnalyzeTooltipVisible: action.flag
            });

        default:
            return state;
    }
}

