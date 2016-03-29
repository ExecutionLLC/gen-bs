import { initSearchInResultsParams, receiveSearchedResults } from './variantsTable'
import { changeFileUploadProgress, fileUploadError } from './fileUpload'
/*
 * action types
 */
export const WS_CREATE_CONNECTION = 'WS_CREATE_CONNECTION';
export const WS_RECEIVE_ERROR = 'WS_RECEIVE_ERROR';
export const WS_RECEIVE_AS_ERROR = 'WS_RECEIVE_AS_ERROR';
export const WS_RECEIVE_AS_UPLOAD_ERROR = 'WS_RECEIVE_AS_UPLOAD_ERROR';
export const WS_RECEIVE_CLOSE = 'WS_RECEIVE_MESSAGE';
export const WS_SEND_MESSAGE = 'WS_SEND_MESSAGE';

export const WS_TABLE_MESSAGE = 'WS_TABLE_MESSAGE';
export const WS_PROGRESS_MESSAGE = 'WS_PROGRESS_MESSAGE';
export const WS_OTHER_MESSAGE = 'WS_OTHER_MESSAGE';
export const REQUEST_ANALYZE = 'REQUEST_ANALYZE';

export const WS_CLEAR_VARIANTS = 'WS_CLEAR_VARIANTS';
export const WS_ADD_COMMENT = 'WS_ADD_COMMENT';
export const WS_UPDATE_COMMENT = 'WS_UPDATE_COMMENT';
export const WS_DELETE_COMMENT='WS_DELETE_COMMENT';
export const REQUEST_CHANGE_VIEW='REQUEST_CHANGE_VIEW';


/*
 * other consts
 */


/*
 * action creators
 */

export  function addComment(commentData){
    return {
        type: WS_ADD_COMMENT,
        commentData
    }
}

export  function changeComment(commentData){
    return {
        type: WS_UPDATE_COMMENT,
        commentData
    }
}

export  function deleteComment(commentData,search_key){
    return {
        type: WS_DELETE_COMMENT,
        commentData,
        search_key
    }
}
export function clearVariants() {
    return {
        type: WS_CLEAR_VARIANTS
    }
}

export function createWsConnection(wsConn) {
    return {
        type: WS_CREATE_CONNECTION,
        wsConn
    }
}

function tableMessage(wsData) {
    return {
        type: WS_TABLE_MESSAGE,
        wsData
    }
}

function progressMessageRouter(wsData) {
    return (dispatch, getState) => {
        dispatch(progressMessage(wsData));

        if (getState().fileUpload.operationId === wsData.operation_id) {
            dispatch(changeFileUploadProgress(wsData.result.progress, wsData.result.status));
        }
    }
}

function progressMessage(wsData) {
    return {
        type: WS_PROGRESS_MESSAGE,
        wsData
    }
}

function receiveError(err) {
    return {
        type: WS_RECEIVE_ERROR,
        err
    };
}

function asErrorRouter(wsData) {
    return (dispatch, getState) => {

        if (getState().fileUpload.operationId === wsData.operation_id) {
            dispatch(fileUploadError(wsData.result.error.message))
        } else {
            dispatch(asError(wsData.result.error))
        }
    }
}

function asError(err) {
    return {
        type: WS_RECEIVE_AS_ERROR,
        err
    };
}

function otherMessage(wsData) {
    return {
        type: WS_OTHER_MESSAGE,
        wsData
    };
}

function receiveMessage(msg) {
    return (dispatch, getState) => {
        const wsData = JSON.parse(JSON.parse(msg));
        console.log('wsData.result', wsData.result);
        console.log('wsData.operation_id', wsData.operation_id);
        if (wsData.result) {
            if (wsData.result.sample_id && getState().fileUpload.operationId !== wsData.operation_id) {
                dispatch(tableMessage(wsData));
                if (getState().variantsTable.isFilteringOrSorting) {
                    dispatch(receiveSearchedResults())
                }
            } else if (wsData.result.progress !== undefined) {
                dispatch(progressMessageRouter(wsData));
            } else if (wsData.result.error) {
                dispatch(asErrorRouter(wsData));
            } else {
                dispatch(otherMessage(wsData));
            }
        } else {
            dispatch(otherMessage(wsData));
        }
    }
}

function receiveClose(msg) {
    return {
        type: WS_RECEIVE_CLOSE,
        msg
    }
}

function sended(msg) {
    return {
        type: WS_SEND_MESSAGE,
        msg
    }
}

export function subscribeToWs(sid) {
    return (dispatch, getState) => {
        const conn = getState().websocket.wsConn;
        conn.onopen = event => {
            conn.send(JSON.stringify({session_id: sid}));
        };
        conn.onmessage = event => dispatch(receiveMessage(JSON.stringify(event.data)));
        conn.onerror = event => dispatch(receiveError(event.data));
        conn.onclose = event => dispatch(receiveClose(event.data));
    }
}

export function send(msg) {
    return (dispatch, getState) => {

        const conn = getState().websocket.wsConn;
        conn.send(msg);
        return dispatch(sended(msg));
    };
}

export function requestAnalyze(searchParams) {
    return {
        type: REQUEST_ANALYZE,
        searchParams
    };
}

export function requestChangeView(view) {
    return {
        type: REQUEST_CHANGE_VIEW,
        view
    };
}
