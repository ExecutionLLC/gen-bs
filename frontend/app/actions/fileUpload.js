import config from '../../config'
import { closeModal } from './modalWindows'
import {fetchSamples} from './samplesList';
import gzip from '../utils/gzip'
import {fetchTotalFields} from "./fields";

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

/*
 * action creators
 */
export function clearUploadState() {
    return {
        type: CLEAR_UPLOAD_STATE
    }
}

export function fileUploadError(msg, index) {
    return {
        type: FILE_UPLOAD_ERROR,
        msg,
        index
    }
}

function requestGzip(index) {
    return {
        type: REQUEST_GZIP,
        index
    }
}

function receiveGzip(index) {
    return {
        type: RECEIVE_GZIP,
        index
    }
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
    if (file.type === 'application/gzip' || file.type === 'application/x-gzip' || file.name.split('.').pop() === 'gz') {
        onGzipped(file);
    } else if (file.type === 'text/vcard' || file.type === 'text/directory' || file.name.split('.').pop() === 'vcf') {
        onGzipStart();
        gzip(file).then(gzippedFile => {
            onGzipped(gzippedFile);
        })
    } else {
        onError('Unsupported file type: must be Variant Calling Format (VCF) 4.1 or higher or VCF compressed with gzip');
    }
}

export function addFilesForUpload(files) {
    return (dispatch, getState) => {
        dispatch(clearUploadState());
        const addedFilesIndex = getState().fileUpload.filesProcesses.length;
        dispatch(addNoGZippedForUpload(files));
        ensureGzippedFile(
            files[0],
            () => {
                dispatch(requestGzip(null));
            },
            (gzippedFile) => {
                dispatch(addGZippedFileForUpload([gzippedFile], null));
                if (gzippedFile !== files[0]) {
                    dispatch(receiveGzip(null));
                }
            },
            (message) => {
                console.error('Wrong file type. Type must be vcard or gzip');
                dispatch(fileUploadError(message, null))
            }
        );
        files.forEach((file, fileLocalIndex) => {
            const fileIndex = addedFilesIndex + fileLocalIndex;
            ensureGzippedFile(
                file,
                () => {
                    dispatch(requestGzip(fileIndex));
                },
                (gzippedFile) => {
                    dispatch(addGZippedFileForUpload([gzippedFile], fileIndex));
                    if (gzippedFile !== file) {
                        dispatch(receiveGzip(fileIndex));
                    }
                },
                (message) => {
                    console.error('Wrong file type. Type must be vcard or gzip');
                    dispatch(fileUploadError(message, fileIndex));
                }
            );
        });
    }
}

function addGZippedFileForUpload(files, index) {
    return {
        type: ADD_GZIPPED_FILE_FOR_UPLOAD,
        files,
        index
    }
}

function requestFileUpload(index) {
    return {
        type: REQUEST_FILE_UPLOAD,
        index
    }
}

function receiveFileUpload(index) {
    return {
        type: RECEIVE_FILE_UPLOAD,
        index
    }
}

function receiveFileOperation(json, index) {
    return {
        type: RECEIVE_FILE_OPERATION,
        operationId: json.operationId,
        index
    }
}

function sendFile(file, sessionId, onOperationId, onProgress, onError) {
    const formData = new FormData();
    formData.append('sample', file);
    $.ajax(config.URLS.FILE_UPLOAD, {
        'type': 'POST',
        'headers': {"X-Session-Id": sessionId},
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

export function uploadFile() {
    return (dispatch, getState) => {

        dispatch(requestFileUpload());
        dispatch(changeFileUploadProgress(0, 'ajax', null));

        sendFile(
            getState().fileUpload.files[0],
            getState().auth.sessionId,
            (operationId) => {
                dispatch(receiveFileOperation({operationId: operationId}, null));
            },
            (percentage) => {
                console.log('progress', percentage);
                dispatch(changeFileUploadProgress(percentage, 'ajax', null));
                if (percentage === 100) {
                    console.log('DONE!');
                }
            },
            (err) => {
                console.error('Upload FAILED: ', err.responseText);
            }
        );
    }

}


export function changeFileUploadProgress(progressValueFromAS, progressStatusFromAS, index) {
    return (dispatch, getState) => {
        dispatch(changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS, index));
        if (progressStatusFromAS === 'ready') {
            dispatch(receiveFileUpload());
            dispatch(fetchTotalFields());
            //dispatch(closeModal('upload'));
            dispatch(fetchSamples());
        }
    }
}

function changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS, index) {
    return {
        type: FILE_UPLOAD_CHANGE_PROGRESS,
        progressValueFromAS,
        progressStatusFromAS
    }
}


