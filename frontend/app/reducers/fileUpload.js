import * as ActionTypes from '../actions/fileUpload'

export default function fileUpload(state = {
  progressValueFromAS: 0,
  progressStatusFromAS: null,
  operationId: null,
  isFetching: false,
  files: []
}, action) {

  switch (action.type) {

    case ActionTypes.CHANGE_FILE_FOR_UPLOAD:
      return Object.assign({}, state, {
        files: action.files
      });

    case ActionTypes.REQUEST_FILE_UPLOAD:
      return Object.assign({}, state, {
        isFetching: true
      });

    case ActionTypes.RECEIVE_FILE_UPLOAD:
      return Object.assign({}, state, {
        isFetching: false,
        operationId: action.operationId
      });

    case ActionTypes.FILE_UPLOAD_CHANGE_PROGRESS:
      return Object.assign({}, state, {
        progressValueFromAS: action.progressValueFromAS,
        progressStatusFromAS: action.progressStatusFromAS
      });

    default:
      return state

  }
}
