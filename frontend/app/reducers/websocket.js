import _ from 'lodash';

import {assign} from '../utils/immutable';
import immutableArray from '../utils/immutableArray';
import * as ActionTypes from '../actions/websocket';

function reduceDeleteComment(action, state) {
    const {variants} = state;
    const {searchKey} = action;
    const newVariants = _.map(variants, variant => {
        return variant.searchKey === searchKey ? {
            ...variant,
            comments: variant.comments.slice(1)
        } : variant;
    });
    return assign(state, {
        variants: newVariants
    });
}

function reduceUpdateComment(action, state) {
    const {variants} = state;
    const {commentData:{searchKey, comment}} = action;

    const newVariants = _.map(variants, variant => {
        return variant.searchKey === searchKey ? {
            ...variant,
            comments: immutableArray.assign(variant.comments, 0, {
                comment
            })
        } : variant;
    });
    return assign(state, {
        variants: newVariants
    });
}

function reduceAddComment(action, state) {
    const {variants} = state;
    const {commentData:{searchKey, comment, id}} = action;
    const newVariants = _.map(variants, variant => {
        return variant.searchKey === searchKey ? {
            ...variant,
            comments: immutableArray.append(variant.comments, {
                id,
                comment
            })
        } : variant;
    });
    return assign(state, {
        variants: newVariants
    });
}

function reduceTableMessage(action, state) {
    const resultData = action.wsData.result.data;
    const newVariants = state.variants === null ? resultData : [...state.variants, ...(resultData || [])];
    return Object.assign({}, state, {
        variants: newVariants,
        variantsHeader: action.wsData.result.header,
        currentVariants: resultData,
        isVariantsEmpty: (newVariants && newVariants.length === 0),
        isVariantsLoading: false,
        isVariantsValid: true,
        variantsError: null
    });
}

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
    currentVariants: null,
    isVariantsEmpty: false,
    isVariantsValid: true,
    variantsError: null,
    isVariantsLoading: false,
    progress: null
}, action) {
    switch (action.type) { // TODO extract reducers
        case  ActionTypes.WS_DELETE_COMMENT:
            return reduceDeleteComment(action, state);
        case ActionTypes.WS_UPDATE_COMMENT:
            return reduceUpdateComment(action, state);
        case ActionTypes.WS_ADD_COMMENT:
            return reduceAddComment(action, state);
        case ActionTypes.WS_CLEAR_VARIANTS:
            return Object.assign({}, state, {
                variants: null,
                currentVariants: null
            });
        case ActionTypes.WS_STORE_CONNECTION:
            return Object.assign({}, state, {
                wsConn: action.wsConn,
                error: null
            });
        case ActionTypes.WS_TABLE_MESSAGE:
            return reduceTableMessage(action, state);
        case ActionTypes.WS_PROGRESS_MESSAGE:
            return Object.assign({}, state, {
                progress: action.wsData.result.progress
            });
        case ActionTypes.WS_RECEIVE_AS_ERROR:
            return Object.assign({}, state, {
                error: action.err,
                isVariantsLoading: false,
                isVariantsValid: false,
                variantsError: action.err
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
        case ActionTypes.WS_RECEIVE_OPEN:
            return Object.assign({}, state, {
                closed: false
            });
        case ActionTypes.REQUEST_ANALYZE:
            return Object.assign({}, state, {
                variants: null,
                isVariantsLoading: true
            });
        case ActionTypes.REQUEST_SET_CURRENT_PARAMS: {
            return Object.assign({}, state, {
                variantsView: action.view, // unused
                variantsSamples: action.samples, // used variantsSample.fileName at exportToFile and at renderFieldHeader
                variantsFilter: action.filter, // unused
                variantsModel: action.model, // unused
                variantsAnalysis: action.analysis // used variantsAnalysis.id and .samples at saveExportedFileToServer, used !!variantsAnalysis and .samples in variants table
            });
        }
        default:
            return state;
    }
}
