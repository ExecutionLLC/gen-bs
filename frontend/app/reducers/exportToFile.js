import * as ActionTypes from '../actions'

export default function exportFileType (state = ActionTypes.fileTypes.NONE, action) {
  switch (action.type) {
    case ActionTypes.SET_EXPORT_FILE_TYPE:
        return action.fileType

    default:
      return state
  }
}
