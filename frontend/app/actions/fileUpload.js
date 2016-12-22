import _ from 'lodash';
import gzip from '../utils/gzip';
import {fetchTotalFields} from './fields';
import Promise from 'bluebird';

import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';

/*
 * action types
 */
export const ADD_NOGZIPPED_FOR_UPLOAD = 'ADD_NOGZIPPED_FOR_UPLOAD';
export const ADD_GZIPPED_FILE_FOR_UPLOAD = 'ADD_GZIPPED_FILE_FOR_UPLOAD';
export const REQUEST_FILE_UPLOAD = 'REQUEST_FILE_UPLOAD';
export const RECEIVE_FILE_UPLOAD = 'RECEIVE_FILE_UPLOAD';
export const RECEIVE_FILE_OPERATION = 'RECEIVE_FILE_OPERATION';
export const FILE_UPLOAD_CHANGE_PROGRESS = 'FILE_UPLOAD_CHANGE_PROGRESS';
export const FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR';
export const CLEAR_UPLOAD_STATE = 'CLEAR_UPLOAD_STATE';
export const REQUEST_GZIP = 'REQUEST_GZIP';
export const RECEIVE_GZIP = 'RECEIVE_GZIP';
export const UPLOADS_LIST_RECEIVE = 'UPLOADS_LIST_RECEIVE';
export const UPLOADS_LIST_ADD_UPLOAD = 'UPLOADS_LIST_ADD_FILTER';
export const SET_CURRENT_UPLOAD_ID = 'SET_CURRENT_UPLOAD_ID';
export const INVALIDATE_CURRENT_UPLOAD_ID = 'INVALIDATE_CURRENT_UPLOAD_ID';
export const UPLOADS_LIST_REMOVE_UPLOAD = 'UPLOADS_LIST_REMOVE_UPLOAD';

export const fileUploadStatus = {
    ERROR: 'error',
    READY: 'ready'
};

const {sampleUploadsClient} = apiFacade;

const DELETE_UPLOAD_ERROR_MESSAGE = 'We are really sorry, but there is an error while deleting upload.' +
    ' Be sure we are working on resolving the issue. You can also try to reload page and try again.';

let idCounter = 0;
const requestAbortFunctions = {};

export function uploadsListReceive(uploads) {
    return {
        type: UPLOADS_LIST_RECEIVE,
        uploads
    };
}

export function filtersListAddFilter(upload) {
    return {
        type: UPLOADS_LIST_ADD_UPLOAD,
        upload
    };
}

export function setCurrentUploadId(uploadId) {
    return {
        type: SET_CURRENT_UPLOAD_ID,
        uploadId
    };
}

export function invalidateCurrentUploadId(metadata) {
    return {
        type: INVALIDATE_CURRENT_UPLOAD_ID,
        metadata
    };
}

export function uploadsListRemoveUpload(uploadId) {
    return {
        type: UPLOADS_LIST_REMOVE_UPLOAD,
        uploadId
    };
}

export function uploadsListServerRemoveUpload(uploadId) {
    return (dispatch) => {
        return new Promise((resolve) => {
            sampleUploadsClient.remove(uploadId, (error, response) => resolve({error, response}));
        }).then(({error, response}) => dispatch(handleApiResponseErrorAsync(DELETE_UPLOAD_ERROR_MESSAGE, error, response))
        ).then(() => {
            dispatch(uploadsListRemoveUpload(uploadId));
        });
    };
}

/*
 * action creators
 */

function requestGzip(id) {
    return {
        type: REQUEST_GZIP,
        id
    };
}

function receiveGzip(id) {
    return {
        type: RECEIVE_GZIP,
        id
    };
}

function addNoGZippedForUpload(files) {
    return {
        type: ADD_NOGZIPPED_FOR_UPLOAD,
        files
    };
}

/**
 * Make gzipped file or return the input file if already gzipped
 * @param {File} file
 * @param {function()} onGzipStart
 * @param {function(File)} onGzipped
 * @param {function(string)} onError
 */
function ensureGzippedFile(file, onGzipStart, onGzipped, onError) {
    if (file.type === 'application/gzip'
        || file.type === 'application/x-gzip'
        || file.name.split('.').pop() === 'gz') {
        onGzipped(file);
    } else if (file.type === 'text/vcard'
        || file.type === 'text/directory'
        || file.name.split('.').pop() === 'vcf') {
        onGzipStart();
        gzip(file).then(gzippedFile => onGzipped(gzippedFile));
    } else {
        onError('Unsupported file type: must be Variant Call Format'
            + ' (VCF) 4.1 or higher or VCF compressed with gzip');
    }
}

function addGZippedFileForUpload(file, id) {
    return {
        type: ADD_GZIPPED_FILE_FOR_UPLOAD,
        file,
        id
    };
}

