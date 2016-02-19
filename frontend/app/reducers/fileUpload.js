import * as ActionTypes from '../actions/fileUpload'

const initialState = {
  progressValueFromAS: 0,
  progressStatusFromAS: null,
  operationId: null,
  isFetching: false,
  files: [],
  error: null,
  isArchiving: false
}

export default function fileUpload(state = initialState, action) {

  switch (action.type) {

    case ActionTypes.CLEAR_UPLOAD_STATE:
      return initialState
      
    case ActionTypes.REQUEST_GZIP:
      return Object.assign({}, state, {
        isArchiving: true
      });

    case ActionTypes.RECEIVE_GZIP:
      return Object.assign({}, state, {
        isArchiving: false
      });

    case ActionTypes.FILE_UPLOAD_ERROR:
      return Object.assign({}, state, {
        files: [],
        error: action.msg
      });

    case ActionTypes.CHANGE_FILE_FOR_UPLOAD:
      return Object.assign({}, state, {
        files: action.files,
        error: null
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
