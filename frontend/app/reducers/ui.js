import * as ActionTypes from '../actions/ui';

export default function ui(state = {
    // Workaround for bug #299
    shouldResetTableScrollPosition: false,
    currentLimit: 100,
    currentOffset: 0,
    isAnalyzeTooltipVisible: false,
    languageId: 'en',
    languages: null
}, action) {

    switch (action.type) {

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

        case ActionTypes.STORE_CURRENT_LANGUAGE_ID:
            return Object.assign({}, state, {
                languageId: action.languageId
            });

        case ActionTypes.STORE_AVAILABLE_LANGUAGES:
            return Object.assign({}, state, {
                languages: action.languages
            });

        default:
            return state;
    }
}

