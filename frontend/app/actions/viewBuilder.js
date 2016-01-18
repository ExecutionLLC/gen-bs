import config from '../../config'

import { closeModal } from './modalWindows'
import { changeView } from './ui'
import { fetchViews } from './userData'

export const VBUILDER_SELECT_VIEW = 'VBUILDER_SELECT_VIEW'

export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN'
export const VBUILDER_DELETE_COLUMN = 'VBUILDER_DELETE_COLUMN'
export const VBUILDER_ADD_COLUMN = 'VBUILDER_ADD_COLUMN'

export const VBUILDER_REQUEST_UPDATE_VIEW = 'VBUILDER_REQUEST_UPDATE_VIEW'
export const VBUILDER_RECEIVE_UPDATE_VIEW = 'VBUILDER_RECEIVE_UPDATE_VIEW'

export const VBUILDER_REQUEST_CREATE_VIEW = 'VBUILDER_REQUEST_CREATE_VIEW'
export const VBUILDER_RECEIVE_CREATE_VIEW = 'VBUILDER_RECEIVE_CREATE_VIEW'

export const VBUILDER_TOGGLE_NEW_EDIT = 'VBUILDER_TOGGLE_NEW_EDIT'


/*
 * Action Creators
 */
export function viewBuilderToggleNewEdit(currentView, editOrNew) {
  return {
    type: VBUILDER_TOGGLE_NEW_EDIT,
    currentView,
    editOrNew
  }
}

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
  return {
    type: VBUILDER_RECEIVE_UPDATE_VIEW,
    view: json
  }
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
        dispatch(closeModal('views'))
        dispatch(changeView(getState().userData.views, json.id))
      })
      .fail(err => {
        console.error('UPDATE View FAILED: ', err.responseText)
      })
  }
}

export function viewBuilderCreateView(viewItemIndex) {

  return (dispatch, getState) => {
    dispatch(viewBuilderRequestCreateView())

    return $.ajax(config.URLS.VIEWS, {
        'type': 'POST',
        'headers': { "X-Session-Id": getState().auth.sessionId },
        'data': JSON.stringify(getState().viewBuilder.newView),
        'processData': false,
        'contentType': 'application/json'
      })
      .done(json => {
        dispatch(viewBuilderReceiveCreateView(json))
        dispatch(closeModal('views'))
        dispatch(fetchViews(getState().userData.views, json.id))
        dispatch(changeView(getState().userData.views, json.id))
      })
      .fail(err => {
        console.error('CREATE View FAILED: ', err.responseText)
      })
  }
}

function viewBuilderRequestCreateView() {
  return {
    type: VBUILDER_REQUEST_CREATE_VIEW
  }
}

function viewBuilderReceiveCreateView(json) {
  return {
    type: VBUILDER_RECEIVE_CREATE_VIEW,
    view: json
  }
}

