import config from '../../config'

export const VBUILDER_SELECT_VIEW = 'VBUILDER_SELECT_VIEW'
export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN'

export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN'
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN'

export const VBUILDER_REQUEST_UPDATE_VIEW = 'VBUILDER_REQUEST_UPDATE_VIEW'
export const VBUILDER_RECEIVE_UPDATE_VIEW = 'VBUILDER_RECEIVE_UPDATE_VIEW'


/*
 * Action Creators
 */
export function viewBuilderSelectView(views, viewId, editOrNew) {
  return {
    type: VBUILDER_SELECT_VIEW,
    views,
    viewId,
    editOrNew
  }
}

export function viewBuilderChangeColumn(viewItemIndex, fieldName, sourceName) {
  return {
    type: VBUILDER_CHANGE_COLUMN,
    viewItemIndex,
    fieldName,
    sourceName
  }
}

export function viewBuilderDeleteColumn(viewItemIndex) {
  return {
    type: VBUILDER_DELETE_COLUMN,
    viewItemIndex
  }
}

export function viewBuilderAddColumn(viewItemIndex) {
  return {
    type: VBUILDER_ADD_COLUMN,
    viewItemIndex
  }
}

function viewBuilderRequestUpdateView() {
  return {
    type: VBUILDER_REQUEST_UPDATE_VIEW
  }
}

function viewBuilderReceiveUpdateView(json) {
  type: VBUILDER_RECEIVE_UPDATE_VIEW,
  json

}

export function viewBuilderUpdateView(viewItemIndex) {

  return (dispatch, getState) => {
    dispatch(viewBuilderRequestUpdateView())

    return $.ajax(`${config.URLS.VIEWS}/${getState().viewBuilder.editedView.id}`, {
        'type': 'PUT',
        'headers': { "X-Session-Id": getState().auth.sessionId },
        'data': JSON.stringify(getState().viewBuilder.editedView),
        'processData': false,
        'contentType': 'application/json'
      })
      .done(json => {
        dispatch(viewBuilderReceiveUpdateView(json))
      })
      .fail(err => {
        console.error('UPDATE View FAILED: ', err.responseText)
      })
  }
}

