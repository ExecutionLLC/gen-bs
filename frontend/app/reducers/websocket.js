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
        {
            const commentVariants = state.variants.slice();
            const deletedVariantIndex = _.findIndex(
                commentVariants, variant => variant.search_key === action.search_key
            );
            const deletedVariant = commentVariants[deletedVariantIndex];
            const newComments = deletedVariant.comments.slice(1);
            const newVariant = Object.assign({}, deletedVariant, {
                comments: newComments
            });
            commentVariants[deletedVariantIndex] = newVariant;
            return Object.assign({}, state, {
                variants: commentVariants
            });
        }
        case ActionTypes.WS_UPDATE_COMMENT:
        {
            const commentVariants = state.variants.slice();
            const updatedVariantIndex = _.findIndex(
                commentVariants, variant => variant.search_key === action.commentData.search_key
            );
            const updatedVariant = commentVariants[updatedVariantIndex];
            const newComments = updatedVariant.comments.slice();
            newComments[0].comment = action.commentData.comment;
            const newVariant = Object.assign({}, updatedVariant, {
                comments: newComments
            });
            commentVariants[updatedVariantIndex] = newVariant;
            return Object.assign({}, state, {
                variants: commentVariants
            });
        }
        case ActionTypes.WS_ADD_COMMENT:
        {
            const commentVariants = state.variants.slice();
            const addCommentVariantIndex = _.findIndex(
                commentVariants, variant => variant.search_key === action.commentData.search_key
            );
            const addVariant = commentVariants[addCommentVariantIndex];
            const newComments = addVariant.comments.slice();
            newComments.push({
                'id': action.commentData.id,
                'comment': action.commentData.comment
            });
            const newVariant = Object.assign({}, addVariant, {
                comments: newComments
            });
            commentVariants[addCommentVariantIndex] = newVariant;
            return Object.assign({}, state, {
                variants: commentVariants
            });
        }
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
            const resultData = _.map(action.wsData.result.data, row => {
                return Object.assign({}, row, {
                    fieldsHash: _.reduce(row.fields, (result, fieldValue) => {
                        result[fieldValue.field_id] = fieldValue.value;
                        return result;
                    }, {})
                });
            });
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
