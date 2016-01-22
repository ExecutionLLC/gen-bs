import * as ActionTypes from '../actions/exportToFile'

export default function exportToFile(state = {type: ActionTypes.fileTypes.NONE, name: '', blob: null}, action) {
  switch (action.type) {
    case ActionTypes.EXPORT_TO_FILE:
        return {
          type: action.fileType.type,
          name: action.fileName + '.' + action.fileType.ext,
          blob: $('#variants_table').tableExport({type: action.fileType.type,escape:'false', consoleLog: 'false'})
        }

    default:
      return state
  }
}
