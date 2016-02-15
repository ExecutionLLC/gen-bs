import * as ActionTypes from '../actions/fileUpload'

export default function fileUpload(state = {
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

    default:
      return state

  }
}
