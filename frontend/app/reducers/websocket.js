import * as ActionTypes from '../actions/websocket'

export default function websocket(state = {
    wsConn: null,
    lastMessageSended: null,
    messages: [],
    errors: [],
    closed: true,
    variants: null,
    currentVariants: null,
    isVariantsEmpty: false,
    isVariantsValid: true,
    isVariantsLoaded: false,
    progress: null
}, action) {
    switch (action.type) {
        case  ActionTypes.WS_DELETE_COMMENT:
            const deleteCommentVariants = state.variants;
            const deleteVariant = _.find(deleteCommentVariants, variant => variant.search_key === action.search_key);
            deleteVariant.comments.splice(0, 1);
            return Object.assign({}, state, {
                variants: deleteCommentVariants,
            });
        case ActionTypes.WS_UPDATE_COMMENT:
            const updateCommentVariants = state.variants;
            const updatedVariant = _.find(updateCommentVariants, variant => variant.search_key === action.commentData.search_key);
            updatedVariant.comments[0].comment = action.commentData.comment;
            return Object.assign({}, state, {
                variants: updateCommentVariants,
            });
        case ActionTypes.WS_ADD_COMMENT:
            const addCommentVarionts = state.variants;
            const addCommentVariant = _.find(addCommentVarionts, variant => variant.search_key === action.commentData.search_key);
            addCommentVariant.comments.push({
                'id':action.commentData.id,
                'comment':action.commentData.comment
            });
            const test3 = '';
            return Object.assign({}, state, {
                variants: addCommentVarionts,
            });
        case ActionTypes.WS_CLEAR_VARIANTS:
            return Object.assign({}, state, {
                variants: null,
                currentVariants: null
            });
        case ActionTypes.WS_CREATE_CONNECTION:
            return Object.assign({}, state, {
                wsConn: action.wsConn
            });
        case ActionTypes.WS_TABLE_MESSAGE:
            const resultData = action.wsData.result.data;
            return Object.assign({}, state, {
                messages: [
                    ...state.messages,
                    action.wsData
                ],
                variants: state.variants === null ? resultData : [...state.variants, ...(resultData || [])],
                currentVariants: resultData,
                isVariantsEmpty: (resultData && resultData.length === 0),
                isVariantsLoaded: false,
                isVariantsValid: true
            });
        case ActionTypes.WS_PROGRESS_MESSAGE:
            return Object.assign({}, state, {
                messages: [
                    ...state.messages,
                    action.wsData
                ],
                progress: action.wsData.result.progress
            });
        case ActionTypes.WS_OTHER_MESSAGE:
            return Object.assign({}, state, {
                messages: [
                    ...state.messages,
                    action.wsData
                ]
            });
        case ActionTypes.WS_RECEIVE_AS_ERROR:
            return Object.assign({}, state, {
                errors: [
                    ...state.errors,
                    action.err
                ],
                isVariantsLoaded: false,
                isVariantsValid: false
            });

        case ActionTypes.WS_RECEIVE_ERROR:
            return Object.assign({}, state, {
                errors: [
                    ...state.errors,
                    action.err
                ],
                isVariantsLoaded: false
            });
        case ActionTypes.WS_RECEIVE_CLOSE:
            return Object.assign({}, state, {
                closed: true
            });
        case ActionTypes.WS_SEND_MESSAGE:
            return Object.assign({}, state, {
                lastMessageSended: action.msg
            });
        case ActionTypes.REQUEST_ANALYZE:
            return Object.assign({}, state, {
                variants: null,
                isVariantsLoaded: true,
                searchParams:action.searchParams
            })

        default:
            return state
    }
}
