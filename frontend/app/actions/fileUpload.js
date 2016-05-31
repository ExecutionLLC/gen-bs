import config from '../../config';
import {closeModal} from './modalWindows';
import {fetchSamples} from './samplesList';
import gzip from '../utils/gzip';
import {fetchTotalFields} from './fields';

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
    };
}

export function fileUploadError(id, error) {
    return {
        type: FILE_UPLOAD_ERROR,
        error,
        id
    };
}

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
        gzip(file).then(gzippedFile => {
            setTimeout(() => {onGzipped(gzippedFile)}, 1000); // TODO: remove before merge
        })
    } else {
        onError('Unsupported file type: must be Variant Calling Format'
            +' (VCF) 4.1 or higher or VCF compressed with gzip');
    }
}

export function addFilesForUpload(files) {
    return (dispatch, getState) => {
        dispatch(clearUploadState());
        const filesWithIds = files.map((file) => ({id: Math.random(), file: file}));
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
                },
                (message) => {
                    console.error('Wrong file type. Type must be vcard or gzip');
                    dispatch(fileUploadError(fileWithId.id, message));
                }
            );
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

function receiveFileOperation(operationId, id) {
    return {
        type: RECEIVE_FILE_OPERATION,
        operationId,
        id
    };
}

function sendFile(file, sessionId, onOperationId, onProgress, onError) {
    const formData = new FormData();
    formData.append('sample', file);
    $.ajax(config.URLS.FILE_UPLOAD, {
        'type': 'POST',
        'headers': {'X-Session-Id': sessionId},
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
        getState().fileUpload.filesProcesses.forEach((fp) => {
            if (fp.isUploaded || fp.isUploading || !fp.isArchived || fp.isArchiving) {
                return;
            }
            dispatch(requestFileUpload(fp.id));
            dispatch(changeFileUploadProgress(0, 'ajax', fp.id));
            sendFile(
                fp.file,
                getState().auth.sessionId,
                (operationId) => {
                    dispatch(receiveFileOperation(operationId, fp.id));
                },
                (percentage) => {
                    console.log('progress', percentage);
                    dispatch(changeFileUploadProgress(percentage, 'ajax', fp.id));
                },
                (err) => {
                    console.error('Upload FAILED: ', err.responseText);
                    dispatch(fileUploadError(fp.id, err.responseText))
                }
            );
        });
        
    }

}


export function changeFileUploadProgress(progressValueFromAS, progressStatusFromAS, id) {
    return (dispatch) => {
        dispatch(changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS, id));
        if (progressStatusFromAS === 'ready') {
            dispatch(receiveFileUpload(id));
            dispatch(fetchTotalFields());
            dispatch(closeModal('upload'));
            dispatch(fetchSamples());
        }
    };
}

function changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS, id) {
    return {
        type: FILE_UPLOAD_CHANGE_PROGRESS,
        progressValueFromAS,
        progressStatusFromAS,
        id
    };
}