function requestFileUpload(id) {
    return {
        type: REQUEST_FILE_UPLOAD,
        id
    };
}

function receiveFileUpload(id) {
    return {
        type: RECEIVE_FILE_UPLOAD,
        id
    };
}

function receiveFileOperation(upload, id) {
    return {
        type: RECEIVE_FILE_OPERATION,
        upload,
        id
    };
}

function sendFile(file, onOperationId, onProgress, onError) {
    return sampleUploadsClient.upload(
        file,
        onProgress,
        (err, res) => {
            if (err) {
                onError(err);
            } else {
                onOperationId(res);
            }
        }
    );
}

export function changeFileUploadProgressState(progressValue, progressStatus, id) {
    return {
        type: FILE_UPLOAD_CHANGE_PROGRESS,
        progressValue,
        progressStatus,
        id
    };
}

function findFileProcessForOperationId(state, operationId) {
    return state.fileUpload.filesProcesses.find((fp) => fp.operationId === operationId);
}

export function uploadFiles(files) {
    return (dispatch) => {
        return Promise.mapSeries(files, (file) => {
            return dispatch(addFileForUpload(file))
                .then((id) => dispatch(uploadFile(id)));
        });
    };
}


export function uploadFile(fileUploadId) {
    return (dispatch, getState) => {
        const fp = _.find(getState().fileUpload.filesProcesses, {id: fileUploadId});
        if (fp.isUploaded || fp.isUploading || !fp.isArchived || fp.isArchiving || fp.operationId) {
            return;
        }
        dispatch(requestFileUpload(fp.id));
        dispatch(changeFileUploadProgress(0, 'ajax', fp.id));
        const abortRequest = sendFile(
            fp.file,
            (operationId) => {
                delete requestAbortFunctions[fp.id];
                dispatch(receiveFileOperation(operationId, fp.id));
            },
            (percentage) => {
                console.log('progress', percentage);
                dispatch(changeFileUploadProgress(percentage, 'ajax', fp.id));
            },
            (err) => {
                console.error('Upload FAILED: ', err.responseText);
                delete requestAbortFunctions[fp.id];
                dispatch(fileUploadError(fp.id, {
                    code: null,
                    message: err.responseText
                }));
            }
        );
        requestAbortFunctions[fp.id] = abortRequest;
    };
}

export function abortRequest(id) {
    return (dispatch) => {
        if (requestAbortFunctions[id]) {
            requestAbortFunctions[id]();
            delete requestAbortFunctions[id];
        }
        dispatch(uploadsListRemoveUpload(id));
    };
}

export function changeFileUploadProgress(progressValue, progressStatus, id) {
    return (dispatch) => {
        dispatch(changeFileUploadProgressState(progressValue, progressStatus, id));
        if (progressStatus === fileUploadStatus.READY) {
            dispatch(receiveFileUpload(id));
            dispatch(fetchTotalFields());
        }
    };
}

export function changeFileUploadProgressForOperationId(progressValue, progressStatus, operationId) {
    return (dispatch, getState) => {
        const fileProcess = findFileProcessForOperationId(getState(), operationId);
        if (fileProcess) {
            dispatch(changeFileUploadProgress(progressValue, progressStatus, fileProcess.id));
        }
    };
}

export function fileUploadErrorForOperationId(error, operationId) {
    return (dispatch, getState) => {
        const fileProcess = findFileProcessForOperationId(getState(), operationId);
        if (fileProcess) {
            dispatch(fileUploadError(fileProcess.id, error));
        }
    };
}


function addFileForUpload(file) {
    return (dispatch) => {
        return new Promise((resolve) => {
            const fileWithId = {id: idCounter++, file};
            dispatch(addNoGZippedForUpload([fileWithId]));
            ensureGzippedFile(
                fileWithId.file,
                () => {
                    dispatch(requestGzip(fileWithId.id));
                },
                (gzippedFile) => {
                    dispatch(addGZippedFileForUpload(gzippedFile, fileWithId.id));
                    if (gzippedFile !== fileWithId.file) {
                        dispatch(receiveGzip(fileWithId.id));
                    }
                    return resolve(fileWithId.id);
                },
                (message) => {
                    console.error('Wrong file type. Type must be vcard or gzip:\n' + message);
                    dispatch(fileUploadError(fileWithId.id, {
                        code: null,
                        message
                    }));
                    return resolve(fileWithId.id);
                }
            );
        });
    };
}


export function clearUploadState() {
    return {
        type: CLEAR_UPLOAD_STATE
    };
}

function fileUploadError(id, error) {
    return {
        type: FILE_UPLOAD_ERROR,
        error,
        id
    };
}
