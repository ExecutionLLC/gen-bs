import _ from 'lodash';
import {
    gzip,
    isGzipFormat
} from '../utils/gzip';
import {fetchTotalFields} from './fields';
import Promise from 'bluebird';
import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';
import {samplesListAddOrUpdateSamples} from './samplesList';
/*
 * action types
 */
export const ADD_NOGZIPPED_FOR_UPLOAD = 'ADD_NOGZIPPED_FOR_UPLOAD';
export const ADD_GZIPPED_FILE_FOR_UPLOAD = 'ADD_GZIPPED_FILE_FOR_UPLOAD';
export const REQUEST_FILE_UPLOAD = 'REQUEST_FILE_UPLOAD';
export const RECEIVE_FILE_UPLOAD = 'RECEIVE_FILE_UPLOAD';
export const SAVE_FILE_OPERATION = 'SAVE_FILE_OPERATION';
export const FILE_UPLOAD_CHANGE_PROGRESS = 'FILE_UPLOAD_CHANGE_PROGRESS';
export const SAVE_UNKNOWN_UPLOAD_PROGRESS = 'SAVE_UNKNOWN_UPLOAD_PROGRESS';
export const SAVE_UNKNOWN_UPLOAD_ERROR = 'SAVE_UNKNOWN_UPLOAD_ERROR';
export const ERASE_UNKNOWN_UPLOAD_EVENT = 'ERASE_UNKNOWN_UPLOAD_EVENT';
export const FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR';
export const REQUEST_GZIP = 'REQUEST_GZIP';
export const RECEIVE_GZIP = 'RECEIVE_GZIP';
export const UPLOADS_LIST_RECEIVE = 'UPLOADS_LIST_RECEIVE';
export const UPLOADS_LIST_ADD_UPLOAD = 'UPLOADS_LIST_ADD_UPLOAD';
export const SET_CURRENT_UPLOAD_ID = 'SET_CURRENT_UPLOAD_ID';
export const INVALIDATE_CURRENT_UPLOAD_ID = 'INVALIDATE_CURRENT_UPLOAD_ID';
export const UPLOADS_LIST_REMOVE_UPLOAD = 'UPLOADS_LIST_REMOVE_UPLOAD';

export const fileUploadStatus = {
    ERROR: 'error',
    READY: 'ready', // equals to WS_PROGRESS_STATUSES.READY
    AJAX: 'ajax',
    TASK_RUNNING: 'task_running',
    IN_PROGRESS: 'in_progress' // seems like did not received
};

export const SAMPLE_UPLOAD_STATE = { // equals to WS_SAMPLE_UPLOAD_STATE
    UNCONFIRMED: 'unconfirmed', // the sample was created after header parsing on WS
    NOT_FOUND: 'not_found', // the sample was not found during parsing on AS
    COMPLETED: 'completed', // the sample was successfully parsed on AS
    ERROR: 'error' // an error has occurred while parsing the file with this sample.
};

const {sampleUploadsClient} = apiFacade;

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

export function invalidateCurrentUploadId(samples) {
    return {
        type: INVALIDATE_CURRENT_UPLOAD_ID,
        samples
    };
}

export function uploadsListRemoveUpload(uploadId) {
    return {
        type: UPLOADS_LIST_REMOVE_UPLOAD,
        uploadId
    };
}

export function uploadsListServerRemoveUpload(uploadId) {
    return (dispatch, getState) => {
        return new Promise((resolve) => {
            sampleUploadsClient.remove(uploadId, (error, response) => resolve({error, response}));
        }).then(({error, response}) => {
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('errors.deleteUploadError'), error, response));
        }).then(() => {
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
 * @param {Object} p
 * @param {function()} onGzipStart
 * @param {function(File)} onGzipped
 * @param {function(string)} onError
 */
function ensureGzippedFile(file, p, onGzipStart, onGzipped, onError) {
    const fileExt = file.name.split('.').pop();
    if (!(file.type === 'text/vcard' || file.type === 'text/directory' || fileExt === 'vcf' || fileExt === 'txt') &&
        !(file.type === 'application/gzip' || file.type === 'application/x-gzip' || fileExt === 'gz')) {
        onError(p.t('samples.errors.unsupportedFileFormat'));
    } else {
        isGzipFormat(file).then(isGz => {
            if (isGz) {
                onGzipped(file);
            } else {
                onGzipStart();
                gzip(file).then(gzippedFile => onGzipped(gzippedFile));
            }
        });
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

function saveFileOperation(upload, id) {
    return {
        type: SAVE_FILE_OPERATION,
        upload,
        id
    };
}

function receiveFileOperation(upload, id) {
    return (dispatch, getState) => {
        dispatch(saveFileOperation(upload, id));
        const {fileUpload: {unknownEvents}} = getState();
        if (unknownEvents && unknownEvents[upload.id]) {
            const event = unknownEvents[upload.id];
            if (event.error) {
                dispatch(fileUploadError(id, event.error));
                dispatch(eraseUnknownUploadEvent(upload.id));
            } else if (event.progressValue && event.progressStatus) {
                dispatch(changeFileUploadProgress(event.progressValue, event.progressStatus, id));
                dispatch(eraseUnknownUploadEvent(upload.id));
            }
        }
    };
}

function sendFile(file, onUploaded, onProgress, onError) {
    return sampleUploadsClient.upload(
        file,
        onProgress,
        (err, res) => {
            if (err) {
                onError(err);
            } else {
                onUploaded(res);
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

export function saveUnknownUploadProgress(progressValue, progressStatus, operationId) {
    return {
        type: SAVE_UNKNOWN_UPLOAD_PROGRESS,
        progressValue,
        progressStatus,
        operationId
    };
}

export function saveUnknownUploadError(error, operationId) {
    return {
        type: SAVE_UNKNOWN_UPLOAD_ERROR,
        error,
        operationId
    };
}

export function eraseUnknownUploadEvent(operationId) {
    return {
        type: ERASE_UNKNOWN_UPLOAD_EVENT,
        operationId
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
        dispatch(changeFileUploadProgress(0, fileUploadStatus.AJAX, fp.id));
        const abortRequest = sendFile(
            fp.file,
            (upload) => {
                delete requestAbortFunctions[fp.id];
                dispatch(receiveFileOperation(upload, fp.id));
                dispatch(samplesListAddOrUpdateSamples(upload.sampleList));
            },
            (percentage) => {
                console.log('progress', percentage);
                dispatch(changeFileUploadProgress(percentage, fileUploadStatus.AJAX, fp.id));
            },
            (err) => {
                console.error('Upload FAILED: ', err);
                delete requestAbortFunctions[fp.id];
                dispatch(fileUploadError(fp.id, {
                    code: null,
                    message: '' + err
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
        } else {
            dispatch(saveUnknownUploadProgress(progressValue, progressStatus, operationId));
        }
    };
}

export function fileUploadErrorForOperationId(error, operationId) {
    return (dispatch, getState) => {
        const fileProcess = findFileProcessForOperationId(getState(), operationId);
        if (fileProcess) {
            dispatch(fileUploadError(fileProcess.id, error));
        } else {
            dispatch(saveUnknownUploadError(error, operationId));
        }
    };
}


function addFileForUpload(file) {
    return (dispatch, getState) => {
        const p = getP(getState());
        return new Promise((resolve) => {
            const fileWithId = {id: idCounter++, file};
            dispatch(addNoGZippedForUpload([fileWithId]));
            ensureGzippedFile(
                fileWithId.file,
                p,
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


function fileUploadError(id, error) {
    return {
        type: FILE_UPLOAD_ERROR,
        error,
        id
    };
}
