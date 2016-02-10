import config from '../../config'

/*
 * action types
 */
export const CHANGE_FILE_FOR_UPLOAD = 'CHANGE_FILE_FOR_UPLOAD'

/*
 * action creators
 */
export function changeFileForUpload(files) {
  return {
    type: CHANGE_FILE_FOR_UPLOAD,
    files
  }
}
