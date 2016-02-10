import * as ActionTypes from '../actions/fileUpload'

export default function fileUpload(state = {
  files: []
}, action) {

  switch (action.type) {

    case ActionTypes.CHANGE_FILE_FOR_UPLOAD:
      return Object.assign({}, state, {
        files: action.files
      });

    default:
      return state

  }
}
