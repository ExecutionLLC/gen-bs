import _ from 'lodash';

import * as ActionTypes from '../actions/websocket';

export default function websocket(state = {
    wsConn: null,
    error: null,
    closed: true,
    variants: null,
    variantsSamples: null,
    variantsView: null,
    variantsFilter: null,
    variantsModel: null,
    variantsAnalysis: null,
    variantsSampleFieldsList: [],
    currentVariants: null,
    isVariantsEmpty: false,
    isVariantsValid: true,
    isVariantsLoading: false,
    progress: null
}, action) {
    switch (action.type) {
        case  ActionTypes.WS_DELETE_COMMENT: {
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
        case ActionTypes.WS_UPDATE_COMMENT: {
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
        case ActionTypes.WS_ADD_COMMENT: {
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
                wsConn: action.wsConn,
                error: null
            });
        case ActionTypes.WS_TABLE_MESSAGE: {
            const resultData = _.map(action.wsData.result.data, row => {
                return Object.assign({}, row, {
                    fieldsHash: _.reduce(row.fields, (result, {fieldId, sampleId, value}) => {
                        result[`${fieldId}${sampleId ? '-' + sampleId : ''}`] = value;
                        return result;
                    }, {})
                });
            });
            return Object.assign({}, state, {
                variants: state.variants === null ? resultData : [...state.variants, ...(resultData || [])],
                currentVariants: resultData,
                isVariantsEmpty: (resultData && resultData.length === 0),
                isVariantsLoading: false,
                isVariantsValid: true
            });
        }
        case ActionTypes.WS_PROGRESS_MESSAGE:
            return Object.assign({}, state, {
                progress: action.wsData.result.progress
            });
        case ActionTypes.WS_RECEIVE_AS_ERROR:
            return Object.assign({}, state, {
                error: action.err,
                isVariantsLoading: false,
                isVariantsValid: false
            });

        case ActionTypes.WS_RECEIVE_ERROR:
            return Object.assign({}, state, {
                error: action.err,
                isVariantsLoading: false
            });
        case ActionTypes.WS_RECEIVE_CLOSE:
            return Object.assign({}, state, {
                closed: true
            });
        case ActionTypes.REQUEST_ANALYZE:
            return Object.assign({}, state, {
                variants: null,
                isVariantsLoading: true
            });
        case ActionTypes.REQUEST_SET_CURRENT_PARAMS: {
            return Object.assign({}, state, {
                variantsView: action.view, // used variantsView.viewListItems (if variantsView) at exportToFile, VariantsTableHead, VariantsTableRows
                variantsSamples: action.samples, // used variantsSample.fileName at exportToFile
                variantsFilter: action.filter, // unused
                variantsModel: action.model, // unused
                variantsSampleFieldsList: action.sampleFields, // used to check if field is requested at VariantsTableHead
                variantsAnalysis: action.analysis // used variantsAnalysis.id at saveExportedFileToServer
            });
        }

        default:
            return state;
    }
}
