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

    const formData = new FormData()
    formData.append('sample', getState().fileUpload.files[0]);

    /*
    console.log('upload formData file', getState().fileUpload.files[0])
    var request = new XMLHttpRequest();
    request.open("POST", config.URLS.FILE_UPLOAD);
    req.setRequestHeader("X-Session-Id": getState().auth.sessionId);
    request.send(formData);
    */

    return $.ajax(config.URLS.FILE_UPLOAD, {
        'type': 'POST',
        'headers': { "X-Session-Id": getState().auth.sessionId },
        'data': formData,
        //'contentType': 'multipart/form-data',
        'contentType': false,
        'processData': false
      })
      .done(json => {
        dispatch(receiveFileUpload(json));
      })
      .fail(err => {
        console.error('Upload FAILED: ', err.responseText);
      });
  }

}

