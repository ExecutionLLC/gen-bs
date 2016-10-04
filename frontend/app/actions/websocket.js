import {receiveSearchedResults} from './variantsTable';
import {changeFileUploadProgressForOperationId, fileUploadErrorForOperationId} from './fileUpload';
import config from '../../config';

/*
 * action types
 */
export const WS_CREATE_CONNECTION = 'WS_CREATE_CONNECTION';
export const WS_RECEIVE_ERROR = 'WS_RECEIVE_ERROR';
export const WS_RECEIVE_AS_ERROR = 'WS_RECEIVE_AS_ERROR';
export const WS_RECEIVE_CLOSE = 'WS_RECEIVE_CLOSE';
export const WS_SEND_MESSAGE = 'WS_SEND_MESSAGE';

export const WS_TABLE_MESSAGE = 'WS_TABLE_MESSAGE';
export const WS_PROGRESS_MESSAGE = 'WS_PROGRESS_MESSAGE';
export const WS_OTHER_MESSAGE = 'WS_OTHER_MESSAGE';
export const REQUEST_ANALYZE = 'REQUEST_ANALYZE';

export const WS_CLEAR_VARIANTS = 'WS_CLEAR_VARIANTS';
export const WS_ADD_COMMENT = 'WS_ADD_COMMENT';
export const WS_UPDATE_COMMENT = 'WS_UPDATE_COMMENT';
export const WS_DELETE_COMMENT = 'WS_DELETE_COMMENT';
export const REQUEST_SET_CURRENT_PARAMS = 'REQUEST_SET_CURRENT_PARAMS';

export class TooManyWebSocketsError extends Error {
    constructor(message) {
        super(message || 'It seems you have another tab opened. Please close it and reload this page to continue.');
    }
}

let webSocketConnection = null;

/*
 * other consts
 */

const WS_PROGRESS_STATUSES = {
    READY: 'ready'
};

const WS_OPERATION_TYPES = {
    UPLOAD: 'UploadOperation',
    SEARCH: 'SearchOperation',
    OPEN: 'OpenSocket'
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

export function storeWsConnection(wsConn) {
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
            const {variantsTable} = getState();
            if (variantsTable.isFilteringOrSorting || variantsTable.isNextDataLoading) {
                dispatch(receiveSearchedResults());
            }
        } else {
            dispatch(progressMessage(wsData));
        }
    };
}

function receiveUploadMessage(wsData) {
    return (dispatch) => {
        dispatch(changeFileUploadProgressForOperationId(wsData.result.progress, wsData.result.status, wsData.operationId));
    };
}

function receiveErrorMessage(wsData) {
    return (dispatch) => {
        console.error('Error: ' + JSON.stringify(wsData.error));
        const error = wsData.error;
        if (wsData.operationType === WS_OPERATION_TYPES.UPLOAD) {
            dispatch(fileUploadErrorForOperationId(error, wsData.operationId));
        } else {
            dispatch(asError(error));
        }
    };
}

function receiveMessage(msg) {
    return (dispatch) => {
        const {operationType, resultType} = msg;
        if (resultType == WS_RESULT_TYPES.ERROR) {
            dispatch(receiveErrorMessage(msg));
        } else if (operationType == WS_OPERATION_TYPES.SEARCH) {
            dispatch(receiveSearchMessage(msg));
        } else if (operationType == WS_OPERATION_TYPES.UPLOAD) {
            dispatch(receiveUploadMessage(msg));
        } else {
            dispatch(otherMessage(msg));
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

function reconnectWS() {
    return (dispatch) => {
        setTimeout(
            () => dispatch(initWSConnectionAsync()),
            config.WEBSOCKET_RECONNECT_TIME_MS
        );
    };
}

export function subscribeToWsAsync() {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            webSocketConnection.onopen = () => {
                console.log('Socket connection is open');
            };
            webSocketConnection.onmessage = ({data}) => {
                const messageObject = JSON.parse(data);
                const {operationType, resultType} = messageObject;
                if (operationType === WS_OPERATION_TYPES.OPEN) {
                    if (resultType === WS_RESULT_TYPES.SUCCESS) {
                        resolve();
                    } else {
                        reject(new TooManyWebSocketsError());
                    }
                } else {
                    dispatch(receiveMessage(messageObject));
                }
            };
            webSocketConnection.onerror = event => {
                dispatch(receiveError(event.data));
            };
            webSocketConnection.onclose = event => {
                dispatch(receiveClose(event.data));
                if (!event.wasClean) {
                    dispatch(reconnectWS());
                }
            };
        });
    };
}

export function initWSConnectionAsync() {
    return (dispatch) => {
        // path just for redirecting to webserver (see nginx rule 'location ~ ^/api/(?<section>.*)'), did not used in webserver
        webSocketConnection = new WebSocket(`${config.URLS.WS}/api/ws`);
        return Promise.resolve(
        ).then(() => {
            dispatch(storeWsConnection(null));
            return dispatch(subscribeToWsAsync());
        });
    };
}

export function send(msg) {
    return (dispatch) => {
        webSocketConnection.send(msg);
        return dispatch(sended(msg));
    };
}

export function requestAnalyze() {
    return {
        type: REQUEST_ANALYZE
    };
}

export function requestSetCurrentParams(view, filter, samples, model, analysis) {
    return {
        type: REQUEST_SET_CURRENT_PARAMS,
        view,
        filter,
        samples,
        model,
        analysis
    };
}
