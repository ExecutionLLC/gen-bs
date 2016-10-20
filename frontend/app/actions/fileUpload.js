import config from '../../config';
import {fetchSamplesAsync} from './samplesList';
import gzip from '../utils/gzip';
import {fetchTotalFields} from './fields';
import Promise from 'bluebird';

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

let idCounter = 0;

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
            +' (VCF) 4.1 or higher or VCF compressed with gzip');
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

function receiveFileOperation(operationId, id) {
    return {
        type: RECEIVE_FILE_OPERATION,
        operationId,
        id
    };
}

function sendFile(file, onOperationId, onProgress, onError) {
    const formData = new FormData();
    formData.append('sample', file);
    formData.append('fileName', file.name);
    $.ajax(config.URLS.FILE_UPLOAD, {
        'type': 'POST',
        'data': formData,
        'contentType': false,
        'processData': false,
        'xhrFields': {
            // add listener to XMLHTTPRequest object directly for progress (jquery doesn't have this yet)
            'onprogress': function (progress) {
                // calculate upload progress
                var percentage = Math.floor((progress.total / progress.total) * 100);
                // log upload progress to console
                console.log('sendFile progress', progress, percentage);
                onProgress(percentage);
                if (percentage === 100) {
                    console.log('sendFile DONE!');
                }
            }
        }
    })
        .done(json => {
            onOperationId(json.operationId);
        })
        .fail(err => {
            onError(err);
        });

}

function changeFileUploadProgressState(progressValue, progressStatus, id) {
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


export function uploadFile() {
    return (dispatch, getState) => {
        getState().fileUpload.filesProcesses.forEach((fp) => {
            if (fp.isUploaded || fp.isUploading || !fp.isArchived || fp.isArchiving) {
                return;
            }
            dispatch(requestFileUpload(fp.id));
            dispatch(changeFileUploadProgress(0, 'ajax', fp.id));
            sendFile(
                fp.file,
                (operationId) => {
                    dispatch(receiveFileOperation(operationId, fp.id));
                },
                (percentage) => {
                    console.log('progress', percentage);
                    dispatch(changeFileUploadProgress(percentage, 'ajax', fp.id));
                },
                (err) => {
                    console.error('Upload FAILED: ', err.responseText);
                    dispatch(fileUploadError(fp.id, {code: null, message: err.responseText}));
                }
            );
        });
        
    };

}


export function changeFileUploadProgress(progressValue, progressStatus, id) {
    return (dispatch) => {
        dispatch(changeFileUploadProgressState(progressValue, progressStatus, id));
        if (progressStatus === 'ready') {
            dispatch(receiveFileUpload(id));
            dispatch(fetchTotalFields());
            dispatch(fetchSamplesAsync());
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

export function addFilesForUpload(files) {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            dispatch(clearUploadState());
            const filesWithIds = files.map((file) => ({id: idCounter++, file}));
            dispatch(addNoGZippedForUpload(filesWithIds));
            filesWithIds.forEach((fileWithId) => {
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
                        resolve();
                    },
                    (message) => {
                        console.error('Wrong file type. Type must be vcard or gzip:\n' + message);
                        dispatch(fileUploadError(fileWithId.id, {
                            code: null,
                            message
                        }));
                        reject(message);
                    }
                );
            });
        });
    };
}

export function clearUploadState() {
    return {
        type: CLEAR_UPLOAD_STATE
    };
}

export function fileUploadError(id, error) {
    return {
        type: FILE_UPLOAD_ERROR,
        error,
        id
    };
}
