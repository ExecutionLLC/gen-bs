import * as ActionTypes from '../actions'

export default function exportToFile(state = {type: ActionTypes.fileTypes.NONE, name: '', blob: null}, action) {
  switch (action.type) {
    case ActionTypes.EXPORT_TO_FILE:
        return {
          type: action.fileType,
          name: action.fileName,
          blob: $('#variants_table').tableExport({type:'csv',escape:'false', consoleLog: 'false'})
        }

    default:
      return state
  }
}
