import * as ActionTypes from '../actions/ui';

export default function ui(state = {
    queryNavbarClosed: true,
    selectedView: null,
    // Workaround for bug #299
    shouldResetTableScrollPosition: false,
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

        case ActionTypes.REQUEST_TABLE_SCROLL_POSITION_RESET:
            return Object.assign({}, state, {
                shouldResetTableScrollPosition: true
            });

        case ActionTypes.COMPLETE_TABLE_SCROLL_POSITION_RESET:
            return Object.assign({}, state, {
                shouldResetTableScrollPosition: false
            });

        case ActionTypes.CHANGE_HEADER_VIEW:
            return Object.assign({}, state, {
                selectedView: _.find(action.views, {id: action.viewId})
            });

        case ActionTypes.TOGGLE_ANALYZE_TOOLTIP:
            return Object.assign({}, state, {
                isAnalyzeTooltipVisible: action.flag
            });

        default:
            return state;
    }
}

