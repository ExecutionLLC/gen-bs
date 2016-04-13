import * as ActionTypes from '../actions/websocket'

export default function websocket(state = {
    wsConn: null,
    lastMessageSended: null,
    messages: [],
    errors: [],
    closed: true,
    variants: null,
    variantsView:null,
    currentVariants: null,
    isVariantsEmpty: false,
    isVariantsValid: true,
    isVariantsLoading: false,
    progress: null
}, action) {
    switch (action.type) {
        case  ActionTypes.WS_DELETE_COMMENT:
        {
            const commentVariants = state.variants.slice();
            const deletedVariantIndex = _.findIndex(
                commentVariants, variant => variant.searchKey === action.searchKey
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
                commentVariants, variant => variant.searchKey === action.commentData.searchKey
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
                commentVariants, variant => variant.searchKey === action.commentData.searchKey
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
                        result[fieldValue.fieldId] = fieldValue.value;
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
                isVariantsLoading: false,
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
                isVariantsLoading: false,
                isVariantsValid: false
            });

        case ActionTypes.WS_RECEIVE_ERROR:
            return Object.assign({}, state, {
                errors: [
                    ...state.errors,
                    action.err
                ],
                isVariantsLoading: false
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
                isVariantsLoading: true,
                searchParams:action.searchParams
            });
        case ActionTypes.REQUEST_SET_CURRENT_PARAMS:
        {
            return Object.assign({}, state, {
                variantsView: action.view,
                variantsSampleFieldsList: action.sampleFields
            });
        }

        default:
            return state
    }
}
