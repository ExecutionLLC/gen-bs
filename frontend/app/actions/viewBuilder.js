export const VBUILDER_SELECT_VIEW = 'VBUILDER_SELECT_VIEW'


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

