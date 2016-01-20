import config from '../../config'

import { closeModal } from './modalWindows'
import { changeView } from './ui'
import { fetchViews } from './userData'

export const FBUILDER_SELECT_FILTER = 'FBUILDER_SELECT_FILTER'

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR'

export const FBUILDER_TOGGLE_NEW_EDIT = 'FBUILDER_TOGGLE_NEW_EDIT'


/*
 * Action Creators
 */
export function filterBuilderToggleNewEdit(editOrNew) {
  return {
    type: FBUILDER_TOGGLE_NEW_EDIT,
    editOrNew
  }
}

export function filterBuilderSelectFilter(filters, filterId, editOrNew) {
  return {
    type: FBUILDER_SELECT_FILTER,
    filters,
    filterId,
    editOrNew
  }
}

export function filterBuilderChangeAttr(attr) {
  return {
    type: FBUILDER_CHANGE_ATTR,
    name: attr.name,
    description: attr.description
  }
}

