import config from '../../config'
import { closeModal } from './modalWindows'
import {fetchSamples} from './samplesList';
import gzip from '../utils/gzip'

/*
 * action types
 */
export const CHANGE_FILE_FOR_UPLOAD = 'CHANGE_FILE_FOR_UPLOAD'
export const REQUEST_FILE_UPLOAD = 'REQUEST_FILE_UPLOAD'
export const RECEIVE_FILE_UPLOAD = 'RECEIVE_FILE_UPLOAD'
export const FILE_UPLOAD_CHANGE_PROGRESS = 'FILE_UPLOAD_CHANGE_PROGRESS'
export const FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR'
export const CLEAR_UPLOAD_STATE = 'CLEAR_UPLOAD_STATE'
export const REQUEST_GZIP = 'REQUEST_GZIP'
export const RECEIVE_GZIP = 'RECEIVE_GZIP'

/*
 * action creators
 */
export function clearUploadState() {
    return {
        type: CLEAR_UPLOAD_STATE
    }
}

export function fileUploadError(msg) {
    return {
        type: FILE_UPLOAD_ERROR,
        msg
    }
}

function requestGzip() {
    return {
        type: REQUEST_GZIP
    }
}

function receiveGzip() {
    return {
        type: RECEIVE_GZIP
    }
}
export function changeFileForUpload(files) {
    const theFile = files[0]
    return (dispatch, getState) => {
        dispatch(clearUploadState())
        if (theFile.type === 'application/gzip' || theFile.type === 'application/x-gzip' || theFile.name.split('.').pop() === 'gz') {
            dispatch(changeFileForUploadAfterGzip(files))
        } else if (theFile.type === 'text/vcard' || theFile.type === 'text/directory' || theFile.name.split('.').pop() === 'vcf') {
            console.log('Not gzipped vcf')
            dispatch(requestGzip())
            gzip(theFile).then(file => {
                dispatch(changeFileForUploadAfterGzip([file]))
                dispatch(receiveGzip())
            })
        } else {
            console.error('Wrong file type. Type must be vcard or gzip')
            dispatch(fileUploadError('Unsupported file type: must be Variant Calling Format (VCF) 4.1 or higher or VCF compressed with gzip'))
        }
    }
}

function changeFileForUploadAfterGzip(files) {
    return {
        type: CHANGE_FILE_FOR_UPLOAD,
        files
    }
}

function requestFileUpload() {
    return {
        type: REQUEST_FILE_UPLOAD
    }
}

function receiveFileUpload(json) {
    return {
        type: RECEIVE_FILE_UPLOAD,
        operationId: json.operationId,
    }
}

export function uploadFile(files) {
    return (dispatch, getState) => {

        dispatch(requestFileUpload())
        dispatch(changeFileUploadProgress(0, 'ajax'))

        const formData = new FormData()
        formData.append('sample', getState().fileUpload.files[0]);

        return $.ajax(config.URLS.FILE_UPLOAD, {
                'type': 'POST',
                'headers': {"X-Session-Id": getState().auth.sessionId},
                'data': formData,
                'contentType': false,
                'processData': false,
                'xhrFields': {
                    // add listener to XMLHTTPRequest object directly for progress (jquery doesn't have this yet)
                    'onprogress': function (progress) {
                        console.log(progress);
                        // calculate upload progress
                        var percentage = Math.floor((progress.total / progress.total) * 100);
                        // log upload progress to console
                        console.log('progress', percentage);
                        dispatch(changeFileUploadProgress(percentage, 'ajax'))
                        if (percentage === 100) {
                            console.log('DONE!');
                        }
                    }
                }
            })
            .done(json => {
                dispatch(receiveFileUpload(json));
            })
            .fail(err => {
                console.error('Upload FAILED: ', err.responseText);
            });
    }

}


export function changeFileUploadProgress(progressValueFromAS, progressStatusFromAS) {
    return (dispatch, getState) => {
        dispatch(changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS))
        if (progressStatusFromAS === 'ready') {
            dispatch(closeModal('upload'));
            dispatch(fetchSamples());
        }
    }
}

function changeFileUploadProgressState(progressValueFromAS, progressStatusFromAS) {
    return {
        type: FILE_UPLOAD_CHANGE_PROGRESS,
        progressValueFromAS,
        progressStatusFromAS
    }
}


