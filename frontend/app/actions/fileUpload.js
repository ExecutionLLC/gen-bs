import config from '../../config'

/*
 * action types
 */
export const CHANGE_FILE_FOR_UPLOAD = 'CHANGE_FILE_FOR_UPLOAD'
export const REQUEST_FILE_UPLOAD = 'REQUEST_FILE_UPLOAD'

/*
 * action creators
 */
export function changeFileForUpload(files) {
  return {
    type: CHANGE_FILE_FOR_UPLOAD,
    files
  }
}

export function requestFileUpload(files) {
  return {
    type: REQUEST_FILE_UPLOAD
  }
}

