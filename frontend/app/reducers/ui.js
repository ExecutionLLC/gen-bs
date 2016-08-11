import * as ActionTypes from '../actions/ui';

export default function ui(state = {
    queryNavbarClosed: true,
    globalSearchString: '',
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

        case ActionTypes.TOGGLE_ANALYZE_TOOLTIP:
            return Object.assign({}, state, {
                isAnalyzeTooltipVisible: action.flag
            });

        case ActionTypes.CHANGE_GLOBAL_STRING:
            return Object.assign({}, state, {
                globalSearchString: action.globalString
            });

        default:
            return state;
    }
}

