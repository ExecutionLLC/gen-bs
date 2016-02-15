import config from '../../config'

/*
 * action types
 */
export const CHANGE_FILE_FOR_UPLOAD = 'CHANGE_FILE_FOR_UPLOAD'
export const REQUEST_FILE_UPLOAD = 'REQUEST_FILE_UPLOAD'
export const RECEIVE_FILE_UPLOAD = 'RECEIVE_FILE_UPLOAD'

/*
 * action creators
 */
export function changeFileForUpload(files) {
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

function receiveFileUpload() {
  return {
    type: RECEIVE_FILE_UPLOAD
  }
}

export function uploadFile(files) {
  return ( dispatch, getState )  => {

    dispatch(requestFileUpload())

    return $.ajax(config.URLS.FILE_UPLOAD, {
        'type': 'POST',
        'headers': { "X-Session-Id": getState().auth.sessionId },
        'data': JSON.stringify(getState().fileUpload.files[0]),
        'contentType': 'multipart/form-data',
        'processData': false
      })
      .done(json => {
        dispatch(receiveFileUpload(json));
      })
      .fail(err => {
        console.error('UPDATE View FAILED: ', err.responseText);
      });
  }

}

