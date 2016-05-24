import {receiveSearchedResults} from './variantsTable';
import {changeFileUploadProgress, fileUploadError} from './fileUpload';
/*
 * action types
 */
export const WS_CREATE_CONNECTION = 'WS_CREATE_CONNECTION';
export const WS_RECEIVE_ERROR = 'WS_RECEIVE_ERROR';
export const WS_RECEIVE_AS_ERROR = 'WS_RECEIVE_AS_ERROR';
export const WS_RECEIVE_CLOSE = 'WS_RECEIVE_MESSAGE';
export const WS_SEND_MESSAGE = 'WS_SEND_MESSAGE';

export const WS_TABLE_MESSAGE = 'WS_TABLE_MESSAGE';
export const WS_PROGRESS_MESSAGE = 'WS_PROGRESS_MESSAGE';
export const WS_OTHER_MESSAGE = 'WS_OTHER_MESSAGE';
export const PREPARE_ANALYZE = 'PREPARE_ANALYZE';
export const REQUEST_ANALYZE = 'REQUEST_ANALYZE';

export const WS_CLEAR_VARIANTS = 'WS_CLEAR_VARIANTS';
export const WS_ADD_COMMENT = 'WS_ADD_COMMENT';
export const WS_UPDATE_COMMENT = 'WS_UPDATE_COMMENT';
export const WS_DELETE_COMMENT = 'WS_DELETE_COMMENT';
export const REQUEST_SET_CURRENT_PARAMS = 'REQUEST_SET_CURRENT_PARAMS';


/*
 * other consts
 */

const WS_PROGRESS_STATUSES = {
    READY: 'ready'
};

const WS_OPERATION_TYPES = {
    UPLOAD: 'upload',
    SEARCH: 'search'
};

const WS_RESULT_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success'
};

/*
 * action creators
 */

export function addComment(commentData) {
    return {
        type: WS_ADD_COMMENT,
        commentData
    };
}

export function changeComment(commentData) {
    return {
        type: WS_UPDATE_COMMENT,
        commentData
    };
}

export function deleteComment(commentData, searchKey) {
    return {
        type: WS_DELETE_COMMENT,
        commentData,
        searchKey
    };
}
export function clearVariants() {
    return {
        type: WS_CLEAR_VARIANTS
    };
}

export function createWsConnection(wsConn) {
    return {
        type: WS_CREATE_CONNECTION,
        wsConn
    };
}

function tableMessage(wsData) {
    return {
        type: WS_TABLE_MESSAGE,
        wsData
    };
}

function progressMessage(wsData) {
    return {
        type: WS_PROGRESS_MESSAGE,
        wsData
    };
}

function receiveError(err) {
    return {
        type: WS_RECEIVE_ERROR,
        err
    };
}

function asError(err) {
    return {
        type: WS_RECEIVE_AS_ERROR,
        err
    };
}

function otherMessage(wsData) {
    console.error('Unexpected message in web socket: ' + JSON.stringify(wsData));
    return {
        type: WS_OTHER_MESSAGE,
        wsData
    };
}

function receiveSearchMessage(wsData) {
    return (dispatch, getState) => {
        if (wsData.result.status === WS_PROGRESS_STATUSES.READY) {
            dispatch(tableMessage(wsData));
            if (getState().variantsTable.isFilteringOrSorting || getState().variantsTable.isNextDataLoading) {
                dispatch(receiveSearchedResults());
            }
        } else {
            dispatch(progressMessage(wsData));
        }
    };
}

function receiveUploadMessage(wsData) {
    return (dispatch) => {
        dispatch(progressMessage(wsData)); // TODO Remove
        dispatch(changeFileUploadProgress(wsData.result.progress, wsData.result.status));
    };
}

function receiveErrorMessage(wsData) {
    return (dispatch) => {
        console.error('Error: ' + JSON.stringify(wsData.error));
        const message = wsData.error.message;
        if (wsData.operationType === WS_OPERATION_TYPES.UPLOAD) {
            dispatch(fileUploadError(message));
        } else {
            dispatch(asError(message));
        }
    };
}

function receiveMessage(msg) {
    return (dispatch) => {
        const wsData = JSON.parse(JSON.parse(msg));
        const {operationType, resultType} = wsData;
        if (resultType == WS_RESULT_TYPES.ERROR) {
            dispatch(receiveErrorMessage(wsData));
        } else if (operationType == WS_OPERATION_TYPES.SEARCH) {
            dispatch(receiveSearchMessage(wsData));
        } else if (operationType == WS_OPERATION_TYPES.UPLOAD) {
            dispatch(receiveUploadMessage(wsData));
        } else {
            dispatch(otherMessage(wsData));
        }
    };
}

function receiveClose(msg) {
    return {
        type: WS_RECEIVE_CLOSE,
        msg
    };
}

function sended(msg) {
    return {
        type: WS_SEND_MESSAGE,
        msg
    };
}

export function subscribeToWs(sessionId) {
    return (dispatch, getState) => {
        const conn = getState().websocket.wsConn;
        conn.onopen = () => {
            conn.send(JSON.stringify({sessionId}));
        };
        conn.onmessage = event => dispatch(receiveMessage(JSON.stringify(event.data)));
        conn.onerror = event => dispatch(receiveError(event.data));
        conn.onclose = event => dispatch(receiveClose(event.data));
    };
}

export function send(msg) {
    return (dispatch, getState) => {

        const conn = getState().websocket.wsConn;
        conn.send(msg);
        return dispatch(sended(msg));
    };
}

export function prepareAnalyze() {
    return {
        type: PREPARE_ANALYZE
    };
}

export function requestAnalyze(searchParams) {
    return {
        type: REQUEST_ANALYZE,
        searchParams
    };
}

export function requestSetCurrentParams(view, filter, sample, sampleFields) {
    return {
        type: REQUEST_SET_CURRENT_PARAMS,
        view,
        filter,
        sample,
        sampleFields
    };
}
