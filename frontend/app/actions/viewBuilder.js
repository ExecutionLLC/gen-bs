export const VBUILDER_SELECT_VIEW = 'VBUILDER_SELECT_VIEW'
export const VBUILDER_CHANGE_COLUMN = 'VBUILDER_CHANGE_COLUMN'


/*
 * Action Creators
 */
export function viewBuilderSelectView(views, viewId) {
  return {
    type: VBUILDER_SELECT_VIEW,
    views,
    viewId
  }
}

export function viewBuilderChangeColumn(fieldId) {
  return {
    type: VBUILDER_CHANGE_COLUMN,
    fieldId
  }
}

