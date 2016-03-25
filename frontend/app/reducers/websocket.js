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
            const deleteCommentVariants = state.variants.slice(0,state.variants.length);
            const deleteVariantIndex = _.findIndex(deleteCommentVariants, variant => variant.search_key === action.search_key);
            const deleteVariant = deleteCommentVariants[deleteVariantIndex];
            let newDeleteComments = deleteVariant.comments.slice(1,deleteVariant.comments.length);
            const newDeleteVariant = {
                comments:newDeleteComments,
                fields:deleteVariant.fields,
                fieldsHash:deleteVariant.fieldsHash,
                search_key:deleteVariant.search_key
            };
            deleteCommentVariants[deleteVariantIndex] = newDeleteVariant;
            return Object.assign({}, state, {
                    variants: deleteCommentVariants
            });
        case ActionTypes.WS_UPDATE_COMMENT:
            const updateCommentVariants = state.variants.slice(0,state.variants.length);
            const updatedVariantIndex = _.findIndex(updateCommentVariants, variant => variant.search_key === action.commentData.search_key);
            const updatedVariant = updateCommentVariants[updatedVariantIndex];
            let newUpdateComments = updatedVariant.comments.slice(0,updatedVariant.comments.length);
            newUpdateComments[0].comment = action.commentData.comment;
            const newUpdateVariant = {
                comments:newUpdateComments,
                fields:updatedVariant.fields,
                fieldsHash:updatedVariant.fieldsHash,
                search_key:updatedVariant.search_key
            };
            updateCommentVariants[updatedVariantIndex] = newUpdateVariant;
            return Object.assign({}, state, {
                variants: updateCommentVariants
            });
        case ActionTypes.WS_ADD_COMMENT:
            const addCommentVariants = state.variants.slice(0,state.variants.length);
            const addCommentVariantIndex = _.findIndex(addCommentVariants, variant => variant.search_key === action.commentData.search_key);
            const addVariant = addCommentVariants[addCommentVariantIndex];
            let newAddComments = addVariant.comments.slice(0,addVariant.comments.length);
            newAddComments.push({
                'id':action.commentData.id,
                'comment':action.commentData.comment
            });
            const newAddVariant = {
                comments:newAddComments,
                fields:addVariant.fields,
                fieldsHash:addVariant.fieldsHash,
                search_key:addVariant.search_key
            };
            addCommentVariants[addCommentVariantIndex] = newAddVariant;
            return Object.assign({}, state, {
                variants: addCommentVariants
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
